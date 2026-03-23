> **📋 Planning Instructions**
> When using `/create-plan` for this work:
> - Create plans in the `phases/` subdirectory
> - Reference this BRIEF.md for work context and scope
> - **Identifier:** `pcw-103`
> - **Commits:**
>   - Subagent: Use `feat(pcw-103-01):`, `fix(pcw-103-02):`, etc.
>   - Manual: Use standard prefixes without identifier

---

# Work: Instance-to-Server Association

**Identifier:** pcw-103
**Type:** Feature

## Objective
Build a first-class `Server` concept in the launcher — a named server record (host, port, notes) that instances reference by ID rather than embedding raw host/port. Add Server List Ping to display live server status (version, MOTD, online players) on instance cards and a dedicated server management UI.

## Scope
**Included:**
- `ServerManager` class with CRUD backed by `electron-store` (similar to `InstanceManager`)
- `Instance` updated to reference an optional `serverId` (foreign key) alongside or replacing `serverAutoConnect`
- Server List Ping implementation — TCP handshake to query server status, MOTD, version, player count
- Server status display on instance cards (ping indicator, player count, server version)
- Basic server management UI — list, add, edit, delete servers; status shown inline
- IPC handlers for servers: `servers:list`, `servers:create`, `servers:update`, `servers:delete`, `servers:ping`

**Excluded:**
- RCON integration (plugin querying via RCON)
- REST API companion plugin for plugin list
- Per-server authentication settings
- Automatic ViaVersion compatibility filtering in version picker (future)

## Context
**Current State:**
- Instances embed `serverAutoConnect: { host, port }` directly on the `Instance` record
- No `Server` entity exists — server details are not reusable across instances
- No server status/ping capability exists
- `electron-store` is used for persistence (instances, tokens, settings each in separate JSON files)
- `InstanceManager` in `src/core/game/instance.ts` is the pattern to follow for `ServerManager`

**Key Files:**
- `src/core/game/instance.ts` — InstanceManager pattern to follow
- `src/core/game/types.ts` — Instance interface (serverAutoConnect to be replaced/extended)
- `src/main/ipc-handlers.ts` — IPC handler registration
- `src/main/preload.ts` — contextBridge API exposure
- `src/renderer/global.d.ts` — LauncherAPI type declarations
- `src/renderer/components/instances/InstanceList.tsx` — instance cards (add server status)
- `src/renderer/components/instances/CreateInstanceModal.tsx` — server picker instead of raw host/port
- `src/renderer/components/instances/EditInstanceModal.tsx` — same

**Tech Stack:**
- Node.js `net` module — TCP socket for Server List Ping (no npm package needed)
- Minecraft Server List Ping protocol (1.7+ handshake format)
- `electron-store` — persistence for server records
- React + existing modal/form CSS — server management UI

## Success Criteria
- [ ] `ServerManager` with list/create/update/delete persisted via electron-store
- [ ] Server List Ping queries a server and returns MOTD, version, online/max players, latency
- [ ] Instance cards show live server status (ping, players) when a server is associated
- [ ] Instance create/edit modals have a server picker (dropdown of saved servers) instead of raw host/port fields
- [ ] Dedicated server list UI (sidebar nav or tab within Instances) for managing servers
- [ ] All IPC channels typed end-to-end in global.d.ts
