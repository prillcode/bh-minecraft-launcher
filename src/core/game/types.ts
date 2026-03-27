// ── Version Manifest (from Mojang) ──────────────────────────────
export interface VersionManifestResponse {
  latest: {
    release: string;
    snapshot: string;
  };
  versions: VersionSummary[];
}

export interface VersionSummary {
  id: string;              // e.g., "1.21.4"
  type: 'release' | 'snapshot' | 'old_beta' | 'old_alpha';
  url: string;             // URL to full version JSON
  time: string;
  releaseTime: string;
}

export interface VersionDetail {
  id: string;
  type: string;
  mainClass: string;       // e.g., "net.minecraft.client.main.Main"
  minecraftArguments?: string;  // Legacy
  arguments?: {
    game: Array<string | ConditionalArg>;
    jvm: Array<string | ConditionalArg>;
  };
  libraries: Library[];
  downloads: {
    client: DownloadInfo;
    client_mappings?: DownloadInfo;
    server?: DownloadInfo;
  };
  assetIndex: {
    id: string;
    sha1: string;
    size: number;
    url: string;
  };
  assets: string;
  javaVersion?: {
    component: string;
    majorVersion: number;
  };
}

export interface ConditionalArg {
  rules: Rule[];
  value: string | string[];
}

export interface Rule {
  action: 'allow' | 'disallow';
  os?: { name?: string; arch?: string; version?: string };
  features?: Record<string, boolean>;
}

export interface Library {
  name: string;            // Maven coordinate: group:artifact:version
  downloads: {
    artifact?: {
      path: string;
      sha1: string;
      size: number;
      url: string;
    };
    classifiers?: Record<string, DownloadInfo & { path: string }>;
  };
  rules?: Rule[];
  natives?: Record<string, string>;
}

export interface DownloadInfo {
  sha1: string;
  size: number;
  url: string;
}

// ── Instance (local launcher concept) ───────────────────────────
export interface Instance {
  id: string;
  name: string;
  versionId: string;
  modLoader?: 'vanilla' | 'forge' | 'fabric' | 'quilt';
  modLoaderVersion?: string;
  javaPath?: string;       // Override auto-detect
  jvmArgs?: string[];
  minMemoryMb: number;
  maxMemoryMb: number;
  gameDirectory: string;   // Isolated per-instance
  resolution?: { width: number; height: number };
  serverAutoConnect?: {    // 👈 BlockHaven quick-connect
    host: string;
    port: number;
  };
  lastPlayed?: number;
  createdAt: number;
}

// ── Download Progress ───────────────────────────────────────────
export interface DownloadProgress {
  phase: 'client' | 'libraries' | 'assets' | 'java' | 'fabric' | 'quilt';
  current: number;
  total: number;
  fileName: string;
  bytesPerSecond: number;
}

// ── Java Runtime ────────────────────────────────────────────────
export interface JavaRuntime {
  path: string;
  version: string;
  majorVersion: number;
  is64Bit: boolean;
}

// ── Launch Config ───────────────────────────────────────────────
export interface LaunchOptions {
  instanceId: string;
  accessToken: string;
  profile: { id: string; name: string };
  userType?: 'msa' | 'legacy';
  onProgress?: (progress: DownloadProgress) => void;
  onStdout?: (data: string) => void;
  onStderr?: (data: string) => void;
  onExit?: (code: number | null) => void;
}
