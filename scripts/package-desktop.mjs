// SCR-12 Windows 打包入口：按目标生成安装包、便携版、商店包与压缩包，并补齐 electron-builder 不支持的 appxbundle
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { getRepoRoot, runNodeCli, runRepoScript } from './run-node-cli.mjs';
import { PACKAGE_FORMATS, PACKAGE_FORMAT_IDS, isKnownFormat } from './package-formats.js';

const repoRoot = getRepoRoot();
const builderConfig = join(repoRoot, 'apps', 'desktop', 'electron-builder.config.js');
const DEFAULT_TARGETS = ['nsis', 'portable'];
const isWindowsHost = process.platform === 'win32';

const findFormat = (formatId) => PACKAGE_FORMATS.find((format) => format.id === formatId) || null;

const printFormatList = () => {
  console.log('[desktop] 可用的 Windows 打包格式：');
  for (const format of PACKAGE_FORMATS) {
    const extension = format.ext ? `.${format.ext}` : '';
    const notes = [];
    if (format.windowsOnly) {
      notes.push('仅 Windows 10+');
    }
    if (format.needsWineOnPosix) {
      notes.push('Linux/macOS 需 wine');
    }
    const suffix = notes.length ? `（${notes.join('，')}）` : '';
    console.log(`  ${format.id.padEnd(12)} ${format.label}${extension} ${suffix}`);
    console.log(`  ${''.padEnd(12)} ${format.note}`);
  }
};

const resolveTargets = (rawArgs) => {
  const requested = rawArgs
    .filter((arg) => !arg.startsWith('-'))
    .flatMap((arg) => arg.split(','))
    .map((arg) => arg.trim())
    .filter(Boolean);
  if (!requested.length) {
    return DEFAULT_TARGETS;
  }
  if (requested.includes('all')) {
    return PACKAGE_FORMAT_IDS;
  }
  const invalid = requested.filter((target) => !isKnownFormat(target));
  if (invalid.length) {
    console.error(`[desktop] 未知的打包格式：${invalid.join(', ')}`);
    printFormatList();
    process.exit(1);
  }
  return requested;
};

const hasWine = () => {
  if (isWindowsHost) {
    return true;
  }
  for (const candidate of ['wine', 'wine64']) {
    try {
      execFileSync(candidate, ['--version'], { stdio: 'ignore' });
      return true;
    } catch {
      continue;
    }
  }
  return false;
};

const skipReasonFor = (formatId) => {
  if (isWindowsHost) {
    return '';
  }
  const format = findFormat(formatId);
  if (!format) {
    return '未知格式';
  }
  if (format.windowsOnly) {
    return `只能在 Windows 10 及以上生成，当前系统为 ${process.platform}`;
  }
  if (format.needsWineOnPosix && !hasWine()) {
    return '当前系统未安装 wine';
  }
  return '';
};

const buildElectronBuilderTarget = (formatId) => {
  const format = findFormat(formatId);
  console.log(`[desktop] 正在打包 ${formatId}：${format.label}`);
  try {
    runNodeCli('electron-builder', ['--config', builderConfig, '--win', formatId]);
    console.log(`[desktop] ${formatId} 打包成功`);
    return true;
  } catch {
    console.error(`[desktop] ${formatId} 打包失败`);
    if (format.windowsOnly) {
      console.error('[desktop] 该格式只能在 Windows 10 及以上系统生成');
    }
    if (format.needsWineOnPosix && !isWindowsHost) {
      console.error('[desktop] Linux/macOS 生成该格式需要安装 wine');
    }
    return false;
  }
};

const buildAppxBundle = () => {
  console.log('[desktop] 正在组合 appxbundle（基于已生成的 .appx）');
  try {
    runRepoScript('make-appxbundle.mjs');
    console.log('[desktop] appxbundle 组合成功');
    return true;
  } catch {
    console.error('[desktop] appxbundle 组合失败');
    console.error('[desktop] 需要 makeappx.exe：安装 Windows SDK，或先成功执行一次 appx 打包');
    return false;
  }
};

const expandDependencies = (targets) => {
  const ordered = [];
  for (const target of targets) {
    if (target === 'appxbundle' && !ordered.includes('appx')) {
      ordered.push('appx');
    }
    if (!ordered.includes(target)) {
      ordered.push(target);
    }
  }
  return ordered;
};

const main = () => {
  const rawArgs = process.argv.slice(2);
  if (rawArgs.includes('--list')) {
    printFormatList();
    return;
  }

  const targets = expandDependencies(resolveTargets(rawArgs));
  console.log(`[desktop] 目标：${targets.join(', ')}`);
  console.log('[desktop] 构建渲染资源…');
  runRepoScript('build-desktop.mjs');

  const results = [];
  for (const target of targets) {
    const skipReason = skipReasonFor(target);
    if (skipReason) {
      console.error(`[desktop] 跳过 ${target}：${skipReason}`);
      results.push([target, false, skipReason]);
      continue;
    }
    results.push([
      target,
      target === 'appxbundle' ? buildAppxBundle() : buildElectronBuilderTarget(target),
      '',
    ]);
  }

  const succeeded = results.filter(([, ok]) => ok).map(([name]) => name);
  const skipped = results.filter(([, ok, reason]) => !ok && reason).map(([name]) => name);
  const failed = results.filter(([, ok, reason]) => !ok && !reason).map(([name]) => name);

  console.log('');
  if (succeeded.length) {
    console.log(`[desktop] 成功：${succeeded.join(', ')}`);
  }
  if (skipped.length) {
    console.log(`[desktop] 跳过：${skipped.join(', ')}（当前系统不支持）`);
  }
  if (failed.length) {
    console.error(`[desktop] 失败：${failed.join(', ')}`);
  }
  console.log('[desktop] 产物目录：dist/desktop');
  if (failed.length || (succeeded.length === 0 && skipped.length > 0)) {
    process.exitCode = 1;
  }
};

main();
