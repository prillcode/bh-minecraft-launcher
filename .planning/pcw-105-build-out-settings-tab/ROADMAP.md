# Roadmap: Build Out Settings Tab

**Identifier:** pcw-105

## Phases

### Phase 01: Extend Settings Backend + IPC
**Status:** 📋 Planned

**Goals:**
- Extend `LauncherSettings` with all new keys (memory defaults, Java path, close-on-launch, resolution, BlockHaven server defaults)
- Add `settings:set` generic IPC handler
- Add `settings:open-data-folder` (shell.openPath) and `settings:clear-cache` handlers
- Expose all new channels in preload and type in `global.d.ts`

**Plans:**
- Use `/create-plan` to define detailed implementation plans

---

### Phase 02: Settings UI
**Status:** 📋 Planned (depends on Phase 01)

**Goals:**
- `SettingsPage.tsx` with five sections: Account, Java & Performance, Game, About, BlockHaven
- Account section: user avatar/name display, auth mode toggle, re-login button
- Java & Performance: min/max memory sliders with MB labels, Java path text input with browse hint
- Game: close-on-launch toggle, resolution width/height inputs
- About: version string, data path display, Open Folder + Clear Cache buttons
- BlockHaven: default server host/port inputs
- Settings-specific CSS (section headers, toggle switches, range sliders)

**Plans:**
- Use `/create-plan` to define detailed implementation plans

---

## Next Steps

1. Review and refine this roadmap
2. Start with Phase 01 — use `/create-plan` to build backend plans
3. Execute plans with `/run-plan`
