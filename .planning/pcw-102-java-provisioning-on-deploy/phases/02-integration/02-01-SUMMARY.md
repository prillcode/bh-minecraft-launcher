# Plan 02-01 Summary: Java Provisioner Integration

**Wired JavaProvisioner into the launch flow: JavaDetector now checks launcher-managed JREs first, game:launch auto-provisions the JRE before downloading assets, and a java:provision IPC handler + preload + global.d.ts expose the feature to the renderer.**

## Accomplishments
- Modified `JavaDetector.findCandidates()` to prepend launcher-managed JRE paths (from `getLauncherPaths().java`) at highest priority, before JAVA_HOME and system paths
- Updated `game:launch` handler to call `javaProvisioner.provision(component)` before `assetManager.downloadVersion()` — skipped when `instance.javaPath` is explicitly set
- Added `java:provision` IPC handler in a new `// ── Java ──` section that provisions a named component and forwards download progress events to the renderer window
- Exposed `window.launcher.java.provision(component)` in `preload.ts`
- Typed `java.provision(component)` in `global.d.ts` under `LauncherAPI`

## Files Created/Modified
- **Modified** `src/core/game/java-detector.ts` — added `getLauncherPaths` import; inserted launcher-managed JRE block at start of `findCandidates()` before the JAVA_HOME block
- **Modified** `src/main/ipc-handlers.ts` — added `JavaProvisioner` import; added `javaProvisioner` singleton; updated `game:launch` handler with auto-provision step; added `java:provision` handler
- **Modified** `src/main/preload.ts` — added `java` section with `provision` method
- **Modified** `src/renderer/global.d.ts` — added `java` field with `provision()` signature to `LauncherAPI`
- **Created** `.planning/pcw-102-java-provisioning-on-deploy/phases/02-integration/02-01-SUMMARY.md` — this file

## Decisions Made
- Placed `javaProvisioner` singleton alongside `javaDetector` and other singletons at the module level in `ipc-handlers.ts`, outside `registerIpcHandlers()`, consistent with the existing pattern
- Placed `java:provision` handler in a dedicated `// ── Java ──` section between `game:detect-java` and `// ── Instances ──` for logical grouping
- Used `version.javaVersion?.component ?? 'java-runtime-delta'` as the fallback component name, consistent with the plan specification
- `instance.javaPath` guard skips auto-provisioning entirely when an explicit java override is present, preserving the existing override behavior in `GameLauncher`

## Issues Encountered
- None. Both `tsconfig.main.json` and `tsconfig.renderer.json` compiled with zero errors on first attempt after each task.

## Next Plan Readiness
Phase 02 integration is complete. The full Java provisioning flow is wired end-to-end: launcher-managed JREs take priority in detection, the JRE is provisioned automatically on launch, and the renderer can trigger provisioning explicitly via `window.launcher.java.provision()`. No further integration work is needed for pcw-102 unless a settings UI or manual provision trigger is desired.
