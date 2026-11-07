# 品牌图标

## 目录结构

```
apps/web/public/
├── favicon.svg              # 浏览器标签页图标（生效中的图标）
├── favicon.ico              # 旧浏览器回退图标（16/32/48）
├── apple-touch-icon.png     # iOS 主屏图标（180×180）
└── logo/
    ├── app-icon.png         # 512×512 应用图标
    ├── logo_mindforai_h.svg      # 横版文字标志（浅色底）
    ├── logo_mindforai_h_dark.svg # 横版文字标志（深色底）
    └── icons/
        ├── icon-01-mindmap.svg   ... icon-10-radial.svg   # 10 个候选图标
        └── index.html             # 候选图标预览页
```

## 候选图标

| 编号 | 文件 | 概念 |
| --- | --- | --- |
| 01 | `icon-01-mindmap.svg` | 思维导图树（中心节点 + 分支） |
| 02 | `icon-02-document.svg` | 文档树（页面 + 节点） |
| 03 | `icon-03-chat.svg` | AI 对话气泡 + 节点 |
| 04 | `icon-04-terminal.svg` | 终端提示符 + 节点 |
| 05 | `icon-05-network.svg` | 神经网络 |
| 06 | `icon-06-sparkle.svg` | AI 星光 + 节点 |
| 07 | `icon-07-flow.svg` | 流程图 |
| 08 | `icon-08-layers.svg` | 分层文件 |
| 09 | `icon-09-braces.svg` | 代码括号 + 节点 |
| 10 | `icon-10-radial.svg` | 放射状思维导图 |

预览全部候选：本地运行 `npm start` 后打开 <http://localhost:7200/logo/icons/index.html>。

## 更换图标

### 方式一：只替换生效图标（最简单）

把选中的 SVG 复制成 `apps/web/public/favicon.svg`，然后重新生成位图回退文件：

```bash
cp apps/web/public/logo/icons/icon-03-chat.svg apps/web/public/favicon.svg
```

### 方式二：重新生成整套品牌资源（推荐）

`scripts/generate-icons.mjs` 是唯一的事实来源（single source of truth），
所有候选图标、`favicon.svg` 和文字标志都由它生成：

```bash
# 生成全部候选图标 + 把某个图标设为生效图标
node scripts/generate-icons.mjs 03-chat

# 只重新生成全部候选图标（保持当前生效图标不变）
node scripts/generate-icons.mjs
```

该脚本只依赖 Node.js，无需额外依赖。若要同时更新位图资源（`favicon.ico`、
`apple-touch-icon.png`、`logo/app-icon.png`），需要 `resvg-py` 与 `pillow`：

```bash
pip install resvg-py pillow
python3 - <<'PY'
import io, resvg_py
from PIL import Image
svg = 'apps/web/public/favicon.svg'
png = resvg_py.svg_to_bytes(svg_path=svg, width=256, height=256)
im = Image.open(io.BytesIO(png)).convert('RGBA')
im.save('apps/web/public/favicon.ico', format='ICO', sizes=[(16,16),(32,32),(48,48)])
PY
```

### 方式三：完全自定义

直接编辑 `apps/web/public/favicon.svg`（512×512 viewBox），
以及需要时编辑 `apps/web/public/logo/logo_mindforai_h*.svg`。

## 品牌色

所有图标共用同一套渐变，取自原 logo：

```
#1ea9ef → #6852f2 → #ab56d9 → #f160b5 → #ef8861
```

## 引用位置

`apps/web/index.html` 中已同时声明 SVG 与 ICO：

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="alternate icon" type="image/x-icon" href="/favicon.ico" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

现代浏览器优先使用 `favicon.svg`，旧浏览器回退到 `favicon.ico`。
