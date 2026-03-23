> **📋 Planning Instructions**
> When using `/create-plan` for this work:
> - Create plans in the `phases/` subdirectory
> - Reference this BRIEF.md for work context and scope
> - **Identifier:** `pcw-104`
> - **Commits:**
>   - Subagent: Use `feat(pcw-104-01):`, `fix(pcw-104-02):`, etc.
>   - Manual: Use standard prefixes without identifier

---

# Work: Build Out Mods Tab

**Identifier:** pcw-104
**Type:** Feature

## Objective
Build a functional Mods tab that lets users browse Modrinth for mods, install them into a specific instance, and manage (view/remove) installed mods per instance. The backend API client and mod loader installer already exist — this work wires them into IPC and builds the renderer UI.

## Scope
**Included:**
- Wire `mods:search`, `mods:install`, `mods:remove` IPC handlers to `ModrinthAPI` and a new `ModManager`
- `ModManager` class: tracks installed mods per instance (name, version, filename, source) via electron-store
- Mods tab UI: instance selector, search bar, results grid with mod cards (icon, name, description, download count)
- Install flow: pick a mod from results → pick compatible version → download JAR to instance's `mods/` directory
- Installed mods panel: list mods installed in the selected instance, with remove button
- `mods:list` IPC to fetch installed mods for an instance

**Excluded:**
- Mod update checking / auto-update
- Dependency resolution UI (required deps shown as info only)
- Forge mod loader installation (already stubbed, stays stubbed)
- Modpack support
- Resource packs / shaders (different project types, future)

## Context
**Current State:**
- `ModrinthAPI` in `src/core/mods/modrinth-api.ts` — fully implemented: `search()`, `getProject()`, `getVersions()`, `getVersion()`
- `ModLoaderInstaller` in `src/core/mods/mod-loader.ts` — Fabric install implemented, Forge throws TODO
- `mods:search/install/remove` channels exposed in preload but handlers throw/return stubs in ipc-handlers.ts
- No `ModManager` class exists yet
- Each instance has a `mods/` subdirectory created at instance creation time (already exists on disk)
- Mods tab route exists in the renderer but renders a placeholder

**Key Files:**
- `src/core/mods/modrinth-api.ts` — Modrinth API client (fully implemented)
- `src/core/mods/mod-loader.ts` — mod loader installer (Fabric ready)
- `src/main/ipc-handlers.ts` — IPC handler registration (mods:* stubs need wiring)
- `src/main/preload.ts` — contextBridge (mods.search/install/remove already exposed)
- `src/renderer/global.d.ts` — LauncherAPI types (mods.* currently typed as unknown)
- `src/core/game/instance.ts` — InstanceManager (reference pattern for ModManager)
- `src/core/game/types.ts` — Instance type (has modLoader field)
- `src/renderer/styles/globals.css` — existing design tokens and component styles

**Tech Stack:**
- Modrinth API v2 — mod search and version resolution
- `got` — HTTP downloads (already a dependency)
- `electron-store` — installed mod manifest per instance
- React + existing modal/CSS patterns

## Success Criteria
- [ ] `ModManager` tracks installed mods per instance, persisted to disk
- [ ] `mods:search` returns typed Modrinth results filtered by instance's game version
- [ ] `mods:install` downloads mod JAR to instance's `mods/` dir and records in ModManager
- [ ] `mods:remove` deletes JAR and removes from ModManager
- [ ] Mods tab shows instance selector + search UI
- [ ] Mod cards show icon, name, description, download count, compatible versions
- [ ] Installed mods panel per instance with remove action
- [ ] All IPC channels fully typed in `global.d.ts`
