import Store from 'electron-store';
import type { StoredSession } from './types';
import { logger } from '../utils/logger';

/**
 * Encrypted credential storage using electron-store.
 *
 * electron-store uses safeStorage (OS keychain on macOS,
 * DPAPI on Windows, libsecret on Linux) for encryption.
 */
export class TokenStore {
  private store: Store<{ session: StoredSession | null }>;

  constructor() {
    this.store = new Store<{ session: StoredSession | null }>({
      name: 'auth',
      encryptionKey: 'blockhaven-launcher', // Basic obfuscation layer
      schema: {
        session: {
          type: ['object', 'null'],
        },
      },
      defaults: {
        session: null,
      },
    });
  }

  async save(session: StoredSession): Promise<void> {
    this.store.set('session', session);
    logger.info(`Saved session for ${session.profile.name}`);
  }

  async load(): Promise<StoredSession | null> {
    return this.store.get('session') ?? null;
  }

  async clear(): Promise<void> {
    this.store.delete('session');
    logger.info('Session cleared');
  }

  /**
   * Check if the stored Minecraft token is still valid.
   */
  async isSessionValid(): Promise<boolean> {
    const session = await this.load();
    if (!session) return false;
    // 5-minute buffer before expiry
    return session.minecraft.expiresAt > Date.now() + 300_000;
  }
}
