# MindForAI 模板库

这里收录可被直接复用的 `.mindforai` 文档模板。下载后把文件放进你的项目根目录，或直接拖入 [MindForAI](https://fantasylincen.github.io/mindforai/) 打开，按自己的项目改写即可。

## 已有模板

| 模板 | 用途 |
| --- | --- |
| [project.mindforai](./project.mindforai) | 项目核心文档：项目定位、模块划分、关键约定与常见任务 |
| [todo.mindforai](./todo.mindforai) | 任务清单：规则、任务拆解、禁止行为与验收标准 |
| [bug-report.mindforai](./bug-report.mindforai) | 缺陷报告：环境、复现步骤、现象、影响与修复建议 |
| [ai-rules.mindforai](./ai-rules.mindforai) | AI 协作规则：角色、编码规范、工作流程与交付要求 |
| [code-map.mindforai](./code-map.mindforai) | 代码地图：以文件夹结构为指引，一句话描述文件与目录职责 |

## 使用建议

- 模板只是起点，删掉不适用的分支，保留能约束 AI 行为的节点。
- 单个程序文件的职责描述保持一句话，不把实现细节写进代码地图。
- 作为 AI 规则使用时，把「规则」与「禁止行为」放在树的靠前位置，减少模型忽略约束的概率。
- 建议配合项目核心文档使用：先让 AI 读 `project.mindforai` 建立全局认知，再读 `todo.mindforai` 领取任务。

## 欢迎提交模板

如果你有一套经常使用、效果稳定的文档结构，欢迎提交 PR：

1. 新建一个 `.mindforai` 文件，文件名使用小写英文与连字符。
2. 在本文的模板表格中补充一行说明。
3. 确保文件能被 MindForAI 正常打开（`type: mindforai` 与 `version: 1` 是必需的文件头）。
4. 附上使用场景与适用对象，方便其他人判断是否复用。
