import Store from 'electron-store';
import type { InstalledMod } from './types';
import { logger } from '../utils/logger';

/**
 * Tracks installed mods per instance, persisted to disk via electron-store.
 *
 * Store layout:
 *   mods[instanceId][projectId] = InstalledMod
 *
 * Mirrors the InstanceManager pattern from src/core/game/instance.ts.
 */
export class ModManager {
  private store: Store<{ mods: Record<string, Record<string, InstalledMod>> }>;

  constructor() {
    this.store = new Store({
      name: 'mods',
      defaults: { mods: {} },
    });
  }

  async list(instanceId: string): Promise<InstalledMod[]> {
    const instanceMods = (this.store.get('mods.' + instanceId as any) ?? {}) as Record<string, InstalledMod>;
    return Object.values(instanceMods).sort((a, b) => b.installedAt - a.installedAt);
  }

  async get(instanceId: string, projectId: string): Promise<InstalledMod | undefined> {
    return this.store.get('mods.' + instanceId + '.' + projectId as any) ?? undefined;
  }

  async add(instanceId: string, mod: InstalledMod): Promise<void> {
    this.store.set('mods.' + instanceId + '.' + mod.id as any, mod);
    logger.info(`Installed mod "${mod.name}" (${mod.id}) into instance ${instanceId}`);
  }

  async remove(instanceId: string, projectId: string): Promise<void> {
    const mod = await this.get(instanceId, projectId);
    this.store.delete('mods.' + instanceId + '.' + projectId as any);
    logger.info(`Removed mod "${mod?.name ?? projectId}" (${projectId}) from instance ${instanceId}`);
  }

  async isInstalled(instanceId: string, projectId: string): Promise<boolean> {
    return !!(await this.get(instanceId, projectId));
  }
}
