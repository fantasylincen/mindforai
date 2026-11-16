<#
MindForAI 桌面版 Node 运行时解析模块（SCR-17 附属）

fnm / nvm / volta 都只对「已初始化的终端」注入 PATH，cmd 和新开的窗口读不到，
因此这里不依赖 shell 初始化，而是主动扫描各版本管理器的安装目录。
由 mindforai.ps1 点源加载，需先定义 $MinimumNodeMajor / $MinimumNodeMinor。
#>

function ConvertTo-VersionParts {
    param([string]$VersionText)
    if (-not $VersionText) { return $null }
    $text = $VersionText.Trim()
    if ($text.StartsWith('v') -or $text.StartsWith('V')) { $text = $text.Substring(1) }
    $parts = $text.Split('.')
    if ($parts.Length -lt 2) { return $null }
    $major = 0
    $minor = 0
    $patch = 0
    if (-not [int]::TryParse($parts[0], [ref]$major)) { return $null }
    if (-not [int]::TryParse($parts[1], [ref]$minor)) { return $null }
    if ($parts.Length -ge 3) { [void][int]::TryParse($parts[2], [ref]$patch) }
    return [PSCustomObject]@{ Major = $major; Minor = $minor; Patch = $patch }
}

function Test-SupportedVersion {
    param($Parts)
    if ($null -eq $Parts) { return $false }
    if ($Parts.Major -gt $MinimumNodeMajor) { return $true }
    if ($Parts.Major -eq $MinimumNodeMajor -and $Parts.Minor -ge $MinimumNodeMinor) { return $true }
    return $false
}

function Get-FnmRootDirectories {
    $roots = @()
    $fnmCommand = Get-Command fnm -ErrorAction SilentlyContinue
    if ($null -ne $fnmCommand) {
        try {
            $jsonText = (& fnm env --json 2>$null)
            if ($jsonText) {
                $parsed = $jsonText.ToString() | ConvertFrom-Json
                if ($parsed.FNM_DIR) { $roots += [string]$parsed.FNM_DIR }
                if ($parsed.FNM_MULTISHELL_PATH) { $roots += [string]$parsed.FNM_MULTISHELL_PATH }
            }
        }
        catch {
            # fnm 输出格式异常时忽略，走下面的兜底目录
        }
    }
    if ($env:FNM_DIR) { $roots += $env:FNM_DIR }
    if ($env:FNM_MULTISHELL_PATH) { $roots += $env:FNM_MULTISHELL_PATH }
    if ($env:APPDATA) { $roots += (Join-Path $env:APPDATA 'fnm') }
    if ($env:LOCALAPPDATA) { $roots += (Join-Path $env:LOCALAPPDATA 'fnm') }
    if ($env:USERPROFILE) { $roots += (Join-Path $env:USERPROFILE '.fnm') }
    return @($roots | Where-Object { $_ } | Select-Object -Unique)
}

function New-NodeCandidate {
    param(
        [string]$Directory,
        [string]$Source,
        [string]$VersionText
    )
    if (-not $Directory) { return $null }
    $nodeExe = Join-Path $Directory 'node.exe'
    if (-not (Test-Path $nodeExe)) { return $null }

    $detectedVersion = $VersionText
    if (-not (ConvertTo-VersionParts $detectedVersion)) {
        try {
            $raw = & $nodeExe -v 2>$null
            if ($raw) { $detectedVersion = $raw.ToString() }
        }
        catch {
            return $null
        }
    }
    $parts = ConvertTo-VersionParts $detectedVersion
    if ($null -eq $parts) { return $null }

    return [PSCustomObject]@{
        Directory = $Directory
        Source    = $Source
        Parts     = $parts
    }
}

function Get-FnmMultishellStorageDirectories {
    $storages = @()
    if ($env:LOCALAPPDATA) { $storages += (Join-Path $env:LOCALAPPDATA 'fnm_multishells') }
    if ($env:APPDATA) { $storages += (Join-Path $env:APPDATA 'fnm_multishells') }
    if ($env:TEMP) { $storages += (Join-Path $env:TEMP 'fnm_multishells') }
    return @($storages | Select-Object -Unique)
}

