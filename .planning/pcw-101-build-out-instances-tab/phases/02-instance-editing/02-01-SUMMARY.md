# Summary: Plan 02-01 — Wire instances:update IPC + Build EditInstanceModal

## Status: Completed

## Tasks Completed

### Task 1: Wire instances:update IPC handler
- Added `instances:update` handler in `src/main/ipc-handlers.ts`
- Receives `(id, config)`, calls `instanceManager.update(id, config)`, returns updated instance

### Task 2: Create EditInstanceModal component
- Created `src/renderer/components/instances/EditInstanceModal.tsx`
- Pre-populated from `instance` prop: name, versionId, serverAutoConnect host/port
- Fetches release versions from Mojang on mount; existing versionId pre-selected
- On save: calls `window.launcher.instances.update()`, fires `onUpdate`, closes
- Clearing server host removes auto-connect (passes `serverAutoConnect: undefined`)
- Backdrop click and Escape key close the modal

### Task 3: Add edit button to InstanceList
- Imported `EditInstanceModal` in `src/renderer/components/instances/InstanceList.tsx`
- Added `editingInstance: InstanceInfo | null` state
- Edit button (`✎`) added to each card before the play button
- `handleUpdated` replaces the matching instance in state by id
- Modal rendered when `editingInstance !== null`

### Task 4: Add instance-card__edit CSS
- Added `.instance-card__edit` to `src/renderer/styles/globals.css`
- Same base as `.instance-card__delete`; hover color uses `--accent` (vs danger for delete)

### Task 5: Verification
- `npx tsc -p tsconfig.main.json --noEmit` — 0 errors
- `npx tsc -p tsconfig.renderer.json --noEmit` — 0 errors

## Files Modified
- `src/main/ipc-handlers.ts`
- `src/renderer/components/instances/EditInstanceModal.tsx` (new)
- `src/renderer/components/instances/InstanceList.tsx`
- `src/renderer/styles/globals.css`

## Deviations
None.
