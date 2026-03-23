import Store from 'electron-store';

export interface LauncherSettings {
  defaultAuthMode: 'microsoft' | 'offline';
  defaultMinMemory: number;
  defaultMaxMemory: number;
  javaPath: string;
  closeOnLaunch: boolean;
  defaultResolutionWidth: number;
  defaultResolutionHeight: number;
}

const store = new Store<LauncherSettings>({
  name: 'settings',
  defaults: {
    defaultAuthMode: 'microsoft',
    defaultMinMemory: 512,
    defaultMaxMemory: 2048,
    javaPath: '',
    closeOnLaunch: false,
    defaultResolutionWidth: 854,
    defaultResolutionHeight: 480,
  },
});

export function getSettings(): LauncherSettings {
  return {
    defaultAuthMode: store.get('defaultAuthMode'),
    defaultMinMemory: store.get('defaultMinMemory'),
    defaultMaxMemory: store.get('defaultMaxMemory'),
    javaPath: store.get('javaPath'),
    closeOnLaunch: store.get('closeOnLaunch'),
    defaultResolutionWidth: store.get('defaultResolutionWidth'),
    defaultResolutionHeight: store.get('defaultResolutionHeight'),
  };
}

export function setSetting<K extends keyof LauncherSettings>(
  key: K,
  value: LauncherSettings[K],
): void {
  store.set(key, value);
}
