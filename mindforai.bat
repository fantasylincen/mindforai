@echo off
chcp 65001 >nul 2>&1
rem SCR-17 MindForAI Windows launcher.
rem This file must stay pure ASCII: cmd.exe misparses UTF-8 batch files and
rem reports errors such as "'?' is not recognized". Every Chinese string lives
rem in mindforai.ps1, which is UTF-8 with BOM and read correctly by PowerShell.
setlocal EnableExtensions
title MindForAI desktop

set "POWERSHELL_EXE=powershell"
where pwsh >nul 2>&1
if not errorlevel 1 set "POWERSHELL_EXE=pwsh"

set "SCRIPT_PATH=%~dp0mindforai.ps1"
if not exist "%SCRIPT_PATH%" (
    echo [ERROR] mindforai.ps1 was not found next to this launcher.
    echo         Extract the archive completely and try again.
    pause
    exit /b 1
)

set "ACTION=%~1"
if "%ACTION%"=="" set "ACTION=menu"

rem Optional second argument selects the packaging format, e.g.
rem   mindforai.bat package appx,msi
set "FORMAT_ARGS="
if not "%~2"=="" set "FORMAT_ARGS=-Format %~2"

"%POWERSHELL_EXE%" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_PATH%" -Action "%ACTION%" %FORMAT_ARGS%
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if not "%EXIT_CODE%"=="0" echo [FAILED] exit code: %EXIT_CODE%
pause
exit /b %EXIT_CODE%
