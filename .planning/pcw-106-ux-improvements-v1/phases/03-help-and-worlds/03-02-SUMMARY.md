# Plan 03-02 Summary: My Worlds IPC Backend

**Added the `launcher-file://` Electron protocol for serving local images, and four `worlds:*` IPC handlers for listing save folders, reading/writing notes, and listing screenshots.**

## Accomplishments
- Registered `launcher-file://` as a privileged scheme in `main/index.ts` (before `app.whenReady`) using `protocol.registerSchemesAsPrivileged`
- Wired `protocol.handle('launcher-file', ...)` inside `app.whenReady` to proxy requests to `net.fetch('file://...')`
- Added `import Store from 'electron-store'` to `ipc-handlers.ts`
- Instantiated inline `worldsStore` (name: `'worlds'`) at the top of `registerIpcHandlers`
- Added handlers: `worlds:list`, `worlds:get-notes`, `worlds:set-notes`, `worlds:list-screenshots`
- Exposed all four as `worlds.*` in preload
- Added `WorldInfo`, `ScreenshotInfo` interfaces and `worlds` block to `LauncherAPI` in `global.d.ts`

## Files Modified
- `src/main/index.ts`
- `src/main/ipc-handlers.ts`
- `src/main/preload.ts`
- `src/renderer/global.d.ts`

## Decisions Made
- Notes keyed as `notes.{instanceId}__{folderName}` — double underscore separator avoids collisions with instance IDs that may contain single underscores.
- Screenshots returned for the whole instance (not per-world) — NBT parsing to correlate screenshots to worlds is out of scope; all screenshots are shown in every world card.
- Both `worlds:list` and `worlds:list-screenshots` return `[]` on catch (saves/screenshots dirs don't exist on first launch).
