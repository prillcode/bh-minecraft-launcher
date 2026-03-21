import got from 'got';
import * as fs from 'fs/promises';
import * as path from 'path';
import PQueue from 'p-queue';
import { createHash } from 'crypto';
import { getLauncherPaths } from '../utils/paths';
import type { VersionDetail, DownloadProgress } from './types';
import { logger } from '../utils/logger';

/**
 * Downloads and verifies all game files for a given version:
 *   1. Client JAR
 *   2. Libraries (filtered by OS rules)
 *   3. Asset index + individual assets
 */
export class AssetManager {
  private queue = new PQueue({ concurrency: 8 });

  async downloadVersion(
    version: VersionDetail,
    onProgress?: (progress: DownloadProgress) => void,
  ): Promise<void> {
    const paths = getLauncherPaths();

    // ── 1. Client JAR ────────────────────────────────────────────
    const clientJarPath = path.join(paths.versions, version.id, `${version.id}.jar`);
    await this.downloadFile(
      version.downloads.client.url,
      clientJarPath,
      version.downloads.client.sha1,
    );
    onProgress?.({
      phase: 'client',
      current: 1,
      total: 1,
      fileName: `${version.id}.jar`,
      bytesPerSecond: 0,
    });

    // ── 2. Libraries ─────────────────────────────────────────────
    const libs = version.libraries.filter((lib) => this.shouldInclude(lib));
    let libsDone = 0;

    const libTasks = libs
      .filter((lib) => lib.downloads.artifact)
      .map((lib) => async () => {
        const artifact = lib.downloads.artifact!;
        const dest = path.join(paths.libraries, artifact.path);
        await this.downloadFile(artifact.url, dest, artifact.sha1);
        libsDone++;
        onProgress?.({
          phase: 'libraries',
          current: libsDone,
          total: libs.length,
          fileName: path.basename(artifact.path),
          bytesPerSecond: 0,
        });
      });

    await this.queue.addAll(libTasks);

    // ── 3. Asset Index + Assets ──────────────────────────────────
    const assetIndexPath = path.join(paths.assets, 'indexes', `${version.assets}.json`);
    await this.downloadFile(version.assetIndex.url, assetIndexPath, version.assetIndex.sha1);

    const assetIndex = JSON.parse(await fs.readFile(assetIndexPath, 'utf-8')) as {
      objects: Record<string, { hash: string; size: number }>;
    };

    const assets = Object.entries(assetIndex.objects);
    let assetsDone = 0;

    const assetTasks = assets.map(([name, { hash }]) => async () => {
      const prefix = hash.substring(0, 2);
      const dest = path.join(paths.assets, 'objects', prefix, hash);
      await this.downloadFile(
        `https://resources.download.minecraft.net/${prefix}/${hash}`,
        dest,
        hash,
      );
      assetsDone++;
      if (assetsDone % 50 === 0 || assetsDone === assets.length) {
        onProgress?.({
          phase: 'assets',
          current: assetsDone,
          total: assets.length,
          fileName: name,
          bytesPerSecond: 0,
        });
      }
    });

    await this.queue.addAll(assetTasks);

    logger.info(`Version ${version.id} fully downloaded`);
  }

  /**
   * Download a file if it doesn't exist or fails hash verification.
   */
  private async downloadFile(url: string, dest: string, expectedSha1: string): Promise<void> {
    // Skip if already downloaded and hash matches
    if (await this.verifyFile(dest, expectedSha1)) return;

    await fs.mkdir(path.dirname(dest), { recursive: true });

    const buffer = await got.get(url).buffer();

    // Verify before writing
    const hash = createHash('sha1').update(buffer).digest('hex');
    if (hash !== expectedSha1) {
      throw new Error(`Hash mismatch for ${url}: expected ${expectedSha1}, got ${hash}`);
    }

    await fs.writeFile(dest, buffer);
  }

  private async verifyFile(filePath: string, expectedSha1: string): Promise<boolean> {
    try {
      const data = await fs.readFile(filePath);
      const hash = createHash('sha1').update(data).digest('hex');
      return hash === expectedSha1;
    } catch {
      return false;
    }
  }

  private shouldInclude(lib: { rules?: Array<{ action: string; os?: { name?: string } }> }): boolean {
    if (!lib.rules) return true;
    const osName = ({ win32: 'windows', darwin: 'osx', linux: 'linux' } as Record<string, string>)[process.platform] ?? 'linux';
    let dominated = false;
    for (const rule of lib.rules) {
      if (rule.action === 'allow') {
        if (!rule.os) dominated = true;
        else if (rule.os.name === osName) dominated = true;
      } else if (rule.action === 'disallow') {
        if (rule.os?.name === osName) return false;
      }
    }
    return dominated;
  }
}
