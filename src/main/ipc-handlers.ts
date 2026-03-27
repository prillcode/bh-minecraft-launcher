import { BrowserWindow, shell, app, type IpcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { MicrosoftAuth } from '../core/auth/microsoft';
import { XboxAuth } from '../core/auth/xbox';
import { MinecraftAuth } from '../core/auth/minecraft';
import { OfflineAuth } from '../core/auth/offline';
import { TokenStore } from '../core/auth/token-store';
import { VersionManifest } from '../core/game/version-manifest';
import { AssetManager } from '../core/game/asset-manager';
import { GameLauncher } from '../core/game/launch';
import { JavaDetector } from '../core/game/java-detector';
import { JavaProvisioner } from '../core/game/java-provisioner';
import { InstanceManager } from '../core/game/instance';
import { ModrinthAPI } from '../core/mods/modrinth-api';
import { ModManager } from '../core/mods/mod-manager';
import { getSettings, setSetting } from '../core/settings';
import type { LauncherSettings } from '../core/settings';
import { getLauncherPaths } from '../core/utils/paths';
import { logger } from '../core/utils/logger';

const tokenStore = new TokenStore();
const msAuth = new MicrosoftAuth();
const xboxAuth = new XboxAuth();
const mcAuth = new MinecraftAuth();
const offlineAuth = new OfflineAuth();
const versionManifest = new VersionManifest();
const assetManager = new AssetManager();
const gameLauncher = new GameLauncher();
const javaDetector = new JavaDetector();
const javaProvisioner = new JavaProvisioner();
const instanceManager = new InstanceManager();
const modrinthAPI = new ModrinthAPI();
const modManager = new ModManager();

export function registerIpcHandlers(ipcMain: IpcMain): void {
  // ── Auth ──────────────────────────────────────────────────────
  ipcMain.handle('auth:start-login', async () => {
    logger.info('Starting Microsoft OAuth device-code flow');
    return msAuth.startDeviceCodeFlow();
  });

  ipcMain.handle('auth:poll-login', async () => {
    const msToken = await msAuth.acquireTokenByDeviceCode();
    logger.debug(`MS token acquired (first 20 chars): ${msToken.accessToken.substring(0, 20)}...`);

    const xblToken = await xboxAuth.authenticateWithXBL(msToken.accessToken);
    logger.debug(`XBL token acquired — userHash: ${xblToken.userHash}, token length: ${xblToken.token.length}`);

    const xstsToken = await xboxAuth.authenticateWithXSTS(xblToken);
    logger.debug(`XSTS token acquired — userHash: ${xstsToken.userHash}, token length: ${xstsToken.token.length}`);

    const mcToken = await mcAuth.loginWithXbox(xstsToken);
    logger.debug(`MC token acquired — token length: ${mcToken.accessToken.length}`);

    const profile = await mcAuth.getProfile(mcToken.accessToken);

    await tokenStore.save({
      authMode: 'microsoft',
      microsoft: msToken,
      minecraft: mcToken,
      profile,
      msalCache: msAuth.serializeCache(),
    });

    return profile;
  });

  ipcMain.handle('auth:offline-login', async (_event, username: string) => {
    logger.info(`Starting offline login for: ${username}`);
    const offlineProfile = offlineAuth.login(username);

    // Store with dummy Microsoft/Minecraft tokens
    await tokenStore.save({
      authMode: 'offline',
      microsoft: { accessToken: '', refreshToken: '', expiresAt: 0 },
      minecraft: { accessToken: 'offline', expiresAt: Infinity },
      profile: {
        id: offlineProfile.id.replace(/-/g, ''),
        name: offlineProfile.name,
        skins: [],
        capes: [],
      },
    });

    return offlineProfile;
  });

  ipcMain.handle('auth:refresh', async () => {
    const stored = await tokenStore.load();
    if (!stored) throw new Error('No stored session');

    if (stored.authMode === 'offline') {
      return stored.profile;
    }

    // MC token still valid — no need to hit MSAL at all
    if (await tokenStore.isSessionValid()) {
      logger.info('MC token still valid, skipping refresh');
      return stored.profile;
    }

    // Restore persisted MSAL cache so acquireTokenSilent can find the account
    if (stored.msalCache) {
      msAuth.deserializeCache(stored.msalCache);
    }

    const msToken = await msAuth.refreshToken(stored.microsoft.refreshToken);
    const xblToken = await xboxAuth.authenticateWithXBL(msToken.accessToken);
    const xstsToken = await xboxAuth.authenticateWithXSTS(xblToken);
    const mcToken = await mcAuth.loginWithXbox(xstsToken);
    const profile = await mcAuth.getProfile(mcToken.accessToken);

    await tokenStore.save({
      authMode: 'microsoft',
      microsoft: msToken,
      minecraft: mcToken,
      profile,
      msalCache: msAuth.serializeCache(),
    });
    return profile;
  });

  ipcMain.handle('auth:logout', async () => {
    await tokenStore.clear();
    return { success: true };
  });

  ipcMain.handle('auth:get-profile', async () => {
    const stored = await tokenStore.load();
    if (!stored) return null;
    return { ...stored.profile, authMode: stored.authMode ?? 'microsoft' };
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

    // Auto-install the version if not already downloaded
    const instance = await instanceManager.get(instanceId);
    const version = await versionManifest.getVersion(instance.versionId);

    // Auto-provision JRE if no instance-level java override
    if (!instance.javaPath) {
      const component = version.javaVersion?.component ?? 'java-runtime-delta';
      await javaProvisioner.provision(component, (progress) => {
        window?.webContents.send('download:progress', progress);
      });
    }

    await assetManager.downloadVersion(version, (progress) => {
      window?.webContents.send('download:progress', progress);
    });

    const isOffline = stored.authMode === 'offline';
    const child = await gameLauncher.launch({
      instanceId,
      accessToken: isOffline ? 'offline' : stored.minecraft.accessToken,
      profile: stored.profile,
      userType: isOffline ? 'legacy' : 'msa',
      onStdout: (data) => {
        logger.debug(`[MC] ${data.trimEnd()}`);
        window?.webContents.send('launch:stdout', data);
      },
      onStderr: (data) => {
        logger.debug(`[MC] ${data.trimEnd()}`);
        window?.webContents.send('launch:stderr', data);
      },
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

  // ── Java ──────────────────────────────────────────────────────
  ipcMain.handle('java:provision', async (event, component: string) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const javaExe = await javaProvisioner.provision(component, (progress) => {
      window?.webContents.send('download:progress', progress);
    });
    return { javaExe };
  });

  // ── Instances ────────────────────────────────────────────────
  ipcMain.handle('instances:list', async () => {
    return instanceManager.list();
  });

  ipcMain.handle('instances:create', async (_event, config) => {
    return instanceManager.create(config);
  });

  ipcMain.handle('instances:update', async (_event, id: string, config) => {
    return instanceManager.update(id, config);
  });

  ipcMain.handle('instances:delete', async (_event, id: string) => {
    await instanceManager.delete(id);
    return { success: true };
  });

  // ── Settings ────────────────────────────────────────────────
  ipcMain.handle('settings:get', async () => {
    return getSettings();
  });

  ipcMain.handle('settings:set-default-auth-mode', async (_event, mode: 'microsoft' | 'offline') => {
    setSetting('defaultAuthMode', mode);
    return { success: true };
  });

  ipcMain.handle('settings:set', async (_event, key: keyof LauncherSettings, value: unknown) => {
    setSetting(key, value as LauncherSettings[typeof key]);
    return { success: true };
  });

  ipcMain.handle('settings:get-app-info', async () => {
    const paths = getLauncherPaths();
    return {
      version: app.getVersion(),
      dataPath: paths.root,
    };
  });

  ipcMain.handle('settings:open-data-folder', async () => {
    const paths = getLauncherPaths();
    await shell.openPath(paths.root);
    return { success: true };
  });

  ipcMain.handle('settings:clear-cache', async () => {
    const paths = getLauncherPaths();
    await fs.rm(paths.temp, { recursive: true, force: true });
    await fs.rm(paths.natives, { recursive: true, force: true });
    logger.info('Cache cleared (temp + natives)');
    return { success: true };
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

  // ── Mods ---------------------------------------------------------------
  ipcMain.handle('mods:search', async (_e, query: string, instanceId: string) => {
    const instance = await instanceManager.get(instanceId);
    return modrinthAPI.search(query, {
      gameVersion: instance.versionId,
      loader: instance.modLoader && instance.modLoader !== 'vanilla' ? instance.modLoader : undefined,
      projectType: 'mod',
    });
  });

  ipcMain.handle('mods:list', async (_e, instanceId: string) => {
    return modManager.list(instanceId);
  });

  ipcMain.handle('mods:get-versions', async (_e, projectId: string, gameVersion: string, loader?: string) => {
    const loaders = loader && loader !== 'vanilla' ? [loader] : undefined;
    return modrinthAPI.getVersions(projectId, {
      gameVersions: [gameVersion],
      loaders,
    });
  });

  ipcMain.handle('mods:install', async (_e, instanceId: string, projectId: string, versionId: string, modName: string, modSlug: string) => {
    const version = await modrinthAPI.getVersion(versionId);
    const primaryFile = version.files.find((f) => f.primary) ?? version.files[0];
    if (!primaryFile) throw new Error('No file found for version ' + versionId);

    const instance = await instanceManager.get(instanceId);
    const dest = path.join(instance.gameDirectory, 'mods', primaryFile.filename);

    // Download the JAR using got.stream piped to a write stream
    const { default: got } = await import('got');
    await pipeline(got.stream(primaryFile.url), createWriteStream(dest));

    const installedMod = {
      id: projectId,
      slug: modSlug,
      name: modName,
      versionId,
      versionNumber: version.version_number,
      fileName: primaryFile.filename,
      sha1: primaryFile.hashes.sha1,
      installedAt: Date.now(),
      enabled: true,
    };
    await modManager.add(instanceId, installedMod);
    logger.info(`Installed mod "${modName}" (${versionId}) into instance ${instanceId}`);
    return installedMod;
  });

  ipcMain.handle('mods:remove', async (_e, instanceId: string, projectId: string) => {
    const mod = await modManager.get(instanceId, projectId);
    if (mod) {
      const instance = await instanceManager.get(instanceId);
      const filePath = path.join(instance.gameDirectory, 'mods', mod.fileName);
      await fs.rm(filePath, { force: true });
      await modManager.remove(instanceId, projectId);
      logger.info(`Removed mod "${mod.name}" from instance ${instanceId}`);
    }
    return { success: true };
  });

  logger.info('IPC handlers registered');
}
