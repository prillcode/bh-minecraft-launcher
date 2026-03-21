import got from 'got';
import type { VersionManifestResponse, VersionSummary, VersionDetail } from './types';
import { logger } from '../utils/logger';

const MANIFEST_URL = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';

/**
 * Fetches and caches Mojang's version manifest.
 * The manifest lists every Minecraft version ever released,
 * with URLs to each version's detailed JSON.
 */
export class VersionManifest {
  private manifest: VersionManifestResponse | null = null;
  private versionCache = new Map<string, VersionDetail>();
  private lastFetch = 0;
  private readonly cacheTtl = 5 * 60 * 1000; // 5 min

  async getVersionList(): Promise<{
    latest: { release: string; snapshot: string };
    versions: VersionSummary[];
  }> {
    await this.ensureManifest();
    return {
      latest: this.manifest!.latest,
      versions: this.manifest!.versions,
    };
  }

  async getVersion(id: string): Promise<VersionDetail> {
    if (this.versionCache.has(id)) {
      return this.versionCache.get(id)!;
    }

    await this.ensureManifest();
    const summary = this.manifest!.versions.find((v) => v.id === id);
    if (!summary) throw new Error(`Unknown version: ${id}`);

    logger.info(`Fetching version detail for ${id}`);
    const detail = await got.get(summary.url).json<VersionDetail>();
    this.versionCache.set(id, detail);

    return detail;
  }

  private async ensureManifest(): Promise<void> {
    if (this.manifest && Date.now() - this.lastFetch < this.cacheTtl) {
      return;
    }

    logger.info('Fetching version manifest from Mojang');
    this.manifest = await got.get(MANIFEST_URL).json<VersionManifestResponse>();
    this.lastFetch = Date.now();
  }
}
