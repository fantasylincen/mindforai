# 安全策略 / Security Policy

## 支持的版本 / Supported Versions

| 版本 | 状态 |
| --- | --- |
| latest | ✅ 支持 |
| 低于 latest | ❌ 不再维护 |

## 报告漏洞 / Reporting a Vulnerability

**请不要通过公开 Issue 报告安全漏洞。**

请通过 GitHub 私密漏洞报告功能提交：
<https://github.com/fantasylincen/mindforai/security/advisories/new>

或发送邮件至维护者邮箱。

请在报告中尽可能提供：

- 受影响的文件格式 / 代码路径
- 复现步骤
- 潜在影响范围
- 已知的缓解方案

我们承诺在收到报告后 **48 小时内** 给出初步响应，并在问题修复后公开披露。

## 数据与隐私 / Data & Privacy

MindForAI 是一个**本地优先**的应用：

- 应用不会将画板数据上传到任何服务器
- 当前打开的文档文本会临时写入浏览器 localStorage，用于刷新页面后恢复；关闭或清空当前文件时自动删除
- 语言与主题随文档清单一并保存在文件中，不单独写入浏览器存储
- 导出的 `.mindforai` / `.smalldrawnix` / `.drawnix` / `.md` 文件始终保存在你的设备上

如果你的部署环境中包含反向代理、访问日志或第三方分析脚本，请自行评估并配置相应策略。
