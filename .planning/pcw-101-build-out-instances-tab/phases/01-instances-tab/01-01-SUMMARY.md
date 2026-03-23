# Summary: Plan 01-01 — Wire Instance IPC Handlers + Strengthen Types

## Status: Completed

## Tasks Completed

### Task 1: Wire InstanceManager into IPC handlers
- Imported `InstanceManager` from `../core/game/instance` in `src/main/ipc-handlers.ts`
- Instantiated `const instanceManager = new InstanceManager();` alongside other singletons
- Added `instances:list` handler — calls `instanceManager.list()`, returns array
- Added `instances:create` handler — receives config, calls `instanceManager.create(config)`, returns created instance
- Added `instances:delete` handler — receives `id: string`, calls `instanceManager.delete(id)`, returns `{ success: true }`

### Task 2: Tighten global.d.ts types for instances
- Added `InstanceConfig` interface with `name`, `versionId`, optional `serverAutoConnect`
- Added `InstanceInfo` interface with `id`, `name`, `versionId`, optional `modLoader`, `lastPlayed`, `serverAutoConnect`, and `createdAt`
- Updated `instances` section in `LauncherAPI` to use typed `InstanceConfig` and `InstanceInfo`

### Task 3: Verify both tsconfigs compile cleanly
- `npx tsc -p tsconfig.main.json --noEmit` — 0 errors
- `npx tsc -p tsconfig.renderer.json --noEmit` — 0 errors

## Files Modified
- `src/main/ipc-handlers.ts`
- `src/renderer/global.d.ts`

## Deviations
None.
