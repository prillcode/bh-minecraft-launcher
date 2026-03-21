# BlockHaven Launcher — Project Structure

```
mc-launcher/
├── package.json
├── tsconfig.json
├── electron-builder.yml          # Packaging config
├── forge.config.ts               # Electron Forge config (alt)
│
├── src/
│   ├── main/                     # Electron main process
│   │   ├── index.ts              # App entry point, window management
│   │   ├── ipc-handlers.ts       # IPC bridge registration
│   │   └── preload.ts            # Context bridge (renderer ↔ main)
│   │
│   ├── core/                     # Platform-agnostic business logic
│   │   ├── auth/
│   │   │   ├── microsoft.ts      # MS OAuth2 device-code flow
│   │   │   ├── xbox.ts           # XBL + XSTS token exchange
│   │   │   ├── minecraft.ts      # Mojang token + profile fetch
│   │   │   ├── token-store.ts    # Encrypted credential persistence
│   │   │   └── types.ts
│   │   │
│   │   ├── game/
│   │   │   ├── version-manifest.ts   # Fetch & cache piston-meta manifest
│   │   │   ├── asset-manager.ts      # Download/verify assets & libraries
│   │   │   ├── java-detector.ts      # Find/validate Java installs
│   │   │   ├── launch.ts             # Assemble args & spawn java process
│   │   │   ├── instance.ts           # Per-profile game directories
│   │   │   └── types.ts
│   │   │
│   │   ├── mods/
│   │   │   ├── mod-loader.ts         # Forge/Fabric/Quilt installer logic
│   │   │   ├── modrinth-api.ts       # Modrinth search & download
│   │   │   └── types.ts
│   │   │
│   │   └── utils/
│   │       ├── download.ts           # Parallel downloads with progress
│   │       ├── hash.ts               # SHA1/SHA256 verification
│   │       ├── logger.ts             # Structured logging
│   │       └── paths.ts              # OS-specific .minecraft paths
│   │
│   └── renderer/                 # React UI (Vite-bundled)
│       ├── index.html
│       ├── main.tsx              # React entry
│       ├── App.tsx
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── TitleBar.tsx       # Custom frameless title bar
│       │   │   └── StatusBar.tsx
│       │   │
│       │   ├── auth/
│       │   │   ├── LoginScreen.tsx     # MS login + device code display
│       │   │   └── AccountSwitcher.tsx
│       │   │
│       │   ├── instances/
│       │   │   ├── InstanceList.tsx
│       │   │   ├── InstanceCard.tsx
│       │   │   └── CreateInstance.tsx
│       │   │
│       │   ├── play/
│       │   │   ├── PlayButton.tsx
│       │   │   ├── VersionSelector.tsx
│       │   │   └── LaunchProgress.tsx
│       │   │
│       │   ├── mods/
│       │   │   ├── ModBrowser.tsx      # Modrinth integration
│       │   │   └── InstalledMods.tsx
│       │   │
│       │   └── settings/
│       │       ├── JavaSettings.tsx
│       │       ├── MemorySlider.tsx
│       │       └── GeneralSettings.tsx
│       │
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   ├── useLaunch.ts
│       │   └── useDownloadProgress.ts
│       │
│       ├── stores/                # Zustand stores
│       │   ├── auth-store.ts
│       │   ├── instance-store.ts
│       │   └── settings-store.ts
│       │
│       └── styles/
│           ├── globals.css
│           └── theme.css
│
├── resources/                    # Static assets for packaging
│   ├── icon.ico
│   ├── icon.png
│   └── icon.icns
│
└── tests/
    ├── core/
    │   ├── auth.test.ts
    │   ├── version-manifest.test.ts
    │   └── launch.test.ts
    └── setup.ts
```
