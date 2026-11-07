#!/usr/bin/env bash
# MindForAI 的 Docker 一键部署脚本：检查环境、构建镜像、以 docker run --rm 启动容器、等待就绪后打开浏览器，停止容器时自动删除
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

PROJECT_NAME="MindForAI"
CONTAINER_NAME="mindforai"
IMAGE_NAME="mindforai:latest"
HOST_PORT="${MINDFORAI_PORT:-8080}"
APP_URL="http://localhost:${HOST_PORT}/"

say_info() { printf '\033[0;36m[INFO]\033[0m %s\n' "$1"; }
say_ok() { printf '\033[0;32m[ OK ]\033[0m %s\n' "$1"; }
say_warn() { printf '\033[0;33m[WARN]\033[0m %s\n' "$1"; }
say_fail() { printf '\033[0;31m[FAIL]\033[0m %s\n' "$1" >&2; exit 1; }

require_docker() {
  command -v docker >/dev/null 2>&1 || say_fail "未检测到 Docker，请先安装 Docker Desktop：https://docs.docker.com/get-docker/"
  docker info >/dev/null 2>&1 || say_fail "Docker 服务未运行，请先启动 Docker Desktop 或 dockerd 后重试。"
  say_ok "Docker 环境就绪：$(docker --version)"
}

port_is_in_use() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1 && return 0
  fi
  if command -v ss >/dev/null 2>&1; then
    ss -ltn 2>/dev/null | awk -v p=":${port}" '$4 ~ p"$"' | grep -q . && return 0
  fi
  if command -v nc >/dev/null 2>&1; then
    nc -z 127.0.0.1 "${port}" >/dev/null 2>&1 && return 0
  fi
  return 1
}

container_is_running() {
  local state
  state="$(docker inspect --format '{{.State.Status}}' "${CONTAINER_NAME}" 2>/dev/null || echo missing)"
  [ "${state}" = "running" ]
}

resolve_host_port() {
  local fallback
  if [ ! -f "${SCRIPT_DIR}/Dockerfile" ]; then
    say_fail "未找到 Dockerfile，请在项目根目录运行本脚本。"
  fi
  if ! port_is_in_use "${HOST_PORT}" || container_is_running; then
    return 0
  fi
  fallback=$((HOST_PORT + 1))
  if port_is_in_use "${fallback}"; then
    say_fail "端口 ${HOST_PORT} 已被其它程序占用，请先释放，或执行 MINDFORAI_PORT=<端口> bash rundocker.sh 指定其它端口。"
  fi
  say_warn "端口 ${HOST_PORT} 已被其它程序占用，改用端口 ${fallback}。"
  HOST_PORT="${fallback}"
  APP_URL="http://localhost:${HOST_PORT}/"
}

image_exists_locally() {
  docker image inspect "${IMAGE_NAME}" >/dev/null 2>&1
}

build_image_attempt() {
  docker build -t "${IMAGE_NAME}" .
}

build_image() {
  say_info "正在构建镜像（首次构建需要下载依赖，可能需要数分钟）..."
  if build_image_attempt; then
    say_ok "镜像构建完成：${IMAGE_NAME}"
    return 0
  fi
  say_warn "镜像构建失败，正在重试一次..."
  if build_image_attempt; then
    say_ok "镜像构建完成：${IMAGE_NAME}"
    return 0
  fi
  if image_exists_locally; then
    say_warn "无法连接 Docker Hub（常见报错：auth.docker.io EOF / 拉取元数据超时）。"
    say_warn "已改用本地已有的镜像 ${IMAGE_NAME} 继续启动，代码可能不是最新。"
    say_warn "如需按最新代码重建，请检查网络、代理或 DNS 后重新运行本脚本。"
    return 0
  fi
  say_fail "镜像构建失败，且本地没有可用镜像。请检查网络、代理或 DNS 后重试（报错见上方日志）。"
}

