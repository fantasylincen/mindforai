<#
MindForAI 桌面版 Windows 一键脚本

  .\mindforai.ps1 install    安装依赖、下载 Electron、构建渲染资源
  .\mindforai.ps1 run        启动桌面版
  .\mindforai.ps1 package    打包 Windows 免安装版与安装包
  .\mindforai.ps1 build      只构建渲染资源
  .\mindforai.ps1 clean      清理 node_modules（修复 EPERM / EISDIR）
  .\mindforai.ps1 doctor     检查环境与依赖健康状况

  可选参数：
    -ChinaMirror   使用国内镜像安装依赖
    -Force         安装前强制清理 node_modules
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('install', 'run', 'package', 'build', 'clean', 'doctor', 'menu', 'pack')]
    [string]$Action = 'menu',

    [string[]]$Format = @(),

    [switch]$ChinaMirror,

    [switch]$Force
)

$ErrorActionPreference = 'Stop'

try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    [Console]::InputEncoding = [System.Text.Encoding]::UTF8
}
catch {
    # 部分受控终端不允许修改编码，忽略即可
}

$Root = $PSScriptRoot
$MinimumNodeMajor = 22
$MinimumNodeMinor = 12
$RequiredFiles = @('package.json', 'package-lock.json', 'nx.json', 'tsconfig.base.json')

$script:NodeSource = ''
$script:NodeExePath = ''
$script:NpmPath = ''

function Write-Section {
    param([string]$Text)
    Write-Host ''
    Write-Host "=== $Text" -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Text)
    Write-Host "  [OK] $Text" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Text)
    Write-Host "  [!]  $Text" -ForegroundColor Yellow
}

function Write-ErrorLine {
    param([string]$Text)
    Write-Host "  [X]  $Text" -ForegroundColor Red
}

. "$PSScriptRoot\scripts\node-runtime.ps1"
. "$PSScriptRoot\scripts\package-formats.ps1"

function Test-Node {
    [void](Resolve-NodeEnvironment)
    $version = Get-NodeVersion
    if ($null -eq $version) {
        Write-ErrorLine '未检测到 Node.js'
        Write-Host '      已尝试：PATH、fnm（%APPDATA%\fnm）、nvm-windows、volta、官方安装目录，均未找到 node.exe。' -ForegroundColor Gray
        Write-Host '      若你用 fnm 安装过，请确认执行过： fnm install --use 26' -ForegroundColor Gray
        Write-Host '      否则请安装 Node.js 22.12 或更高版本：https://nodejs.org/en/download' -ForegroundColor Gray
        Write-Host '      下载 Windows Installer (.msi) x64，安装时勾选 Add to PATH，装完新开终端窗口。' -ForegroundColor Gray
        Show-NodeManagerHint
        return $false
    }
    $isEnough = ($version.Major -gt $MinimumNodeMajor) -or (($version.Major -eq $MinimumNodeMajor) -and ($version.Minor -ge $MinimumNodeMinor))
    if (-not $isEnough) {
        Write-ErrorLine ("Node.js 版本过低：{0}，需要 22.12 及以上" -f $version.Text)
        Write-Host '      下载地址：https://nodejs.org/en/download' -ForegroundColor Gray
        return $false
    }
    Write-Ok ("Node.js {0}（要求 22.12+）" -f $version.Text)
    return $true
}

function Test-Npm {
    $npmPath = Get-NpmPath
    $npmVersion = $null
    try {
        $npmVersion = (& $npmPath -v 2>$null)
    }
    catch {
        $npmVersion = $null
    }
    if (-not $npmVersion) {
        Write-ErrorLine '未检测到 npm'
        Write-Host '      fnm / nvm 安装的 Node 自带 npm，若缺失请检查安装是否完整。' -ForegroundColor Gray
        return $false
    }
    Write-Ok ("npm {0}" -f $npmVersion.ToString().Trim())
    Write-Host ("        npm 路径：{0}" -f $npmPath) -ForegroundColor DarkGray
    return $true
}

