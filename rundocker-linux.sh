#!/usr/bin/env bash
# Docker 一键部署脚本（Linux 版）：复用通用脚本，额外处理 Docker 未启动与无桌面环境的情况
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

say_info() { printf '\033[0;36m[INFO]\033[0m %s\n' "$1"; }
say_warn() { printf '\033[0;33m[WARN]\033[0m %s\n' "$1"; }
say_fail() { printf '\033[0;31m[FAIL]\033[0m %s\n' "$1" >&2; exit 1; }

ensure_docker_daemon() {
  command -v docker >/dev/null 2>&1 || say_fail "未检测到 Docker，请先安装 Docker Engine：https://docs.docker.com/engine/install/"
  if docker info >/dev/null 2>&1; then
    return 0
  fi
  say_warn "Docker 服务未运行，尝试通过 systemd 启动..."
  if command -v systemctl >/dev/null 2>&1; then
    systemctl start docker >/dev/null 2>&1 || true
    sleep 2
  fi
  docker info >/dev/null 2>&1 || say_fail "Docker 服务仍未运行，请执行 sudo systemctl start docker 后重试。"
}

warn_when_no_desktop() {
  if [ -z "${DISPLAY:-}" ] && [ -z "${WAYLAND_DISPLAY:-}" ] && [ "${BROWSER_AUTO_OPEN:-1}" != "0" ]; then
    say_warn "未检测到图形桌面环境，将跳过自动打开浏览器；请在浏览器中访问 http://localhost:${MINDFORAI_PORT:-8080}/"
    export BROWSER_AUTO_OPEN=0
  fi
}

main() {
  ensure_docker_daemon
  warn_when_no_desktop
  say_info "正在调用通用部署脚本 rundocker.sh ..."
  exec bash "${SCRIPT_DIR}/rundocker.sh" "$@"
}

main "$@"
