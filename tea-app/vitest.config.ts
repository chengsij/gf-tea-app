import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import path from 'path';

// Custom plugin to ensure shared folder dependencies are resolved correctly
const sharedFolderPlugin: Plugin = {
  name: 'shared-folder-resolution',
  resolveId(id: string, importer?: string) {
    // Ensure zod imports from shared folder are resolved from tea-app node_modules
    if (id === 'zod' && importer && importer.includes('/shared/')) {
      const resolved = path.resolve(__dirname, 'node_modules/zod/index.cjs')
      return resolved
    }
  }
}

export default defineConfig({
  plugins: [sharedFolderPlugin, react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
