// SCR-07 一键提交站点 URL 到 IndexNow（覆盖 Bing / Yandex / Seznam / Naver）并打印 Google、百度等搜索引擎的人工收录步骤

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicDirectoryPath = join(projectRootDirectory, 'apps/web/public');
const sitemapFilePath = join(publicDirectoryPath, 'sitemap.xml');
const indexNowEndpointUrl = 'https://api.indexnow.org/indexnow';
const requestTimeoutMilliseconds = 15000;

function readSitemapUrls(sitemapXmlText) {
  return [...sitemapXmlText.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((match) => match[1]);
}

function findIndexNowKey(publicDirectory) {
  const keyFileName = readdirSync(publicDirectory).find((fileName) =>
    /^[0-9a-fA-F]{8,128}\.txt$/.test(fileName)
  );
  if (!keyFileName) {
    throw new Error(`未在 ${publicDirectory} 找到 IndexNow 密钥文件（形如 <32位十六进制>.txt）`);
  }
  return {
    key: readFileSync(join(publicDirectory, keyFileName), 'utf8').trim(),
    keyFileName,
  };
}

async function fetchWithTimeout(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    redirect: 'follow',
    signal: AbortSignal.timeout(requestTimeoutMilliseconds),
  });
  return response;
}

async function checkUrlOnline(url) {
  try {
    const response = await fetchWithTimeout(url, { method: 'GET' });
    return response.status;
  } catch (error) {
    console.warn(`[跳过] ${url} 无法访问：${error.message}`);
    return 0;
  }
}

async function waitForKeyFileOnline(keyLocation, key, attempts = 5, delayMilliseconds = 10000) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetchWithTimeout(keyLocation, { method: 'GET' });
      const remoteKey = response.ok ? (await response.text()).trim() : '';
      if (remoteKey === key) {
        return true;
      }
      console.log(`[等待] 密钥文件尚未生效（第 ${attempt}/${attempts} 次，状态码 ${response.status}）`);
    } catch (error) {
      console.log(`[等待] 密钥文件暂不可访问：${error.message}（第 ${attempt}/${attempts} 次）`);
    }
    if (attempt < attempts) {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, delayMilliseconds));
    }
  }
  return false;
}

async function submitToIndexNow({ host, key, keyLocation, urlList }) {
  const response = await fetchWithTimeout(indexNowEndpointUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key, keyLocation, urlList }),
  });
  return response;
}

function printManualSubmissionGuide(sitemapUrl) {
  console.log('');
  console.log('需要登录账号手动提交的搜索引擎（一次配置，长期生效）：');
  console.log(`  Google 搜索中心：https://search.google.com/search-console  资源添加后提交 ${sitemapUrl}`);
  console.log(`  Bing 网站管理员：https://www.bing.com/webmasters  可绑定 Google 搜索中心并提交 ${sitemapUrl}`);
  console.log(`  百度搜索资源平台：https://ziyuan.baidu.com  普通收录 → sitemap，提交 ${sitemapUrl}`);
  console.log(`  搜狗站长平台：https://zhanzhang.sogou.com  提交 ${sitemapUrl}`);
  console.log(`  360 站长平台：https://zhanzhang.so.com  提交 ${sitemapUrl}`);
  console.log(`  头条搜索站长平台：https://zhanzhang.toutiao.com  提交 ${sitemapUrl}`);
  console.log('  DuckDuckGo 使用 Bing 索引，无需单独提交。');
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const sitemapXmlText = readFileSync(sitemapFilePath, 'utf8');
  const sitemapUrls = readSitemapUrls(sitemapXmlText);

  if (sitemapUrls.length === 0) {
    throw new Error(`sitemap 中没有可提交的 URL：${sitemapFilePath}`);
  }

  const { key, keyFileName } = findIndexNowKey(publicDirectoryPath);
  const sitemapUrl = new URL('sitemap.xml', sitemapUrls[0]).href;
  const host = new URL(sitemapUrls[0]).host;
  const keyLocation = new URL(keyFileName, sitemapUrls[0]).href;

  console.log(`站点主机：${host}`);
  console.log(`站点地图：${sitemapUrl}`);
  console.log(`IndexNow 密钥位置：${keyLocation}`);

  const onlineUrlList = [];
  for (const url of sitemapUrls) {
    const statusCode = await checkUrlOnline(url);
    if (statusCode === 200) {
      onlineUrlList.push(url);
      console.log(`[在线] ${url}`);
    } else {
      console.log(`[跳过] ${url} 返回状态码 ${statusCode}`);
    }
  }

  if (onlineUrlList.length === 0) {
    throw new Error('sitemap 中的所有 URL 都不可访问，请先确认站点已发布');
  }

  if (isDryRun) {
    console.log('');
    console.log(`[演练] 将向 IndexNow 提交 ${onlineUrlList.length} 条 URL，未实际发送请求。`);
    printManualSubmissionGuide(sitemapUrl);
    return;
  }

  const keyFileReady = await waitForKeyFileOnline(keyLocation, key);
  if (!keyFileReady) {
    throw new Error('IndexNow 密钥文件未在站点上生效，请先部署本次改动后重试');
  }

  const response = await submitToIndexNow({ host, key, keyLocation, urlList: onlineUrlList });
  const responseText = await response.text();
  if (response.status === 200 || response.status === 202) {
    console.log('');
    console.log(`[成功] IndexNow 已接收 ${onlineUrlList.length} 条 URL，覆盖 Bing / Yandex / Seznam / Naver。`);
  } else {
    console.warn('');
    console.warn(`[失败] IndexNow 返回状态码 ${response.status}：${responseText}`);
    process.exitCode = 1;
  }

  printManualSubmissionGuide(sitemapUrl);
}

main().catch((error) => {
  console.error(`[错误] ${error.message}`);
  process.exitCode = 1;
});