function Test-Project {
    $missing = @()
    foreach ($file in $RequiredFiles) {
        if (-not (Test-Path (Join-Path $Root $file))) { $missing += $file }
    }
    if ($missing.Count -gt 0) {
        Write-ErrorLine ("目录缺少文件：{0}" -f ($missing -join ', '))
        Write-Host '      请在解压后的项目根目录运行本脚本。' -ForegroundColor Gray
        return $false
    }
    Write-Ok ("项目目录 {0}" -f $Root)
    return $true
}

function Test-LocationRisk {
    $lower = $Root.ToLowerInvariant()
    $riskyWords = @('onedrive', 'dropbox', 'googledrive', 'google drive', 'nutstore', 'baidunetdisk', '坚果云')
    $hits = @()
    foreach ($word in $riskyWords) {
        if ($lower.Contains($word)) { $hits += $word }
    }
    if ($Root.StartsWith('\\')) { $hits += 'UNC 网络路径' }
    if ($Root.Length -gt 60) { $hits += ("路径较长 {0} 字符" -f $Root.Length) }
    if ($hits.Count -gt 0) {
        Write-Warn ("当前路径存在风险：{0}" -f ($hits -join '，'))
        Write-Warn '同步盘、网络盘与超长路径都会导致 npm 报 EPERM / EISDIR。'
        Write-Warn '建议把项目放到 D:\dev\mindforai 这类本地短路径目录。'
        return $false
    }
    Write-Ok '路径检查通过'
    return $true
}

function Get-BrokenBinEntries {
    $binDir = Join-Path $Root 'node_modules\.bin'
    $broken = @()
    if (-not (Test-Path $binDir)) { return ,@() }
    foreach ($item in (Get-ChildItem -LiteralPath $binDir -Force -ErrorAction SilentlyContinue)) {
        if ($item.PSIsContainer) { $broken += $item.Name }
    }
    return ,$broken
}

function Invoke-CleanDeps {
    [void](Resolve-NodeEnvironment)
    Write-Section '清理 node_modules'
    $target = Join-Path $Root 'node_modules'
    if (-not (Test-Path $target)) {
        Write-Ok 'node_modules 不存在，无需清理'
        return $true
    }
    $broken = Get-BrokenBinEntries
    if ($broken.Count -gt 0) {
        Write-Warn ("发现 {0} 个畸形 .bin 条目（跨系统共用 node_modules 的典型症状）" -f $broken.Count)
    }
    $script = Join-Path $Root 'scripts\clean-node-modules.mjs'
    if (Test-Path $script) {
        if (-not (Invoke-NodeScript -ScriptPath $script)) {
            Write-ErrorLine '自动清理失败，请关闭编辑器与终端后重试'
            return $false
        }
        return $true
    }
    Remove-Item -LiteralPath $target -Recurse -Force
    Write-Ok '已删除 node_modules'
    return $true
}

function Test-ElectronBinary {
    return (Test-Path (Join-Path $Root 'node_modules\electron\dist\electron.exe'))
}

function Install-ElectronBinary {
    if (Test-ElectronBinary) {
        Write-Ok 'Electron 运行库已就绪'
        return $true
    }
    Write-Section '下载 Electron 运行库（约 280MB）'
    $installScript = Join-Path $Root 'node_modules\electron\install.js'
    if (-not (Test-Path $installScript)) {
        Write-ErrorLine '未找到 node_modules\electron\install.js，依赖未安装成功'
        return $false
    }
    if (-not (Invoke-NodeScript -ScriptPath $installScript)) {
        Write-ErrorLine 'Electron 下载失败，请检查网络或使用 -ChinaMirror 参数'
        return $false
    }
    if (-not (Test-ElectronBinary)) {
        Write-ErrorLine 'Electron 运行库仍缺失'
        return $false
    }
    Write-Ok 'Electron 运行库已就绪'
    return $true
}

function Set-CnMirror {
    if (-not $ChinaMirror) { return }
    $env:npm_config_registry = 'https://registry.npmmirror.com'
    $env:ELECTRON_MIRROR = 'https://npmmirror.com/mirrors/electron/'
    Write-Ok '已启用国内镜像'
}

