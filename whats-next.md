<original_task>
Diagnose and fix Microsoft auth "invalid_grant" failure in the packaged AppImage (MS_CLIENT_ID not
reaching the bundled app at runtime), then continue feature development on the BlockHaven Minecraft
Launcher — a custom Electron + React + TypeScript launcher targeting the BlockHaven SMP server.
</original_task>

<work_completed>

## Auth / Packaging Fix (v0.6.2 — confirmed working)
- Root cause identified: .env not bundled in AppImage; dotenv reads from process.cwd() at runtime
  which has no .env, causing fallback to placeholder client ID → invalid_grant on every login
- Fix: vite.main.config.ts now loads .env at build time via dotenv and uses Vite `define` to inline
  MS_CLIENT_ID, BLOCKHAVEN_SERVER_HOST, BLOCKHAVEN_SERVER_PORT as string literals in the bundle
- Also inlined previously: MSAL cache serialization (v0.6.0), MSAL instance reset on each login
  attempt (v0.6.1), --quickPlayMultiplayer for server auto-join (v0.5.12)
- Full auth chain confirmed working end-to-end in both dev and packaged AppImage:
  MS device-code → XBL → XSTS → Minecraft login → profile fetch

## First-Launch Auto-Instance (this session)
- Added `instances:create-blockhaven` IPC handler in src/main/ipc-handlers.ts
  Reads inlined BLOCKHAVEN_SERVER_HOST/PORT env vars, fetches latest MC release from version
  manifest, calls instanceManager.createBlockHavenInstance()
- Added `createBlockhaven()` to src/main/preload.ts and src/renderer/global.d.ts
- Modified InstanceList.tsx useEffect: if instances list is empty on mount, auto-calls
  createBlockhaven() and populates the list; falls through to empty state on failure

## Login UX Polish (this session)
- LoginScreen.tsx: Copy Code button now calls window.open(verificationUri) automatically —
  browser opens alongside clipboard copy, no manual link click required
- Removed the clickable verification URL link from both device-code and polling phases
- Updated device-code phase instructional text: "Copy the code below — your browser will open automatically."

## Title Bar (this session)
- TitleBar.tsx: updated from "BlockHaven" to "BlockHaven Minecraft Launcher"

## Fabric Mod Loader Support (this session — primary feature, v0.7.0)

### New file: src/core/game/fabric-provisioner.ts
- Fetches latest stable Fabric loader version from Fabric meta API:
  GET https://meta.fabricmc.net/v2/versions/loader/{gameVersion}
- Fetches full Fabric profile JSON:
  GET https://meta.fabricmc.net/v2/versions/loader/{gameVersion}/{loaderVersion}/profile/json
- Downloads all Fabric library JARs into shared libraries directory using mavenCoordToPath()
  (converts "net.fabricmc:fabric-loader:0.16.x" → "net/fabricmc/fabric-loader/0.16.x/...")
- SHA1-verified; idempotent (skips already-downloaded files); fires onProgress 'fabric' phase events
- Returns { mainClass, libraryPaths } to caller

### Modified: src/core/game/launch.ts
- Imported FabricProvisioner, added private fabricProvisioner instance
- In launch(): if instance.modLoader === 'fabric', calls fabricProvisioner.provision() with
  onProgress, captures { mainClass, libraryPaths }
- buildClasspath() gained optional extraLibs parameter — Fabric JARs prepended before vanilla libs
- Launch command uses fabric mainClass instead of version.mainClass when Fabric is active

### Modified: src/core/game/types.ts
- DownloadProgress.phase: added 'fabric' literal
- LaunchOptions: added optional onProgress?: (progress: DownloadProgress) => void

### Modified: src/main/ipc-handlers.ts
- game:launch handler: passes onProgress into gameLauncher.launch() so Fabric download
  progress appears in the status bar as 'fabric' phase

### Modified: src/renderer/components/instances/CreateInstanceModal.tsx
- Added modLoader state ('vanilla' | 'fabric'), defaults to 'vanilla'
- Added "Mod Loader" select dropdown (None/Vanilla, Fabric) above the server field
- modLoader included in InstanceConfig passed to instances:create

### Modified: src/renderer/components/instances/EditInstanceModal.tsx
- Same dropdown, initialized from instance.modLoader (falls back to 'vanilla' for legacy instances)
- modLoader included in Partial<InstanceConfig> passed to instances:update

### Modified: src/renderer/components/mods/ModsTab.tsx
- Derived selectedInstance and isVanilla = !modLoader || modLoader === 'vanilla'
- Search input, Search button disabled when isVanilla
- When vanilla selected: shows "Mods require a mod loader. Edit the instance and switch to Fabric."
- InstalledModsPanel hidden for vanilla instances
- Results list gated behind !isVanilla

### Modified: src/renderer/global.d.ts
- InstanceConfig: added modLoader?: 'vanilla' | 'fabric'

