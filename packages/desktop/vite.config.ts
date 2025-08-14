import path from 'node:path';
import AutoImport from 'unplugin-auto-import/vite';
import {defineConfig} from 'vite';
import electron from 'vite-plugin-electron/simple';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    electron({
      main: {
        entry: 'src/main.ts',
        vite: {
          resolve: {
            alias: {
              '@': path.resolve(__dirname, 'src'),
            },
          },
          build: {
            sourcemap: true,
          },
        },
      },
      preload: {
        input: path.join(__dirname, 'src/preload.ts'),
        vite: {
          resolve: {
            alias: {
              '@': path.resolve(__dirname, 'src'),
            },
          },
          build: {
            sourcemap: true,
          },
        },
      },
    }),
  ],
});