function Invoke-InstallDeps {
    $needClean = $Force.IsPresent
    if (-not $needClean) {
        $broken = Get-BrokenBinEntries
        if ($broken.Count -gt 0) {
            Write-Warn '检测到畸形的 .bin 目录，先执行清理'
            $needClean = $true
        }
    }
    if ($needClean) {
        if (-not (Invoke-CleanDeps)) { return $false }
    }

    Write-Section '安装依赖（npm ci）'
    Write-Host '     若报 EPERM，请先关闭 VS Code / TRAE / 终端与正在运行的 node 进程。' -ForegroundColor Gray
    & (Get-NpmPath) ci | Out-Host
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorLine 'npm ci 失败'
        Write-Host '      建议依次尝试：' -ForegroundColor Gray
        Write-Host '        1) 关闭编辑器与终端后重新运行本命令' -ForegroundColor Gray
        Write-Host '        2) .\mindforai.ps1 clean  然后  .\mindforai.ps1 install' -ForegroundColor Gray
        Write-Host '        3) 把项目移出 OneDrive / 网络盘 / 超长路径' -ForegroundColor Gray
        return $false
    }
    Write-Ok '依赖安装完成'
    return $true
}

function Invoke-BuildRenderer {
    [void](Resolve-NodeEnvironment)
    Write-Section '构建桌面版渲染资源'
    & (Get-NpmPath) run build:desktop | Out-Host
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorLine '构建失败'
        return $false
    }
    Write-Ok '构建完成：apps\desktop\renderer'
    return $true
}

function Get-RunningProcesses {
    $names = @('node', 'electron', 'MindForAI')
    $found = @()
    foreach ($name in $names) {
        $items = Get-Process -Name $name -ErrorAction SilentlyContinue
        if ($null -ne $items) {
            foreach ($item in $items) { $found += $item }
        }
    }
    return ,$found
}

function Invoke-Doctor {
    Write-Section '环境检查'
    [void](Test-Node)
    $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if ($null -ne $nodeCommand) {
        Write-Host ("        node 路径：{0}" -f $nodeCommand.Source) -ForegroundColor DarkGray
    }
    if ($script:NodeSource) {
        Write-Host ("        Node 来源：{0}" -f $script:NodeSource) -ForegroundColor DarkGray
    }
    [void](Test-Npm)
    [void](Test-Project)
    [void](Test-LocationRisk)

    Write-Section '依赖状态'
    $nodeModules = Join-Path $Root 'node_modules'
    if (Test-Path $nodeModules) {
        Write-Ok 'node_modules 存在'
        $broken = Get-BrokenBinEntries
        if ($broken.Count -gt 0) {
            Write-Warn ("发现 {0} 个畸形 .bin 条目：" -f $broken.Count)
            foreach ($name in $broken) {
                Write-Host ("        node_modules\.bin\{0}" -f $name) -ForegroundColor DarkYellow
            }
            Write-Warn '这是跨系统共用 node_modules 的典型症状，请执行 clean 后重新 install。'
        }
        else {
            Write-Ok '.bin 结构正常'
        }
        if (Test-ElectronBinary) { Write-Ok 'Electron 运行库已就绪' }
        else { Write-Warn 'Electron 运行库缺失，执行 install 会自动下载' }
    }
    else {
        Write-Warn 'node_modules 不存在，请执行 .\mindforai.ps1 install'
    }

    $fnmRoots = Get-FnmRootDirectories
    $hasFnmInstall = $false
    foreach ($root in $fnmRoots) {
        if (Test-Path (Join-Path $root 'node-versions')) { $hasFnmInstall = $true }
    }
    if ($hasFnmInstall) {
        Write-Section 'Node 版本管理器'
        Write-Ok '检测到 fnm 安装目录'
        Show-NodeManagerHint
    }

    Write-Section '运行中的进程'
    $processes = Get-RunningProcesses
    if ($processes.Count -gt 0) {
        Write-Warn ("检测到 {0} 个可能占用依赖目录的进程" -f $processes.Count)
        foreach ($process in $processes) {
            Write-Host ("        {0} (PID {1})" -f $process.ProcessName, $process.Id) -ForegroundColor DarkYellow
        }
    }
    else {
        Write-Ok '未发现占用进程'
    }
    return 0
}

