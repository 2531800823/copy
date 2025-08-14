import react from '@vitejs/plugin-react-swc';
import path from 'path';
import {defineConfig} from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 7010,
    /** 配置代理，解决跨域问题 */
    proxy: {
      '/api': {
        target: 'http://localhost:7011',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
