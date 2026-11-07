<div align="center">

# MindForAI

**用思维导图生成喂给 AI 的项目文档**

### 🌐 [在线体验 MindForAI](https://fantasylincen.github.io/mindforai/)

[![Deploy](https://github.com/fantasylincen/mindforai/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/fantasylincen/mindforai/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![GitHub stars](https://img.shields.io/github/stars/fantasylincen/mindforai?style=social)](https://github.com/fantasylincen/mindforai/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/fantasylincen/mindforai?style=social)](https://github.com/fantasylincen/mindforai/fork)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://hub.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)

[English](./README_en.md) · [快速开始](#快速开始) · [典型场景](#典型场景) · [文件格式](#文件格式) · [文档模板](#文档模板库) · [开发](#开发)

</div>

---

## 这是什么

**MindForAI 是一款开源的 AI 文档生成白板。**

它不是又一个 Markdown 编辑器，而是 **AI 时代的人机沟通协议**：用结构化的树状文档消除自然语言歧义，让 AI 按图施工。

你用思维导图把项目梳理清楚，MindForAI 把它压缩成 **AI 能瞬间读懂** 的紧凑文本文件，然后你把这个文件丢给 Claude Code、Cursor、Copilot 等 AI 编程助手——它立刻就知道你的项目是干什么的、当前进展如何、下一步该做什么。

**它解决的痛点**：每次开启新会话，AI 都要重新理解一遍你的项目。你写一段话描述背景，它理解得模棱两可；你贴一堆文件，token 成本高得离谱。MindForAI 让你用一张图 + 一个文件，**一次性把上下文说清楚**。

## 我们的终极目标

**1文档 + 1Agent = 1项目。**

我们相信，AI 时代的项目交付可以精简为这个等式：一份足够清晰的文档，加上一个能读懂它的 Agent，就足以完成一个项目。

MindForAI 想做的，是用 `.mindforai` 改写 Agent 的底层基础文档：让文档不再只是「供人阅读的背景材料」，而成为 Agent 更加严格、更加明确、更加清晰的行动方针。相比 Markdown，树状结构把目标、边界、约束和验收标准放在确定的位置，能显著减少歧义与目标漂移，为 Agent 带来更强的执行力。

## 为什么是 MindForAI

**人类语言并不适合直接指挥 AI。**

同一段自然语言可以有多种理解：概念混用、指代不明、隐含前提、目标漂移，都会让 AI 给出看似合理却偏离你本意的结果。对话越长、文本越大，歧义被放大的概率越高——AI 可能抓住无关细节，误解你的意图，甚至把上一轮的错误当作事实继续推理。

**因此，非常不建议直接以人类自然语言与 AI 进行大段对话，尤其是把整篇需求、整份设计一次性贴进对话框。** 小段的需求文本通常不容易走偏，因为它足够聚焦；但一旦涉及多个模块、多个约束和多个验收标准，自然语言的线性叙述就很难表达清楚它们之间的关系。

MindForAI 用「树」把意图显式表达出来：每个节点只表达一个概念，父子关系就是任务的拆解关系，兄弟节点就是并列的约束。AI 不需要猜你想说什么，照着节点逐条执行即可。

- 🎯 **消除歧义**：结构化节点替代大段散文，目标、约束、验收标准各归其位，AI 的行为不容易跑偏。
- 🧩 **人机同构**：思维导图的树状结构与神经元的分支结构天然相似，人类和 AI 都能快速建立整体认知。
- ⚡ **极致省 Token**：`.mindforai` 用缩进代替括号和逗号，体量比 JSON 小数倍，比大段 Markdown 更精炼。
- ✂️ **更低阅读成本**：AI 只读它需要的那条分支就能定位修改点，不必全文检索、反复试错，减少上下文污染。
- 👀 **人类易读，AI 更易读**：人一眼看清全局，AI 可直接按树解析，不必猜测段落之间的从属关系。
- 📝 **比 Markdown 更好编辑、更易读**：增删节点、调整层级、复制分支都像操作大纲一样直接，改完即读；没有标题层级和列表符号的维护负担。
- ♻️ **节点级复用**：一条 AI 行为约束、一条项目规则就是一个节点，复制到新项目立即可用。
- 🎯 **直接派活**：可用于产品设计、项目拆解和任务分发，拆好的任务树喂给 AI 就能开工。

> 一句话：**人类易读，AI 更易读；这是 AI 时代人类与 AI 的最佳沟通数据结构。**

## 典型场景

MindForAI 不只用来画图，它更像一份 **可以被 AI 直接执行的说明书**。下面这些内容都可以在一棵树里完成，并导出成同一个 `.mindforai` 文件。

| 场景 | 在 MindForAI 里梳理什么 | 交给 AI 后得到什么 |
| --- | --- | --- |
| 🧭 **项目需求文档设计** | 目标用户 → 使用场景 → 功能边界 → 约束条件 → 验收标准 | AI 按需求边界实现，减少凭空发挥与范围蔓延 |
| 🧠 **项目的核心文档** | 项目定位 → 模块划分 → 目录结构 → 模块依赖 → 导航入口 | AI 先建立全局认知，再按模块定位代码；大型项目可以拆成多个能被 AI 独立实施的小模块 |
| 🤖 **AI 规则 / 人格 / 技能文档** | 角色设定 → 行为边界 → 输出风格 → 技能清单 → 禁止事项 | 每次会话快速加载一致的协作规则，不必反复交代背景与偏好 |
| 🗺️ **代码地图 / 源码导航** | 文件夹 → 文件 → 一句话职责（以目录结构为指引） | AI 沿树直接定位文件，避免全仓库搜索；拆解粒度建议到单个程序文件、单文件不超过 800 行，不再向下细分 |
| 🧩 **项目拆解与任务派发** | 里程碑 → 可独立实施的小模块 → 任务 → 验收标准 | 一个模块交给一个 AI 会话，并行推进且互不污染上下文 |
| ✅ **待办清单（TODO）** | 需求 → 子任务 → 验收标准 | AI 直接开始干活，不用反复确认 |
| 🐛 **缺陷报告（Bug Report）** | 现象 → 复现步骤 → 期望行为 → 实际行为 | AI 精准定位问题并给出修复方案 |
| 🏗️ **技术方案 / 架构设计** | 现状 → 目标架构 → 迁移步骤 | AI 按你的方案实施，不跑偏 |
| ✍️ **非开发场景** | 写作提纲、活动策划、学习路径、产品分析、会议纪要 | 任何需要结构化思考与复用的内容，都能导出为清晰文档 |

> 制作代码地图时，建议把「最小拆解到单个程序文件、单个文件不超过 800 行、每个文件与文件夹只写一句话描述、不再向下细分」写进 AI 规则，后续维护会轻松很多。

## 核心能力

- 🗺️ **思维导图 + 流程图**：一个白板搞定结构梳理与流程设计
- 🤖 **AI 专用导出格式**：`.mindforai`（行式树状文本）比原始 JSON 小数倍，token 友好
- 🧠 **结构化上下文**：用层级代替长文，目标、约束、步骤一次讲清，显著降低 AI 误解率
- 🎯 **精准定位修改点**：模块 ID + 分支路径，让 AI 沿树定位，减少全仓库搜索和上下文污染
- 📦 **可复用文档模板**：项目核心文档 / 任务看板 / 缺陷报告 / 工作方法 / 代码审查，见 [文档模板库](./templates/)
- ✂️ **节点级复制复用**：规则、约束、任务模板直接复制节点，跨项目复用无需重写
- 🔗 **Mermaid 流程图**：粘贴 Mermaid 文本即可生成可编辑导图，适合已有文档迁移
- 🩹 **坏文件自修复**：解析失败时高亮错误行并支持一键格式化，AI 改坏的文件也能救回
- 💾 **本地优先**：文档只在你打开的本地文件中流转，不上传服务器；浏览器仅缓存当前文档文本用于刷新恢复（关闭文件即清除）
- 🖼️ **多格式导出**：PNG / SVG / `.mindforai` / `.drawnixlite`
- ⌨️ **多窗口编辑**：可同时打开多个窗口编辑不同文档
- 🌐 **多语言界面**：中文 / English / Русский / العربية / Tiếng Việt
- 📱 **移动端适配 + 无限画布**：缩放、滚动、主题切换
- 🚀 **在线使用 + 私有部署**：可直接打开 [GitHub Pages 在线版](https://fantasylincen.github.io/mindforai/)，也可用 Docker 部署到自己的机器
- ♻️ **MIT 开源协议**：可自由商用、修改、私有化部署

## 快速开始

### 直接在线使用

打开 <https://fantasylincen.github.io/mindforai/>，无需安装、无需注册。

> 文档只在你打开的本地文件中流转，不会上传到任何服务器。

### 本地 Docker 部署

> **只需要本机装了 Docker**，一条命令搞定安装、部署、运行。

#### 第 1 步：克隆项目

```bash
git clone https://github.com/fantasylincen/mindforai.git
cd mindforai
```

#### 第 2 步：一键部署并运行

**Windows**（双击即可，无需敲命令）：

```
rundocker.bat
```

**macOS**：

```bash
bash rundocker-macos.sh
```

**Linux**：

```bash
bash rundocker-linux.sh
```

**任意系统（Bash）**：`bash rundocker.sh`

脚本会自动完成：检查 Docker → 构建镜像 → 启动容器 → 等待就绪 → **自动打开浏览器**。

部署完成后访问 **<http://localhost:8080>**。容器以 `docker run --rm` 启动：
只要停止容器（Docker Desktop 停止按钮、`docker stop mindforai` 或 `bash rundocker.sh stop`），该容器都会被自动删除。

> 想换端口？`MINDFORAI_PORT=9000 bash rundocker.sh`（Windows：先在系统环境变量中设置 `MINDFORAI_PORT`）
>
> 脚本详细说明见 [`deploy/README.md`](./deploy/README.md)。

### 不用 Docker？本地源码运行

**Windows**：双击 `runsrc.bat`（再次双击即重启，`runsrc.bat stop` 停止）

**macOS / Linux**：`bash runsrc.sh`（再次运行即重启，`bash runsrc.sh stop` 停止）

脚本会自动安装依赖、后台启动开发服务器、等待端口可访问后用默认浏览器打开 <http://localhost:7200>。

也可以手动运行：

```bash
npm install
npm start
```

### 构建生产包

```bash
npm install
npm run build:web      # 产物输出到 dist/apps/web
```

## 文件格式

MindForAI 支持两种文档格式，可在「另存为」菜单中自由选择：

| 格式 | 后缀名 | 内容 | 适用场景 |
| --- | --- | --- | --- |
| **MindForAI** | `.mindforai` | 紧凑树状文本 | **首选**：喂给 AI，体积小、层级清晰 |
| **DrawnixLite** | `.drawnixlite` | 精简 JSON 树 | 需要程序化解析的中间格式 |

`.mindforai` 文件长这样（一个 TODO 列表）：

```text
type: mindforai
version: 1
content[1]:
  - text: TODOS
    children[2]:
      - 优先读取项目核心文档 ./project.mindforai
      - text: 规则
        children[1]:
          - 最终给用户的报告需要使用中文
```

格式规则：每个节点文本都不加双引号，`-` 后直接跟内容；叶子节点独占一行，不再用逗号拼接。

**为什么用这套文本格式？** 相比 JSON，它用缩进表达层级，省去了大量括号和逗号，在相同信息量下体积更小、token 更省，AI 解析起来也更直观；相比 Markdown，它没有标题层级和列表符号的维护负担，节点可以整支拖拽、复制与复用，人类和 AI 都更容易定位与改写。

## 文档模板库

[`templates/Templets.mindforai`](./templates/Templets.mindforai) 是一份可直接拖进 MindForAI 打开的模板合集，把真实项目文档、任务看板、常用工作方法与代码审查流程放在同一棵树里：

- **示例项目A: mindforai**：项目核心文档、已完成 / 处理中任务、TODO 与使用说明
- **示例项目B: BeamStreamS3**：ESP32-S3 Wi-Fi 麦克风的硬件约定、固件模块、配置协议与任务记录
- **作者常用的工作方法**：本机 Agent 操作 Docker、一键部署脚本、Web 版 AI 常用方法、启动旧项目的第一步
- **我们的终极目标**：1文档 + 1Agent = 1项目

下载后把文件放进项目根目录，或直接拖进 MindForAI 打开，按自己的项目改写；也可以只右键复制需要的那一支，作为独立文档继续使用。也欢迎把你经常使用、效果稳定的模板提交到 [`templates/`](./templates/) 目录，让更多人直接复用。

## 文件出错怎么办

打开或拖入文件时，MindForAI 会先根据文件名后缀判断格式，判断不出时再读取文件开头的类型声明。若内容无法解析（例如被 AI 改坏的 `.mindforai`），页面会弹出文本修正编辑器：

- 对 `.mindforai` / `.drawnixlite` 均有语法着色
- 出错的行用红线标出，并列出“第 N 行 + 错误原因”，点击可直接跳转
- 支持一键「格式化」、直接「保存」回原文件，或修正后「校验并打开」

## 怎么用

1. **拆模块** —— 按「模块 → 文件 → 职责」把项目拆成树，关键节点标注模块 ID 与文件路径
2. **画出来** —— 打开 MindForAI，用思维导图工具补全结构；规则、行为约束、验收标准各占一个节点
3. **存下来** —— 「另存为」→ 选择 `MindForAI File (.mindforai)`
4. **喂给 AI** —— 把 `.mindforai` 放进项目根目录，或直接粘贴给 AI 助手；AI 会沿树定位，而不是全文搜索

在 Claude Code / Cursor 中可以这样开场：

```
请先阅读 ./project.mindforai，按模块 ID 与文件路径定位修改点，不要全仓库搜索，然后……
```

> 推荐工作流：先做项目模块化拆解，再派发任务。拆得越清晰，AI 找到修改点越快，浪费的 token 越少。

## 界面说明

- **默认主题为「暗夜」**，画布与工具栏均为深色；可在右下角主题下拉框中切换。
- **「打开新窗口」**（左上角菜单 → 打开新窗口）会在新标签页打开一块**空白画布**，
  与当前窗口的文档互相独立，适合同时编辑多份文档。
- **网页标题跟随文件名**：打开文件后，浏览器标签页标题会变成 `文件名 - MindForAI`，
  顶部工具栏也会显示当前文件名。

## 开发

### 环境要求

- Node.js 20+（推荐使用 [nvm](https://github.com/nvm-sh/nvm) 管理版本，仓库提供 `.nvmrc`）
- npm 10+

### 常用命令

```bash
npm start            # 启动开发服务器
npm run build        # 构建全部包
npm run build:web    # 仅构建 Web 应用
npm test             # 运行全部单元测试
npm run lint         # 代码检查
npm run format       # 代码格式化
node scripts/generate-icons.mjs 03-chat   # 生成图标候选，并把 03 设为生效图标
```

### 更换图标

`apps/web/public/logo/icons/` 下有 10 个候选图标（`01-mindmap` ~ `10-radial`），
预览页：<http://localhost:7200/logo/icons/index.html>。

选好后替换生效图标并重新生成资源：

```bash
node scripts/generate-icons.mjs 03-chat   # 把 03-chat 设为生效图标
```

详细说明见 [docs/brand.md](./docs/brand.md)。

### 仓库结构

```
mindforai/
├── apps/
│   ├── web/                  # Web 应用（Vite + React 19）
│   └── web-e2e/              # Playwright 端到端测试
├── packages/
│   ├── mindforai/            # 核心白板库（组件 + 插件 + 文档序列化）
│   ├── react-board/          # 白板 React 渲染层
│   └── react-text/           # 富文本渲染模块
├── templates/                # 可复用的 .mindforai 文档模板
├── .github/workflows/        # GitHub Pages 自动部署
├── runsrc.sh / runsrc.ps1 + runsrc.bat        # 本地源码一键启动
├── rundocker.sh / rundocker-*.sh / rundocker.ps1 + .bat  # Docker 一键部署
├── deploy/                   # 启动与部署脚本说明（脚本本体在仓库根目录）
├── docs/                     # 项目文档
├── Dockerfile                # 多阶段构建：Node 构建 → 静态站点
├── docker-compose.yml        # 可选的 compose 编排（脚本默认用 docker run --rm）
└── package.json              # Nx monorepo 根配置
```

## 技术栈

- **框架**：[Plait](https://github.com/worktile/plait) —— 开源画图框架
- **前端**：React 19 + TypeScript + Vite + Nx monorepo
- **富文本**：[Slate](https://github.com/ianstormtaylor/slate)
- **AI 格式**：行式缩进树状文本（兼容旧版 TOON 文档读取）
- **部署**：GitHub Pages + Docker + Nginx 静态托管

## 致谢

**衷心感谢 [Drawnix](https://github.com/plait-board/drawnix) 原项目及其开发团队，也感谢所有为 AI 付出努力的开发者、研究者、开源贡献者与模型 / 工具提供者。**

MindForAI 基于 Drawnix 演进而来。特别感谢 Drawnix 原作者在画板内核、思维导图、流程图、无限画布、插件架构等方面的开源贡献，正是这些优秀的工作让本项目得以站在更高起点上。

同时特别感谢 DeepSeek 团队在模型能力与开放生态上的贡献，让个人开发者与小团队也能以更低的成本获得强大的 AI 编程能力。

也感谢 [Plait](https://github.com/worktile/plait) 画图框架的维护者，以及每一位通过 Issue、PR、文档与反馈帮助 MindForAI 成长的人。

> ⚠️ 本项目为独立衍生项目，与 Drawnix 原项目团队无隶属关系；原项目商标与版权归其原作者所有。

## 参与贡献

欢迎任何形式的贡献 —— 提 Issue、提 Bug、贡献代码、完善文档、提交好用的[文档模板](./templates/)。

提交 Issue 或 Pull Request 前，请先阅读 [贡献指南](./CONTRIBUTING.md) 与 [行为准则](./CODE_OF_CONDUCT.md)。

## 许可证

[MIT License](./LICENSE) © MindForAI Contributors