function Invoke-Install {
    Write-Section '步骤 1/3 环境检查'
    if (-not (Test-Node)) { return 1 }
    if (-not (Test-Npm)) { return 1 }
    if (-not (Test-Project)) { return 1 }
    [void](Test-LocationRisk)
    Set-CnMirror

    Write-Section '步骤 2/3 依赖与运行库'
    if (-not (Invoke-InstallDeps)) { return 1 }
    if (-not (Install-ElectronBinary)) { return 1 }

    Write-Section '步骤 3/3 构建'
    if (-not (Invoke-BuildRenderer)) { return 1 }

    Write-Host ''
    Write-Host '安装完成，执行 .\mindforai.ps1 run 启动桌面版。' -ForegroundColor Green
    return 0
}

function Invoke-Run {
    if (-not (Test-Node)) { return 1 }
    if (-not (Test-Npm)) { return 1 }
    if (-not (Test-Project)) { return 1 }
    if (-not (Test-Path (Join-Path $Root 'node_modules'))) {
        Write-ErrorLine '尚未安装依赖，请先执行 .\mindforai.ps1 install'
        return 1
    }
    if (-not (Install-ElectronBinary)) { return 1 }
    if (-not (Test-Path (Join-Path $Root 'apps\desktop\renderer\index.html'))) {
        Write-Warn '渲染资源未构建，先构建一次'
        if (-not (Invoke-BuildRenderer)) { return 1 }
    }
    Write-Section '启动 MindForAI 桌面版'
    Write-Host '     关闭窗口即退出；修改前端代码后需重新执行本命令。' -ForegroundColor Gray
    & (Get-NpmPath) run desktop:dev | Out-Host
    return $LASTEXITCODE
}

function Assert-ReadyForBuild {
    if (-not (Test-Node)) { return $false }
    if (-not (Test-Npm)) { return $false }
    if (-not (Test-Project)) { return $false }
    if (-not (Test-Path (Join-Path $Root 'node_modules'))) {
        Write-ErrorLine '尚未安装依赖，请先执行： .\mindforai.ps1 install'
        return $false
    }
    return $true
}

function Invoke-Package {
    param([string[]]$FormatIds = @())
    if (-not (Assert-ReadyForBuild)) { return 1 }

    Write-Section '打包 Windows 桌面版'
    Write-Host '     产物输出到 dist\desktop' -ForegroundColor Gray

    if ($null -eq $FormatIds -or $FormatIds.Count -eq 0) {
        Write-Host '     未指定格式，使用默认组合：nsis + portable' -ForegroundColor Gray
        & (Get-NpmPath) run package:desktop | Out-Host
    }
    else {
        $targetArgument = $FormatIds -join ','
        & (Get-NpmPath) run package:desktop -- $targetArgument | Out-Host
    }

    if ($LASTEXITCODE -ne 0) {
        Write-ErrorLine '打包失败，请查看上方日志'
        return 1
    }

    Write-Ok '产物目录：dist\desktop'
    $artifactDir = Join-Path $Root 'dist\desktop'
    Get-ChildItem -LiteralPath $artifactDir -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Extension -match '^\.(exe|msi|appx|appxbundle|zip|7z)$' } |
        ForEach-Object { Write-Host ("       {0}  {1:N2} MB" -f $_.Name, ($_.Length / 1MB)) -ForegroundColor Gray }
    return 0
}

function Read-MenuChoice {
    Write-Host ''
    Write-Host '========================================' -ForegroundColor DarkCyan
    Write-Host '  MindForAI 桌面版' -ForegroundColor Cyan
    Write-Host ("  目录：{0}" -f $Root) -ForegroundColor Gray
    Write-Host '========================================' -ForegroundColor DarkCyan
    Write-Host ''
    Write-Host '  1. 安装依赖并构建（首次使用）'
    Write-Host '  2. 启动桌面版'
    Write-Host '  3. 打包（默认：NSIS 安装包 + 便携版）'
    Write-Host '  4. 打包（自选格式：appxbundle / appx / nsis / msi / zip ...）'
    Write-Host '  5. 清理 node_modules'
    Write-Host '  6. 环境自检'
    Write-Host '  7. 只构建渲染资源'
    Write-Host '  0. 退出'
    Write-Host ''
    $choice = Read-Host '请输入序号后回车'
    switch ($choice.Trim()) {
        '1' { return 'install' }
        '2' { return 'run' }
        '3' { return 'package' }
        '4' { return 'pack' }
        '5' { return 'clean' }
        '6' { return 'doctor' }
        '7' { return 'build' }
        '0' { return 'exit' }
        default { return 'invalid' }
    }
}

