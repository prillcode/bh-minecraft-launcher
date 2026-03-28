> **📋 Planning Instructions**
> When using `/create-plan` for this work:
> - Create plans in the `phases/` subdirectory
> - Reference this BRIEF.md for work context and scope
> - **Identifier:** `pcw-106`
> - **Commits:**
>   - Subagent: Use `feat(pcw-106-01):`, `fix(pcw-106-02):`, etc.
>   - Manual: Use standard prefixes without identifier

---

# Work: ux-improvements-v1

**Identifier:** pcw-106
**Type:** Enhancement

## Objective
Post-v1.0 UX polish pass: wire existing settings/UI features that are currently no-ops, add Quilt mod loader support, and surface a version mismatch warning before launch. All items are low-to-medium effort with direct user-visible impact.

## Scope
**Included:**
- Wire `closeOnLaunch` setting in `main/index.ts` (toggle exists, behavior not implemented)
- Wire `JAVA_HOME` / `javaPath` setting into `java-detector.ts` (setting saved but never read at launch)
- Implement mod enable/disable on disk (`.jar` → `.jar.disabled` rename; toggle exists in UI but has no effect)
- Add Quilt mod loader support (~80% reuse from FabricProvisioner)
- Version mismatch warning before launch when `serverAutoConnect` is set and MC version differs

**Excluded:**
- Forge support (high complexity, low priority)
- New UI pages or tab additions
- Mod loader version pinning (separate backlog item)

## Context
**Current State:**
- v1.0.0 shipped with full instance management, Fabric support, mods/shaders tabs, settings page
- Several settings are saved to disk but never acted upon at runtime
- Mod enable/disable toggle renders in `InstalledModsPanel` but `.jar.disabled` rename is not wired
- Quilt provisioner not yet created despite `'quilt'` already in the `modLoader` union type
- Version mismatch results in a silent Minecraft disconnect screen rather than a pre-launch prompt

**Key Files:**
- [src/main/index.ts](../../src/main/index.ts) — closeOnLaunch wiring
- [src/core/game/java-detector.ts](../../src/core/game/java-detector.ts) — javaPath override
- [src/core/game/launch.ts](../../src/core/game/launch.ts) — Quilt branch + version mismatch check
- [src/core/game/fabric-provisioner.ts](../../src/core/game/fabric-provisioner.ts) — template for Quilt
- [src/main/ipc-handlers.ts](../../src/main/ipc-handlers.ts) — game:launch handler
- [src/renderer/components/mods/InstalledModsPanel.tsx](../../src/renderer/components/mods/InstalledModsPanel.tsx) — enable/disable toggle
- [src/renderer/components/instances/EditInstanceModal.tsx](../../src/renderer/components/instances/EditInstanceModal.tsx) — Quilt dropdown option
- [src/renderer/components/instances/CreateInstanceModal.tsx](../../src/renderer/components/instances/CreateInstanceModal.tsx) — Quilt dropdown option

**Tech Stack:**
Electron 34 + React + TypeScript, pnpm, Node 22. Main process: CJS via nodenext. Renderer: Vite + React.

## Success Criteria
- [ ] Closing the launcher when game launches works when `closeOnLaunch` is `true`
- [ ] `javaPath` from settings is used by java-detector instead of always auto-detecting
- [ ] Toggling a mod enabled/disabled renames the `.jar` file on disk; state persists across restarts
- [ ] Quilt instances can be created, Quilt loader is provisioned at launch, mods tab is enabled
- [ ] Pre-launch warning shown when instance MC version mismatches server version (with proceed/cancel)
