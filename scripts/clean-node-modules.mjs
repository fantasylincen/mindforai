// SCR-15 依赖目录复位脚本：清除只读属性后多次重试删除 node_modules，并打印仍被占用的具体路径
import { chmodSync, existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { getRepoRoot } from './run-node-cli.mjs';

const REMOVE_ATTEMPTS = 6;
const RETRY_DELAY_MS = 1000;
const MAX_REPORTED_PATHS = 10;

const sleepSync = (milliseconds) => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
};

const clearReadonlyRecursively = (targetPath) => {
  let stats;
  try {
    stats = statSync(targetPath);
  } catch {
    return;
  }
  try {
    chmodSync(targetPath, stats.mode | 0o200);
  } catch {
    // 权限不足时跳过，交给后续重试
  }
  if (!stats.isDirectory()) {
    return;
  }
  let entries;
  try {
    entries = readdirSync(targetPath);
  } catch {
    return;
  }
  for (const entry of entries) {
    clearReadonlyRecursively(join(targetPath, entry));
  }
};

const collectLockedPaths = (targetPath, collected = []) => {
  if (collected.length >= MAX_REPORTED_PATHS || !existsSync(targetPath)) {
    return collected;
  }
  let stats;
  try {
    stats = statSync(targetPath);
  } catch {
    collected.push(targetPath);
    return collected;
  }
  if (!stats.isDirectory()) {
    collected.push(targetPath);
    return collected;
  }
  let entries;
  try {
    entries = readdirSync(targetPath);
  } catch {
    collected.push(targetPath);
    return collected;
  }
  for (const entry of entries) {
    collectLockedPaths(join(targetPath, entry), collected);
    if (collected.length >= MAX_REPORTED_PATHS) {
      break;
    }
  }
  return collected;
};

const removeOnce = (targetPath) => {
  try {
    rmSync(targetPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
  } catch {
    clearReadonlyRecursively(targetPath);
    rmSync(targetPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
  }
};

const removeWithRetry = (targetPath) => {
  for (let attempt = 1; attempt <= REMOVE_ATTEMPTS; attempt++) {
    if (!existsSync(targetPath)) {
      return true;
    }
    try {
      removeOnce(targetPath);
    } catch {
      // 保留重试机会，不在此中断
    }
    if (!existsSync(targetPath)) {
      return true;
    }
    console.log(`[clean] 第 ${attempt} 次删除未完成，${RETRY_DELAY_MS}ms 后重试…`);
    sleepSync(RETRY_DELAY_MS);
  }
  return !existsSync(targetPath);
};

const main = () => {
  const repoRoot = getRepoRoot();
  const relativeTargets = process.argv.slice(2).length ? process.argv.slice(2) : ['node_modules'];
  let hasFailure = false;
  for (const relativeTarget of relativeTargets) {
    const targetPath = join(repoRoot, relativeTarget);
    if (!existsSync(targetPath)) {
      console.log(`[clean] 不存在，跳过：${relativeTarget}`);
      continue;
    }
    console.log(`[clean] 正在清理：${relativeTarget}`);
    if (removeWithRetry(targetPath)) {
      console.log(`[clean] 已删除：${relativeTarget}`);
      continue;
    }
    hasFailure = true;
    console.error('[clean] 删除失败，以下路径仍被占用：');
    for (const lockedPath of collectLockedPaths(targetPath)) {
      console.error(`  - ${lockedPath}`);
    }
  }
  if (hasFailure) {
    console.error('[clean] 请依次处理后再重试：');
    console.error('  1. 关闭全部 VS Code / 编辑器窗口与终端');
    console.error('  2. 结束残留的 node.exe / electron.exe / MindForAI.exe 进程');
    console.error('  3. 关闭资源管理器里该目录的预览或同步窗口');
    console.error('  4. 暂停 OneDrive / Dropbox 同步，或把项目移出同步目录');
    console.error('  5. 临时关闭杀毒软件对该目录的实时扫描');
    process.exit(1);
  }
  console.log('[clean] 清理完成，接下来执行：npm ci');
};

main();
