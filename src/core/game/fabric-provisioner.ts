import got from 'got';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import { getLauncherPaths } from '../utils/paths';
import type { DownloadProgress } from './types';
import { logger } from '../utils/logger';

interface FabricLoaderEntry {
  loader: { version: string; stable: boolean };
}

interface FabricLibrary {
  name: string;
  url: string;
  sha1?: string;
}

interface FabricProfile {
  mainClass: string;
  libraries: FabricLibrary[];
}

export interface FabricProvisionResult {
  mainClass: string;
  libraryPaths: string[];
}

export class FabricProvisioner {
  private static readonly META_URL = 'https://meta.fabricmc.net/v2';

  async provision(
    gameVersion: string,
    onProgress?: (progress: DownloadProgress) => void,
  ): Promise<FabricProvisionResult> {
    const loaderVersion = await this.getLatestStableLoaderVersion(gameVersion);
    logger.info(`Provisioning Fabric loader ${loaderVersion} for MC ${gameVersion}`);

    const profile = await this.fetchProfile(gameVersion, loaderVersion);
    const libraryPaths = await this.downloadLibraries(profile.libraries, onProgress);

    return { mainClass: profile.mainClass, libraryPaths };
  }

  private async getLatestStableLoaderVersion(gameVersion: string): Promise<string> {
    const entries = await got
      .get(`${FabricProvisioner.META_URL}/versions/loader/${gameVersion}`)
      .json<FabricLoaderEntry[]>();

    const stable = entries.find((e) => e.loader.stable) ?? entries[0];
    if (!stable) throw new Error(`No Fabric loader available for Minecraft ${gameVersion}`);
    return stable.loader.version;
  }

  private fetchProfile(gameVersion: string, loaderVersion: string): Promise<FabricProfile> {
    return got
      .get(`${FabricProvisioner.META_URL}/versions/loader/${gameVersion}/${loaderVersion}/profile/json`)
      .json<FabricProfile>();
  }

  private async downloadLibraries(
    libraries: FabricLibrary[],
    onProgress?: (progress: DownloadProgress) => void,
  ): Promise<string[]> {
    const { libraries: librariesDir } = getLauncherPaths();
    const result: string[] = [];
    let done = 0;

    for (const lib of libraries) {
      const localPath = await this.downloadLibrary(lib, librariesDir);
      result.push(localPath);
      done++;
      onProgress?.({
        phase: 'fabric',
        current: done,
        total: libraries.length,
        fileName: path.basename(localPath),
        bytesPerSecond: 0,
      });
    }

    return result;
  }

  private async downloadLibrary(lib: FabricLibrary, librariesDir: string): Promise<string> {
    const relPath = this.mavenCoordToPath(lib.name);
    const localPath = path.join(librariesDir, relPath);

    // Fast-path: file exists and hash matches
    if (lib.sha1) {
      try {
        const data = await fs.readFile(localPath);
        if (createHash('sha1').update(data).digest('hex') === lib.sha1) return localPath;
      } catch {
        // Missing or unreadable — fall through to download
      }
    } else {
      try {
        await fs.access(localPath);
        return localPath;
      } catch {
        // Missing — fall through to download
      }
    }

    const url = lib.url + relPath;
    logger.debug(`Downloading Fabric library: ${lib.name}`);
    const buffer = await got.get(url).buffer();

    if (lib.sha1) {
      const actual = createHash('sha1').update(buffer).digest('hex');
      if (actual !== lib.sha1) {
        throw new Error(`Hash mismatch for ${lib.name}: expected ${lib.sha1}, got ${actual}`);
      }
    }

    await fs.mkdir(path.dirname(localPath), { recursive: true });
    await fs.writeFile(localPath, buffer);
    return localPath;
  }

  /**
   * Converts a Maven coordinate to a relative jar path.
   * "net.fabricmc:fabric-loader:0.16.10"
   *   -> "net/fabricmc/fabric-loader/0.16.10/fabric-loader-0.16.10.jar"
   */
  private mavenCoordToPath(coord: string): string {
    const [group, artifact, version] = coord.split(':');
    return `${group.replaceAll('.', '/')}/${artifact}/${version}/${artifact}-${version}.jar`;
  }
}
