# Plan 01-02 Summary: Mod Enable/Disable (disk rename + UI toggle)

**Added a per-mod enable/disable toggle that renames the `.jar` file to `.jar.disabled` on disk, persists the state in electron-store, and shows an Enable/Disable button with opacity dimming in the installed mods panel.**

## Accomplishments
- Added `ModManager.setEnabled()` — updates `enabled` and `fileName` in the store; derives new filename by adding/stripping `.disabled` suffix
- Added `mods:toggle` IPC handler — renames the file on disk then calls `setEnabled()`
- Exposed `mods.toggle` in preload and typed it in `global.d.ts`
- Updated `InstalledModsPanel`: added `togglingId` state, `handleToggle` handler, Enable/Disable button per row, and `opacity: 0.5` for disabled mods
- Also added "Search All" category chip (follow-up UX request): first chip in the row, active when no category selected, focuses the search input on click

## Files Modified
- `src/core/mods/mod-manager.ts`
- `src/main/ipc-handlers.ts`
- `src/main/preload.ts`
- `src/renderer/global.d.ts`
- `src/renderer/components/mods/InstalledModsPanel.tsx`

## Decisions Made
- Disable strategy: append `.disabled` to the existing filename (including any extension), not strip `.jar` and re-add. Simpler and safe for double-disable guard via `endsWith('.disabled')` check in `setEnabled()`.
- `fileName` is not updated in the renderer after toggle (only `enabled` flag) — the stored filename is only needed by the backend for the next toggle or remove operation.

## Issues Encountered
- None.
