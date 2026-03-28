# Plan 01-01 Summary: Wire closeOnLaunch + javaPath global override

**Wired two settings that were saved to disk but never read at runtime: `closeOnLaunch` hides/shows the launcher window around the game process lifetime; `javaPath` is now passed to the launcher as a global override and skips JRE auto-provisioning.**

## Accomplishments
- Added `globalJavaPath?: string` to `LaunchOptions` in `src/core/game/types.ts`
- Updated `GameLauncher.launch()` to resolve java as: `instance.javaPath || options.globalJavaPath || auto-detect`
- `game:launch` IPC handler now reads `getSettings()` and:
  - Skips `javaProvisioner.provision()` when `settings.javaPath` is set
  - Passes `globalJavaPath: settings.javaPath || undefined` into `gameLauncher.launch()`
  - Calls `window?.hide()` after spawn when `closeOnLaunch` is true
  - Calls `window?.show()` in `onExit` when `closeOnLaunch` is true

## Files Modified
- `src/core/game/types.ts`
- `src/core/game/launch.ts`
- `src/main/ipc-handlers.ts`

## Decisions Made
- Used `||` (falsy) rather than `??` (nullish) for the java path chain — empty string from settings should fall through to auto-detect.
- `settings` read once at handler entry so both closeOnLaunch and javaPath share the same snapshot.

## Issues Encountered
- None. Changes were straightforward wiring with no TypeScript friction.
