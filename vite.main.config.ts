import { defineConfig } from 'vite';
import { builtinModules } from 'module';
import * as path from 'path';
import { config } from 'dotenv';

// Load .env at build time so MS_CLIENT_ID gets inlined into the bundle.
// This is the only way the value reaches the packaged app (no .env at runtime).
config();

const external = [
  'electron',
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
];

export default defineConfig({
  define: {
    'process.env.MS_CLIENT_ID': JSON.stringify(process.env.MS_CLIENT_ID ?? ''),
    'process.env.BLOCKHAVEN_SERVER_HOST': JSON.stringify(process.env.BLOCKHAVEN_SERVER_HOST ?? 'play.bhsmp.com'),
    'process.env.BLOCKHAVEN_SERVER_PORT': JSON.stringify(process.env.BLOCKHAVEN_SERVER_PORT ?? '25565'),
    'process.env.OPEN_DEVTOOLS': JSON.stringify(process.env.OPEN_DEVTOOLS ?? ''),
  },
  build: {
    outDir: 'dist/main',
    emptyOutDir: true,
    target: 'node22',
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'src/main/index.ts'),
        preload: path.resolve(__dirname, 'src/main/preload.ts'),
      },
      output: {
        format: 'cjs',
        entryFileNames: '[name].js',
      },
      external,
    },
  },
  resolve: {
    conditions: ['node'],
  },
});
