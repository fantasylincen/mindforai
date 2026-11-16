// DESK-14 桌面版渲染进程的独立构建配置，产出相对路径资源供 Electron 直接加载
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { resolve } from 'path';

export default defineConfig({
  root: __dirname,
  base: './',
  publicDir: resolve(__dirname, 'public'),
  cacheDir: '../../node_modules/.vite/apps/web-desktop',

  plugins: [react(), nxViteTsPaths()],

  build: {
    outDir: '../../dist/apps/desktop-web',
    emptyOutDir: true,
    reportCompressedSize: false,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: resolve(__dirname, 'desktop.html'),
      output: {
        entryFileNames: 'assets/desktop.js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
