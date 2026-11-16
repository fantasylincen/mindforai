// SCR-13 桌面版开发启动脚本：先构建渲染资源再以开发模式拉起 Electron 主进程
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getRepoRoot, runNodeCli, runRepoScript } from './run-node-cli.mjs';

const repoRoot = getRepoRoot();
const rendererEntry = join(repoRoot, 'apps', 'desktop', 'renderer', 'index.html');

const ensureRendererBuilt = () => {
  if (existsSync(rendererEntry)) {
    return;
  }
  console.log('[desktop] 首次启动，构建渲染资源…');
  runRepoScript('build-desktop.mjs');
};

const main = () => {
  ensureRendererBuilt();
  console.log('[desktop] 启动 Electron…');
  runNodeCli('electron', [join(repoRoot, 'apps', 'desktop')]);
};

main();
