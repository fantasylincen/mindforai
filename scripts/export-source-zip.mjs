// SCR-16 导出源码包：把构建与运行所需的源码打成 zip，供在 Windows 本地重新安装依赖
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getRepoRoot } from './run-node-cli.mjs';

const repoRoot = getRepoRoot();
const outputDir = join(repoRoot, 'dist');
const stagingDir = join(outputDir, 'export-staging');
const EXCLUDED_PREFIXES = [
  'node_modules/',
  'dist/',
  '.nx/',
  'tmp/',
  '.git/',
  'apps/desktop/renderer/',
  'apps/vscode-extension/webview/',
  '.claude/',
];
const EXCLUDED_FILES = ['ALL.toon'];
const REQUIRED_FILES = [
  'package.json',
  'package-lock.json',
  'nx.json',
  'tsconfig.base.json',
  'project.toon',
  'apps/web/index.html',
  'apps/desktop/main.js',
  'mindforai.ps1',
  'mindforai.bat',
];

const runGit = (args) => execFileSync('git', args, { cwd: repoRoot, maxBuffer: 64 * 1024 * 1024 });

const listSourceFiles = () => {
  const output = runGit(['ls-files', '-co', '--exclude-standard', '-z']).toString('utf8');
  return output
    .split('\0')
    .filter(Boolean)
    .filter((file) => !EXCLUDED_PREFIXES.some((prefix) => file.startsWith(prefix)))
    .filter((file) => !EXCLUDED_FILES.includes(file))
    .filter((file) => existsSync(join(repoRoot, file)))
    .sort();
};

const readPackageVersion = () => {
  const packageJson = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
  return packageJson.version || '0.0.0';
};

const buildFirstReadme = (fileCount) =>
  [
    'MindForAI 源码包',
    '========================================',
    '',
    '这个压缩包只包含源码，不包含 node_modules。',
    '依赖必须在 Windows 本机重新安装，跨系统复制 node_modules 会导致 EPERM / EISDIR 报错。',
    '',
    '第一步：解压到真实的 Windows 本地磁盘目录',
    '  正确：D:\\dev\\mindforai',
    '  错误：OneDrive / 坚果云等同步目录、网络映射盘、WSL 或 Linux 映射目录',
    '',
    '第二步：安装 Node.js 22.12 或更高版本（推荐当前 LTS 26.x）',
    '  https://nodejs.org/en/download  →  Windows Installer (.msi)  x64',
    '  安装时勾选 Add to PATH，装完必须新开一个 PowerShell 窗口。',
    '',
    '  如果你用 fnm 安装：fnm 只把 node 注入到「已初始化的终端」里，',
    '  cmd 或新开的窗口常常找不到 node。两种解决办法（任选一种）：',
    '    A. 换用官方 .msi 安装包（最省事，推荐）',
    '    B. 保留 fnm：本脚本会自动扫描 fnm 的安装目录并直接使用，无需手动配置 PATH；',
    '       若仍想在自己的 CMD 里能用 node，按 fnm 文档把下面这行写进 CMD 的 AutoRun：',
    '         FOR /f "tokens=*" %%z IN (\'fnm env --use-on-cd\') DO CALL %%z',
    '',
    '第三步：在解压目录里运行（任选一种）',
    '  双击 mindforai.bat，然后在菜单里选择 1',
    '  或执行：  .\\mindforai.ps1 install',
    '',
    '可用命令：',
    '  .\\mindforai.ps1 install    安装依赖（清理旧目录 + npm ci + 下载 Electron）',
    '  .\\mindforai.ps1 run        构建渲染资源并启动桌面版',
    '  .\\mindforai.ps1 package    打包 Windows 安装包与免安装版',
    '  .\\mindforai.ps1 clean      只清理 node_modules',
    '  .\\mindforai.ps1 doctor     检查环境（Node 版本、路径、占用进程）',
    '',
    `本包共 ${fileCount} 个源码文件。详细说明见 README.md 与 deploy/README.md。`,
    '',
  ].join('\r\n');

const writeStagingExtras = (fileList) => {
  rmSync(stagingDir, { recursive: true, force: true });
  mkdirSync(stagingDir, { recursive: true });
  writeFileSync(join(stagingDir, 'README-FIRST.txt'), buildFirstReadme(fileList.length), 'utf8');
  writeFileSync(join(stagingDir, 'SOURCE-FILE-LIST.txt'), `${fileList.join('\r\n')}\r\n`, 'utf8');
};

const runZip = (args) => {
  try {
    execFileSync('zip', args, { cwd: repoRoot, maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      throw new Error('系统缺少 zip 命令，请先安装：apt install zip');
    }
    throw new Error(`zip 执行失败：${error.message}`);
  }
};

const listArchiveEntries = (outputPath) =>
  execFileSync('unzip', ['-Z1', outputPath], { maxBuffer: 64 * 1024 * 1024 })
    .toString('utf8')
    .split('\n')
    .filter(Boolean);

const createArchive = (outputPath, fileList) => {
  rmSync(outputPath, { force: true });
  if (fileList.some((file) => file.startsWith('-'))) {
    throw new Error('存在以 - 开头的文件名，无法安全传给 zip');
  }
  runZip(['-q', outputPath, ...fileList]);
  runZip(['-q', '-j', outputPath, 'dist/export-staging/README-FIRST.txt']);
  runZip(['-q', '-j', outputPath, 'dist/export-staging/SOURCE-FILE-LIST.txt']);

  const entries = listArchiveEntries(outputPath);
  const forbidden = entries.filter(
    (entry) => entry.startsWith('node_modules/') || entry.endsWith('.node')
  );
  if (forbidden.length) {
    throw new Error(`压缩包误含依赖或原生模块：${forbidden.slice(0, 5).join(', ')}`);
  }
  const required = ['package.json', 'package-lock.json', 'README-FIRST.txt', 'mindforai.bat'];
  const lacking = required.filter((entry) => !entries.includes(entry));
  if (lacking.length) {
    throw new Error(`压缩包缺少关键文件：${lacking.join(', ')}`);
  }
  return entries;
};

const main = () => {
  const fileList = listSourceFiles();
  if (!fileList.length) {
    throw new Error('未找到可导出的源码文件，请确认当前目录是 git 仓库根目录');
  }
  const missing = REQUIRED_FILES.filter((file) => !fileList.includes(file));
  if (missing.length) {
    throw new Error(`以下关键文件未纳入导出列表：${missing.join(', ')}`);
  }

  mkdirSync(outputDir, { recursive: true });
  writeStagingExtras(fileList);

  const version = readPackageVersion();
  const outputPath = join(outputDir, `mindforai-source-${version}.zip`);
  const entryCount = createArchive(outputPath, fileList).length;
  rmSync(stagingDir, { recursive: true, force: true });

  const bytes = readFileSync(outputPath);
  const sha256 = createHash('sha256').update(bytes).digest('hex');

  console.log(`[export] 源码文件数：${fileList.length}，压缩包条目：${entryCount}`);
  console.log(`[export] 压缩包路径：${outputPath}`);
  console.log(`[export] 体积：${(bytes.length / 1024 / 1024).toFixed(2)} MB`);
  console.log(`[export] SHA256：${sha256}`);
  console.log('[export] 下一步：把 zip 拷到 Windows，解压到本地磁盘后运行 mindforai.bat');
};

main();