## Version Bump & Release
- package.json: 0.6.2 → 0.7.0
- Committed SHA: 235fad1 — "feat: Fabric mod loader support, first-launch auto-instance, UX polish (v0.7.0)"
- Tagged v0.7.0, pushed to origin/main with tags — CI building now

## Testing Confirmed (local dev)
- Vanilla instance launches correctly (unchanged behavior)
- Fabric instance creation: dropdown saves modLoader correctly
- Fabric first launch: status bar shows 'fabric' download progress, game launches with Fabric
- Fabric second launch: skips downloads, faster start
- Vanilla instance on Mods tab shows correct "requires mod loader" message
- Auto-connect to localhost Docker server working with --quickPlayMultiplayer
- Microsoft auth working end-to-end in AppImage (v0.6.2+)

</work_completed>

<work_remaining>

## High Priority

### Quilt Mod Loader Support
- Very low effort: ~80% code reuse from FabricProvisioner
- Create src/core/game/quilt-provisioner.ts
  API: GET https://meta.quiltmc.org/v3/versions/loader/{gameVersion}
  Profile: GET https://meta.quiltmc.org/v3/versions/loader/{gameVersion}/{loaderVersion}/profile/json
- 'quilt' already exists in Instance.modLoader union in types.ts
- Add 'quilt' option to CreateInstanceModal and EditInstanceModal dropdowns
- Add 'quilt' branch in launch.ts (same pattern as fabric)
- Add 'quilt' to DownloadProgress.phase in types.ts
- Note: isVanilla in ModsTab already handles quilt correctly (any non-vanilla modLoader enables mods)

### Wire Remaining Env Vars
- JAVA_HOME: src/core/game/java-detector.ts — check process.env.JAVA_HOME first before scanning
  system paths; useful for pinning a specific JDK
- OPEN_DEVTOOLS: src/main/index.ts — if process.env.OPEN_DEVTOOLS === 'true', call
  win.webContents.openDevTools() after window creation

## Medium Priority

### Mod Dependency Auto-Install
- Modrinth API exposes dependencies on each mod version: GET /v2/version/{id} returns
  dependencies[] with { project_id, version_id, dependency_type: 'required'|'optional'|'incompatible' }
- When user clicks Install on a mod, fetch its version info, collect all required dependencies
  that aren't already installed, and prompt: "This mod requires: Fabric API, Common Network — install all?"
- Install dependencies first, then the requested mod
- Relevant files: src/main/ipc-handlers.ts (mods:install handler), src/renderer/components/mods/VersionPickerModal.tsx
- ModrinthAPI class (src/core/mods/modrinth-api.ts) likely needs a getVersion() method if not present

### Shader Pack Support (Iris / Fabric instances only)
- Iris stores shader packs in {gameDirectory}/shaderpacks/ — folder already created at instance creation
- Add a "Shaders" section to the instance detail / EditInstanceModal showing installed shader packs
- Allow user to browse local .zip files or download from Modrinth (project_type: 'shader')
- Modrinth search already supports project_type filter — same search flow as mods but filtered to shaders
- On launch, Iris picks up whatever .zip files are in shaderpacks/ automatically — no launch args needed
- Gate behind modLoader === 'fabric' (or quilt) since vanilla can't run Iris
- Note: shader packs are large (10-50MB+) — may want separate progress tracking

### Version Mismatch Warning
- Add serverMinecraftVersion?: string to Instance type in types.ts and InstanceInfo in global.d.ts
- On game:launch, if serverAutoConnect is set and serverMinecraftVersion differs from instance.versionId,
  send a warning event to renderer or return a structured warning before spawning process
- Currently Minecraft itself shows a disconnect screen — acceptable but not ideal UX

### Mod Loader Version Pinning
- Currently always fetches latest stable Fabric loader on each launch (fast API call + file check)
- To pin: after provision(), call instanceManager.update(id, { modLoaderVersion: loaderVersion })
- FabricProvisioner.provision() should accept optional pinned version, skip meta API call if provided
- Prevents unexpected loader upgrades between sessions

### Forge Support
- Requires running forge-installer.jar as subprocess: java -jar forge-installer.jar --installClient
- Much more complex than Fabric — installer mutates game directory, generates new version JSON
- Not recommended until Fabric/Quilt are solid and tested

## Low Priority / Nice-to-Have
- Pre-fill server host field in Create Instance modal with BLOCKHAVEN_SERVER_HOST env var
- Mod enable/disable: rename .jar → .jar.disabled on disk when toggled (enabled flag exists on
  InstalledModInfo but has no effect currently)
- Settings page: expose defaultMaxMemory/defaultMinMemory for global JVM heap tuning
- closeOnLaunch: defined in LauncherSettings but behavior not wired in main/index.ts

</work_remaining>

<attempted_approaches>

## Auth Debugging (resolved)
- Deleted ~/.config/blockhaven-launcher/auth.json to clear stale session — did not fix (root
  cause was missing client ID, not stale cache)
- Various MSAL configuration attempts before identifying build-time env var inlining as the fix

