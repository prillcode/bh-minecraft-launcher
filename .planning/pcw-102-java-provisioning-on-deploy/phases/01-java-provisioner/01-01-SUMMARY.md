# Plan 01-01 Summary: JavaProvisioner

**Added `java` path to LauncherPaths, extended DownloadProgress phase union, and created the JavaProvisioner class that provisions Mojang-hosted JRE bundles with SHA1 verification and progress reporting.**

## Accomplishments
- Added `java: string` field to the `LauncherPaths` interface and populated it in both `getLauncherPaths()` and `getLauncherPathsCustomRoot()` (set to `<root>/java`)
- Extended `DownloadProgress.phase` union type to include `'java'` alongside the existing `'client' | 'libraries' | 'assets'`
- Created `JavaProvisioner` class with:
  - `provision(component, onProgress?)` — fast-paths on cache hit, otherwise fetches Mojang's all.json manifest, resolves the file-list manifest, downloads all JRE files concurrently (concurrency 8), sets executable bits on non-Windows, and returns the path to the java executable
  - `getPlatformKey()` — maps Node.js `process.platform`/`process.arch` to all seven Mojang platform keys: `linux`, `linux-i386`, `mac-os`, `mac-os-arm64`, `windows-x64`, `windows-x86`, `windows-arm64`
  - `getJavaExePath()` — resolves `<javaDir>/<component>/bin/java[.exe]`
  - `verifyFile()` — SHA1 verification matching the pattern in `AssetManager`

## Files Created/Modified
- **Modified** `src/core/utils/paths.ts` — added `java` field to interface, `getLauncherPaths()`, and `getLauncherPathsCustomRoot()`
- **Modified** `src/core/game/types.ts` — extended `DownloadProgress.phase` to include `'java'`
- **Created** `src/core/game/java-provisioner.ts` — full `JavaProvisioner` implementation

## Decisions Made
- Followed the exact `AssetManager` pattern for imports, concurrency queue, progress reporting, and SHA1 verification to keep the codebase consistent
- Internal manifest types (`RuntimeEntry`, `AllManifest`, `FileEntry`, `FileManifest`) are not exported — they are implementation details of the provisioner
- `java` directory is placed after `instances` in the `LauncherPaths` object literal as specified by the plan

## Issues Encountered
- None. Both tasks compiled cleanly with zero TypeScript errors on first attempt.

## Next Plan Readiness
Phase 01-02 (integrating `JavaProvisioner` into the launch flow via `JavaDetector` and `GameLauncher`) is unblocked. `JavaProvisioner` is independently instantiable and testable; `LauncherPaths.java` is available for the detector to check; `DownloadProgress.phase` already carries `'java'` so IPC progress forwarding will work without further type changes.