function Get-NodeCandidatesFromFnm {
    $candidates = @()

    foreach ($root in (Get-FnmRootDirectories)) {
        $directCandidate = New-NodeCandidate -Directory $root -Source 'fnm 当前会话' -VersionText ''
        if ($null -ne $directCandidate) { $candidates += $directCandidate }

        $versionsDir = Join-Path $root 'node-versions'
        if (Test-Path $versionsDir) {
            $versionDirs = Get-ChildItem -LiteralPath $versionsDir -Directory -ErrorAction SilentlyContinue
            foreach ($versionDir in $versionDirs) {
                $candidate = New-NodeCandidate -Directory (Join-Path $versionDir.FullName 'installation') -Source ('fnm ' + $versionDir.Name) -VersionText $versionDir.Name
                if ($null -ne $candidate) { $candidates += $candidate }
            }
        }

        $aliasDir = Join-Path $root 'aliases\default'
        $aliasCandidate = New-NodeCandidate -Directory $aliasDir -Source 'fnm default' -VersionText ''
        if ($null -ne $aliasCandidate) { $candidates += $aliasCandidate }
    }

    foreach ($storage in (Get-FnmMultishellStorageDirectories)) {
        if (-not (Test-Path $storage)) { continue }
        $shellDirs = Get-ChildItem -LiteralPath $storage -Directory -ErrorAction SilentlyContinue
        foreach ($shellDir in $shellDirs) {
            $shellCandidate = New-NodeCandidate -Directory $shellDir.FullName -Source 'fnm 多终端会话' -VersionText ''
            if ($null -ne $shellCandidate) { $candidates += $shellCandidate }
        }
    }

    return $candidates
}

function Get-NodeCandidatesFromNvm {
    $candidates = @()
    $nvmHome = $env:NVM_HOME
    if (-not $nvmHome -and $env:APPDATA) { $nvmHome = Join-Path $env:APPDATA 'nvm' }
    if ($nvmHome -and (Test-Path $nvmHome)) {
        $versionDirs = Get-ChildItem -LiteralPath $nvmHome -Directory -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -match '^v\d+\.\d+\.\d+$' }
        foreach ($versionDir in $versionDirs) {
            $candidate = New-NodeCandidate -Directory $versionDir.FullName -Source ('nvm-windows ' + $versionDir.Name) -VersionText $versionDir.Name
            if ($null -ne $candidate) { $candidates += $candidate }
        }
    }
    if ($env:NVM_SYMLINK) {
        $symlinkCandidate = New-NodeCandidate -Directory $env:NVM_SYMLINK -Source 'nvm-windows 当前版本' -VersionText ''
        if ($null -ne $symlinkCandidate) { $candidates += $symlinkCandidate }
    }
    return $candidates
}

function Get-NodeCandidatesFromFixedLocations {
    $candidates = @()
    if ($env:LOCALAPPDATA) {
        $voltaCandidate = New-NodeCandidate -Directory (Join-Path $env:LOCALAPPDATA 'Volta\bin') -Source 'volta' -VersionText ''
        if ($null -ne $voltaCandidate) { $candidates += $voltaCandidate }
    }
    $programDirs = @()
    if ($env:ProgramFiles) { $programDirs += $env:ProgramFiles }
    if (${env:ProgramFiles(x86)}) { $programDirs += ${env:ProgramFiles(x86)} }
    foreach ($programDir in $programDirs) {
        $officialCandidate = New-NodeCandidate -Directory (Join-Path $programDir 'nodejs') -Source '官方安装包' -VersionText ''
        if ($null -ne $officialCandidate) { $candidates += $officialCandidate }
    }
    return $candidates
}

function Get-NodeCandidates {
    $collected = @()
    foreach ($group in @((Get-NodeCandidatesFromFnm), (Get-NodeCandidatesFromNvm), (Get-NodeCandidatesFromFixedLocations))) {
        foreach ($item in $group) {
            if ($null -ne $item) { $collected += $item }
        }
    }
    return @($collected)
}

