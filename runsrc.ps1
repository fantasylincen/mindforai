# MindForAI 本地源码开发服务器脚本（Windows）：安装依赖、后台启动 Vite 开发服务器，重复运行代表重启，就绪后打开浏览器
[CmdletBinding()]
param(
    [ValidateSet('start', 'stop')]
    [string]$Action = 'start',
    [int]$Port = 7200,
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ProjectName = 'MindForAI'
$ProjectDir = $PSScriptRoot
$LogFile = Join-Path $ProjectDir '.mindforai.log'
$PidFile = Join-Path $ProjectDir '.mindforai.pid'
$ServerPort = $Port
$AppUrl = ''

function Write-Info([string]$Message) { Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Ok([string]$Message) { Write-Host "[ OK ] $Message" -ForegroundColor Green }
function Write-Warn([string]$Message) { Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Stop-WithError([string]$Message) { Write-Host "[FAIL] $Message" -ForegroundColor Red; exit 1 }

function Test-CommandAvailable([string]$Name) {
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Assert-NodeToolchain {
    if (-not (Test-CommandAvailable 'node')) { Stop-WithError '未找到 node，请先安装 Node.js 20 或更高版本：https://nodejs.org/' }
    if (-not (Test-CommandAvailable 'npm')) { Stop-WithError '未找到 npm，请重新安装 Node.js（npm 随 Node.js 一起安装）。' }
    $major = 0
    $null = [int]::TryParse((node -p 'process.versions.node.split(".")[0]'), [ref]$major)
    if ($major -lt 20) {
        Write-Warn "当前 Node.js 版本为 $(node --version)，建议升级到 20 或更高版本。"
    }
}

function Test-CommandLineBelongsToProject([int]$ProcessId) {
    $process = Get-CimInstance Win32_Process -Filter "ProcessId=$ProcessId" -ErrorAction SilentlyContinue
    if (-not $process) { return $false }
    $commandLine = "$($process.CommandLine)"
    $knownMarkers = @('nx serve', 'vite', $ProjectDir)
    foreach ($marker in $knownMarkers) {
        if ($commandLine.IndexOf($marker, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) { return $true }
    }
    return $false
}

function Get-PortListenerProcessId([int]$PortNumber) {
    $connection = Get-NetTCPConnection -State Listen -LocalPort $PortNumber -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($connection) { return [int]$connection.OwningProcess }
    return 0
}

function Stop-ProcessTree([int]$ProcessId) {
    if ($ProcessId -le 0) { return }
    & taskkill.exe /PID $ProcessId /T /F *> $null
}

function Stop-InstanceFromPidFile {
    if (-not (Test-Path $PidFile)) { return $false }
    $rawPid = 0
    $content = (Get-Content $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1)
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    if (-not [int]::TryParse("$content".Trim(), [ref]$rawPid)) { return $false }
    $process = Get-Process -Id $rawPid -ErrorAction SilentlyContinue
    if (-not $process) { return $false }
    if (-not (Test-CommandLineBelongsToProject $rawPid)) { return $false }
    Write-Info "正在停止上一实例（pid: $rawPid）..."
    Stop-ProcessTree $rawPid
    return $true
}

function Stop-InstanceFromPort {
    $listenPort = Resolve-ConfiguredPort
    $listenerPid = Get-PortListenerProcessId $listenPort
    if ($listenerPid -le 0) { return $false }
    if (-not (Test-CommandLineBelongsToProject $listenerPid)) { return $false }
    Write-Info "正在停止占用端口 $listenPort 的旧进程（pid: $listenerPid）..."
    Stop-ProcessTree $listenerPid
    return $true
}

function Stop-PreviousInstance {
    $stopped = Stop-InstanceFromPidFile
    if (Stop-InstanceFromPort) { $stopped = $true }
    if ($stopped) { Start-Sleep -Seconds 1 }
}

function Install-DependenciesWhenMissing {
    $nodeModules = Join-Path $ProjectDir 'node_modules'
    if (Test-Path $nodeModules) { return }
    Write-Info '正在安装依赖（首次运行需要几分钟，请耐心等待）...'
    Push-Location $ProjectDir
    try {
        & npm install --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { Stop-WithError '依赖安装失败，请检查上方日志。' }
    } finally {
        Pop-Location
    }
}

function Resolve-FreePort([int]$PreferredPort) {
    if (Get-PortListenerProcessId $PreferredPort -eq 0) { return $PreferredPort }
    $candidatePort = $PreferredPort + 1
    while ($candidatePort -lt ($PreferredPort + 40)) {
        if (Get-PortListenerProcessId $candidatePort -eq 0) {
            Write-Warn "端口 $PreferredPort 已被其它程序占用，改用端口 $candidatePort。"
            return $candidatePort
        }
        $candidatePort++
    }
    Stop-WithError '找不到可用端口，请使用 -Port 参数指定其它端口。'
}

function Start-DevServer([int]$ListenPort) {
    Set-Content -Path $LogFile -Value '' -Encoding UTF8
    $arguments = @('nx', 'serve', 'web', '--host=0.0.0.0', "--port=$ListenPort")
    $process = Start-Process -FilePath 'npx.cmd' -ArgumentList $arguments -WorkingDirectory $ProjectDir -RedirectStandardOutput $LogFile -RedirectStandardError "$LogFile.err" -WindowStyle Hidden -PassThru
    Set-Content -Path $PidFile -Value "$($process.Id)" -Encoding ASCII
    return $process
}

function Wait-DevServerReady([System.Diagnostics.Process]$Process, [int]$ListenPort) {
    for ($attempt = 1; $attempt -le 180; $attempt++) {
        if ($Process.HasExited) { return $false }
        $logContent = ''
        if (Test-Path $LogFile) { $logContent = Get-Content $LogFile -Raw -ErrorAction SilentlyContinue }
        if ("$logContent" -match "localhost:$ListenPort") { return $true }
        Start-Sleep -Seconds 1
    }
    return $false
}

function Open-DefaultBrowser([string]$Url) {
    if ($NoBrowser) { return }
    Write-Info "正在使用默认浏览器打开：$Url"
    Start-Process $Url
}

function Show-RecentLog {
    $candidates = @($LogFile, "$LogFile.err")
    foreach ($candidate in $candidates) {
        if (-not (Test-Path $candidate)) { continue }
        Write-Warn "最近一段日志（$candidate）："
        Get-Content $candidate -Tail 20 -ErrorAction SilentlyContinue | ForEach-Object { Write-Host $_ }
    }
}

function Invoke-StopAction {
    Stop-PreviousInstance
    Write-Ok 'MindForAI 开发服务器已停止。'
}

function Resolve-ConfiguredPort {
    $envPort = 0
    if ([int]::TryParse("$($env:PORT)", [ref]$envPort) -and $envPort -gt 0) {
        return $envPort
    }
    return $Port
}

function Invoke-StartAction {
    Assert-NodeToolchain
    Stop-PreviousInstance
    $script:ServerPort = Resolve-FreePort (Resolve-ConfiguredPort)
    Install-DependenciesWhenMissing
    Write-Info "正在后台启动 MindForAI 开发服务器（端口 $($script:ServerPort)）..."
    $process = Start-DevServer $script:ServerPort
    $script:AppUrl = "http://localhost:$($script:ServerPort)/"
    if (Wait-DevServerReady $process $script:ServerPort) {
        Write-Ok "启动完成：$($script:AppUrl)"
        Write-Host "       日志：$LogFile"
        Write-Host '       停止：runsrc.bat stop'
        Open-DefaultBrowser $script:AppUrl
    } else {
        Show-RecentLog
        Stop-WithError '启动失败，请检查上方日志。'
    }
}

Write-Host ''
Write-Host '========================================'
Write-Host "  $ProjectName 本地开发启动"
Write-Host '========================================'
Write-Host ''

if ($Action -eq 'stop') {
    Invoke-StopAction
} else {
    Invoke-StartAction
}
