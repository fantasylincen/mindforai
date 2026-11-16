#!/usr/bin/env bash
# MindForAI Web UI 停止脚本：非阻塞停止由 start.sh 启动的 Vite 开发服务器（默认端口 8756）
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

exec bash "${SCRIPT_DIR}/start.sh" stop
