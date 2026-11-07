#!/usr/bin/env bash
# Docker 一键部署脚本（macOS 版）：复用通用脚本，额外等待 Docker Desktop 启动完成
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAX_WAIT_SECONDS="${DOCKER_WAIT_SECONDS:-120}"

say_info() { printf '\033[0;36m[INFO]\033[0m %s\n' "$1"; }
say_warn() { printf '\033[0;33m[WARN]\033[0m %s\n' "$1"; }
say_fail() { printf '\033[0;31m[FAIL]\033[0m %s\n' "$1" >&2; exit 1; }

ensure_docker_desktop_running() {
  command -v docker >/dev/null 2>&1 || say_fail "未检测到 Docker，请先安装 Docker Desktop for Mac：https://docs.docker.com/desktop/install/mac-install/"
  docker info >/dev/null 2>&1 && return 0
  say_warn "Docker Desktop 未运行，正在尝试启动..."
  if [ -d "/Applications/Docker.app" ]; then
    open -a Docker >/dev/null 2>&1 || true
  else
    say_fail "未找到 Docker.app，请先安装 Docker Desktop 后重试。"
  fi
  local waited
  for waited in $(seq 1 "${MAX_WAIT_SECONDS}"); do
    if docker info >/dev/null 2>&1; then
      say_info "Docker Desktop 已就绪。"
      return 0
    fi
    sleep 1
  done
  say_fail "等待 Docker Desktop 启动超时，请手动启动后重试。"
}

main() {
  ensure_docker_desktop_running
  say_info "正在调用通用部署脚本 rundocker.sh ..."
  exec bash "${SCRIPT_DIR}/rundocker.sh" "$@"
}

main "$@"
