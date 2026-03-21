import got from 'got';
import type { XBLToken, XSTSToken } from './types';
import { logger } from '../utils/logger';

const XBL_AUTH_URL = 'https://user.auth.xboxlive.com/user/authenticate';
const XSTS_AUTH_URL = 'https://xsts.auth.xboxlive.com/xsts/authorize';

/**
 * Step 2 of the auth chain:
 *   MS Access Token → Xbox Live Token → XSTS Token
 *
 * XSTS (Xbox Secure Token Service) is what Mojang actually consumes.
 */
export class XboxAuth {
  /**
   * Exchange Microsoft access token for an Xbox Live (XBL) token.
   */
  async authenticateWithXBL(msAccessToken: string): Promise<XBLToken> {
    logger.info('Exchanging MS token for XBL token');

    const response = await got.post(XBL_AUTH_URL, {
      json: {
        Properties: {
          AuthMethod: 'RPS',
          SiteName: 'user.auth.xboxlive.com',
          RpsTicket: `d=${msAccessToken}`,
        },
        RelyingParty: 'http://auth.xboxlive.com',
        TokenType: 'JWT',
      },
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }).json<{
      Token: string;
      DisplayClaims: { xui: Array<{ uhs: string }> };
    }>();

    return {
      token: response.Token,
      userHash: response.DisplayClaims.xui[0].uhs,
    };
  }

  /**
   * Exchange XBL token for an XSTS token (scoped to Minecraft).
   */
  async authenticateWithXSTS(xblToken: XBLToken): Promise<XSTSToken> {
    logger.info('Exchanging XBL token for XSTS token');

    const response = await got.post(XSTS_AUTH_URL, {
      json: {
        Properties: {
          SandboxId: 'RETAIL',
          UserTokens: [xblToken.token],
        },
        RelyingParty: 'rp://api.minecraftservices.com/',
        TokenType: 'JWT',
      },
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }).json<{
      Token: string;
      DisplayClaims: { xui: Array<{ uhs: string }> };
    }>();

    return {
      token: response.Token,
      userHash: response.DisplayClaims.xui[0].uhs,
    };
  }
}
