// SCR-18 Windows 打包格式清单：node 打包脚本与 PowerShell 菜单共用的唯一数据源
const PACKAGE_FORMATS = [
  {
    id: 'nsis',
    label: 'NSIS 安装包',
    ext: 'exe',
    note: '可选安装目录，写入文件关联，推荐分发',
    needsWineOnPosix: true,
    windowsOnly: false,
  },
  {
    id: 'portable',
    label: '便携版',
    ext: 'exe',
    note: '单文件免安装，不写注册表',
    needsWineOnPosix: false,
    windowsOnly: false,
  },
  {
    id: 'msi',
    label: 'MSI 安装包',
    ext: 'msi',
    note: '适合企业域环境批量部署',
    needsWineOnPosix: true,
    windowsOnly: false,
  },
  {
    id: 'msiwrapped',
    label: 'MSI 包裹版',
    ext: 'msi',
    note: 'MSI 内嵌 NSIS，兼容性更好',
    needsWineOnPosix: true,
    windowsOnly: false,
  },
  {
    id: 'appx',
    label: 'AppX 应用包',
    ext: 'appx',
    note: 'Microsoft Store 格式，需 Windows 10+，未签名需开发者模式',
    needsWineOnPosix: false,
    windowsOnly: true,
  },
  {
    id: 'appxbundle',
    label: 'AppXBundle 集合包',
    ext: 'appxbundle',
    note: '由已生成的 .appx 组合而成，需 makeappx（Windows SDK）',
    needsWineOnPosix: false,
    windowsOnly: true,
  },
  {
    id: 'zip',
    label: 'ZIP 压缩包',
    ext: 'zip',
    note: '解压即用，适合绿色分发',
    needsWineOnPosix: false,
    windowsOnly: false,
  },
  {
    id: '7z',
    label: '7z 压缩包',
    ext: '7z',
    note: '体积更小',
    needsWineOnPosix: false,
    windowsOnly: false,
  },
  {
    id: 'dir',
    label: '免安装目录',
    ext: '',
    note: '仅解包不压缩，便于检查产物',
    needsWineOnPosix: false,
    windowsOnly: false,
  },
];

const RECOMMENDED_FORMAT_IDS = ['nsis', 'portable', 'msi', 'appx', 'appxbundle', 'zip'];

const PACKAGE_FORMAT_IDS = PACKAGE_FORMATS.map((format) => format.id);

const isKnownFormat = (formatId) => PACKAGE_FORMAT_IDS.includes(formatId);

if (require.main === module) {
  const argument = process.argv[2];
  if (argument === '--json') {
    process.stdout.write(JSON.stringify(PACKAGE_FORMATS));
  } else if (argument === '--ids') {
    process.stdout.write(PACKAGE_FORMAT_IDS.join(','));
  } else if (argument === '--recommended') {
    process.stdout.write(RECOMMENDED_FORMAT_IDS.join(','));
  } else {
    process.stdout.write('用法：node scripts/package-formats.js [--json|--ids|--recommended]\n');
  }
}

module.exports = {
  PACKAGE_FORMATS,
  PACKAGE_FORMAT_IDS,
  RECOMMENDED_FORMAT_IDS,
  isKnownFormat,
};
