import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import Store from 'electron-store';
import { getLauncherPaths } from '../utils/paths';
import type { Instance } from './types';
import { logger } from '../utils/logger';

/**
 * Manages isolated game instances — each gets its own directory
 * for saves, mods, configs, resource packs, etc.
 *
 * Think of instances like "profiles" in the vanilla launcher,
 * but fully isolated on disk.
 */
export class InstanceManager {
  private store: Store<{ instances: Record<string, Instance> }>;

  constructor() {
    this.store = new Store({
      name: 'instances',
      defaults: { instances: {} },
    });
  }

  async list(): Promise<Instance[]> {
    const all = this.store.get('instances');
    return Object.values(all).sort((a, b) => (b.lastPlayed ?? 0) - (a.lastPlayed ?? 0));
  }

  async get(id: string): Promise<Instance> {
    const instance = this.store.get(`instances.${id}`);
    if (!instance) throw new Error(`Instance not found: ${id}`);
    return instance;
  }

  async create(config: Partial<Instance> & { name: string; versionId: string }): Promise<Instance> {
    const id = randomUUID();
    const gameDirectory = path.join(getLauncherPaths().instances, id);

    await fs.mkdir(gameDirectory, { recursive: true });
    await fs.mkdir(path.join(gameDirectory, 'mods'), { recursive: true });
    await fs.mkdir(path.join(gameDirectory, 'resourcepacks'), { recursive: true });
    await fs.mkdir(path.join(gameDirectory, 'saves'), { recursive: true });
    await fs.mkdir(path.join(gameDirectory, 'shaderpacks'), { recursive: true });

    const instance: Instance = {
      id,
      name: config.name,
      versionId: config.versionId,
      modLoader: config.modLoader ?? 'vanilla',
      modLoaderVersion: config.modLoaderVersion,
      javaPath: config.javaPath,
      jvmArgs: config.jvmArgs,
      minMemoryMb: config.minMemoryMb ?? 512,
      maxMemoryMb: config.maxMemoryMb ?? 2048,
      gameDirectory,
      resolution: config.resolution,
      serverAutoConnect: config.serverAutoConnect,
      createdAt: Date.now(),
    };

    this.store.set(`instances.${id}`, instance);
    logger.info(`Created instance "${instance.name}" (${id})`);

    return instance;
  }

  async update(id: string, updates: Partial<Instance>): Promise<Instance> {
    const existing = await this.get(id);
    const updated = { ...existing, ...updates, id }; // Don't allow id override
    this.store.set(`instances.${id}`, updated);
    logger.info(`Updated instance "${updated.name}" (${id})`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const instance = await this.get(id);

    // Remove game directory
    try {
      await fs.rm(instance.gameDirectory, { recursive: true, force: true });
    } catch (err) {
      logger.warn(`Failed to remove game directory for ${id}: ${err}`);
    }

    this.store.delete(`instances.${id}` as any);
    logger.info(`Deleted instance "${instance.name}" (${id})`);
  }

  async markPlayed(id: string): Promise<void> {
    this.store.set(`instances.${id}.lastPlayed`, Date.now());
  }

  /**
   * Create a pre-configured BlockHaven instance with auto-connect.
   */
  async createBlockHavenInstance(versionId: string, serverHost: string, serverPort = 25565): Promise<Instance> {
    return this.create({
      name: 'BlockHaven',
      versionId,
      maxMemoryMb: 4096,
      minMemoryMb: 1024,
      serverAutoConnect: {
        host: serverHost,
        port: serverPort,
      },
    });
  }
}
