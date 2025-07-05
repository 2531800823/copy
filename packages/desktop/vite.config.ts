import path from 'node:path'
import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    electron({
      main: {
        entry: 'src/main.ts',
      },
      preload: {
        input: path.join(__dirname, 'src/preload.ts'),
      },
    }),
  ],
  build: {
    rollupOptions: {
      external: ['electron'],
    },
  },
})
