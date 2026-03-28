# Roadmap: ux-improvements-v1

**Identifier:** pcw-106

## Phases

### Phase 01: Wire Existing Features
**Status:** 📋 Planned

**Goals:**
- Wire `closeOnLaunch` — hide/show window around game process lifetime
- Wire global `javaPath` setting into launch flow (priority: instance > global > auto-detect)
- Implement mod enable/disable — `.jar` ↔ `.jar.disabled` rename on disk + UI toggle

**Plans:**
- [01-01-PLAN.md](phases/01-wire-existing-features/01-01-PLAN.md) — closeOnLaunch + javaPath global override
- [01-02-PLAN.md](phases/01-wire-existing-features/01-02-PLAN.md) — mod enable/disable (disk rename + UI toggle)

---

### Phase 02: Curated Mod Categories + Shader Suggestions
**Status:** 📋 Planned

**Goals:**
- Mods tab: add category browsing section above search (Performance, HUD/Minimap, Gameplay, Compatibility)
  - Hardcoded slug lists → bulk Modrinth fetch → render as installable cards filtered by instance loader
- Shaders tab: add curated popular shaders list (Complementary, BSL, Sildur's, SEUS Renewed, etc.)
  - Same bulk-fetch pattern; all shaders shown regardless of loader
  - Surface "Shaders require Iris + Sodium" callout if Iris is not installed

**Plans:**
- Use `/create-plan` to define detailed implementation plans

---

### Phase 03: New Bottom Panel Group — Help + My Worlds
**Status:** 📋 Planned

**Goals:**
- Add new sidebar panel group anchored above Sign Out
- **Help panel** — in-app launcher documentation (adding instances, mods, shaders, settings)
  - Static `.md` files bundled with app, rendered via `react-markdown` + `remark-gfm`
  - Sectioned TOC: Instances, Mods, Shaders, Settings, Troubleshooting
  - Note: Strategy Guide deferred to a separate web-hosted resource (linkable from Help later)
- **My Worlds panel** — per-instance world listing with notes + screenshots
  - Reads `{gameDirectory}/saves/` — folder name + mtime for "last played" (no NBT parsing)
  - User notes per world stored in electron-store (instanceId + world folder key)
  - Screenshots from `{gameDirectory}/screenshots/` rendered as thumbnail grid
  - Respects selected instance context (same as Mods/Shaders)

**Plans:**
- Use `/create-plan` to define detailed implementation plans

---

### Phase 04: Quilt Mod Loader Support
**Status:** 📋 Planned (independent, can run alongside other phases)

**Goals:**
- Create `src/core/game/quilt-provisioner.ts` (~80% reuse from FabricProvisioner)
  - API: `https://meta.quiltmc.org/v3/versions/loader/{gameVersion}`
  - Profile: `https://meta.quiltmc.org/v3/versions/loader/{gameVersion}/{loaderVersion}/profile/json`
- Add Quilt branch in `launch.ts` (same pattern as Fabric)
- Add `'quilt'` option to Create/Edit instance modals
- Add `'quilt'` to `DownloadProgress.phase`

**Plans:**
- Use `/create-plan` to define detailed implementation plans

---

### Phase 05: Version Mismatch Warning
**Status:** 📋 Planned (independent)

**Goals:**
- Add `serverMinecraftVersion?: string` to Instance type + `InstanceInfo` in `global.d.ts`
- Pre-launch check: if `serverAutoConnect` is set and stored server version differs from instance version, show warning dialog (proceed / cancel)
- Expose server version field in EditInstanceModal

**Plans:**
- Use `/create-plan` to define detailed implementation plans

---

### Phase 06: Session Notes (replaces My Worlds)
**Status:** 📋 Planned

**Goals:**
- Remove My Worlds (phase 03 shipped it but it is useless — server players have no singleplayer saves)
- Add Session Notes: per-instance personal journal for waypoints, POIs, and multiplayer session memories
  - NotesManager (electron-store, name: "notes", keyed notes.{instanceId}.{entryId})
  - NoteEntry: { id, instanceId, title, text, screenshotPaths, createdAt, updatedAt }
  - Screenshots browsed from {gameDirectory}/screenshots/ (multiplayer screenshots via F2)
  - Two-pane UI: note list (left) + editor with auto-save + screenshot grid (right)

**Plans:**
- [06-01-PLAN.md](phases/06-session-notes/06-01-PLAN.md) — Remove My Worlds (nav, route, component, IPC, preload, types, CSS)
- [06-02-PLAN.md](phases/06-session-notes/06-02-PLAN.md) — NotesManager backend (store, IPC handlers, preload, types)
- [06-03-PLAN.md](phases/06-session-notes/06-03-PLAN.md) — Session Notes UI (NotesPage, route, sidebar, CSS)

---

## Notes

- Strategy Guide deferred: planned as separate web-hosted content (GitHub Pages or similar);
  a link to it can be added to the Help panel once the URL is known.
- Phase 03 (My Worlds) fully removed and repurposed as Phase 06 (Session Notes).

---

## Next Steps

1. Execute Phase 01 plans with `/run-plan`
2. After Phase 01: create Phase 02 plans with `/create-plan`
3. Phases 04 and 05 are independent and can be planned/executed in parallel with any phase
4. Phase 06 plans are ready to execute sequentially: 06-01 → 06-02 → 06-03
