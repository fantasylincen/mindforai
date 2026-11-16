// SCR-19 把已生成的 .appx 组合成 .appxbundle：electron-builder 只产出 .appx，bundle 需 MakeAppx 补一步
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { unzipSync, strFromU8 } from 'fflate';
import { getRepoRoot } from './run-node-cli.mjs';

const repoRoot = getRepoRoot();
const outputDir = join(repoRoot, 'dist', 'desktop');
const stagingDir = join(outputDir, 'appxbundle-staging');
const MANIFEST_NAME = 'AppxManifest.xml';

const readAttribute = (source, attribute) => {
  const matched = new RegExp(`${attribute}\\s*=\\s*"([^"]*)"`, 'i').exec(source);
  return matched ? matched[1] : '';
};

const readAppxIdentity = (appxPath) => {
  let entries;
  try {
    entries = unzipSync(new Uint8Array(readFileSync(appxPath)));
  } catch (error) {
    throw new Error(`无法解压 appx：${error.message}`);
  }
  const manifestKey = Object.keys(entries).find(
    (key) =>
      key.toLowerCase() === MANIFEST_NAME.toLowerCase() ||
      key.toLowerCase().endsWith(`/${MANIFEST_NAME.toLowerCase()}`)
  );
  if (!manifestKey) {
    throw new Error(`包内缺少 ${MANIFEST_NAME}`);
  }
  const manifest = strFromU8(entries[manifestKey]);
  const identityBlock = /<Identity\b[^>]*>/i.exec(manifest);
  if (!identityBlock) {
    throw new Error('清单缺少 Identity 节点');
  }
  return {
    name: readAttribute(identityBlock[0], 'Name'),
    publisher: readAttribute(identityBlock[0], 'Publisher'),
    version: readAttribute(identityBlock[0], 'Version'),
    architecture: readAttribute(identityBlock[0], 'ProcessorArchitecture'),
  };
};

const listAppxFiles = () => {
  if (!existsSync(outputDir)) {
    return [];
  }
  return readdirSync(outputDir)
    .filter((name) => name.toLowerCase().endsWith('.appx'))
    .map((name) => join(outputDir, name))
    .filter((filePath) => statSync(filePath).isFile())
    .sort();
};

const collectMakeappxFromWindowsSdk = () => {
  const kitRoots = [
    'C:\\Program Files (x86)\\Windows Kits\\10\\bin',
    'C:\\Program Files\\Windows Kits\\10\\bin',
  ];
  const found = [];
  for (const kitRoot of kitRoots) {
    if (!existsSync(kitRoot)) {
      continue;
    }
    for (const version of readdirSync(kitRoot).sort().reverse()) {
      for (const arch of ['x64', 'x86']) {
        const candidate = join(kitRoot, version, arch, 'makeappx.exe');
        if (existsSync(candidate)) {
          found.push(candidate);
        }
      }
    }
  }
  return found;
};

const collectMakeappxFromCacheTree = () => {
  const cacheRoots = [
    join(homedir(), 'AppData', 'Local', 'electron-builder', 'Cache'),
    join(homedir(), '.cache', 'electron-builder'),
    join(homedir(), 'Library', 'Caches', 'electron-builder'),
  ];
  const found = [];
  const walk = (currentDir, depth) => {
    if (depth > 4) {
      return;
    }
    let entries;
    try {
      entries = readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const entryPath = join(currentDir, entry.name);
      if (entry.isFile() && entry.name.toLowerCase() === 'makeappx.exe') {
        found.push(entryPath);
        continue;
      }
      if (entry.isDirectory()) {
        walk(entryPath, depth + 1);
      }
    }
  };
  for (const cacheRoot of cacheRoots) {
    if (existsSync(cacheRoot)) {
      walk(cacheRoot, 0);
    }
  }
  return found;
};

const collectMakeappxFromBoundedWalk = (rootDir, maxDepth) => {
  const found = [];
  const walk = (currentDir, depth) => {
    if (depth > maxDepth) {
      return;
    }
    let entries;
    try {
      entries = readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const entryPath = join(currentDir, entry.name);
      if (entry.isFile() && entry.name.toLowerCase() === 'makeappx.exe') {
        found.push(entryPath);
      } else if (entry.isDirectory()) {
        walk(entryPath, depth + 1);
      }
    }
  };
  if (existsSync(rootDir)) {
    walk(rootDir, 0);
  }
  return found;
};