## What Was NOT Attempted (and why)
- Bundling .env into the AppImage: rejected — would expose secrets in the package
- Runtime env var injection via electron-builder extraFiles: rejected — fragile, requires .env
  at install location
- Forge support: deferred — installer JAR subprocess approach is high complexity, low priority

</attempted_approaches>

<critical_context>

## Project
- Repo: https://github.com/prillcode/bh-minecraft-launcher
- Local: /home/prill/dev/bh-minecraft-launcher
- Stack: Electron + React + TypeScript, pnpm@9.15.0, Node 22, Electron 34
- electron-store v10, got v14 — both ESM-only, require nodenext moduleResolution
- Main process bundled as CJS by vite.main.config.ts (format: 'cjs' in rollupOptions)
- package.json has NO "type": "module" — TS treats files as CJS under nodenext

## Build / Run
  pnpm dev    # tsc watch + vite dev (wait for "Found 0 errors")
  pnpm start  # electron dist/main/index.js
  pnpm build  # full build
  pnpm package # electron-builder

## Auth Data Locations
- AppImage runtime: ~/.config/blockhaven-launcher/auth.json
- Dev (pnpm start): ~/.config/Electron/auth.json

## Env Vars (all inlined at Vite build time via vite.main.config.ts define)
- MS_CLIENT_ID — in .env (gitignored) and GitHub secret MS_CLIENT_ID
- BLOCKHAVEN_SERVER_HOST — default play.bhsmp.com; use localhost for Docker testing
- BLOCKHAVEN_SERVER_PORT — default 25565
- JAVA_HOME — NOT YET WIRED (java-detector.ts)
- OPEN_DEVTOOLS — NOT YET WIRED (main/index.ts)

## Key Architectural Decisions
- Fabric JARs stored in shared libraries dir (same as vanilla libs) — not per-instance
- Fabric provisioning inside GameLauncher.launch() — launcher owns all launch prerequisites
- isVanilla in ModsTab treats missing modLoader as vanilla (safe for legacy instances)
- createBlockhaven auto-create on empty list is intentional for dedicated launcher UX
- Version list is fully dynamic from Mojang's manifest API — no hardcoded versions

## Fabric Implementation Notes
- profile JSON libraries[].url is a Maven repo BASE URL — must append mavenCoordToPath(lib.name)
- Library entries may or may not have sha1 field — provisioner handles both cases
- Always fetches latest stable loader (stable: true flag in API response)
- modLoaderVersion on Instance is never written after provision (known limitation)

## CI
- .github/workflows/release.yml — triggers on v* tags, 3-OS matrix
- Creates .env with MS_CLIENT_ID from GitHub secret MS_CLIENT_ID
- Artifacts: BlockHaven-Launcher-{version}-{arch}.{ext}
- Test AppImage: chmod +x *.AppImage && ./BlockHaven*.AppImage

## Gotchas
- electron-store: always pass explicit generic — schema option causes TS to infer unknown
- process.platform map needs `as Record<string, string>` cast
- outDir in tsconfig.main.json must be 'dist' not 'dist/main'
- Minecraft version "26.1" is real (March 2026 release) — appears from live Mojang API
- Version mismatch between client and server = clean Minecraft disconnect screen, not crash

## Server
- BlockHaven SMP: play.bhsmp.com / play.blockhaven.net
- Local Docker testing: set BLOCKHAVEN_SERVER_HOST=localhost in .env before building
- Server is vanilla — Fabric client connects without issues

## Popular Fabric Mods for Testing
Performance:
- Sodium (sodium) — rendering engine replacement, major FPS boost
- Lithium (lithium) — general server/client optimizations
- Iris Shaders (iris) — shader support (requires Sodium)

QoL:
- JEI / REI (roughly-enough-items) — item/recipe browser
- AppleSkin (appleskin) — food value HUD
- Xaero's Minimap (xaeros-minimap)
- JourneyMap (journeymap)

All available on Modrinth, compatible with recent Fabric versions.

</critical_context>

<current_state>

## Deliverables
- v0.7.0: COMPLETE — committed 235fad1, tagged, pushed, CI building
- Fabric support: COMPLETE (provisioner, launch, UI, mod tab gating)
- First-launch auto-instance: COMPLETE
- Login UX (copy+open browser): COMPLETE
- Title bar rename: COMPLETE
- Vanilla mod tab block with explanation: COMPLETE

## In-Progress
- CI build for v0.7.0 triggered by tag push — building Linux/macOS/Windows artifacts

## Not Started (priority order)
1. Quilt support
2. JAVA_HOME wiring
3. OPEN_DEVTOOLS wiring
4. Version mismatch warning
5. Mod loader version pinning
6. Forge support

## Known Limitations
- modLoaderVersion on Instance never written — always re-fetches latest Fabric loader
- Mod enable/disable toggle in UI has no disk effect (.jar.disabled rename not implemented)
- No pre-launch version mismatch warning (handled gracefully by Minecraft disconnect screen)

</current_state>
