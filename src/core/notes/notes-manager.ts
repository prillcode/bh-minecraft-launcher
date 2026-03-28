import { randomUUID } from 'crypto';
import Store from 'electron-store';
import type { NoteEntry } from './types';
import { logger } from '../utils/logger';

/**
 * Persists per-instance session notes via electron-store.
 *
 * Store layout:
 *   notes[instanceId][entryId] = NoteEntry
 *
 * Mirrors the ModManager pattern from src/core/mods/mod-manager.ts.
 */
export class NotesManager {
  private store: Store<{ notes: Record<string, Record<string, NoteEntry>> }>;

  constructor() {
    this.store = new Store({
      name: 'notes',
      defaults: { notes: {} },
    });
  }

  async list(instanceId: string): Promise<NoteEntry[]> {
    const entries = (this.store.get(`notes.${instanceId}` as any) ?? {}) as Record<string, NoteEntry>;
    return Object.values(entries).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async get(instanceId: string, entryId: string): Promise<NoteEntry | undefined> {
    return (this.store.get(`notes.${instanceId}.${entryId}` as any) ?? undefined) as NoteEntry | undefined;
  }

  async create(
    instanceId: string,
    entry: Omit<NoteEntry, 'id' | 'instanceId' | 'createdAt' | 'updatedAt'>,
  ): Promise<NoteEntry> {
    const now = Date.now();
    const note: NoteEntry = {
      id: randomUUID(),
      instanceId,
      title: entry.title,
      text: entry.text,
      screenshotPaths: entry.screenshotPaths,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(`notes.${instanceId}.${note.id}` as any, note);
    logger.info(`Created note "${note.title}" (${note.id}) for instance ${instanceId}`);
    return note;
  }

  async update(
    instanceId: string,
    entryId: string,
    patch: Partial<Pick<NoteEntry, 'title' | 'text' | 'screenshotPaths'>>,
  ): Promise<NoteEntry> {
    const existing = await this.get(instanceId, entryId);
    if (!existing) throw new Error(`Note ${entryId} not found in instance ${instanceId}`);
    const updated: NoteEntry = { ...existing, ...patch, updatedAt: Date.now() };
    this.store.set(`notes.${instanceId}.${entryId}` as any, updated);
    return updated;
  }

  async delete(instanceId: string, entryId: string): Promise<void> {
    const note = await this.get(instanceId, entryId);
    this.store.delete(`notes.${instanceId}.${entryId}` as any);
    logger.info(`Deleted note "${note?.title ?? entryId}" (${entryId}) from instance ${instanceId}`);
  }
}
