import got from 'got';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import PQueue from 'p-queue';
import { getLauncherPaths } from '../utils/paths';
import type { DownloadProgress } from './types';
import { logger } from '../utils/logger';

interface RuntimeEntry {
  manifest: { url: string; sha1: string; size: number };
  version: { name: string; released: string };
}

type AllManifest = Record<string, Record<string, RuntimeEntry[]>>;

interface FileEntry {
  type: 'file' | 'directory' | 'link';
  executable?: boolean;
  downloads?: {
    raw: { url: string; sha1: string; size: number };
  };
}

interface FileManifest {
  files: Record<string, FileEntry>;
}

export class JavaProvisioner {
  private static readonly MANIFEST_URL =
    'https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json';

  /**
   * Provision the JRE for the given Mojang component name (e.g. 'java-runtime-delta').
   * Returns the path to the java executable.
   * Fast-path: if already provisioned, returns immediately without downloading.
   */
  async provision(
    component: string,
    onProgress?: (progress: DownloadProgress) => void,
  ): Promise<string> {
    const { java: javaDir } = getLauncherPaths();
    const javaExe = this.getJavaExePath(javaDir, component);

    // Fast-path: already provisioned
    try {
      await fs.access(javaExe);
      logger.info(`JRE ${component} already provisioned at ${javaExe}`);
      return javaExe;
    } catch {
      // Not yet provisioned — continue
    }

    logger.info(`Provisioning JRE component: ${component}`);

    // 1. Fetch platform manifest index
    const platformKey = this.getPlatformKey();
    const allManifest = await got.get(JavaProvisioner.MANIFEST_URL).json<AllManifest>();
    const entries = allManifest[platformKey]?.[component];
    if (!entries || entries.length === 0) {
      throw new Error(`No JRE available for platform "${platformKey}" component "${component}"`);
    }
    const entry = entries[0];

    // 2. Fetch the file list manifest for this component
    const fileManifest = await got.get(entry.manifest.url).json<FileManifest>();
    const filesToDownload = Object.entries(fileManifest.files).filter(
      ([, v]) => v.type === 'file' && v.downloads?.raw,
    );

    logger.info(`Downloading ${filesToDownload.length} JRE files for ${component}`);

    // 3. Download all files concurrently (same pattern as AssetManager)
    const queue = new PQueue({ concurrency: 8 });
    let done = 0;
    const total = filesToDownload.length;

    await queue.addAll(
      filesToDownload.map(([relPath, fileEntry]) => async () => {
        const dest = path.join(javaDir, component, relPath);
        await fs.mkdir(path.dirname(dest), { recursive: true });

        // Skip if already present and valid
        if (fileEntry.downloads!.raw.sha1 && await this.verifyFile(dest, fileEntry.downloads!.raw.sha1)) {
          done++;
          return;
        }

        const buffer = await got.get(fileEntry.downloads!.raw.url).buffer();
        await fs.writeFile(dest, buffer);

        // Set executable bit on non-Windows
        if (fileEntry.executable && process.platform !== 'win32') {
          await fs.chmod(dest, 0o755);
        }

        done++;
        onProgress?.({
          phase: 'java',
          current: done,
          total,
          fileName: relPath,
          bytesPerSecond: 0,
        });
      }),
    );

    logger.info(`JRE ${component} provisioned at ${javaExe}`);
    return javaExe;
  }

  /** Map Node.js platform/arch to Mojang's platform key in the manifest. */
  private getPlatformKey(): string {
    const { platform, arch } = process;
    if (platform === 'linux') return arch === 'x64' ? 'linux' : 'linux-i386';
    if (platform === 'darwin') return arch === 'arm64' ? 'mac-os-arm64' : 'mac-os';
    if (platform === 'win32') {
      if (arch === 'arm64') return 'windows-arm64';
      return arch === 'x64' ? 'windows-x64' : 'windows-x86';
    }
    return 'linux'; // fallback
  }

  /** Full path to the java executable inside the provisioned component directory. */
  private getJavaExePath(javaDir: string, component: string): string {
    const exe = process.platform === 'win32' ? 'java.exe' : 'java';
    return path.join(javaDir, component, 'bin', exe);
  }

  private async verifyFile(filePath: string, expectedSha1: string): Promise<boolean> {
    try {
      const data = await fs.readFile(filePath);
      return createHash('sha1').update(data).digest('hex') === expectedSha1;
    } catch {
      return false;
    }
  }
}
