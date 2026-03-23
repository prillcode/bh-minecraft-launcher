# Roadmap: Build Out Mods Tab

**Identifier:** pcw-104

## Phases

### Phase 01: ModManager + IPC Wiring
**Status:** 📋 Planned

**Goals:**
- Build `ModManager` class — tracks installed mods per instance via electron-store; exposes `list(instanceId)`, `add(instanceId, mod)`, `remove(instanceId, modId)`
- Wire `mods:list`, `mods:search`, `mods:install`, `mods:remove`, `mods:get-versions` IPC handlers
- `mods:install` downloads mod JAR via `got` into instance's `mods/` directory
- Expose all methods in preload and fully type in `global.d.ts`

**Plans:**
- [01-01](phases/01-mod-manager-ipc/01-01-PLAN.md) — ModManager class
- [01-02](phases/01-mod-manager-ipc/01-02-PLAN.md) — IPC handlers (all 5) + preload + global.d.ts

---

### Phase 02: Mods Tab UI — Browse + Install
**Status:** 📋 Planned (depends on Phase 01)

**Goals:**
- Instance selector dropdown at top of Mods tab
- Search bar — calls `mods:search` filtered to instance's game version and mod loader
- Mod result cards: icon, name, description, download count, "Install" button
- Version picker modal on install — shows compatible versions, picks most recent by default

**Plans:**
- [02-01](phases/02-browse-ui/02-01-PLAN.md) — ModsTab container + instance selector + search + mod cards
- [02-02](phases/02-browse-ui/02-02-PLAN.md) — VersionPickerModal (version list + install flow)

---

### Phase 03: Installed Mods Panel
**Status:** 📋 Planned (depends on Phase 01 + 02-01)

**Goals:**
- Installed mods list shown below search results for the selected instance
- Each row: name, version, remove button
- Remove calls `mods:remove`, deletes JAR, updates list
- Panel refreshes after a mod is installed
- Empty state when no mods installed

**Plans:**
- [03-01](phases/03-installed-panel/03-01-PLAN.md) — InstalledModsPanel component + wire into ModsTab

---

## Execution Order

```
01-01 -> 01-02 -> 02-01 -> 02-02
                       -> 03-01
```

02-02 and 03-01 both depend on 02-01 and can run in either order.

## Next Steps

1. Execute Phase 01: `/run-plan .planning/pcw-104-build-out-mods-tab/phases/01-mod-manager-ipc/01-01-PLAN.md`
2. Then `01-02-PLAN.md`, then `02-01-PLAN.md`
3. Then `02-02-PLAN.md` and `03-01-PLAN.md` in either order
