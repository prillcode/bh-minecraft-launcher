# Plan 02-01 Summary: Modrinth Bulk Project Fetch

**Added `ModrinthAPI.getProjects()` using Modrinth's bulk endpoint, wired it as a new `mods:get-projects` IPC channel, and exposed it to the renderer.**

## Accomplishments
- Added `getProjects(slugs: string[]): Promise<ModrinthProject[]>` to `ModrinthAPI` using `GET /v2/projects?ids=[...]`
- Returns `[]` immediately for empty input (no network call)
- Added `mods:get-projects` IPC handler in `ipc-handlers.ts`
- Exposed `mods.getProjects` in preload and typed it as `getProjects(slugs: string[]): Promise<ModSearchHit[]>` in `global.d.ts`

## Files Modified
- `src/core/mods/modrinth-api.ts`
- `src/main/ipc-handlers.ts`
- `src/main/preload.ts`
- `src/renderer/global.d.ts`

## Decisions Made
- No instance filtering in the IPC handler — the renderer is responsible for display; the API returns the same project shape regardless of instance loader/version.
- Typed the renderer-side return as `ModSearchHit[]` (existing renderer type) rather than introducing a new `ModrinthProject` interface in `global.d.ts`.
