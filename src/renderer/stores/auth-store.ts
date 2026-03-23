import { create } from 'zustand';

interface MinecraftProfile {
  id: string;
  name: string;
  skins: Array<{ url: string; variant: string }>;
}

interface AuthState {
  profile: MinecraftProfile | null;
  authMode: 'microsoft' | 'offline';
  isLoading: boolean;
  setProfile: (profile: MinecraftProfile | null) => void;
  setAuthMode: (mode: 'microsoft' | 'offline') => void;
  offlineLogin: (username: string) => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  authMode: 'microsoft',
  isLoading: true,

  setProfile: (profile) => set({ profile }),
  setAuthMode: (authMode) => set({ authMode }),

  offlineLogin: async (username: string) => {
    const result = await window.launcher.auth.offlineLogin(username);
    set({
      profile: { id: result.id, name: result.name, skins: [] },
      authMode: 'offline',
    });
  },

  /**
   * On app startup, try to restore an existing session.
   * If the token is still valid, we skip the login screen.
   */
  initialize: async () => {
    try {
      // Try silent refresh first
      const profile = await window.launcher.auth.refresh();
      const stored = await window.launcher.auth.getProfile();
      set({
        profile,
        authMode: stored?.authMode ?? 'microsoft',
        isLoading: false,
      });
    } catch {
      // No valid session — show login
      set({ profile: null, isLoading: false });
    }
  },
}));

// Auto-initialize on import
useAuthStore.getState().initialize();