function Invoke-NodeScript {
    param([string]$ScriptPath)
    $nodeExecutable = Get-NodeExecutablePath
    if (-not $nodeExecutable) {
        Write-ErrorLine '找不到 node，无法执行脚本'
        return $false
    }
    & $nodeExecutable $ScriptPath | Out-Host
    return ($LASTEXITCODE -eq 0)
}

function Set-NodeExecutable {
    param([string]$NodeExecutablePath)
    if (-not $NodeExecutablePath) { return }
    $script:NodeExePath = $NodeExecutablePath
    $nodeDirectory = Split-Path -Parent $NodeExecutablePath
    if ($nodeDirectory -and ($env:PATH -notlike ('*' + $nodeDirectory + '*'))) {
        $env:PATH = ($nodeDirectory + ';' + $env:PATH)
    }
}

function Get-NodeExecutablePath {
    if ($script:NodeExePath) { return $script:NodeExePath }
    $command = Get-Command node -ErrorAction SilentlyContinue
    if ($null -ne $command) { return $command.Source }
    return $null
}

function Get-NpmPath {
    if ($script:NpmPath) { return $script:NpmPath }

    $nodeExecutable = Get-NodeExecutablePath
    if ($nodeExecutable) {
        $nodeDirectory = Split-Path -Parent $nodeExecutable
        foreach ($candidateName in @('npm.cmd', 'npm')) {
            $candidate = Join-Path $nodeDirectory $candidateName
            if (Test-Path $candidate) {
                $script:NpmPath = $candidate
                return $candidate
            }
        }
    }

    $command = Get-Command npm -ErrorAction SilentlyContinue
    if ($null -ne $command) {
        $script:NpmPath = $command.Source
        return $command.Source
    }
    return 'npm'
}

function Resolve-NodeEnvironment {
    $supported = @(Get-NodeCandidates |
        Where-Object { Test-SupportedVersion $_.Parts } |
        Sort-Object -Property @{ Expression = { $_.Parts.Major } }, @{ Expression = { $_.Parts.Minor } }, @{ Expression = { $_.Parts.Patch } } -Descending)

    if ($supported.Count -gt 0) {
        $pathNode = Get-Command node -ErrorAction SilentlyContinue
        if ($null -ne $pathNode) {
            $pathVersionText = $null
            try {
                $pathVersionText = (& node -v 2>$null)
            }
            catch {
                $pathVersionText = $null
            }
            $pathText = ''
            if ($pathVersionText) { $pathText = $pathVersionText.ToString() }
            if (Test-SupportedVersion (ConvertTo-VersionParts $pathText)) {
                Set-NodeExecutable $pathNode.Source
                $script:NodeSource = 'PATH'
                return $true
            }
        }

        $best = $supported[0]
        $env:PATH = ($best.Directory + ';' + $env:PATH)
        Set-NodeExecutable (Join-Path $best.Directory 'node.exe')
        if ($null -eq $pathNode) {
            Write-Warn '当前终端 PATH 里没有 node，这通常是 fnm / nvm 只对已初始化终端生效导致的'
        }
        Write-Ok ("已自动使用 {0}" -f $best.Source)
        Write-Host ("      目录：{0}" -f $best.Directory) -ForegroundColor Gray
        $script:NodeSource = $best.Source
        return $true
    }

    $pathNodeFallback = Get-Command node -ErrorAction SilentlyContinue
    if ($null -ne $pathNodeFallback) {
        Set-NodeExecutable $pathNodeFallback.Source
        $script:NodeSource = 'PATH'
        return $true
    }
    return $false
}

function Get-NodeVersion {
    $nodeExecutable = Get-NodeExecutablePath
    if (-not $nodeExecutable) { return $null }
    $raw = $null
    try {
        $raw = (& $nodeExecutable -v 2>$null)
    }
    catch {
        return $null
    }
    if (-not $raw) { return $null }
    $parts = ConvertTo-VersionParts $raw.ToString()
    if ($null -eq $parts) { return $null }
    return [PSCustomObject]@{
        Text  = $raw.ToString().Trim()
        Major = $parts.Major
        Minor = $parts.Minor
    }
}

