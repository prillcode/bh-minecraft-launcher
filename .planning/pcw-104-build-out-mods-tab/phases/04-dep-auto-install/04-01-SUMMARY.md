# Phase 04 Plan 01: Dep Auto-Install Backend Summary

**Added `mods:get-required-deps` IPC handler with full type wiring end-to-end.**

## Accomplishments
- `ModrinthVersion.dependencies` now includes optional `version_id?: string` matching the Modrinth API response
- New `mods:get-required-deps` IPC handler resolves required, uninstalled deps for a given version — handles both pinned (`version_id` set) and unpinned (resolves latest compatible via `getVersions`) deps; skips already-installed mods and logs a warning when no compatible version is found
- `getRequiredDeps` exposed through contextBridge in preload
- `DependencyInfo` interface and `getRequiredDeps` method declaration added to `global.d.ts` for full renderer type safety

## Files Created/Modified
- `src/core/mods/modrinth-api.ts` — added `version_id?: string` to `ModrinthVersion.dependencies` array item type
- `src/main/ipc-handlers.ts` — added `mods:get-required-deps` handler after `mods:install`
- `src/main/preload.ts` — exposed `getRequiredDeps` in the `mods` contextBridge object
- `src/renderer/global.d.ts` — added `DependencyInfo` interface and `getRequiredDeps` declaration in `LauncherAPI.mods`

## Decisions Made
- Used `Promise.all` for the parallel `getProject` + `getVersion` fetch per dep to reduce latency
- Loader filter passed as `undefined` (no filter) when `modLoader` is falsy or `'vanilla'`, matching existing handler patterns

## Issues Encountered
None — build passed clean on first attempt.

## Next Step
Ready for 04-02-PLAN.md
