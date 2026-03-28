# Summary: 05-02 — Version Mismatch Warning (Frontend)

## Result: COMPLETE

## Steps executed

### Step 1 — `EditInstanceModal` — `serverMinecraftVersion` field added
`src/renderer/components/instances/EditInstanceModal.tsx`:
- Added `serverVersion` state: `useState(instance.serverMinecraftVersion ?? '')`
- Added `serverMinecraftVersion: serverVersion.trim() || undefined` to config in `handleSubmit`
- Added form field after server host/port: text input with id `ei-server-version`,
  placeholder "e.g. 1.21.1", with hint text explaining the warning behavior

### Step 2 — `Sidebar.tsx` — mismatch handling in `handlePlay`
`src/renderer/components/layout/Sidebar.tsx`:
- `handlePlay` now awaits `result` from `game.launch(selectedInstanceId)`
- Checks `'versionMismatch' in result && result.versionMismatch`
- If true: resets `launching` to false, shows `window.confirm()` dialog with version strings
- Cancel: returns early, Play button resets to normal
- Confirm: calls `game.launch(selectedInstanceId, true)` (force flag bypasses check)

## Build: PASSED
Zero TypeScript errors.

## Files changed
- `src/renderer/components/instances/EditInstanceModal.tsx`
- `src/renderer/components/layout/Sidebar.tsx`

## Deviations
None.
