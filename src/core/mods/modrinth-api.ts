import got from 'got';
import { logger } from '../utils/logger';

const MODRINTH_API = 'https://api.modrinth.com/v2';
const USER_AGENT = 'blockhaven-launcher/0.1.0 (github.com/yourrepo)';

// ── Types ───────────────────────────────────────────────────────
export interface ModrinthProject {
  slug: string;
  title: string;
  description: string;
  categories: string[];
  downloads: number;
  icon_url: string | null;
  project_type: 'mod' | 'modpack' | 'resourcepack' | 'shader';
  versions: string[];
}

export interface ModrinthVersion {
  id: string;
  project_id: string;
  name: string;
  version_number: string;
  game_versions: string[];
  loaders: string[];
  files: Array<{
    url: string;
    filename: string;
    hashes: { sha1: string; sha512: string };
    size: number;
    primary: boolean;
  }>;
  dependencies: Array<{
    project_id: string;
    dependency_type: 'required' | 'optional' | 'incompatible';
  }>;
}

export interface ModSearchResult {
  hits: ModrinthProject[];
  offset: number;
  limit: number;
  total_hits: number;
}

// ── API Client ──────────────────────────────────────────────────
export class ModrinthAPI {
  private client = got.extend({
    prefixUrl: MODRINTH_API,
    headers: { 'User-Agent': USER_AGENT },
    responseType: 'json',
  });

  /**
   * Search mods by query, filtered to a game version and loader.
   */
  async search(
    query: string,
    options?: {
      gameVersion?: string;
      loader?: string;
      limit?: number;
      offset?: number;
      projectType?: string;
    },
  ): Promise<ModSearchResult> {
    const facets: string[][] = [];
    if (options?.gameVersion) facets.push([`versions:${options.gameVersion}`]);
    if (options?.loader) facets.push([`categories:${options.loader}`]);
    if (options?.projectType) facets.push([`project_type:${options.projectType}`]);

    const searchParams: Record<string, string> = {
      query,
      limit: String(options?.limit ?? 20),
      offset: String(options?.offset ?? 0),
    };

    if (facets.length > 0) {
      searchParams.facets = JSON.stringify(facets);
    }

    logger.info(`Modrinth search: "${query}"`);
    return this.client.get('search', { searchParams }).json<ModSearchResult>();
  }

  /**
   * Get a specific project (mod/modpack/shader).
   */
  async getProject(idOrSlug: string): Promise<ModrinthProject> {
    return this.client.get(`project/${idOrSlug}`).json<ModrinthProject>();
  }

  /**
   * List versions of a project, optionally filtered.
   */
  async getVersions(
    projectId: string,
    options?: { gameVersions?: string[]; loaders?: string[] },
  ): Promise<ModrinthVersion[]> {
    const searchParams: Record<string, string> = {};
    if (options?.gameVersions) searchParams.game_versions = JSON.stringify(options.gameVersions);
    if (options?.loaders) searchParams.loaders = JSON.stringify(options.loaders);

    return this.client
      .get(`project/${projectId}/version`, { searchParams })
      .json<ModrinthVersion[]>();
  }

  /**
   * Get a single version by ID.
   */
  async getVersion(versionId: string): Promise<ModrinthVersion> {
    return this.client.get(`version/${versionId}`).json<ModrinthVersion>();
  }
}
