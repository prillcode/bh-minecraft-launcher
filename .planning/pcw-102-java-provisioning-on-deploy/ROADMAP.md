# Roadmap: Java Provisioning on Deploy

**Identifier:** pcw-102

## Phases

### Phase 01: JavaProvisioner Class
**Status:** 📋 Planned

**Goals:**
- Add `java` path to `LauncherPaths` in `paths.ts`
- Extend `DownloadProgress.phase` to include `'java'` in `types.ts`
- Create `JavaProvisioner` — fetches Mojang's per-file JRE manifest, downloads individual files with SHA1 verification, sets executable bits, returns path to java executable
- Fast-path cache check: no-op if JRE already fully present

**Plans:**
- `01-01-PLAN.md` — JavaProvisioner class + paths/types extension

---

### Phase 02: Integration
**Status:** 📋 Planned (depends on Phase 01)

**Goals:**
- Update `JavaDetector.findBest()` to check launcher-managed JRE path first
- Add `java:provision` IPC handler (explicit trigger, reuses `download:progress` channel)
- Update `game:launch` IPC handler to auto-provision before launch (no-op when cached)
- Expose `java.provision` in preload and type it in `global.d.ts`

**Plans:**
- `02-01-PLAN.md` — JavaDetector update + IPC wiring

---

## Next Steps

1. Execute Phase 01 with `/run-plan`
2. Execute Phase 02 with `/run-plan`
