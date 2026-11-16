// SCR-14 桌面版脚本的跨平台命令执行器：直接用 node 执行各依赖包的 JS 入口，避开 Windows 上 .cmd 与 Unix 上无扩展名的 shim 差异
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');

const PACKAGE_ENTRIES = {
  vite: join('node_modules', 'vite', 'bin', 'vite.js'),
  electron: join('node_modules', 'electron', 'cli.js'),
  'electron-builder': join('node_modules', 'electron-builder', 'cli.js'),
};

export const getRepoRoot = () => repoRoot;

export const runRepoScript = (scriptName, args = [], cwd = repoRoot) => {
  execFileSync(process.execPath, [join(repoRoot, 'scripts', scriptName), ...args], {
    cwd,
    stdio: 'inherit',
    env: process.env,
  });
};

export const runNodeCli = (packageName, args, cwd = repoRoot) => {
  const entry = PACKAGE_ENTRIES[packageName];
  if (!entry) {
    throw new Error(`未登记的依赖包：${packageName}`);
  }
  execFileSync(process.execPath, [join(repoRoot, entry), ...args], {
    cwd,
    stdio: 'inherit',
    env: process.env,
  });
};
