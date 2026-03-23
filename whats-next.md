# What's Next — BlockHaven Launcher

Generated: 2026-03-21 (end of session)

---

<original_task>
Add environment variable support to the project: create `.env.example`, add `dotenv`, wire `import 'dotenv/config'` as the first import in `src/main/index.ts`, and create `.gitignore`.
</original_task>

<work_completed>

## Environment variable support (original task — complete)

- **`.env.example`** created at project root with six documented variables:
  - `MS_CLIENT_ID` (required, Azure AD OAuth)
  - `LOG_LEVEL` (optional, default "info")
  - `BLOCKHAVEN_SERVER_HOST` / `BLOCKHAVEN_SERVER_PORT` (optional, default port 25565)
  - `JAVA_HOME` override (commented out)
  - `OPEN_DEVTOOLS` (commented out)
- **`.gitignore`** created: excludes `.env`, `node_modules/`, `dist/`, `release/`, `*.log`
- **`dotenv` 17.3.1** added via `pnpm add dotenv`
- **`src/main/index.ts` line 1**: `import 'dotenv/config'` added as the very first import

## TypeScript fixes (side tasks — complete)

### `src/core/auth/microsoft.ts`
- Field `pendingRequest` type widened from `Promise<AuthenticationResult> | null` to `Promise<AuthenticationResult | null> | null` — matches MSAL's actual return type from `acquireTokenByDeviceCode()`
- Lines 61–62 refactored to use a local `const pending` so `.catch(reject)` isn't called on a possibly-null reference

### `tsconfig.main.json`
- `"module"` changed from `"commonjs"` to `"nodenext"`
- `"moduleResolution"` added as `"nodenext"` (was missing, defaulted to old `"node"`)
- `"outDir"` changed from `"dist/main"` to `"dist"`

