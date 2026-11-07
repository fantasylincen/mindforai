# MindForAI 的 Docker 一键部署脚本（Windows）：检查环境、构建镜像、以 docker run --rm 启动容器、等待就绪后打开浏览器，停止容器时自动删除
[CmdletBinding()]
param(
    [ValidateSet('start', 'stop')]
    [string]$Action = 'start',
    [int]$Port = 0,
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ProjectName = 'MindForAI'
$ContainerName = 'mindforai'
$ImageName = 'mindforai:latest'
$ProjectDir = $PSScriptRoot
$HostPort = 0
$AppUrl = ''

function Write-Info([string]$Message) { Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Ok([string]$Message) { Write-Host "[ OK ] $Message" -ForegroundColor Green }
function Write-Warn([string]$Message) { Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Stop-WithError([string]$Message) { Write-Host "[FAIL] $Message" -ForegroundColor Red; exit 1 }

function Test-CommandAvailable([string]$CommandName) {
    return [bool](Get-Command $CommandName -ErrorAction SilentlyContinue)
}

function Assert-DockerReady {
    if (-not (Test-CommandAvailable 'docker')) {
        Stop-WithError '未检测到 Docker，请先安装 Docker Desktop：https://docs.docker.com/get-docker/'
    }
    docker info *> $null
    if ($LASTEXITCODE -ne 0) {
        Stop-WithError 'Docker 服务未运行，请先启动 Docker Desktop 后重试。'
    }
    $dockerVersion = (docker --version) -join ' '
    Write-Ok "Docker 环境就绪：$dockerVersion"
}

function Test-PortInUse([int]$PortNumber) {
    $listener = Get-NetTCPConnection -State Listen -LocalPort $PortNumber -ErrorAction SilentlyContinue
    return [bool]$listener
}

function Test-ContainerRunning {
    $containerState = docker inspect --format '{{.State.Status}}' $ContainerName 2>$null
    return ($LASTEXITCODE -eq 0 -and "$containerState".Trim() -eq 'running')
}

function Test-ContainerExists {
    docker inspect $ContainerName *> $null
    return ($LASTEXITCODE -eq 0)
}

function Assert-DockerfileExists {
    if (-not (Test-Path (Join-Path $ProjectDir 'Dockerfile'))) {
        Stop-WithError '未找到 Dockerfile，请把脚本放在项目根目录后重试。'
    }
}

function Resolve-ConfiguredPort {
    $envPort = 0
    if ($Port -gt 0) {
        $script:HostPort = $Port
    } elseif ([int]::TryParse("$($env:MINDFORAI_PORT)", [ref]$envPort) -and $envPort -gt 0) {
        $script:HostPort = $envPort
    } else {
        $script:HostPort = 8080
    }
}

function Resolve-HostPort {
    Resolve-ConfiguredPort
    if (-not (Test-PortInUse $script:HostPort) -or (Test-ContainerRunning)) {
        $script:AppUrl = "http://localhost:$($script:HostPort)/"
        return
    }
    $fallbackPort = $script:HostPort + 1
    if (Test-PortInUse $fallbackPort) {
        Stop-WithError "端口 $($script:HostPort) 已被其它程序占用，请释放该端口，或用 -Port 参数指定其它端口。"
    }
    Write-Warn "端口 $($script:HostPort) 已被其它程序占用，改用端口 $fallbackPort。"
    $script:HostPort = $fallbackPort
    $script:AppUrl = "http://localhost:$($script:HostPort)/"
}

function Test-ImageExistsLocally {
    docker image inspect $ImageName *> $null
    return ($LASTEXITCODE -eq 0)
}

function Build-Image {
    Write-Info '正在构建镜像（首次构建需要下载依赖，可能需要数分钟）...'
    $lastBuildExitCode = 1
    Push-Location $ProjectDir
    try {
        docker build -t $ImageName .
        $lastBuildExitCode = $LASTEXITCODE
        if ($lastBuildExitCode -ne 0) {
            Write-Warn '镜像构建失败，正在重试一次...'
            docker build -t $ImageName .
            $lastBuildExitCode = $LASTEXITCODE
        }
    } finally {
        Pop-Location
    }
    if ($lastBuildExitCode -eq 0) {
        Write-Ok "镜像构建完成：$ImageName"
        return
    }
    if (Test-ImageExistsLocally) {
        Write-Warn '无法连接 Docker Hub（常见报错：auth.docker.io EOF / 拉取元数据超时）。'
        Write-Warn "已改用本地已有的镜像 $ImageName 继续启动，代码可能不是最新。"
        Write-Warn '如需按最新代码重建，请检查网络、代理或 DNS 后重新运行本脚本。'
        return
    }
    Stop-WithError '镜像构建失败，且本地没有可用镜像。请检查网络、代理或 DNS 后重试（报错见上方日志）。'
}

function Remove-ContainerIfExists {
    if (-not (Test-ContainerExists)) { return }
    Write-Info "正在移除旧容器：$ContainerName"
    docker rm -f $ContainerName *> $null
    if ($LASTEXITCODE -ne 0) {
        Stop-WithError "旧容器移除失败，请先手动删除 $ContainerName。"
    }
}

function Start-Container {
    Write-Info "正在启动容器（宿主机端口 $($script:HostPort) 映射到容器 80，停止后自动删除）..."
    Remove-ContainerIfExists
    docker run --rm -d --name $ContainerName -p "$($script:HostPort):80" $ImageName > $null
    if ($LASTEXITCODE -ne 0) { Stop-WithError '容器启动失败，请检查上方日志。' }
    Write-Ok "容器已启动：$ContainerName"
}

function Test-ContainerExited {
    $containerState = docker inspect --format '{{.State.Status}}' $ContainerName 2>$null
    if ($LASTEXITCODE -ne 0) { return $true }
    $stateText = "$containerState".Trim()
    return ($stateText -eq 'exited' -or $stateText -eq 'dead')
}

function Test-ServiceResponding {
    try {
        $response = Invoke-WebRequest -Uri $script:AppUrl -UseBasicParsing -TimeoutSec 3
        return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400)
    } catch {
        return $false
    }
}

function Wait-ServiceReady {
    Write-Info '正在等待服务就绪...'
    for ($attempt = 1; $attempt -le 90; $attempt++) {
        if (Test-ContainerExited) {
            Stop-WithError '容器已退出或已被删除，请重新执行本脚本并检查启动日志。'
        }
        if (Test-ServiceResponding) {
            Write-Ok "服务已就绪：$($script:AppUrl)"
            return
        }
        Start-Sleep -Seconds 2
    }
    Write-Warn "等待超时，服务可能仍在启动，可稍后手动访问 $($script:AppUrl)。"
}

function Open-DefaultBrowser {
    if ($NoBrowser) {
        Write-Warn '已按 -NoBrowser 跳过自动打开浏览器。'
        return
    }
    Write-Info "正在使用默认浏览器打开：$($script:AppUrl)"
    Start-Process $script:AppUrl
}

function Remove-Container {
    if (-not (Test-ContainerExists)) {
        Write-Ok '容器不存在，已无需删除。'
        return
    }
    Write-Info '正在停止并删除容器...'
    docker rm -f $ContainerName *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "删除容器失败，请手动执行 docker rm -f $ContainerName。"
        return
    }
    Write-Ok '容器已停止并删除。'
}

function Show-UsageSummary {
    Write-Host ''
    Write-Ok "$ProjectName 部署完成，访问地址：$($script:AppUrl)"
    Write-Host "       查看日志：docker logs -f $ContainerName"
    Write-Host "       停止容器（Docker 会自动删除）：docker stop $ContainerName"
    Write-Host '       立即停止并删除容器：rundocker.bat stop'
    Write-Host ''
}

function Invoke-Deploy {
    Assert-DockerReady
    Assert-DockerfileExists
    Resolve-HostPort
    Build-Image
    Start-Container
    Wait-ServiceReady
    Open-DefaultBrowser
    Show-UsageSummary
}

function Invoke-Stop {
    Assert-DockerReady
    Assert-DockerfileExists
    Remove-Container
}

Write-Host ''
Write-Host '========================================'
Write-Host "  $ProjectName 一键部署（Docker）"
Write-Host '========================================'
Write-Host ''

if ($Action -eq 'stop') {
    Invoke-Stop
} else {
    Invoke-Deploy
}
