/**
 * Type declarations for the `window.launcher` API
 * exposed by the preload script via contextBridge.
 */

interface MinecraftProfile {
  id: string;
  name: string;
  skins: Array<{ id: string; url: string; variant: 'CLASSIC' | 'SLIM' }>;
  capes: Array<{ id: string; url: string; alias: string }>;
}

interface DeviceCodeResponse {
  userCode: string;
  verificationUri: string;
  expiresIn: number;
}

interface OfflineProfile {
  name: string;
  id: string;
}

interface LauncherAPI {
  auth: {
    startLogin(): Promise<DeviceCodeResponse>;
    pollLogin(): Promise<MinecraftProfile>;
    refresh(): Promise<MinecraftProfile>;
    logout(): Promise<{ success: boolean }>;
    getProfile(): Promise<(MinecraftProfile & { authMode?: 'microsoft' | 'offline' }) | null>;
    offlineLogin(username: string): Promise<OfflineProfile>;
  };
  game: {
    getVersions(): Promise<{
      latest: { release: string; snapshot: string };
      versions: Array<{
        id: string;
        type: string;
        releaseTime: string;
      }>;
    }>;
    install(versionId: string): Promise<{ success: boolean }>;
    launch(instanceId: string): Promise<{ pid: number }>;
    kill(): Promise<{ success: boolean }>;
    detectJava(): Promise<Array<{
      path: string;
      version: string;
      majorVersion: number;
      is64Bit: boolean;
    }>>;
  };
  instances: {
    list(): Promise<InstanceInfo[]>;
    create(config: InstanceConfig): Promise<InstanceInfo>;
    update(id: string, config: Partial<InstanceConfig>): Promise<InstanceInfo>;
    delete(id: string): Promise<{ success: boolean }>;
  };
  mods: {
    search(query: string, instanceId: string): Promise<ModSearchResponse>;
    install(instanceId: string, projectId: string, versionId: string, modName: string, modSlug: string): Promise<InstalledModInfo>;
    remove(instanceId: string, projectId: string): Promise<{ success: boolean }>;
    list(instanceId: string): Promise<InstalledModInfo[]>;
    getVersions(projectId: string, gameVersion: string, loader?: string): Promise<ModVersionInfo[]>;
  };
  java: {
    provision(component: string): Promise<{ javaExe: string }>;
  };
  settings: {
    get(): Promise<LauncherSettings>;
    set(key: keyof LauncherSettings, value: LauncherSettings[keyof LauncherSettings]): Promise<{ success: boolean }>;
    setDefaultAuthMode(mode: 'microsoft' | 'offline'): Promise<{ success: boolean }>;
    getAppInfo(): Promise<{ version: string; dataPath: string }>;
    openDataFolder(): Promise<{ success: boolean }>;
    clearCache(): Promise<{ success: boolean }>;
  };
  window: {
    minimize(): Promise<void>;
    maximize(): Promise<void>;
    close(): Promise<void>;
  };
  on(channel: string, callback: (...args: any[]) => void): void;
  removeAllListeners(channel: string): void;
}

declare global {
  interface Window {
    launcher: LauncherAPI;
  }

  interface LauncherSettings {
    defaultAuthMode: 'microsoft' | 'offline';
    defaultMinMemory: number;
    defaultMaxMemory: number;
    javaPath: string;
    closeOnLaunch: boolean;
    defaultResolutionWidth: number;
    defaultResolutionHeight: number;
  }

  interface InstalledModInfo {
    id: string;
    slug: string;
    name: string;
    versionId: string;
    versionNumber: string;
    fileName: string;
    sha1: string;
    installedAt: number;
    enabled: boolean;
  }

  interface ModSearchHit {
    slug: string;
    title: string;
    description: string;
    categories: string[];
    downloads: number;
    icon_url: string | null;
    project_type: string;
    versions: string[];
  }

  interface ModSearchResponse {
    hits: ModSearchHit[];
    offset: number;
    limit: number;
    total_hits: number;
  }

  interface ModVersionFile {
    url: string;
    filename: string;
    size: number;
    primary: boolean;
  }

  interface ModVersionInfo {
    id: string;
    project_id: string;
    name: string;
    version_number: string;
    game_versions: string[];
    loaders: string[];
    files: ModVersionFile[];
  }

  interface InstanceConfig {
    name: string;
    versionId: string;
    serverAutoConnect?: { host: string; port: number };
  }

  interface InstanceInfo {
    id: string;
    name: string;
    versionId: string;
    modLoader?: string;
    lastPlayed?: number;
    serverAutoConnect?: { host: string; port: number };
    createdAt: number;
  }
}

export {};
