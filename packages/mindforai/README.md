# @mindforai/mindforai

MindForAI 的核心白板库：提供无限画布、思维导图、流程图、自由绘制，以及面向 AI 的文档导出能力（`.mindforai` / `.smalldrawnix` / `.drawnix`）。

本库由 [Nx](https://nx.dev) 生成并维护。

## 运行单元测试

执行 `nx test mindforai` 即可通过 [Vitest](https://vitest.dev/) 运行单元测试。

## 文件出错怎么办

打开或拖入文件时，先根据文件后缀判断格式，判断不出时再读取文件开头的类型声明。内容无法解析时会弹出文本修正编辑器：支持三种格式的语法着色、红线标出错误行、按“行号 + 原因”列出错误、格式化、保存回原文件，以及修正后直接打开。