**Why these tsconfig changes:** `got` v14 and `electron-store` v10 are ESM-only packages that use the `exports` field in `package.json` for type resolution. The old `"node"` moduleResolution ignores `exports`, making all their types unresolvable. `"nodenext"` was chosen over `"node16"` (they are equivalent when `module` is also set to match, but `nodenext` tracks Node 22+ and was the user's preference) and over `"bundler"` (which requires `module: es2015+`, incompatible with commonjs). Since `package.json` has no `"type": "module"`, TypeScript treats all `.ts` files as CJS under `nodenext` — no `.js` extensions required on relative imports.

**Why `outDir` changed:** With `rootDir: "src"` and `outDir: "dist/main"`, TypeScript mirrors the full source tree, so `src/main/index.ts` was being emitted to `dist/main/main/index.js`. `package.json` `"main"` field expects `dist/main/index.js`. Changing `outDir` to `"dist"` gives the correct output path.

### `src/core/auth/token-store.ts`
- Constructor call changed to `new Store<{ session: StoredSession | null }>({...})` — the `schema` option caused TypeScript to infer `{ session: unknown }` from the JSON Schema definition, conflicting with the field's declared generic. Explicit type parameter overrides schema inference.

### `src/core/game/asset-manager.ts` (line 130) and `src/core/game/launch.ts` (line 163)
- Both files had: `{ win32: 'windows', darwin: 'osx', linux: 'linux' }[process.platform]`
- `process.platform` is typed as `NodeJS.Platform` which includes 11 values (`aix`, `android`, `cygwin`, `freebsd`, `haiku`, `netbsd`, `openbsd`, `sunos`, `win32`, `darwin`, `linux`), but the object literal only had 3 keys — TypeScript rejected the index access
- Fixed by casting the map: `({ ... } as Record<string, string>)[process.platform]`

### `src/core/utils/download.ts` (line 40)
- `progress` implicit `any` error resolved automatically once `got`'s types became resolvable via the `moduleResolution` fix — no code change needed

## UI improvements (side tasks — complete)

### Clickable Microsoft login link during polling phase
- **`src/renderer/components/auth/LoginScreen.tsx`**: The `polling` phase previously showed only the spinner and code, with no link. Added the `verificationUri` as a clickable `<a>` with `target="_blank"` and `login-card__url` class, matching the existing `device-code` phase treatment.

### Copy-to-clipboard button for device code
- **`src/renderer/components/auth/LoginScreen.tsx`**: Added `copied` state and `copyCode` callback using `navigator.clipboard.writeText()`. Copy button appears inline next to the code in both `device-code` and `polling` phases. Shows "Copied!" for 2 seconds then resets.
- **`src/renderer/styles/globals.css`**: Added `.login-card__copy-btn` styles using existing CSS variables (`--bg-tertiary`, `--border`, `--accent`, `--text-secondary`, `--radius-sm`, `--font-mono`). Hover state turns accent color.

## App launch debugging (side task — complete)

- Confirmed `pnpm dev` (tsc watch + vite dev) must reach "Found 0 errors" before running `pnpm start`
- `pnpm start` runs `electron dist/main/index.js`
- The app launched successfully and rendered the login screen

</work_completed>

<work_remaining>

## PRIORITY: Fix the 403 on `login_with_xbox` — auth chain is broken

The full OAuth → XBL → XSTS → Minecraft auth chain fails at the final step with:

```
HTTPError: Request failed with status code 403 (Forbidden):
POST https://api.minecraftservices.com/authentication/login_with_xbox
```

This error surfaces in the UI as: `Error invoking remote method 'auth:poll-login'`

### Debugging steps (in order of likelihood)

**1. Add missing `Accept` header in `src/core/auth/minecraft.ts` line 19–29**

The `login_with_xbox` POST request is missing `Accept: 'application/json'`. Both the XBL and XSTS requests in `xbox.ts` include it — `minecraft.ts` does not. Try adding it:

```ts
headers: {
  'Content-Type': 'application/json',
  Accept: 'application/json',   // <-- add this
},
```

**2. Verify Azure AD app registration**

The `MS_CLIENT_ID` in `.env` must be configured correctly in Azure Portal:
- Platform: "Mobile and desktop applications"
- Redirect URI: `https://login.microsoftonline.com/common/oauth2/nativeclient`
- API Permissions: `XboxLive.signin` (delegated) must be granted
- The authority in `microsoft.ts` is `https://login.microsoftonline.com/consumers` — this targets personal Microsoft accounts only. If the test account is a work/school account, change to `common` or `organizations`.

**3. Verify the test account owns Minecraft Java Edition**

A 403 from `login_with_xbox` (not `minecraft/profile`) can also mean the Xbox token exchange itself is being rejected. If the account doesn't have Xbox Live linked, that step fails before even reaching the Minecraft ownership check. Confirm the Microsoft account has Xbox Live set up.

**4. Check `RpsTicket` prefix in `src/core/auth/xbox.ts` line 26**

```ts
RpsTicket: `d=${msAccessToken}`,
```

The `d=` prefix is correct for Microsoft OAuth tokens acquired via MSAL. If this ever changes (e.g. different MSAL version or scope), it may need to be `t=` instead. Verify MSAL is returning a proper access token (log `msAccessToken.substring(0, 20)` to confirm it's not undefined/empty).

**5. Log intermediate tokens for diagnosis**

Add temporary debug logging in `src/core/auth/xbox.ts` after each step to confirm XBL and XSTS tokens are being received and have non-empty `token` and `userHash` fields before being passed to `loginWithXbox`.

## Follow-on work (not yet started)

- Wire `BLOCKHAVEN_SERVER_HOST` / `BLOCKHAVEN_SERVER_PORT` env vars into `InstanceManager.createBlockHavenInstance()` in `src/core/game/instance.ts` (currently uses hardcoded values at call sites)
- Wire `OPEN_DEVTOOLS` env var into `src/main/index.ts` to conditionally open DevTools instead of always opening in dev mode
- Wire `JAVA_HOME` env var override into `src/core/game/java-detector.ts`
- Implement actual instance management UI (the `InstanceList` component exists but may not be wired to real data)
- End-to-end game launch testing (auth chain must be fixed first)

</work_remaining>

<attempted_approaches>

## `moduleResolution` iterations

1. First tried `"moduleResolution": "node16"` alone (without changing `module`) — TypeScript 5.7 rejected this with: `Option 'module' must be set to 'Node16' when option 'moduleResolution' is set to 'Node16'`
2. Tried `"moduleResolution": "bundler"` mentally — ruled out because it requires `module: es2015+`, incompatible with `module: commonjs`
3. Final solution: set both `module` and `moduleResolution` to `"nodenext"` — user preferred this to keep Node 22 alignment

## `outDir` discovery

- The wrong output path (`dist/main/main/index.js`) was only discovered after running `pnpm dev` and trying `pnpm start`, which gave `Cannot find module '.../dist/main/index.js'`
- Inspected `dist/main/` with `ls` and found the nested `main/` directory, traced it to the `rootDir`/`outDir` interaction

</attempted_approaches>

<critical_context>

## Project structure

```
bh-minecraft-launcher/
  src/
    main/         — Electron main process (compiled by tsconfig.main.json)
      index.ts    — Entry point; dotenv loaded here as first import
      ipc-handlers.ts
      preload.ts
    core/         — Also compiled by tsconfig.main.json (included in "include")
      auth/
        microsoft.ts   — MSAL device-code flow (Step 1)
        xbox.ts        — XBL + XSTS token exchange (Step 2)
        minecraft.ts   — Minecraft auth + profile fetch (Step 3) ← FAILING HERE
        token-store.ts — electron-store persistence
        types.ts
      game/
        asset-manager.ts
        instance.ts
        launch.ts
        version-manifest.ts
        java-detector.ts
      mods/
      utils/
        download.ts
        logger.ts
        paths.ts
    renderer/     — Vite/React frontend (separate tsconfig.renderer.json)
      components/auth/LoginScreen.tsx  ← modified this session
      styles/globals.css               ← modified this session
      stores/auth-store.ts
```

## Build / run commands

```bash
# Terminal 1 — compile + watch (wait for "Found 0 errors")
pnpm dev

# Terminal 2 — launch Electron (only after terminal 1 is ready)
pnpm start
```

## Key configuration state

- **`tsconfig.main.json`**: `module: nodenext`, `moduleResolution: nodenext`, `outDir: dist`, `rootDir: src`
- **`package.json` `"main"`**: `dist/main/index.js` (matches output path now that `outDir` is `dist`)
- **`package.json` has no `"type": "module"`** — TypeScript treats all `.ts` as CJS under nodenext; no `.js` extensions needed on relative imports
- **Node version**: 22
- **Electron version**: 34
- **`electron-store`**: v10 (ESM-only, requires nodenext resolution)
- **`got`**: v14 (ESM-only, requires nodenext resolution)

## Auth chain (4 steps)

1. `MicrosoftAuth.startDeviceCodeFlow()` → device code shown to user
2. `MicrosoftAuth.acquireTokenByDeviceCode()` → MS access token (via MSAL polling)
3. `XboxAuth.authenticateWithXBL(msAccessToken)` → XBL token
4. `XboxAuth.authenticateWithXSTS(xblToken)` → XSTS token
5. `MinecraftAuth.loginWithXbox(xstsToken)` → Minecraft access token ← **403 HERE**
6. `MinecraftAuth.getProfile(mcAccessToken)` → player profile

Steps 1–2 confirmed working (device code displayed, user completed browser auth, MSAL returned token). Steps 3–5 are the unverified zone. The 403 is thrown from `got` in `minecraft.ts:19`.

## CSS / theming

The renderer uses CSS custom properties (`--accent`, `--bg-tertiary`, `--border`, `--text-secondary`, `--radius-sm`, `--radius-md`, `--font-mono`) defined in `globals.css`. Always use these variables for any new UI work — no hardcoded colors.

## electron-store generic typing gotcha

When passing a `schema` option to `new Store({...})`, electron-store infers types from the JSON Schema definition (`type: ['object', 'null']` → `unknown`). Always pass the TypeScript generic explicitly: `new Store<YourType>({...})` to override schema inference.

</critical_context>

<current_state>

## Deliverable status

| Item | Status |
|------|--------|
| `.env.example` | Complete |
| `.gitignore` | Complete |
| `dotenv` installed + wired | Complete |
| All TypeScript errors resolved | Complete (0 errors in watch) |
| App launches and renders UI | Complete |
| Microsoft OAuth device-code flow | Complete (displays code, copy button, clickable link) |
| XBL / XSTS token exchange | Unknown — not verified independently |
| Minecraft `login_with_xbox` (403) | **BROKEN — next priority** |
| Game launch end-to-end | Not started |
| Env vars wired into game/instance code | Not started |

## Current working state

- `pnpm dev` runs cleanly with 0 TypeScript errors
- The UI renders the login screen correctly
- The device-code OAuth flow completes (user can authenticate with Microsoft)
- After successful MS auth, the app crashes at the Minecraft services API with a 403
- No commits have been made — all changes are unstaged working tree edits
- No `.env` file exists yet (only `.env.example`) — user must create `.env` and set a real `MS_CLIENT_ID`

## Open questions

- Is the Azure AD app registration correctly configured? (Most likely root cause of 403)
- Does the test Microsoft account have Minecraft Java Edition purchased?
- Is the test account a personal Microsoft account? (The MSAL authority is set to `consumers` — work/school accounts won't work)

</current_state>
