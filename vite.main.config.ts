import { defineConfig } from 'vite';
import { builtinModules } from 'module';
import * as path from 'path';

const external = [
  'electron',
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
];

export default defineConfig({
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
