# Phase 03 Plan 01: Shader Pack Backend Summary

**Wired full shader pack backend: shaderpacks/ dir creation, 5 IPC handlers, typed preload + global.d.ts.**

## Accomplishments
- Added `shaderpacks/` mkdir to `InstanceManager.create()` alongside mods/, resourcepacks/, saves/
- Added `shaders:search` IPC handler using `projectType: 'shader'` (no loader filter)
- Added `shaders:list`, `shaders:remove`, `shaders:install-modrinth`, `shaders:install-local` IPC handlers
- All handlers call `mkdir({ recursive: true })` first for legacy instance compatibility
- Exposed full `shaders` API in preload.ts with `onDownloadProgress` returning an unsubscribe fn
- Added `ShaderInfo` interface and `shaders` API to global.d.ts `LauncherAPI`

## Files Created/Modified
- `src/core/game/instance.ts` — added shaderpacks/ mkdir
- `src/main/ipc-handlers.ts` — added dialog import + 5 shaders IPC handlers
- `src/main/preload.ts` — exposed shaders API + onDownloadProgress
- `src/renderer/global.d.ts` — added ShaderInfo interface + shaders API

## Decisions Made
- Added `shaders:search` (not in original plan) because `mods:search` hardcodes `projectType: 'mod'` — without a dedicated search handler, shader search would return zero results
- `shaders:install-modrinth` uses actual `stat()` for fileSize instead of returning 0 (more accurate)

## Issues Encountered
- None

## Next Step
Ready for 03-02-PLAN.md
