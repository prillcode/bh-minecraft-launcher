import {
  PublicClientApplication,
  type DeviceCodeRequest,
  type AuthenticationResult,
} from '@azure/msal-node';
import type { DeviceCodeResponse, MicrosoftTokenResponse } from './types';
import { logger } from '../utils/logger';

/**
 * Microsoft OAuth 2.0 via the device-code flow.
 *
 * Device-code is ideal for a desktop launcher:
 *   1. Launcher displays a short code + URL
 *   2. User opens browser, enters code, signs in
 *   3. Launcher polls until auth completes
 *
 * Requires an Azure AD app registration with:
 *   - "Mobile and desktop applications" platform
 *   - Redirect URI: https://login.microsoftonline.com/common/oauth2/nativeclient
 *   - XboxLive.signin scope enabled
 */

const CLIENT_ID = process.env.MS_CLIENT_ID ?? 'YOUR_AZURE_APP_CLIENT_ID';
const AUTHORITY = 'https://login.microsoftonline.com/consumers';
const SCOPES = ['XboxLive.signin', 'offline_access'];

export class MicrosoftAuth {
  private pca: PublicClientApplication;
  private pendingDeviceCode: DeviceCodeResponse | null = null;
  private pendingRequest: Promise<AuthenticationResult | null> | null = null;

  constructor() {
    this.pca = new PublicClientApplication({
      auth: {
        clientId: CLIENT_ID,
        authority: AUTHORITY,
      },
    });
  }

  /**
   * Initiates device-code flow. Returns the code the user needs to enter
   * at https://microsoft.com/devicelogin.
   */
  async startDeviceCodeFlow(): Promise<DeviceCodeResponse> {
    return new Promise((resolve, reject) => {
      const request: DeviceCodeRequest = {
        scopes: SCOPES,
        deviceCodeCallback: (response) => {
          this.pendingDeviceCode = {
            userCode: response.userCode,
            verificationUri: response.verificationUri,
            expiresIn: response.expiresIn,
          };
          logger.info(`Device code: ${response.userCode}`);
          resolve(this.pendingDeviceCode);
        },
      };

      // Store the pending promise so pollLogin can await it
      const pending = this.pca.acquireTokenByDeviceCode(request);
      this.pendingRequest = pending;
      pending.catch(reject);
    });
  }

  /**
   * Awaits completion of the device-code flow (user finishes browser login).
   */
  async acquireTokenByDeviceCode(): Promise<MicrosoftTokenResponse> {
    if (!this.pendingRequest) {
      throw new Error('No pending device-code flow. Call startDeviceCodeFlow first.');
    }

    const result = await this.pendingRequest;
    this.pendingRequest = null;
    this.pendingDeviceCode = null;

    if (!result) throw new Error('Authentication failed — null result');

    return {
      accessToken: result.accessToken,
      refreshToken: result.account?.homeAccountId ?? '', // MSAL caches refresh internally
      expiresAt: result.expiresOn?.getTime() ?? Date.now() + 3600_000,
    };
  }

  /**
   * Silently refresh using MSAL's token cache.
   */
  async refreshToken(_refreshToken: string): Promise<MicrosoftTokenResponse> {
    const accounts = await this.pca.getTokenCache().getAllAccounts();
    if (accounts.length === 0) throw new Error('No cached accounts for silent refresh');

    const result = await this.pca.acquireTokenSilent({
      account: accounts[0],
      scopes: SCOPES,
    });

    if (!result) throw new Error('Silent refresh failed');

    return {
      accessToken: result.accessToken,
      refreshToken: result.account?.homeAccountId ?? '',
      expiresAt: result.expiresOn?.getTime() ?? Date.now() + 3600_000,
    };
  }
}
