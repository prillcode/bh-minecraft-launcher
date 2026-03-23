import { createHash } from 'crypto';
import type { OfflineProfile } from './types';

/**
 * Offline-mode authentication for use with offline-mode servers.
 * Generates deterministic UUIDs matching Minecraft's server-side algorithm.
 */
export class OfflineAuth {
  /**
   * Validate a username and return an offline profile.
   * Username rules: 3-16 characters, alphanumeric + underscore only.
   */
  login(username: string): OfflineProfile {
    if (username.length < 3 || username.length > 16) {
      throw new Error('Username must be 3-16 characters');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new Error('Username can only contain letters, numbers, and underscores');
    }

    return {
      name: username,
      id: this.generateOfflineUUID(username),
    };
  }

  /**
   * Generate a UUID v3 (MD5-based) matching Minecraft's offline-mode algorithm.
   * Equivalent to `UUID.nameUUIDFromBytes("OfflinePlayer:<username>".getBytes("UTF-8"))` in Java.
   */
  generateOfflineUUID(username: string): string {
    const data = Buffer.from(`OfflinePlayer:${username}`, 'utf-8');
    const hash = createHash('md5').update(data).digest();

    // Set version to 3 (UUID v3): clear top 4 bits of byte 6, set to 0011
    hash[6] = (hash[6] & 0x0f) | 0x30;
    // Set variant to RFC 4122: clear top 2 bits of byte 8, set to 10
    hash[8] = (hash[8] & 0x3f) | 0x80;

    const hex = hash.toString('hex');
    return [
      hex.substring(0, 8),
      hex.substring(8, 12),
      hex.substring(12, 16),
      hex.substring(16, 20),
      hex.substring(20, 32),
    ].join('-');
  }
}
