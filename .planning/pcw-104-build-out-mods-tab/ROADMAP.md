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

### Phase 04: Mod Dependency Auto-Install
**Status:** 📋 Planned (depends on Phase 01 + 02 + 03)

**Goals:**
- When user clicks Install in VersionPickerModal, fetch the selected version's required deps
- Filter out already-installed deps; if any remain, show inline confirmation prompt listing them
- Install uninstalled deps sequentially first, then the requested mod
- Per-item status label during install ("Installing Fabric API…")
- Simple mods (no deps) install unchanged in a single click

**Plans:**
- [04-01](phases/04-dep-auto-install/04-01-PLAN.md) — IPC backend: `mods:get-required-deps` handler + `DependencyInfo` type
- [04-02](phases/04-dep-auto-install/04-02-PLAN.md) — VersionPickerModal: two-phase install flow + dep confirmation UI

---

## Execution Order

```
01-01 -> 01-02 -> 02-01 -> 02-02 -> 04-01 -> 04-02
                       -> 03-01
```

## Next Steps

1. Execute Phase 04: `/run-plan .planning/pcw-104-build-out-mods-tab/phases/04-dep-auto-install/04-01-PLAN.md`
2. Then `04-02-PLAN.md`
