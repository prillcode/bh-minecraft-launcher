# Plan 01-01 Summary: ModManager

**Created ModManager class — persistence layer for installed mods per instance, mirroring InstanceManager and backed by electron-store.**

## Accomplishments
- Implemented `ModManager` at `src/core/mods/mod-manager.ts` with all 5 required methods: `list`, `get`, `add`, `remove`, `isInstalled`
- Store keyed by `instanceId` → `projectId` → `InstalledMod`, using electron-store `name: 'mods'`
- `list()` returns mods sorted by `installedAt` descending
- `remove()` logs mod name (fetched before deletion) alongside the projectId
- TypeScript compilation passes with `tsc -p tsconfig.main.json --noEmit`

## Files Created/Modified
- **Created:** `src/core/mods/mod-manager.ts`

## Decisions Made
- Added an explicit `as Record<string, InstalledMod>` cast on the `Object.values()` call in `list()` — the `as any` path trick causes the store to return `unknown` for the nested object, so a second cast is required to restore the concrete type. This is a minor deviation from the plan's literal wording but is necessary for TypeScript strict mode to accept the code.
- `remove()` pre-fetches the mod name for a useful log message; falls back to the projectId string if the entry is already absent.

## Issues Encountered
- `npx tsc --noEmit` invoked the wrong tsc binary (printed help instead of compiling). Used `./node_modules/.bin/tsc -p tsconfig.main.json --noEmit` instead — this is the correct invocation for this project since there is no root `tsconfig.json`.
- Initial `list()` produced `TS2322: Type 'unknown[]' is not assignable to type 'InstalledMod[]'` because the `as any` cast on the store get returns `unknown`. Fixed by adding the `as Record<string, InstalledMod>` cast.

## Next Plan Readiness
ModManager is ready to be imported and used in the IPC handlers (`mods:install`, `mods:remove`, `mods:list`). No blocking issues.
