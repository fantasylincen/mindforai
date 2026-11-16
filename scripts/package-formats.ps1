<#
MindForAI Windows 打包格式模块（SCR-18）

打包格式清单由 scripts/package-formats.js 统一维护，这里只负责交互与分发，
避免 PowerShell 与 node 两侧的格式列表不一致。
由 mindforai.ps1 点源加载，依赖其 Write-Section / Write-Ok / Write-Warn / Write-ErrorLine 与 $Root。
#>

$script:PackageFormats = @()

function Import-PackageFormats {
    if ($script:PackageFormats.Count -gt 0) { return $true }
    $nodeExecutable = Get-NodeExecutablePath
    if (-not $nodeExecutable) {
        Write-ErrorLine '打包格式清单需要 node，但未找到 node.exe'
        return $false
    }
    $listScript = Join-Path $Root 'scripts\package-formats.js'
    if (-not (Test-Path $listScript)) {
        Write-ErrorLine ("缺少文件：{0}" -f $listScript)
        return $false
    }
    try {
        $json = & $nodeExecutable $listScript --json 2>$null
    }
    catch {
        Write-ErrorLine '读取打包格式清单失败'
        return $false
    }
    if (-not $json) {
        Write-ErrorLine '打包格式清单为空'
        return $false
    }
    $script:PackageFormats = @($json.ToString() | ConvertFrom-Json)
    return ($script:PackageFormats.Count -gt 0)
}

function Test-IsWindowsHost {
    return ($env:OS -eq 'Windows_NT')
}

function Show-PackageFormatTable {
    Write-Host ''
    Write-Host '  可用的 Windows 打包格式：' -ForegroundColor Cyan
    Write-Host ''
    $index = 0
    foreach ($format in $script:PackageFormats) {
        $index = $index + 1
        $extension = ''
        if ($format.ext) { $extension = '.' + $format.ext }
        $tag = ''
        if ($format.windowsOnly -and -not (Test-IsWindowsHost)) {
            $tag = '  [当前系统不支持]'
        }
        Write-Host ("   {0}. {1}{2}{3}" -f $index, $format.label, $extension, $tag)
        Write-Host ("      {0}" -f $format.note) -ForegroundColor DarkGray
    }
    Write-Host ''
}

function Resolve-PackageFormatSelection {
    param([string]$RawInput)
    $text = $RawInput.Trim()
    if ($text -eq '') { return @() }
    if ($text -eq 'a' -or $text -eq 'A') {
        $nodeExecutable = Get-NodeExecutablePath
        $listScript = Join-Path $Root 'scripts\package-formats.js'
        $recommended = & $nodeExecutable $listScript --recommended 2>$null
        if ($recommended) { return @($recommended.ToString().Trim() -split ',') }
        return @()
    }
    if ($text -eq 'all' -or $text -eq 'ALL') {
        $nodeExecutable = Get-NodeExecutablePath
        $listScript = Join-Path $Root 'scripts\package-formats.js'
        $allIds = & $nodeExecutable $listScript --ids 2>$null
        if ($allIds) { return @($allIds.ToString().Trim() -split ',') }
        return @()
    }

    $selected = @()
    foreach ($piece in ($text -split '[,，\s]+')) {
        if ($piece -eq '') { continue }
        $number = 0
        if (-not [int]::TryParse($piece, [ref]$number)) {
            Write-Warn ("无法识别：{0}" -f $piece)
            continue
        }
        if ($number -lt 1 -or $number -gt $script:PackageFormats.Count) {
            Write-Warn ("序号超出范围：{0}" -f $piece)
            continue
        }
        $format = $script:PackageFormats[$number - 1]
        if ($selected -notcontains $format.id) { $selected += $format.id }
    }
    return $selected
}

function Filter-SupportedPackageFormats {
    param([string[]]$FormatIds)
    $isWindows = Test-IsWindowsHost
    $effective = @()
    foreach ($formatId in $FormatIds) {
        $matched = $null
        foreach ($format in $script:PackageFormats) {
            if ($format.id -eq $formatId) { $matched = $format; break }
        }
        if ($null -eq $matched) {
            Write-Warn ("未知格式已忽略：{0}" -f $formatId)
            continue
        }
        if ($matched.windowsOnly -and -not $isWindows) {
            Write-Warn ("{0} 只能在 Windows 10+ 上生成，已跳过" -f $matched.label)
            continue
        }
        if ($effective -notcontains $formatId) { $effective += $formatId }
    }
    return $effective
}

function Show-PackageArtifacts {
    $artifactDir = Join-Path $Root 'dist\desktop'
    if (-not (Test-Path $artifactDir)) { return }
    $files = Get-ChildItem -LiteralPath $artifactDir -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Extension -match '^\.(exe|msi|appx|appxbundle|zip|7z)$' } |
        Sort-Object Name
    if (-not $files) { return }
    Write-Host ''
    Write-Host '  产物清单：' -ForegroundColor Cyan
    foreach ($file in $files) {
        Write-Host ("    {0}  {1:N2} MB" -f $file.Name, ($file.Length / 1MB)) -ForegroundColor Gray
    }
}

function Invoke-PackageWithFormats {
    param([string[]]$FormatIds)
    if (-not (Import-PackageFormats)) { return $false }
    if ($null -eq $FormatIds -or $FormatIds.Count -eq 0) {
        Write-Warn '未选择任何打包格式'
        return $false
    }

    $effective = Filter-SupportedPackageFormats -FormatIds $FormatIds
    if ($effective.Count -eq 0) {
        Write-ErrorLine '没有可在当前系统上生成的格式'
        return $false
    }

    Write-Section ("开始打包：{0}" -f ($effective -join ', '))
    $targetArgument = $effective -join ','
    & (Get-NpmPath) run package:desktop -- $targetArgument | Out-Host
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorLine '打包失败，请查看上方日志'
        Write-Host '      提示：Linux / macOS 生成 nsis / msi 需要 wine；' -ForegroundColor Gray
        Write-Host '            appx / appxbundle 只能在 Windows 10 及以上生成。' -ForegroundColor Gray
        return $false
    }
    Write-Ok '打包完成'
    Show-PackageArtifacts
    return $true
}

function Invoke-PackInteractive {
    if (-not (Import-PackageFormats)) { return $false }
    Show-PackageFormatTable
    Write-Host '  输入序号（多选用逗号分隔），或输入 a 使用推荐组合、all 打包全部' -ForegroundColor Gray
    Write-Host '  输入 0 返回主菜单' -ForegroundColor Gray
    Write-Host ''
    $rawInput = Read-Host '请选择打包格式'
    if ($rawInput.Trim() -eq '0' -or $rawInput.Trim() -eq '') {
        return $true
    }
    $formatIds = Resolve-PackageFormatSelection -RawInput $rawInput
    return (Invoke-PackageWithFormats -FormatIds $formatIds)
}
