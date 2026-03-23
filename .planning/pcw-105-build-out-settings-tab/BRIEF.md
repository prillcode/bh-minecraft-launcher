> **📋 Planning Instructions**
> When using `/create-plan` for this work:
> - Create plans in the `phases/` subdirectory
> - Reference this BRIEF.md for work context and scope
> - **Identifier:** `pcw-105`
> - **Commits:**
>   - Subagent: Use `feat(pcw-105-01):`, `fix(pcw-105-02):`, etc.
>   - Manual: Use standard prefixes without identifier

---

# Work: Build Out Settings Tab

**Identifier:** pcw-105
**Type:** Feature

## Objective
Build a functional Settings tab with four sections: Account (current user, auth mode), Java & Performance (global memory and Java path defaults), Game (launch behaviour, default resolution), and About (launcher version, data directory, cache management). Extend `LauncherSettings` in `settings.ts` to persist all new values.

## Scope
**Included:**
- **Account section** — display current logged-in user (avatar, username, auth mode badge); re-login / switch account button; default auth mode toggle (Microsoft / Offline)
- **Java & Performance section** — global default min/max memory sliders (used as instance defaults when instance doesn't override); global Java path override field
- **Game section** — "Close launcher when game launches" toggle; default resolution (width × height inputs)
- **About section** — launcher version (from `package.json`); data directory path display; "Open Folder" button (`shell.openPath`); "Clear Cache" button (wipes `temp/` and `natives/` directories)
- **BlockHaven section** — default server host/port (pre-fills server field when creating new instances); placeholder for news/announcements URL
- Extend `LauncherSettings` interface and `settings.ts` to persist all new keys
- New `settings:set` IPC handler (generic key/value) alongside existing specific handlers
- Settings UI component at `src/renderer/components/settings/SettingsPage.tsx`

**Excluded:**
- Per-instance Java/memory overrides (already on `Instance`, out of scope here)
- Proxy / network settings
- Theme / appearance switching (app is dark-only for now)
- Automatic launcher updates
- Language / i18n

## Context
**Current State:**
- `src/core/settings.ts` — `LauncherSettings` has only `defaultAuthMode`; `getSettings()` and `setSetting()` exist
- `settings:get` and `settings:set-default-auth-mode` IPC handlers exist in `ipc-handlers.ts`
- No Settings UI component exists — the Settings route renders a placeholder
- `app.getPath('userData')` gives the data root (already used in `paths.ts`)
- `app.getVersion()` or `package.json` gives launcher version

**Key Files:**
- `src/core/settings.ts` — extend `LauncherSettings` interface and add new keys
- `src/main/ipc-handlers.ts` — add `settings:set` generic handler, `settings:open-data-folder`, `settings:clear-cache`
- `src/main/preload.ts` — expose new settings channels
- `src/renderer/global.d.ts` — type new settings API surface
- `src/renderer/styles/globals.css` — add settings-specific styles (sections, toggles, sliders)
- `src/renderer/components/settings/SettingsPage.tsx` — new component (main deliverable)
- `src/core/utils/paths.ts` — reference for data directory paths

**Tech Stack:**
- Electron `shell.openPath()` — open data folder in file manager
- Node.js `fs.rm()` — cache clearing
- React controlled inputs — sliders, toggles, text fields
- Existing CSS variables and form styles

## Success Criteria
- [ ] Settings page renders with all four sections (Account, Java & Performance, Game, About) plus BlockHaven section
- [ ] All settings persist across launcher restarts via electron-store
- [ ] Memory sliders affect default min/max on new instances
- [ ] "Open Folder" opens the data directory in the OS file manager
- [ ] "Clear Cache" removes `temp/` and `natives/` with confirmation
- [ ] Default auth mode toggle works (existing behaviour preserved)
- [ ] Current account displayed with name and auth mode badge
