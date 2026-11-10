// WEB-18 VS Code 扩展 Webview 的独立构建配置，产出相对路径资源供 Webview 加载
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { resolve } from 'path';

export default defineConfig({
  root: __dirname,
  base: './',
  publicDir: false,
  cacheDir: '../../node_modules/.vite/apps/web-vscode',

  plugins: [react(), nxViteTsPaths()],

  build: {
    outDir: '../../dist/apps/vscode-webview',
    emptyOutDir: true,
    reportCompressedSize: false,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: resolve(__dirname, 'vscode.html'),
      output: {
        entryFileNames: 'assets/webview.js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
