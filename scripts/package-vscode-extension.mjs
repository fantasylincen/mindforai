// 一键构建并打包 VS Code 扩展：构建 Webview、组装可安装目录、生成 .vsix 安装包
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync, strToU8 } from '../node_modules/fflate/esm/browser.js';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const sourceDir = join(repoRoot, 'apps', 'vscode-extension');
const webviewDistDir = join(repoRoot, 'dist', 'apps', 'vscode-webview');
const stagingRoot = join(repoRoot, 'dist', 'vscode-extension');
const stagedExtensionDir = join(stagingRoot, 'extension');
const sourcePackageJsonPath = join(sourceDir, 'package.json');

const CONTENT_TYPES = {
  json: 'application/json',
  js: 'application/javascript',
  mjs: 'application/javascript',
  css: 'text/css',
  html: 'text/html',
  svg: 'image/svg+xml',
  png: 'image/png',
  ico: 'image/x-icon',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  md: 'text/markdown',
  txt: 'text/plain',
  map: 'application/json',
  woff: 'application/font-woff',
  woff2: 'font/woff2',
  ttf: 'application/font-sfnt',
  vsixmanifest: 'text/xml',
};
const DROPPED_WEBVIEW_ENTRIES = [
  'logo',
  '_headers',
  '_redirects',
  'robots.txt',
  'sitemap.xml',
  'social-card-1200x630.png',
  'favicon.ico',
  'favicon.svg',
  'apple-touch-icon.png',
];

const readPackageJson = () => JSON.parse(readFileSync(sourcePackageJsonPath, 'utf8'));

const runWebviewBuild = () => {
  const viteBin = join(repoRoot, 'node_modules', '.bin', 'vite');
  execFileSync(
    viteBin,
    ['build', '--config', join(repoRoot, 'apps', 'web', 'vite.vscode.config.ts')],
    {
      cwd: repoRoot,
      stdio: 'inherit',
    }
  );
};

const collectFiles = (rootDir, currentDir = rootDir) => {
  const entries = [];
  for (const entry of readdirSync(currentDir)) {
    const fullPath = join(currentDir, entry);
    if (statSync(fullPath).isDirectory()) {
      entries.push(...collectFiles(rootDir, fullPath));
    } else {
      entries.push(relative(rootDir, fullPath).split('\\').join('/'));
    }
  }
  return entries;
};

const copyWebviewInto = (targetDir) => {
  rmSync(targetDir, { recursive: true, force: true });
  cpSync(webviewDistDir, targetDir, { recursive: true });
  for (const entry of DROPPED_WEBVIEW_ENTRIES) {
    rmSync(join(targetDir, entry), { recursive: true, force: true });
  }
  const builtHtmlPath = join(targetDir, 'vscode.html');
  if (!existsSync(builtHtmlPath)) {
    throw new Error(`Webview 入口 HTML 缺失：${builtHtmlPath}`);
  }
  cpSync(builtHtmlPath, join(targetDir, 'index.html'));
  rmSync(builtHtmlPath, { force: true });
};

const stageExtension = () => {
  rmSync(stagingRoot, { recursive: true, force: true });
  mkdirSync(stagedExtensionDir, { recursive: true });
  cpSync(join(sourceDir, 'package.json'), join(stagedExtensionDir, 'package.json'));
  cpSync(join(sourceDir, 'extension.js'), join(stagedExtensionDir, 'extension.js'));
  cpSync(join(sourceDir, 'media'), join(stagedExtensionDir, 'media'), { recursive: true });
  copyWebviewInto(join(stagedExtensionDir, 'webview'));
  const installDirName = `${readPackageJson().publisher}.${readPackageJson().name}-${readPackageJson().version}`;
  const installDir = join(stagingRoot, installDirName);
  cpSync(stagedExtensionDir, installDir, { recursive: true });
  return installDir;
};

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const buildContentTypesXml = (extensionFiles) => {
  const extensions = new Set(
    extensionFiles
      .map((file) => /\.([^.\\/]+)$/.exec(file))
      .filter(Boolean)
      .map((match) => match[1].toLowerCase())
  );
  extensions.add('vsixmanifest');
  const defaults = [...extensions]
    .sort()
    .map(
      (extension) =>
        `  <Default Extension=".${extension}" ContentType="${CONTENT_TYPES[extension] || 'application/octet-stream'}" />`
    );
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    ...defaults,
    '</Types>',
  ].join('\n');
};

const buildVsixManifest = (manifest) =>
  [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011" xmlns:d="http://schemas.microsoft.com/developer/vsx-schema-design/2011">',
    '  <Metadata>',
    `    <Identity Language="en-US" Id="${escapeXml(manifest.name)}" Version="${escapeXml(manifest.version)}" Publisher="${escapeXml(manifest.publisher)}" />`,
    `    <DisplayName>${escapeXml(manifest.displayName)}</DisplayName>`,
    `    <Description xml:space="preserve">${escapeXml(manifest.description)}</Description>`,
    '    <Tags>mindforai,mindmap,whiteboard</Tags>',
    '    <Categories>Other</Categories>',
    '    <GalleryFlags>Public</GalleryFlags>',
    '    <Properties>',
    `      <Property Id="Microsoft.VisualStudio.Code.Engine" Value="${escapeXml(manifest.engines.vscode)}" />`,
    '      <Property Id="Microsoft.VisualStudio.Code.ExtensionDependencies" Value="" />',
    '      <Property Id="Microsoft.VisualStudio.Code.ExtensionPack" Value="" />',
    '      <Property Id="Microsoft.VisualStudio.Code.ExtensionKind" Value="workspace" />',
    '      <Property Id="Microsoft.VisualStudio.Code.LocalizedLanguages" Value="" />',
    '    </Properties>',
    '  </Metadata>',
    '  <Installation>',
    '    <InstallationTarget Id="Microsoft.VisualStudio.Code" />',
    '  </Installation>',
    '  <Dependencies />',
    '  <Assets>',
    '    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true" />',
    '  </Assets>',
    '</PackageManifest>',
  ].join('\n');

const createVsix = () => {
  const manifest = readPackageJson();
  const extensionFiles = collectFiles(stagedExtensionDir);
  const archiveEntries = {};
  for (const file of extensionFiles) {
    archiveEntries[`extension/${file}`] = new Uint8Array(
      readFileSync(join(stagedExtensionDir, file))
    );
  }
  archiveEntries['extension.vsixmanifest'] = strToU8(buildVsixManifest(manifest));
  archiveEntries['[Content_Types].xml'] = strToU8(buildContentTypesXml(extensionFiles));
  const outputPath = join(repoRoot, 'dist', `mindforai-${manifest.version}.vsix`);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, zipSync(archiveEntries, { level: 6 }));
  return outputPath;
};

const main = () => {
  console.log('[vscode-extension] 构建 Webview…');
  runWebviewBuild();
  console.log('[vscode-extension] 写入扩展目录内的 webview…');
  copyWebviewInto(join(sourceDir, 'webview'));
  console.log('[vscode-extension] 组装扩展目录…');
  const installDir = stageExtension();
  console.log('[vscode-extension] 生成 .vsix 安装包…');
  const outputPath = createVsix();
  console.log(`[vscode-extension] 安装目录：${installDir}`);
  console.log(`[vscode-extension] 安装包：${outputPath}`);
};

main();
