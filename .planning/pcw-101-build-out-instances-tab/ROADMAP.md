# pcw-101: Roadmap

## Phase 01 — Instances Tab (List + Create + Play)

### 01-01: Wire Instance IPC Handlers + Strengthen Types
- Wire `InstanceManager` into `ipc-handlers.ts` (list, create, delete)
- Tighten `global.d.ts` types with `InstanceConfig` and `InstanceInfo`
- **Status:** Ready

### 01-02: Create Instance Modal + Upgrade Instance List UI
- Build `CreateInstanceModal` (name, version picker, optional server)
- Upgrade `InstanceList` with delete, server display, better empty state
- Add modal/form CSS using existing design variables
- **Status:** ✅ Done

## Phase 02 — Instance Editing

### 02-01: Wire instances:update IPC + Build EditInstanceModal
- Wire `instances:update` IPC handler
- Build `EditInstanceModal` pre-populated with existing instance data
- Add edit button to each instance card in `InstanceList`
- **Status:** ✅ Done

---

## Phase 03 — Shader Pack Support

### 03-01: Backend — IPC handlers + types
- Add `shaderpacks/` mkdir to InstanceManager.create()
- Wire `shaders:list`, `shaders:remove`, `shaders:install-modrinth`, `shaders:install-local` IPC handlers
- Expose in preload + add `ShaderInfo` type to global.d.ts
- **Status:** 📋 Planned

### 03-02: UI — ShadersTab + components + routing
- `InstalledShadersPanel` — list .zip files, remove button
- `ShaderVersionPickerModal` — version picker, download progress
- `ShadersTab` — instance selector, Fabric/Quilt gate, Modrinth search, local install
- Wire `/shaders` route + Sidebar nav item
- **Status:** ✅ Done

---

## Phase 04 — App-level Instance Selection and Launch

### 04-01: SelectedInstanceContext + InstanceList selection
- Create `src/renderer/stores/selected-instance-context.tsx` with provider + `useSelectedInstance` hook
- Wrap `App.tsx` authenticated shell with `SelectedInstanceProvider`
- Update `InstanceList`: card click = select (accent-border highlight), ✏ edit button, auto-select on mount, delete clears selection
- **Status:** 📋 Planned

### 04-02: ModsTab + ShadersTab — use context, remove dropdowns
- Remove instance `<select>` from both tabs; read `selectedInstanceId` from context
- Replace with compact "Instance: [name] (version)" header + "← Change" link to `/instances`
- Vanilla instances gated via existing gate message (no dropdown = no way to accidentally pick vanilla)
- **Status:** 📋 Planned (depends on 04-01)

### 04-03: Sidebar Play button
- Add Play button to Sidebar above Sign Out showing selected instance name
- Launches via `window.launcher.game.launch(selectedInstanceId)`
- Disabled when nothing selected; shows inline error on failure
- Human verify checkpoint
- **Status:** 📋 Planned (depends on 04-02)
