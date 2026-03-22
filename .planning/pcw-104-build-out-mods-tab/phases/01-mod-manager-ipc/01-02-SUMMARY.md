# Plan 01-02 Summary: Mods IPC Handlers + Types

**Wired all 5 mods IPC handlers, updated preload.ts with correct signatures, and fully typed mods.* in global.d.ts.**

## Accomplishments
- Registered 5 IPC handlers: `mods:search`, `mods:list`, `mods:get-versions`, `mods:install`, `mods:remove`
- `mods:install` downloads JAR via `got.stream` + `pipeline` and records mod in `ModManager`
- `mods:remove` deletes JAR from disk and removes record from `ModManager`
- `mods:search` filters by instance's `versionId` and `modLoader` (skips loader filter for vanilla)
- Updated `preload.ts` mods section with all 5 methods and correct parameter signatures
- Added 5 interfaces to `global.d.ts`: `InstalledModInfo`, `ModSearchHit`, `ModSearchResponse`, `ModVersionFile`, `ModVersionInfo`
- Replaced `unknown`-typed mods section in `LauncherAPI` with fully typed definitions
- TypeScript compiles cleanly with no errors

## Files Created/Modified
- `src/main/ipc-handlers.ts` — added imports (`path`, `fs`, `createWriteStream`, `pipeline`, `ModrinthAPI`, `ModManager`), instantiated `modrinthAPI` and `modManager`, added 5 IPC handlers
- `src/main/preload.ts` — replaced mods section with all 5 methods and correct signatures
- `src/renderer/global.d.ts` — added 5 mod-related interfaces to `declare global`, replaced `mods` section in `LauncherAPI` with full types

## Decisions Made
- Used dynamic `await import('got')` for the download in `mods:install` to handle the ESM/CJS boundary, consistent with the plan's note about got's module format
- `mods:install` uses `got.stream()` piped via Node's `stream/promises pipeline` to `createWriteStream` for efficient streaming download without buffering the entire JAR in memory
- `mods:search` passes `loader: undefined` for vanilla instances (not an empty string) so Modrinth doesn't filter on loader

## Issues Encountered
None. The existing `ModManager` and `ModrinthAPI` classes were already fully implemented from plan 01-01, making wiring straightforward.

## Next Plan Readiness
The backend is fully wired. All 5 IPC channels are registered, typed end-to-end, and exposed in the preload. The renderer can now call `window.launcher.mods.*` with full TypeScript type safety. Ready for the Mods tab UI phase.
