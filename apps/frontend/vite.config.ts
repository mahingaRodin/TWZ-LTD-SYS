import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@fire-system/shared-types': path.resolve(
        __dirname,
        '../../packages/shared-types/src/index.ts',
      ),
    },
  },
  server: {
    port: 3000,
    strictPort: false,
  },
});
