import { Translations } from '../types';

const zhTranslations: Translations = {
  // Toolbar items
  'toolbar.hand': '手形工具 — H',
  'toolbar.selection': '选择 — V',
  'toolbar.mind': '思维导图 — M',
  'toolbar.edit': '编辑',

  // Zoom controls
  'zoom.in': '放大 — Cmd++',
  'zoom.out': '缩小 — Cmd+-',
  'zoom.fit': '自适应',
  'zoom.100': '缩放至 100%',

  // Themes
  'theme.default': '默认',
  'theme.colorful': '缤纷',
  'theme.soft': '柔和',
  'theme.retro': '复古',
  'theme.dark': '暗夜',
  'theme.starry': '星空',

  // Colors
  'color.none': '主题颜色',
  'color.unknown': '其他颜色',
  'color.default': '黑色',
  'color.white': '白色',
  'color.gray': '灰色',
  'color.deepBlue': '深蓝色',
  'color.red': '红色',
  'color.green': '绿色',
  'color.yellow': '黄色',
  'color.purple': '紫色',
  'color.orange': '橙色',
  'color.pastelPink': '淡粉色',
  'color.cyan': '青色',
  'color.brown': '棕色',
  'color.forestGreen': '森绿色',
  'color.lightGray': '浅灰色',

  // General
  'general.undo': '撤销',
  'general.redo': '重做',
  'general.menu': '应用菜单',
  'general.delete': '删除',

  'general.copyToClipboard': '复制到剪贴板',
  'general.copyToClipboard.transparent': '透明背景',

  // Language
  'language.switcher': 'Language',
  'language.chinese': '中文',
  'language.english': 'English',
  'language.russian': 'Русский',
  'language.arabic': 'عربي',
  'language.vietnamese': 'Tiếng Việt',
  // Menu items
  'menu.open': '打开',
  'menu.newWindow': '打开新窗口',
  'menu.saveFile': '保存到当前文件',
  'menu.saveAsFile': '另存为',
  'menu.saveAsDrawnixLite': 'DrawnixLite 文件（.drawnixlite，精简 JSON）',
  'menu.saveAsMindForAI': 'MindForAI 文件（.mindforai，紧凑文本）',
  'menu.saveAsMarkdown': 'Markdown 文件（.md，标准 Markdown）',
  'menu.exportImage': '导出图片',
  'menu.exportImage.svg': 'SVG',
  'menu.exportImage.png': 'PNG',
  'menu.exportImage.jpg': 'JPG',
  'menu.cleanBoard': '清除画布',
  'menu.github': 'GitHub',
  'menu.search': '搜索节点',
  'menu.help': '帮助',

  // Search panel
  'search.title': '搜索节点',
  'search.placeholder': '搜索所有节点文本',
  'search.prev': '上一个匹配',
  'search.next': '下一个匹配',
  'search.close': '关闭搜索',
  'search.noResult': '没有匹配结果',

  // Help dialog
  'help.title': '帮助',
  'help.description': '以下是基本操作方法与常用快捷键。',
  'help.close': '关闭',
  'help.groupStart': '基本操作',
  'help.groupEdit': '编辑',
  'help.groupView': '视图与节点',
  'help.groupDocument': '文档',
  'help.hand': '手形工具（拖动画布）',
  'help.selection': '选择工具',
  'help.mind': '思维导图工具',
  'help.editNode': '编辑选中节点',
  'help.addChild': '为选中节点新增子节点',
  'help.multiSelect': '多选节点',
  'help.saveAs': '另存为',
  'help.exportSvg': '导出 SVG',
  'help.fitViewport': '适配视图',
  'help.collapseAllNodes': '折叠全部节点',
  'help.badgeCtrlClick': '点击折叠气泡时全部展开或折叠',
  'help.autoSave': '自动保存',
  'help.newDocument': '新建 / 关闭文档',
  'help.search': '搜索节点',

  // Clean confirm dialog
  'cleanConfirm.title': '清除画布',
  'cleanConfirm.description': '这将会清除整个画布。你是否要继续?',
  'cleanConfirm.cancel': '取消',
  'cleanConfirm.ok': '确认',

  // Link popup items
  'popupLink.delLink': '移除连结',

  // Tool popup items
  'popupToolbar.fillColor': '填充颜色',
  'popupToolbar.stroke': '边框',
  'popupToolbar.opacity': '不透明度',
  'popupToolbar.expandAll': '全部展开',
  'popupToolbar.collapseAll': '全部折叠',
  'nodeMoreHint.expandAll': '按住 Ctrl 点击：全部展开（Ctrl + Alt + E）',
  'nodeMoreHint.collapseAll': '按住 Ctrl 点击：全部折叠（Ctrl + Alt + C）',
  'popupToolbar.insertMermaidFlowchart': '插入Mermaid流程图节点',

  // Node context menu items
  'contextMenu.copyNode': '复制 (mindforai)',
  'contextMenu.copyDrawnixLite': '复制 (drawnixlite)',
  'contextMenu.copyMarkdown': '复制 (Markdown)',
  'contextMenu.pasteNodeAsChild': '粘贴',
  'toast.copySuccess': '节点已复制',
  'toast.copyFailed': '复制失败，请允许剪贴板权限',
  'toast.pasteSuccess': '已粘贴为子节点',
  'toast.pasteFailed': '粘贴失败，请选择思维导图节点',
  'toast.pasteUnavailable': '剪贴板中没有可用的节点',

  // Document status bar
  'statusBar.unsaved': '未保存',
  'statusBar.saved': '已保存',
  'statusBar.localOnly': '仅本地草稿',
  'statusBar.noFile': '未关联文件',
  'statusBar.autoSave': '自动保存',
  'statusBar.autoSaveHint': '勾选后，节点编辑结束且鼠标回到画布时自动保存到当前文件',
  'statusBar.nodes': '节点数',
  'statusBar.md5': 'MD5',

  // Document title
  'documentTitle.close': '关闭当前文件',

  // File drag and drop
  'toast.dropFileHint': '拖拽 .mindforai / .drawnixlite / .md 文件到此处打开',
  'toast.dropFileLoaded': '已打开文件：',
  'toast.dropFileUnsupported': '不支持的文件格式',
  'toast.mergedFileNamePrefix': '合并文档（',
  'toast.mergedFileNameSuffix': ' 个文件）',
  'welcome.openOrDrop': '打开文件，或把文件拖到这里',
  'welcome.dropHere': '把文件拖到这里',
  'welcome.dropActive': '松开鼠标，即可打开文件',
  'welcome.supportedFormats': '支持的文件类型',
  'welcome.multiFileHint': '支持同时拖入多个文件，自动按文件名组织成一张思维导图',
  'welcome.openFile': '选择文件',
  'toast.markdownSaveConverted': 'Markdown 已转换为 mindforai 格式并保存',
  'toast.saveSuccess': '文件已保存',
  'toast.saveFailed': '保存失败，请重试',

  'textEditor.title': '文件格式错误',
  'textEditor.description': '当前文件无法解析。请修复下方用红线标出的错误，然后点击“校验并打开”。',
  'textEditor.editTitle': '编辑文档文本',
  'textEditor.editDescription': '直接编辑当前文档的 .mindforai 文本，修改后可格式化、校验并应用。',
  'textEditor.format': '格式化',
  'textEditor.open': '校验并打开',
  'textEditor.apply': '应用修改',
  'textEditor.applySuccess': '文档文本已更新',
  'textEditor.close': '关闭',
  'textEditor.formatSuccess': '已格式化，仍有错误时会继续标红',
  'textEditor.formatFailed': '文档仍有错误，无法完成格式化',
  'textEditor.stillInvalid': '文档仍有错误，请继续修正',
  'textEditor.valid': '格式正确，可以打开',
  'documentError.unknownFormat': '无法识别文件格式，请确认文件是 .mindforai 或 .drawnixlite',
  'documentError.missingType': '缺少 type: mindforai 文件头',
  'documentError.invalidType': '文件类型声明无效',
  'documentError.invalidVersion': 'version 必须为正整数',
  'documentError.missingContent': '缺少 content 定义',
  'documentError.invalidContentLine': 'content 行格式无效',
  'documentError.unexpectedLine': '无法识别的行',
  'documentError.invalidIndent': '缩进层级不匹配',
  'documentError.invalidListItem': '列表项必须以“- ”开头',
  'documentError.invalidChildrenHeader': 'children 行格式无效',
  'documentError.inlineChildrenContent': 'children 行不能包含内联内容',
  'documentError.childrenCountMismatch': 'children 数量与实际子节点数量不一致',
  'documentError.contentCountMismatch': 'content 数量与实际根节点数量不一致',
  'documentError.unexpectedChildLine': '该行缩进过深或缺少 children 定义',
  'documentError.jsonSyntax': 'JSON 语法错误',
  'documentError.missingCompactContent': '缺少 content 数组',
  'documentError.invalidCompactNode': 'content 中存在无效节点',
  'documentError.invalidDocumentStructure': '文档结构无效',

  // Text placeholders
  'textPlaceholders.text': '文本',

  // Line tool
  'line.source': '起点',
  'line.target': '终点',
  'line.arrow': '箭头',
  'line.none': '无',

  // Stroke style
  'stroke.solid': '实线',
  'stroke.dashed': '虚线',
  'stroke.dotted': '点线',

  // Draw elements text
  'draw.lineText': '文本',
  'draw.geometryText': '文本',

  // Mind map elements text
  'mind.centralText': '中心主题',
  'mind.abstractNodeText': '摘要',

  //markdown example

  'tutorial.title': 'MindForAI',
  'tutorial.description': '用思维导图生成喂给 AI 的项目文档：核心文档、TODO 清单、缺陷报告',
  'tutorial.dataDescription': '文档只保存在你的本地文件中，打开或另存为 .mindforai 即可投喂给 AI',
  'tutorial.appToolbar': '导出，语言设置，...',
  'tutorial.creationToolbar': '选择一个工具开始你的创作',
  'tutorial.themeDescription': '在明亮和黑暗主题之间切换',
};

export default zhTranslations;
