// DESK-03 桌面版 electron-builder 打包配置：产物输出到 dist/desktop，覆盖 Windows 全部可用目标
const path = require('node:path');

const repositoryRoot = path.join(__dirname, '..', '..');
const packageJson = require('./package.json');
const electronVersion = require('electron/package.json').version;

const iconPath = path.join(__dirname, 'build', 'icon.png');

const fileAssociations = [
  {
    ext: 'toon',
    name: 'MindForAI 文档',
    description: 'MindForAI 白板文档',
    role: 'Editor',
    icon: iconPath,
  },
  {
    ext: 'json',
    name: 'MindForAI 精简文档',
    description: 'MindForAI 精简 JSON 文档',
    role: 'Editor',
    icon: iconPath,
  },
  {
    ext: 'mindforai',
    name: 'MindForAI 旧版文档',
    description: 'MindForAI 旧版白板文档',
    role: 'Editor',
    icon: iconPath,
  },
  {
    ext: 'drawnixlite',
    name: 'DrawnixLite 旧版文档',
    description: 'DrawnixLite 旧版精简文档',
    role: 'Editor',
    icon: iconPath,
  },
  {
    ext: 'md',
    name: 'Markdown 文档',
    description: 'Markdown 大纲文档',
    role: 'Editor',
    icon: iconPath,
  },
];

module.exports = {
  appId: 'com.mindforai.desktop',
  productName: 'MindForAI',
  electronVersion,
  copyright: `Copyright © ${new Date().getFullYear()} MindForAI`,
  directories: {
    app: __dirname,
    output: path.join(repositoryRoot, 'dist', 'desktop'),
  },
  npmRebuild: false,
  buildDependenciesFromSource: false,
  files: [
    'main.js',
    'preload.js',
    'package.json',
    'renderer/**/*',
    'build/**/*',
    '!node_modules/**/*',
  ],
  extraMetadata: {
    version: packageJson.version,
    main: 'main.js',
  },
  artifactName: 'MindForAI-${version}-${arch}.${ext}',
  win: {
    target: [
      { target: 'nsis', arch: ['x64'] },
      { target: 'portable', arch: ['x64'] },
    ],
    icon: iconPath,
    requestedExecutionLevel: 'asInvoker',
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowElevation: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'MindForAI',
    installerLanguages: ['zh_CN'],
    language: '2052',
    runAfterFinish: true,
    deleteAppDataOnUninstall: false,
  },
  portable: {
    artifactName: 'MindForAI-${version}-${arch}-portable.${ext}',
  },
  appx: {
    identityName: 'com.mindforai.desktop',
    applicationId: 'MindForAI',
    displayName: 'MindForAI',
    publisherDisplayName: 'MindForAI',
    publisher: 'CN=MindForAI',
    backgroundColor: '#1f2126',
    showNameOnTiles: true,
    addAutoLaunchExtension: false,
  },
  msi: {
    oneClick: false,
    perMachine: false,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'MindForAI',
    upgradeCode: '7C1E5A2B-3F4D-4E8A-9B6C-1D2E3F4A5B6C',
  },
  msiWrapped: {
    oneClick: true,
    perMachine: false,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'MindForAI',
  },
  fileAssociations,
};
