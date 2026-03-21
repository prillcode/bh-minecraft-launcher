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

interface LauncherAPI {
  auth: {
    startLogin(): Promise<DeviceCodeResponse>;
    pollLogin(): Promise<MinecraftProfile>;
    refresh(): Promise<MinecraftProfile>;
    logout(): Promise<{ success: boolean }>;
    getProfile(): Promise<MinecraftProfile | null>;
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
    list(): Promise<Array<{
      id: string;
      name: string;
      versionId: string;
      modLoader?: string;
      lastPlayed?: number;
    }>>;
    create(config: unknown): Promise<unknown>;
    update(id: string, config: unknown): Promise<unknown>;
    delete(id: string): Promise<void>;
  };
  mods: {
    search(query: string): Promise<unknown>;
    install(instanceId: string, modId: string): Promise<unknown>;
    remove(instanceId: string, modId: string): Promise<unknown>;
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
}

export {};
