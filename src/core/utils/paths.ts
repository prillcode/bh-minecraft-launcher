import * as path from 'path';
import { app } from 'electron';

/**
 * All launcher data lives under a single root directory.
 * We DON'T use the vanilla .minecraft folder — instances are fully isolated.
 */
export interface LauncherPaths {
  root: string;           // Top-level launcher data dir
  versions: string;       // Shared version JARs + JSON
  libraries: string;      // Shared library JARs
  assets: string;         // Shared assets (indexes + objects)
  natives: string;        // Extracted native libs per version
  instances: string;      // Per-instance game directories
  java: string;           // Provisioned JRE runtimes
  logs: string;
  temp: string;
}

let cachedPaths: LauncherPaths | null = null;

export function getLauncherPaths(): LauncherPaths {
  if (cachedPaths) return cachedPaths;

  // Use Electron's userData path as the root
  // Windows: %APPDATA%/blockhaven-launcher
  // macOS:   ~/Library/Application Support/blockhaven-launcher
  // Linux:   ~/.config/blockhaven-launcher
  const root = path.join(app.getPath('userData'));

  cachedPaths = {
    root,
    versions: path.join(root, 'versions'),
    libraries: path.join(root, 'libraries'),
    assets: path.join(root, 'assets'),
    natives: path.join(root, 'natives'),
    instances: path.join(root, 'instances'),
    java: path.join(root, 'java'),
    logs: path.join(root, 'logs'),
    temp: path.join(root, 'temp'),
  };

  return cachedPaths;
}

/**
 * For use in tests or non-Electron contexts.
 */
export function getLauncherPathsCustomRoot(root: string): LauncherPaths {
  return {
    root,
    versions: path.join(root, 'versions'),
    libraries: path.join(root, 'libraries'),
    assets: path.join(root, 'assets'),
    natives: path.join(root, 'natives'),
    instances: path.join(root, 'instances'),
    java: path.join(root, 'java'),
    logs: path.join(root, 'logs'),
    temp: path.join(root, 'temp'),
  };
}
