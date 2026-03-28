# Summary: 05-01 — Version Mismatch Warning (Backend)

## Result: COMPLETE

## Steps executed

### Step 1 — Added `serverMinecraftVersion` to `Instance` type
`src/core/game/types.ts` — added `serverMinecraftVersion?: string` after `serverAutoConnect`.

### Step 2 — Added to `global.d.ts`
- `InstanceConfig`: added `serverMinecraftVersion?: string`
- `InstanceInfo`: added `serverMinecraftVersion?: string`

### Step 3 — InstanceManager persistence
`src/core/game/instance.ts` — `update()` uses object spread so no change needed.
`create()` explicitly lists fields — added `serverMinecraftVersion: config.serverMinecraftVersion`.

### Step 4 — Pre-launch version check in `game:launch`
`src/main/ipc-handlers.ts` — changed handler signature to `(event, instanceId: string, force = false)`.
Added mismatch check after `instanceManager.get()`:
- Triggers only when `!force && serverAutoConnect && serverMinecraftVersion && versions differ`
- Returns `{ versionMismatch: true, instanceVersion, serverVersion }` early (no launch)

### Step 5 — Preload `launch` binding updated
`src/main/preload.ts` — `launch: (instanceId, force = false) => ipcRenderer.invoke('game:launch', instanceId, force)`

### Step 6 — `global.d.ts` return type updated
`launch(instanceId: string, force?: boolean): Promise<{ pid: number } | { versionMismatch: true; instanceVersion: string; serverVersion: string }>`

## Build: PASSED
Zero TypeScript errors. Pre-existing `got` dynamic-import warning unchanged.

## Files changed
- `src/core/game/types.ts`
- `src/core/game/instance.ts`
- `src/main/ipc-handlers.ts`
- `src/main/preload.ts`
- `src/renderer/global.d.ts`

## Deviations
None.