function Show-NodeManagerHint {
    Write-Host ''
    Write-Host '  关于 fnm：fnm 只对「已执行过初始化」的终端生效。' -ForegroundColor Gray
    Write-Host '    cmd 或新开的窗口读取不到 fnm 注入的 PATH，所以 node -v 会失败。' -ForegroundColor Gray
    Write-Host '    本脚本会自动扫描 fnm 安装目录并直接使用，不影响本脚本运行。' -ForegroundColor Gray
    Write-Host '    若希望自己的 cmd 里也能用 node，二选一：' -ForegroundColor Gray
    Write-Host '      A. 改装官方 .msi 安装包（会写入系统 PATH，最省事）' -ForegroundColor Gray
    Write-Host '      B. 按 fnm 文档把以下内容加入 CMD 的 AutoRun：' -ForegroundColor Gray
    Write-Host '         FOR /f "tokens=*" %%z IN (''fnm env --use-on-cd'') DO CALL %%z' -ForegroundColor DarkGray
}

function Show-Usage {
    Write-Host ''
    Write-Host 'MindForAI 桌面版' -ForegroundColor Cyan
    Write-Host '  .\mindforai.ps1 install    安装依赖、下载 Electron、构建'
    Write-Host '  .\mindforai.ps1 run        启动桌面版'
    Write-Host '  .\mindforai.ps1 package                     打包 NSIS + 便携版'
    Write-Host '  .\mindforai.ps1 package -Format all         打包全部可用格式'
    Write-Host '  .\mindforai.ps1 package -Format appx,msi    指定格式'
    Write-Host '  .\mindforai.ps1 pack                        交互式选择打包格式'
    Write-Host '  .\mindforai.ps1 build      只构建渲染资源'
    Write-Host '  .\mindforai.ps1 clean      清理 node_modules'
    Write-Host '  .\mindforai.ps1 doctor     检查环境'
    Write-Host ''
}

[void](Resolve-NodeEnvironment)

if ($Action -eq 'menu') {
    while ($true) {
        $selected = Read-MenuChoice
        if ($selected -eq 'exit') {
            exit 0
        }
        if ($selected -eq 'invalid') {
            Write-Host ''
            Write-ErrorLine '无效的序号，请重新输入'
            continue
        }
        $Action = $selected
        break
    }
}

if ($Action -ne 'menu') {
    Write-Host ''
    Write-Host 'MindForAI 桌面版' -ForegroundColor Cyan
    Write-Host ("目录：{0}" -f $Root) -ForegroundColor Gray
}

$exitCode = 0
try {
    switch ($Action) {
        'install' { $exitCode = Invoke-Install }
        'run' { $exitCode = Invoke-Run }
        'package' {
            if ($Format.Count -gt 0) {
                if (Invoke-PackageWithFormats -FormatIds $Format) { $exitCode = 0 } else { $exitCode = 1 }
            }
            else {
                $exitCode = Invoke-Package
            }
        }
        'pack' {
            if (Invoke-PackInteractive) { $exitCode = 0 } else { $exitCode = 1 }
        }
        'build' { if (Invoke-BuildRenderer) { $exitCode = 0 } else { $exitCode = 1 } }
        'clean' { if (Invoke-CleanDeps) { $exitCode = 0 } else { $exitCode = 1 } }
        'doctor' { $exitCode = Invoke-Doctor }
        default { Show-Usage }
    }
}
catch {
    Write-Host ''
    Write-ErrorLine $_.Exception.Message
    $exitCode = 1
}

Write-Host ''
if ($exitCode -eq 0) {
    Write-Host '完成' -ForegroundColor Green
}
else {
    Write-Host '执行未完成，请按上面的提示处理后重试' -ForegroundColor Red
}
exit $exitCode
