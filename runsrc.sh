#!/usr/bin/env bash
# 本地源码开发服务器启停脚本：安装依赖并后台启动 Vite 开发服务器，重复运行代表重启，就绪后打开浏览器
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

LOG_FILE="${LOG_FILE:-.mindforai.log}"
PID_FILE="${PID_FILE:-.mindforai.pid}"
PREFERRED_PORT="${PORT:-7200}"

say_info() { printf '\033[0;36m[INFO]\033[0m %s\n' "$1"; }
say_ok() { printf '\033[0;32m[ OK ]\033[0m %s\n' "$1"; }
say_warn() { printf '\033[0;33m[WARN]\033[0m %s\n' "$1"; }
say_fail() { printf '\033[0;31m[FAIL]\033[0m %s\n' "$1" >&2; exit 1; }

require_node_toolchain() {
  command -v node >/dev/null 2>&1 || say_fail "未找到 node，请先安装 Node.js 20 或更高版本。"
  command -v npm >/dev/null 2>&1 || say_fail "未找到 npm，请先安装 Node.js（npm 随 Node.js 一起安装）。"
  local major
  major="$(node -p 'String(process.versions.node.split(".")[0])' 2>/dev/null || echo 0)"
  if [ "${major}" -lt 20 ] 2>/dev/null; then
    say_warn "当前 Node.js 版本为 $(node --version)，建议升级到 20 或更高版本。"
  fi
}

can_probe_processes() {
  [ -d /proc/self ] && [ -r /proc/self/stat ]
}

pid_alive() {
  local pid="$1" state
  [ -n "${pid}" ] || return 1
  [ -d "/proc/${pid}" ] || return 1
  state="$(sed -e 's/^.*) //' -e 's/ .*//' "/proc/${pid}/stat" 2>/dev/null || true)"
  [ -n "${state}" ] && [ "${state}" != "Z" ]
}

pid_cwd() {
  readlink -f "/proc/$1/cwd" 2>/dev/null || true
}

pid_command_line() {
  tr '\0' ' ' < "/proc/$1/cmdline" 2>/dev/null || true
}

is_project_process() {
  local pid="$1" command_line working_dir
  pid_alive "${pid}" || return 1
  command_line="$(pid_command_line "${pid}")"
  working_dir="$(pid_cwd "${pid}")"
  case "${command_line}" in
    *"${SCRIPT_DIR}"*) return 0 ;;
    *"nx serve"*) return 0 ;;
    *"vite"*) return 0 ;;
  esac
  case "${working_dir}" in
    "${SCRIPT_DIR}"|"${SCRIPT_DIR}"/*) return 0 ;;
  esac
  return 1
}

port_listener_pid() {
  local port="$1" pid=""
  if command -v lsof >/dev/null 2>&1; then
    pid="$(lsof -nP -iTCP:"${port}" -sTCP:LISTEN -t 2>/dev/null | head -n 1 || true)"
  fi
  if [ -z "${pid}" ] && command -v ss >/dev/null 2>&1; then
    pid="$(ss -ltnp 2>/dev/null | awk -v p=":${port}" '$4 ~ p"$" {print $NF}' | sed -n 's/.*pid=\([0-9]*\).*/\1/p' | head -n 1)"
  fi
  if [ -z "${pid}" ] && command -v fuser >/dev/null 2>&1; then
    pid="$(fuser "${port}/tcp" 2>/dev/null | tr -cs '0-9' '\n' | grep -E '^[0-9]+$' | head -n 1 || true)"
  fi
  echo "${pid}"
}

terminate_process_group() {
  local pid="$1" waited
  kill -TERM "-${pid}" 2>/dev/null || kill -TERM "${pid}" 2>/dev/null || true
  for waited in $(seq 1 40); do
    pid_alive "${pid}" || return 0
    sleep 0.25
  done
  kill -KILL "-${pid}" 2>/dev/null || kill -KILL "${pid}" 2>/dev/null || true
  for waited in $(seq 1 20); do
    pid_alive "${pid}" || return 0
    sleep 0.25
  done
  return 0
}