remove_container_if_exists() {
  if docker inspect "${CONTAINER_NAME}" >/dev/null 2>&1; then
    say_info "正在移除旧容器：${CONTAINER_NAME}"
    docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || say_fail "旧容器移除失败，请先手动删除 ${CONTAINER_NAME}。"
  fi
}

start_container() {
  say_info "正在启动容器（宿主机端口 ${HOST_PORT} 映射到容器 80，停止后自动删除）..."
  remove_container_if_exists
  docker run --rm -d --name "${CONTAINER_NAME}" -p "${HOST_PORT}:80" "${IMAGE_NAME}" >/dev/null || say_fail "容器启动失败，请检查上方日志。"
  say_ok "容器已启动：${CONTAINER_NAME}"
}

probe_service_once() {
  if command -v curl >/dev/null 2>&1; then
    curl --silent --fail --max-time 3 "${APP_URL}" >/dev/null 2>&1
    return $?
  fi
  if command -v wget >/dev/null 2>&1; then
    wget --quiet --tries=1 --timeout=3 --spider "${APP_URL}" >/dev/null 2>&1
    return $?
  fi
  [ "$(docker inspect --format '{{.State.Health.Status}}' "${CONTAINER_NAME}" 2>/dev/null || echo unknown)" = "healthy" ]
}

wait_service_ready() {
  local waited state
  say_info "正在等待服务就绪..."
  for waited in $(seq 1 90); do
    state="$(docker inspect --format '{{.State.Status}}' "${CONTAINER_NAME}" 2>/dev/null || echo missing)"
    if [ "${state}" = "exited" ] || [ "${state}" = "dead" ] || [ "${state}" = "missing" ]; then
      say_fail "容器已退出或已被删除，请重新执行本脚本并检查启动日志。"
    fi
    if probe_service_once; then
      say_ok "服务已就绪：${APP_URL}"
      return 0
    fi
    sleep 2
  done
  say_warn "等待超时，服务可能仍在启动，可稍后手动访问 ${APP_URL}。"
}

open_browser() {
  say_info "正在使用默认浏览器打开：${APP_URL}"
  if [ "${BROWSER_AUTO_OPEN:-1}" = "0" ]; then
    say_warn "已按 BROWSER_AUTO_OPEN=0 跳过自动打开浏览器。"
    return 0
  fi
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "${APP_URL}" >/dev/null 2>&1 &
  elif command -v open >/dev/null 2>&1; then
    open "${APP_URL}" >/dev/null 2>&1 &
  elif command -v sensible-browser >/dev/null 2>&1; then
    sensible-browser "${APP_URL}" >/dev/null 2>&1 &
  else
    say_warn "未找到可用的浏览器启动命令，请手动访问 ${APP_URL}"
  fi
}

remove_container() {
  if ! docker inspect "${CONTAINER_NAME}" >/dev/null 2>&1; then
    say_ok "容器不存在，已无需删除。"
    return 0
  fi
  say_info "正在停止并删除容器..."
  docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || say_warn "删除容器失败，请手动执行 docker rm -f ${CONTAINER_NAME}。"
  say_ok "容器已停止并删除。"
}

print_usage_summary() {
  printf '\n'
  say_ok "${PROJECT_NAME} 部署完成，访问地址：${APP_URL}"
  printf '       查看日志：docker logs -f %s\n' "${CONTAINER_NAME}"
  printf '       停止容器（Docker 会自动删除）：docker stop %s\n' "${CONTAINER_NAME}"
  printf '       立即停止并删除容器：bash rundocker.sh stop\n\n'
}

deploy() {
  require_docker
  resolve_host_port
  build_image
  start_container
  wait_service_ready
  open_browser
  print_usage_summary
}

main() {
  printf '\n========================================\n'
  printf '  %s 一键部署（Docker）\n' "${PROJECT_NAME}"
  printf '========================================\n\n'
  case "${1:-start}" in
    stop|down)
      require_docker
      remove_container
      ;;
    *)
      deploy
      ;;
  esac
}

main "$@"
