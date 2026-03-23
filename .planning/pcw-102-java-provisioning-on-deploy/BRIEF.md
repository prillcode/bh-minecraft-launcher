> **📋 Planning Instructions**
> When using `/create-plan` for this work:
> - Create plans in the `phases/` subdirectory
> - Reference this BRIEF.md for work context and scope
> - **Identifier:** `pcw-102`
> - **Commits:**
>   - Subagent: Use `feat(pcw-102-01):`, `fix(pcw-102-02):`, etc.
>   - Manual: Use standard prefixes without identifier

---

# Work: Java Provisioning on Deploy

**Identifier:** pcw-102
**Type:** Feature

## Objective
Automatically download and manage a bundled JRE so users never need to install Java manually. The launcher should provision the correct Java version on first launch (or when Java is missing) and use that bundled runtime when launching Minecraft — never relying on system Java.

## Scope
**Included:**
- Fetch Mojang's Java runtime manifest to get the correct JRE for the user's OS/arch
- Download and extract the JRE into the launcher's data directory (e.g. `~/.blockhaven/java/`)
- Update `JavaDetector` to check the launcher-managed path first before falling back to system Java
- Show download progress in the UI (reuse existing download progress channel)
- Cache the downloaded JRE — only re-download if missing or outdated

**Excluded:**
- Multiple JRE version management (just provision what Minecraft needs)
- Manual Java override UI (already supported via `javaPath` on Instance)
- JRE updates/auto-upgrade beyond what the version manifest requires

## Context
**Current State:**
- `JavaDetector` scans common system paths for Java 21+ but finds nothing if not installed
- `GameLauncher` calls `javaDetector.findBest()` and throws `No Java 21+ found` if empty
- Mojang hosts their own JRE builds via a metadata API (same runtimes the official launcher uses)
- `AssetManager` already handles chunked downloads with progress reporting — pattern can be reused

**Key Files:**
- `src/core/game/java-detector.ts` — needs to check launcher-managed JRE path first
- `src/core/game/launch.ts` — calls `javaDetector.findBest()` before launching
- `src/core/utils/paths.ts` — should expose a `java` path in launcher directories
- `src/core/game/asset-manager.ts` — reference for download + progress pattern
- `src/main/ipc-handlers.ts` — may need a `java:provision` IPC handler

**Tech Stack:**
- Electron / Node.js main process
- Mojang Java Runtime API: `https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json`
- `got` (already a dependency) for HTTP downloads
- `extract-zip` or Node `tar` for JRE extraction

## Success Criteria
- [ ] First launch with no system Java installs the JRE automatically
- [ ] JRE is stored in the launcher data directory, not system-wide
- [ ] Download progress is visible in the UI
- [ ] Subsequent launches skip download (cached JRE detected)
- [ ] `GameLauncher` uses the provisioned JRE path
