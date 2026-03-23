# Roadmap: Instance-to-Server Association

**Identifier:** pcw-103

## Phases

### Phase 01: Server Entity + Ping Backend
**Status:** 📋 Planned

**Goals:**
- Define `Server` type in `types.ts`
- Build `ServerManager` (CRUD via electron-store)
- Implement Server List Ping (Minecraft 1.7+ TCP handshake)
- Wire IPC handlers: `servers:list/create/update/delete/ping`
- Expose via preload + type in `global.d.ts`

**Plans:**
- [01-01](phases/01-server-backend/01-01-PLAN.md) — Server type + ServerManager
- [01-02](phases/01-server-backend/01-02-PLAN.md) — Server List Ping + IPC + preload + global.d.ts

---

### Phase 02: Instance ↔ Server Wiring + Card Status
**Status:** 📋 Planned (depends on Phase 01)

**Goals:**
- Update `Instance` to reference `serverId` (optional, replaces raw `serverAutoConnect`)
- Migrate existing instances with `serverAutoConnect` to use server records
- Instance cards show live status: ping latency, online players, server version
- Create/Edit instance modals replace raw host/port with a server picker dropdown

**Plans:**
- [02-01](phases/02-instance-wiring/02-01-PLAN.md) — Instance type update + startup migration
- [02-02](phases/02-instance-wiring/02-02-PLAN.md) — Instance card status badges + modal server picker

---

### Phase 03: Server Management UI
**Status:** 📋 Planned (depends on Phase 01)

**Goals:**
- Server list view (accessible from sidebar)
- Add/Edit/Delete server modals (name, host, port, notes)
- Live status per row (ping on load, refresh button)
- MOTD display (plain text, strip § formatting codes)

**Plans:**
- [03-01](phases/03-server-ui/03-01-PLAN.md) — ServerList component + /servers route + nav item
- [03-02](phases/03-server-ui/03-02-PLAN.md) — AddServerModal + EditServerModal

---

## Execution Order

```
01-01 -> 01-02 -> 02-01 -> 02-02
                -> 03-01 -> 03-02
```

Phase 02 and Phase 03 both depend on Phase 01 and can be done in either order.

## Next Steps

1. Execute Phase 01: `/run-plan .planning/pcw-103-instance-to-server-association/phases/01-server-backend/01-01-PLAN.md`
2. Then: `01-02-PLAN.md`
3. Then either Phase 02 or Phase 03 (independent of each other)
