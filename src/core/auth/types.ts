// ── Microsoft OAuth ─────────────────────────────────────────────
export interface MicrosoftTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
}

export interface DeviceCodeResponse {
  userCode: string;
  verificationUri: string;
  expiresIn: number;
}

// ── Xbox Live ───────────────────────────────────────────────────
export interface XBLToken {
  token: string;
  userHash: string;
}

export interface XSTSToken {
  token: string;
  userHash: string;
}

// ── Minecraft ───────────────────────────────────────────────────
export interface MinecraftTokenResponse {
  accessToken: string;
  expiresAt: number;
}

export interface MinecraftProfile {
  id: string;       // UUID (no dashes)
  name: string;     // In-game username
  skins: Array<{
    id: string;
    state: string;
    url: string;
    variant: 'CLASSIC' | 'SLIM';
  }>;
  capes: Array<{
    id: string;
    state: string;
    url: string;
    alias: string;
  }>;
}

// ── Offline Mode ───────────────────────────────────────────────
export interface OfflineProfile {
  name: string;
  id: string; // UUID (dashed format)
}

// ── Combined session stored on disk ─────────────────────────────
export interface StoredSession {
  authMode: 'microsoft' | 'offline';
  microsoft: MicrosoftTokenResponse;
  minecraft: MinecraftTokenResponse;
  profile: MinecraftProfile;
  msalCache?: string; // Serialized MSAL token cache for silent refresh across restarts
}
