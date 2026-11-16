// SCR-11 一键构建桌面版渲染资源：构建桌面 Webview、把产物整理成 Electron 可加载的 renderer 目录
import { cpSync, existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { getRepoRoot, runNodeCli } from './run-node-cli.mjs';

const repoRoot = getRepoRoot();
const buildOutputDir = join(repoRoot, 'dist', 'apps', 'desktop-web');
const rendererDir = join(repoRoot, 'apps', 'desktop', 'renderer');
const droppedEntries = [
  'logo',
  'logo/icons',
  '_headers',
  '_redirects',
  'robots.txt',
  'sitemap.xml',
  'social-card-1200x630.png',
  'd4a35f43e1183caef54aa7a1db5d9e99.txt',
];

const runRendererBuild = () => {
  runNodeCli('vite', [
    'build',
    '--config',
    join(repoRoot, 'apps', 'web', 'vite.desktop.config.ts'),
  ]);
};

const normalizeEntryHtml = () => {
  const builtHtmlPath = join(buildOutputDir, 'desktop.html');
  if (!existsSync(builtHtmlPath)) {
    throw new Error(`桌面版入口 HTML 缺失：${builtHtmlPath}`);
  }
  renameSync(builtHtmlPath, join(buildOutputDir, 'index.html'));
};

const copyRendererInto = () => {
  rmSync(rendererDir, { recursive: true, force: true });
  mkdirSync(rendererDir, { recursive: true });
  cpSync(buildOutputDir, rendererDir, { recursive: true });
  for (const entry of droppedEntries) {
    rmSync(join(rendererDir, entry), { recursive: true, force: true });
  }
};

const main = () => {
  console.log('[desktop] 构建桌面版渲染资源…');
  runRendererBuild();
  console.log('[desktop] 整理入口与静态资源…');
  normalizeEntryHtml();
  copyRendererInto();
  console.log(`[desktop] 渲染目录：${rendererDir}`);
  console.log(`[desktop] 构建产物：${buildOutputDir}`);
};

main();