const collectMakeappxFromPath = () => {
  const pathValue = process.env.PATH || process.env.Path || '';
  const found = [];
  for (const directory of pathValue.split(process.platform === 'win32' ? ';' : ':')) {
    if (!directory) {
      continue;
    }
    const candidate = join(directory, 'makeappx.exe');
    if (existsSync(candidate)) {
      found.push(candidate);
    }
  }
  return found;
};

const findMakeappx = () => {
  const fromPath = collectMakeappxFromPath();
  if (fromPath.length) {
    return fromPath[0];
  }
  const kitsPath = process.env.ELECTRON_BUILDER_WINDOWS_KITS_PATH;
  if (kitsPath) {
    const fromEnv = collectMakeappxFromBoundedWalk(kitsPath, 3);
    if (fromEnv.length) {
      return fromEnv[0];
    }
  }
  const fromSdk = collectMakeappxFromWindowsSdk();
  if (fromSdk.length) {
    return fromSdk[0];
  }
  const fromCache = collectMakeappxFromCacheTree();
  if (fromCache.length) {
    return fromCache[0];
  }
  return '';
};

const fail = (message) => {
  console.error(`[appxbundle] ${message}`);
  process.exit(1);
};

const main = () => {
  const appxFiles = listAppxFiles();
  if (!appxFiles.length) {
    fail('dist/desktop 下没有 .appx，请先打包 appx 目标');
  }

  const identities = appxFiles.map((appxPath) => ({
    ...readAppxIdentity(appxPath),
    fileName: appxPath.split(/[\\/]/).pop(),
    appxPath,
  }));
  for (const item of identities) {
    console.log(`[appxbundle] 待处理 ${item.fileName}（${item.architecture}，${item.version}）`);
  }

  const makeappx = findMakeappx();
  if (!makeappx) {
    console.error('[appxbundle] 未找到 makeappx.exe');
    console.error('[appxbundle] 获取方式（任选一种）：');
    console.error(
      '[appxbundle]   1. 先执行一次 appx 打包，electron-builder 会自动下载包含 makeappx 的工具包'
    );
    console.error(
      '[appxbundle]   2. 安装 Windows SDK：https://developer.microsoft.com/windows/windows-sdk/'
    );
    process.exit(1);
  }
  console.log(`[appxbundle] MakeAppx：${makeappx}`);

  const distinct = (key) => new Set(identities.map((item) => item[key]));
  if (distinct('name').size > 1 || distinct('publisher').size > 1 || distinct('version').size > 1) {
    console.error('[appxbundle] 参与组合的 .appx 必须有相同的 Name / Publisher / Version');
    for (const item of identities) {
      console.error(
        `[appxbundle]   ${item.name} | ${item.publisher} | ${item.version} | ${item.architecture}`
      );
    }
    process.exit(1);
  }

  rmSync(stagingDir, { recursive: true, force: true });
  mkdirSync(stagingDir, { recursive: true });
  for (const item of identities) {
    copyFileSync(item.appxPath, join(stagingDir, item.fileName));
    console.log(`[appxbundle] 收集 ${item.fileName}（${item.architecture}）`);
  }

  const version = [...distinct('version')][0];
  const architectures = [...new Set(identities.map((item) => item.architecture))].sort();
  const outputPath = join(outputDir, `MindForAI-${version}-${architectures.join('-')}.appxbundle`);
  rmSync(outputPath, { force: true });

  try {
    execFileSync(makeappx, ['bundle', '/d', stagingDir, '/p', outputPath, '/o'], {
      stdio: 'inherit',
    });
  } catch (error) {
    fail(`MakeAppx bundle 失败：${error.message}`);
  }

  rmSync(stagingDir, { recursive: true, force: true });
  if (!existsSync(outputPath)) {
    fail('未生成 .appxbundle');
  }

  const bytes = statSync(outputPath).size;
  console.log(`[appxbundle] 完成：${outputPath}`);
  console.log(`[appxbundle] 体积：${(bytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`[appxbundle] 包含架构：${architectures.join(', ')}`);
  console.log('[appxbundle] 提示：未签名的 .appxbundle 需要开启「开发人员模式」才能安装');
};

main();
