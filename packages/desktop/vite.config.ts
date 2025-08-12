import path from 'node:path'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'

const autoImport = AutoImport({
  dirs: [
    {
      glob: 'src/config',
      types: true,
    },
  ],
  dts: 'src/types/auto-imports.d.ts',
  eslintrc: {
    enabled: true,
    filepath: './.eslintrc-auto-import.json',
    globalsPropValue: true,
  },
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    electron({
      main: {
        entry: 'src/main.ts',
        vite: {
          plugins: [autoImport],
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
          plugins: [autoImport],
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
})
