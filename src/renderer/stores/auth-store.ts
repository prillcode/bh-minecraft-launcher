import { create } from 'zustand';

interface MinecraftProfile {
  id: string;
  name: string;
  skins: Array<{ url: string; variant: string }>;
}

interface AuthState {
  profile: MinecraftProfile | null;
  isLoading: boolean;
  setProfile: (profile: MinecraftProfile | null) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  isLoading: true,

  setProfile: (profile) => set({ profile }),

  /**
   * On app startup, try to restore an existing session.
   * If the token is still valid, we skip the login screen.
   */
  initialize: async () => {
    try {
      // Try silent refresh first
      const profile = await window.launcher.auth.refresh();
      set({ profile, isLoading: false });
    } catch {
      // No valid session — show login
      set({ profile: null, isLoading: false });
    }
  },
}));

// Auto-initialize on import
useAuthStore.getState().initialize();
