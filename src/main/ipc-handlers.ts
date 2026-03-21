import { BrowserWindow, type IpcMain } from 'electron';
import { MicrosoftAuth } from '../core/auth/microsoft';
import { XboxAuth } from '../core/auth/xbox';
import { MinecraftAuth } from '../core/auth/minecraft';
import { TokenStore } from '../core/auth/token-store';
import { VersionManifest } from '../core/game/version-manifest';
import { AssetManager } from '../core/game/asset-manager';
import { GameLauncher } from '../core/game/launch';
import { JavaDetector } from '../core/game/java-detector';
import { logger } from '../core/utils/logger';

const tokenStore = new TokenStore();
const msAuth = new MicrosoftAuth();
const xboxAuth = new XboxAuth();
const mcAuth = new MinecraftAuth();
const versionManifest = new VersionManifest();
const assetManager = new AssetManager();
const gameLauncher = new GameLauncher();
const javaDetector = new JavaDetector();

export function registerIpcHandlers(ipcMain: IpcMain): void {
  // ── Auth ──────────────────────────────────────────────────────
  ipcMain.handle('auth:start-login', async () => {
    logger.info('Starting Microsoft OAuth device-code flow');
    return msAuth.startDeviceCodeFlow();
  });

  ipcMain.handle('auth:poll-login', async () => {
    const msToken = await msAuth.acquireTokenByDeviceCode();
    const xblToken = await xboxAuth.authenticateWithXBL(msToken.accessToken);
    const xstsToken = await xboxAuth.authenticateWithXSTS(xblToken);
    const mcToken = await mcAuth.loginWithXbox(xstsToken);
    const profile = await mcAuth.getProfile(mcToken.accessToken);

    await tokenStore.save({
      microsoft: msToken,
      minecraft: mcToken,
      profile,
    });

    return profile;
  });

  ipcMain.handle('auth:refresh', async () => {
    const stored = await tokenStore.load();
    if (!stored) throw new Error('No stored session');

    const msToken = await msAuth.refreshToken(stored.microsoft.refreshToken);
    const xblToken = await xboxAuth.authenticateWithXBL(msToken.accessToken);
    const xstsToken = await xboxAuth.authenticateWithXSTS(xblToken);
    const mcToken = await mcAuth.loginWithXbox(xstsToken);
    const profile = await mcAuth.getProfile(mcToken.accessToken);

    await tokenStore.save({ microsoft: msToken, minecraft: mcToken, profile });
    return profile;
  });

  ipcMain.handle('auth:logout', async () => {
    await tokenStore.clear();
    return { success: true };
  });

  ipcMain.handle('auth:get-profile', async () => {
    const stored = await tokenStore.load();
    return stored?.profile ?? null;
  });

  // ── Game ──────────────────────────────────────────────────────
  ipcMain.handle('game:get-versions', async () => {
    return versionManifest.getVersionList();
  });

  ipcMain.handle('game:install', async (event, versionId: string) => {
    const version = await versionManifest.getVersion(versionId);
    const window = BrowserWindow.fromWebContents(event.sender);

    await assetManager.downloadVersion(version, (progress) => {
      window?.webContents.send('download:progress', progress);
    });

    return { success: true };
  });

  ipcMain.handle('game:launch', async (event, instanceId: string) => {
    const stored = await tokenStore.load();
    if (!stored) throw new Error('Not authenticated');

    const window = BrowserWindow.fromWebContents(event.sender);

    const child = await gameLauncher.launch({
      instanceId,
      accessToken: stored.minecraft.accessToken,
      profile: stored.profile,
      onStdout: (data) => window?.webContents.send('launch:stdout', data),
      onStderr: (data) => window?.webContents.send('launch:stderr', data),
      onExit: (code) => window?.webContents.send('launch:exit', code),
    });

    return { pid: child.pid };
  });

  ipcMain.handle('game:kill', () => {
    gameLauncher.kill();
    return { success: true };
  });

  ipcMain.handle('game:detect-java', async () => {
    return javaDetector.detect();
  });

  // ── Window Controls ───────────────────────────────────────────
  ipcMain.handle('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  });

  ipcMain.handle('window:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.isMaximized() ? win.unmaximize() : win?.maximize();
  });

  ipcMain.handle('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });

  logger.info('IPC handlers registered');
}
