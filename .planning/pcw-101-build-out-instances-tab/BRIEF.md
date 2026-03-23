# pcw-101: Build out Instances tab

**Type:** Feature
**Status:** Planning

## Objective

Build a functional Instances tab that lets users list existing instances, create new ones (name, version, optional server auto-connect), and launch Minecraft from them. The backend InstanceManager already exists — this work wires it into IPC handlers and builds the renderer UI.

## Relevant Files

### Backend (already exists)
- [instance.ts](../../src/core/game/instance.ts) - InstanceManager class with full CRUD + createBlockHavenInstance()
- [types.ts](../../src/core/game/types.ts) - Instance, LaunchOptions, VersionDetail types
- [ipc-handlers.ts](../../src/main/ipc-handlers.ts) - IPC handlers (instances:* handlers need wiring)
- [version-manifest.ts](../../src/core/game/version-manifest.ts) - Version fetching from Mojang

### Renderer (needs work)
- [InstanceList.tsx](../../src/renderer/components/instances/InstanceList.tsx) - Existing skeleton with list + launch
- [PlayButton.tsx](../../src/renderer/components/play/PlayButton.tsx) - Existing play button component
- [globals.css](../../src/renderer/styles/globals.css) - Global styles
- [global.d.ts](../../src/renderer/global.d.ts) - Window.launcher type definitions

### Preload
- [preload.ts](../../src/main/preload.ts) - Bridge API (instances.* already exposed)

## Scope

### In scope
- Wire InstanceManager into IPC handlers (instances:list, instances:create, instances:delete)
- Create Instance modal/form: name, version picker (from Mojang manifest), optional server host/port
- Instance list with cards showing name, version, last played
- Play button per instance that triggers game:launch
- Empty state with quick-create prompt

### Out of scope (for now)
- Instance editing/renaming
- Mod loader selection (Forge/Fabric/Quilt)
- Instance import/export
- Custom Java path or JVM args in the create form
- Memory settings in the create form (use defaults: 512MB min, 2048MB max)
