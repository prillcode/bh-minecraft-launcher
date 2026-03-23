import got, { HTTPError } from 'got';
import type { XSTSToken, MinecraftTokenResponse, MinecraftProfile } from './types';
import { logger } from '../utils/logger';

const MC_AUTH_URL = 'https://api.minecraftservices.com/authentication/login_with_xbox';
const MC_PROFILE_URL = 'https://api.minecraftservices.com/minecraft/profile';

/**
 * Step 3 of the auth chain:
 *   XSTS Token → Minecraft Access Token → Minecraft Profile
 */
export class MinecraftAuth {
  /**
   * Exchange XSTS token for a Minecraft access token.
   */
  async loginWithXbox(xstsToken: XSTSToken): Promise<MinecraftTokenResponse> {
    logger.info('Exchanging XSTS token for Minecraft access token');

    try {
      const response = await got.post(MC_AUTH_URL, {
        json: {
          identityToken: `XBL3.0 x=${xstsToken.userHash};${xstsToken.token}`,
        },
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }).json<{
        access_token: string;
        expires_in: number;
      }>();

      return {
        accessToken: response.access_token,
        expiresAt: Date.now() + response.expires_in * 1000,
      };
    } catch (err) {
      if (err instanceof HTTPError) {
        logger.error(`loginWithXbox failed — status: ${err.response.statusCode}, body: ${err.response.body}`);
      }
      throw err;
    }
  }

  /**
   * Fetch the authenticated player's Minecraft profile (username, UUID, skins).
   */
  async getProfile(mcAccessToken: string): Promise<MinecraftProfile> {
    logger.info('Fetching Minecraft profile');

    return got.get(MC_PROFILE_URL, {
      headers: {
        Authorization: `Bearer ${mcAccessToken}`,
      },
    }).json<MinecraftProfile>();
  }
}
