#!/usr/bin/env bash
# SCR-17 导出源码压缩包：收集构建所需源码打成 zip，供拷贝到 Windows 后本地安装依赖
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if ! command -v node >/dev/null 2>&1; then
    echo "[导出失败] 未找到 node，请先安装 Node.js 22.12 或更高版本" >&2
    exit 1
fi

node "$SCRIPT_DIR/scripts/export-source-zip.mjs"
