@echo off
chcp 65001 >nul 2>&1
setlocal EnableExtensions
title MindForAI Docker deploy

set "POWERSHELL_EXE=powershell"
where pwsh >nul 2>&1
if not errorlevel 1 set "POWERSHELL_EXE=pwsh"

set "SCRIPT_PATH=%~dp0rundocker.ps1"
set "EXTRA_ARGS="
if /i "%~1"=="stop" set "EXTRA_ARGS=-Action stop"
if /i "%~1"=="down" set "EXTRA_ARGS=-Action stop"

"%POWERSHELL_EXE%" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_PATH%" %EXTRA_ARGS%
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if not "%EXIT_CODE%"=="0" goto :failed
pause
exit /b 0

:failed
echo Deployment failed, exit code: %EXIT_CODE%
pause
exit /b %EXIT_CODE%