stop_previous_instance() {
  local old_pid listener stopped waited
  stopped=0
  if [ -f "${PID_FILE}" ]; then
    old_pid="$(cat "${PID_FILE}" 2>/dev/null || true)"
    rm -f "${PID_FILE}"
    if is_project_process "${old_pid}"; then
      say_info "正在停止上一实例（pid: ${old_pid}）..."
      terminate_process_group "${old_pid}"
      stopped=1
    fi
  fi
  if can_probe_processes; then
    listener="$(port_listener_pid "${PREFERRED_PORT}")"
    if [ -n "${listener}" ] && is_project_process "${listener}"; then
      say_info "正在停止占用端口 ${PREFERRED_PORT} 的旧进程（pid: ${listener}）..."
      terminate_process_group "${listener}"
      stopped=1
    fi
  fi
  if [ "${stopped}" = "1" ]; then
    for waited in $(seq 1 20); do
      port_listener_pid "${PREFERRED_PORT}" | grep -q '[0-9]' || break
      sleep 0.5
    done
  fi
}

ensure_dependencies() {
  if [ ! -d node_modules ]; then
    say_info "正在安装依赖（首次运行需要几分钟，请耐心等待）..."
    npm install --no-audit --no-fund || say_fail "依赖安装失败，请检查上方日志。"
  fi
}

launch_server_in_background() {
  local port="$1"
  : > "${LOG_FILE}"
  if command -v setsid >/dev/null 2>&1; then
    setsid bash -c 'echo $$ > "$1"; shift; exec "$@"' _ "${PID_FILE}" \
      npx nx serve web --host=0.0.0.0 --port="${port}" >>"${LOG_FILE}" 2>&1 </dev/null &
  else
    nohup bash -c 'echo $$ > "$1"; shift; exec "$@"' _ "${PID_FILE}" \
      npx nx serve web --host=0.0.0.0 --port="${port}" >>"${LOG_FILE}" 2>&1 </dev/null &
  fi
  disown 2>/dev/null || true
}

port_accepts_connection() {
  node -e "const net=require('net');const s=net.createConnection({port:Number(process.argv[1]),host:'127.0.0.1'});s.once('connect',()=>{s.destroy();process.exit(0)});s.once('error',()=>process.exit(1));s.setTimeout(1500,()=>{s.destroy();process.exit(1)});" "$1" >/dev/null 2>&1
}

wait_until_dev_server_ready() {
  local port="$1" waited
  for waited in $(seq 1 180); do
    if port_accepts_connection "${port}"; then
      return 0
    fi
    if [ -f "${PID_FILE}" ] && ! pid_alive "$(cat "${PID_FILE}" 2>/dev/null || true)"; then
      return 1
    fi
    sleep 1
  done
  return 1
}

pick_available_port() {
  node -e "const net=require('net');const start=Number(process.argv[1]);const tryPort=(port,left)=>{const s=net.createServer();s.once('error',()=>{s.close(()=>{});if(left>0)tryPort(port+1,left-1);else process.exit(1);});s.once('listening',()=>s.close(()=>console.log(port)));s.listen(port,'127.0.0.1');};tryPort(start,20);" "${PREFERRED_PORT}"
}

open_browser() {
  local url="$1"
  say_info "正在使用默认浏览器打开：${url}"
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "${url}" >/dev/null 2>&1 &
  elif command -v open >/dev/null 2>&1; then
    open "${url}" >/dev/null 2>&1 &
  elif command -v sensible-browser >/dev/null 2>&1; then
    sensible-browser "${url}" >/dev/null 2>&1 &
  else
    say_warn "未找到可用的浏览器启动命令，请手动访问 ${url}"
  fi
}

show_recent_log() {
  say_warn "最近一段启动日志如下："
  grep -v '^$' "${LOG_FILE}" 2>/dev/null | tail -n 20 >&2 || true
}

stop_from_user_command() {
  stop_previous_instance
  say_ok "MindForAI 开发服务器已停止。"
}

start_or_restart() {
  local port url
  require_node_toolchain
  stop_previous_instance
  port="$(pick_available_port)" || say_fail "找不到可用端口，请检查本机网络环境。"
  if [ "${port}" != "${PREFERRED_PORT}" ]; then
    say_warn "端口 ${PREFERRED_PORT} 已被其它程序占用，改用端口 ${port}。"
  fi
  ensure_dependencies
  say_info "正在后台启动 MindForAI 开发服务器（端口 ${port}）..."
  launch_server_in_background "${port}"
  url="http://localhost:${port}/"
  if wait_until_dev_server_ready "${port}"; then
    say_ok "启动完成：${url}"
    printf '       日志：%s\n' "${LOG_FILE}"
    printf '       停止：bash %s stop\n' "$0"
    open_browser "${url}"
  else
    show_recent_log
    say_fail "启动失败，请检查上方日志。"
  fi
}

main() {
  case "${1:-start}" in
    stop) stop_from_user_command ;;
    *) start_or_restart ;;
  esac
}

main "$@"
