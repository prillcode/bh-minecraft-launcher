import { contextBridge, ipcRenderer } from 'electron';

/**
 * Exposes a safe, typed API to the renderer process.
 * The renderer calls `window.launcher.*` — never touches Node directly.
 */
contextBridge.exposeInMainWorld('launcher', {
  // ── Auth ──────────────────────────────────────────────────────
  auth: {
    /** Starts MS OAuth device-code flow; returns { userCode, verificationUri } */
    startLogin: () => ipcRenderer.invoke('auth:start-login'),
    /** Polls for completion after user enters device code */
    pollLogin: () => ipcRenderer.invoke('auth:poll-login'),
    /** Refresh existing session */
    refresh: () => ipcRenderer.invoke('auth:refresh'),
    /** Log out and clear stored tokens */
    logout: () => ipcRenderer.invoke('auth:logout'),
    /** Get current MC profile (username, uuid, skin) */
    getProfile: () => ipcRenderer.invoke('auth:get-profile'),
  },

  // ── Game ──────────────────────────────────────────────────────
  game: {
    /** Fetch available versions from Mojang manifest */
    getVersions: () => ipcRenderer.invoke('game:get-versions'),
    /** Download game files for a version */
    install: (versionId: string) => ipcRenderer.invoke('game:install', versionId),
    /** Launch Minecraft with a given instance config */
    launch: (instanceId: string) => ipcRenderer.invoke('game:launch', instanceId),
    /** Kill running game process */
    kill: () => ipcRenderer.invoke('game:kill'),
    /** Detect installed Java runtimes */
    detectJava: () => ipcRenderer.invoke('game:detect-java'),
  },

  // ── Instances ─────────────────────────────────────────────────
  instances: {
    list: () => ipcRenderer.invoke('instances:list'),
    create: (config: unknown) => ipcRenderer.invoke('instances:create', config),
    update: (id: string, config: unknown) => ipcRenderer.invoke('instances:update', id, config),
    delete: (id: string) => ipcRenderer.invoke('instances:delete', id),
  },

  // ── Mods ──────────────────────────────────────────────────────
  mods: {
    search: (query: string) => ipcRenderer.invoke('mods:search', query),
    install: (instanceId: string, modId: string) =>
      ipcRenderer.invoke('mods:install', instanceId, modId),
    remove: (instanceId: string, modId: string) =>
      ipcRenderer.invoke('mods:remove', instanceId, modId),
  },

  // ── Window Controls ───────────────────────────────────────────
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
  },

  // ── Events (main → renderer) ──────────────────────────────────
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const validChannels = [
      'download:progress',
      'launch:stdout',
      'launch:stderr',
      'launch:exit',
      'auth:expired',
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event, ...args) => callback(...args));
    }
  },

  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
});
