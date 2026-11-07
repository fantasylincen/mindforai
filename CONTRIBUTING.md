# 贡献指南 / Contributing to MindForAI

感谢你的贡献。缺陷修复、测试、文档、翻译、性能优化以及聚焦的功能改进都欢迎。

## 社区语言 / Community Language

MindForAI 的 Issue、Pull Request、Discussion、Code Review、提交信息以及贡献者文档统一使用**中文或英文**。本地化产品文案（i18n）欢迎提交，但讨论本身建议使用中文或英文保持一致。

## 开始之前 / Before You Start

- 先搜索已有的 Issue 与 Discussion。
- 缺陷请基于最新的 `main` 分支复现。
- 每个 Issue / PR 只聚焦一个问题。
- 大型功能、架构调整或 `.mindforai` 格式变更，请先讨论再动手。
- AI 辅助得出的结论需要自行验证，不要直接提交未经验证的 AI 审计输出或批量 Issue。

## 本地开发 / Local Development

请使用 `.nvmrc` 中指定的 Node.js 版本。

```bash
npm ci
npm run start
```

提交 Pull Request 前，请运行与改动相关的检查：

```bash
npm run lint
npm run format:check
npm run test
npm run build
```

涉及交互改动的，请在安装 Playwright 浏览器后运行 E2E 测试：

```bash
npx playwright install
npx nx e2e web-e2e
```

## Pull Request

- 以 `main` 分支为目标分支。
- 使用清晰的中文或英文标题、描述与提交信息。
- 说明改了什么、为什么改；有相关 Issue 时请链接。
- 行为变更请补充或更新测试。
- 界面变更请附上截图或录屏。
- 必要时同步更新文档与翻译。
- 修改导入、导出、剪贴板或序列化行为时，保持对既有 `.drawnix` / `.smalldrawnix` 文件的兼容。
- 避免夹带无关的格式化、重构或依赖变更。

## AI 辅助贡献 / AI-Assisted Contributions

欢迎使用 AI 工具，但你仍需对自己的提交负责。如果代码、测试或文档由 AI 生成或被大幅修改，请主动披露：

- 使用的工具与模型（若已知）
- AI 协助的具体部分
- 你的评审与测试过程

你必须理解、能解释并能维护所提交的改动。未经整理或验证的 AI 原始输出不被接受。单纯的补全、拼写与格式化协助无需披露。

请勿向外部 AI 服务提供密钥、私有漏洞细节、个人数据或未授权内容。

## 许可证 / License

提交贡献即表示你同意你的贡献将按仓库的 MIT License 授权。
