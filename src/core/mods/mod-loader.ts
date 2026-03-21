import got from 'got';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getLauncherPaths } from '../utils/paths';
import { logger } from '../utils/logger';

export interface ModLoaderInfo {
  loader: 'fabric' | 'forge' | 'quilt';
  version: string;
  gameVersion: string;
}

const FABRIC_META = 'https://meta.fabricmc.net/v2';

/**
 * Installs mod loader runtimes into an instance.
 *
 * Fabric is the simplest to support programmatically — its installer
 * just downloads a loader JAR + intermediary mappings and patches
 * the version JSON. Forge is more complex (runs a Java-based installer).
 */
export class ModLoaderInstaller {
  /**
   * List available Fabric loader versions for a game version.
   */
  async getFabricVersions(gameVersion: string): Promise<Array<{ loader: { version: string } }>> {
    return got
      .get(`${FABRIC_META}/versions/loader/${gameVersion}`)
      .json<Array<{ loader: { version: string } }>>();
  }

  /**
   * Install Fabric loader into an instance's version directory.
   */
  async installFabric(gameVersion: string, loaderVersion: string): Promise<string> {
    const paths = getLauncherPaths();
    const versionId = `fabric-loader-${loaderVersion}-${gameVersion}`;
    const versionDir = path.join(paths.versions, versionId);

    await fs.mkdir(versionDir, { recursive: true });

    // Fetch the merged version JSON from Fabric's meta API
    const versionJson = await got
      .get(`${FABRIC_META}/versions/loader/${gameVersion}/${loaderVersion}/profile/json`)
      .json<Record<string, unknown>>();

    await fs.writeFile(
      path.join(versionDir, `${versionId}.json`),
      JSON.stringify(versionJson, null, 2),
    );

    logger.info(`Installed Fabric ${loaderVersion} for MC ${gameVersion}`);
    return versionId;
  }

  /**
   * Install Forge — this is significantly more complex because Forge
   * uses a Java-based installer. For now, we'd shell out to the
   * installer JAR.
   */
  async installForge(gameVersion: string, forgeVersion: string): Promise<string> {
    // TODO: Download forge installer JAR, run it headlessly with:
    //   java -jar forge-installer.jar --installClient <gameDir>
    // Then parse the generated version JSON.
    throw new Error(
      `Forge installation not yet implemented. ` +
      `Requested: ${gameVersion}-${forgeVersion}. ` +
      `Consider using Fabric for now.`,
    );
  }
}
