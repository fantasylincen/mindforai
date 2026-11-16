#!/usr/bin/env bash
# SCR-20 Linux / macOS 下的 Windows 打包入口：按格式调用 electron-builder，并说明各格式的系统要求
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

C_RESET='\033[0m'
C_BOLD='\033[1m'
C_DIM='\033[2m'
C_RED='\033[31m'
C_GREEN='\033[32m'
C_YELLOW='\033[33m'
C_CYAN='\033[36m'

log_info() { printf '%b\n' "${C_CYAN}[打包]${C_RESET} $*"; }
log_ok() { printf '%b\n' "${C_GREEN}[成功]${C_RESET} $*"; }
log_warn() { printf '%b\n' "${C_YELLOW}[提示]${C_RESET} $*"; }
log_fail() { printf '%b\n' "${C_RED}[失败]${C_RESET} $*" >&2; }

print_usage() {
    cat <<'USAGE'
MindForAI Windows 打包脚本（Linux / macOS）

用法
  ./package-windows.sh                 默认打包 nsis + portable
  ./package-windows.sh <格式> [...]     指定格式，可多选
  ./package-windows.sh all             打包当前系统可生成的全部格式
  ./package-windows.sh --list          查看格式清单

可用格式
  nsis         NSIS 安装包（.exe，安装向导 + 文件关联）
  portable     便携版（单个 .exe，免安装）
  msi          MSI 安装包（.msi，企业批量部署）
  msiwrapped   MSI 包裹版（.msi 内嵌 NSIS）
  appx         AppX 应用包（.appx，Microsoft Store 格式）
  appxbundle   AppXBundle 集合包（.appxbundle）
  zip          ZIP 压缩包
  7z           7z 压缩包
  dir          免安装目录（仅解包，便于检查产物）

系统要求
  任意平台    portable、zip、7z、dir
  需要 wine   nsis、msi、msiwrapped（在 Linux / macOS 上构建时）
  仅 Windows  appx、appxbundle（需 Windows 10+ 与 Windows SDK）

建议
  在 Windows 上直接使用 mindforai.bat，无需 wine，且能生成 appx / appxbundle。
USAGE
}

require_node() {
    if ! command -v node >/dev/null 2>&1; then
        log_fail '未找到 node，请安装 Node.js 22.12 或更高版本'
        exit 1
    fi
    local version major minor
    version="$(node -p 'process.versions.node')"
    major="${version%%.*}"
    minor="${version#*.}"
    minor="${minor%%.*}"
    if [ "$major" -lt 22 ] || { [ "$major" -eq 22 ] && [ "$minor" -lt 12 ]; }; then
        log_fail "Node.js v${version} 版本过低，需要 22.12 或更高版本"
        exit 1
    fi
    log_ok "Node.js v${version}"
}

require_dependencies() {
    if [ ! -d node_modules ]; then
        log_fail '尚未安装依赖，请先执行：npm ci'
        exit 1
    fi
    if [ ! -f node_modules/electron-builder/cli.js ]; then
        log_fail '缺少 electron-builder，请重新执行：npm ci'
        exit 1
    fi
    log_ok '依赖已就绪'
}

has_wine() {
    command -v wine >/dev/null 2>&1 || command -v wine64 >/dev/null 2>&1
}

report_environment() {
    if has_wine; then
        log_ok '检测到 wine，可生成 nsis / msi / msiwrapped'
    else
        log_warn '未检测到 wine，nsis / msi / msiwrapped 会被跳过'
        log_warn '需要安装包请改用 Windows 上的 mindforai.bat'
    fi
    log_warn 'appx / appxbundle 只能在 Windows 10+ 或 macOS 上生成'
}

list_artifacts() {
    if [ ! -d dist/desktop ]; then
        return
    fi
    local found=0
    local artifact size
    printf '%b\n' ""
    printf '%b\n' "${C_BOLD}产物清单（dist/desktop）：${C_RESET}"
    for artifact in dist/desktop/*.exe dist/desktop/*.msi dist/desktop/*.appx \
        dist/desktop/*.appxbundle dist/desktop/*.zip dist/desktop/*.7z; do
        [ -f "$artifact" ] || continue
        found=1
        size="$(wc -c <"$artifact" 2>/dev/null | tr -d ' ')"
        awk -v name="$(basename "$artifact")" -v bytes="${size:-0}" \
            'BEGIN { printf "  %-46s %8.2f MB\n", name, bytes / 1048576 }'
    done
    if [ "$found" -eq 0 ]; then
        printf '  （暂无产物）\n'
    fi
    printf '%b\n' ""
    printf '%b\n' "${C_DIM}未签名的安装包在 Windows 上首次运行会触发 SmartScreen 提示，属正常现象。${C_RESET}"
}

main() {
    case "${1:-}" in
        -h | --help | help)
            print_usage
            exit 0
            ;;
        --list | list)
            node scripts/package-desktop.mjs --list
            exit $?
            ;;
    esac

    printf '\n%b\n' "${C_BOLD}MindForAI Windows 打包${C_RESET}"
    log_info "工作目录：${SCRIPT_DIR}"
    require_node
    require_dependencies
    report_environment

    local targets=("$@")
    if [ ${#targets[@]} -eq 0 ]; then
        targets=(nsis portable)
        log_info '未指定格式，默认打包：nsis portable'
    fi

    printf '\n'
    node scripts/package-desktop.mjs "${targets[@]}"
    local exit_code=$?

    list_artifacts

    if [ "$exit_code" -ne 0 ]; then
        log_fail '部分格式未能生成，原因见上方日志'
        exit "$exit_code"
    fi
    log_ok '打包完成'
    exit 0
}

main "$@"
