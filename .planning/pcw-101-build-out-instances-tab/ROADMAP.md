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
- **Status:** Ready (depends on Phase 01)
