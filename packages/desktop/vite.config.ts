import path from 'node:path';
import process from 'node:process';
import {defineConfig} from 'vite';
import electron from 'vite-plugin-electron/simple';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    electron({
      main: {
        entry: 'electron/main.ts',
      },
      preload: {
        input: path.join(__dirname, 'electron/preload.ts'),
      },
    }),
  ],
  build: {
    rollupOptions: {
      external: ['electron'],
    },
  },
});
