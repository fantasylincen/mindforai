import { Translations } from '../types';

const enTranslations: Translations = {
  // Toolbar items
  'toolbar.hand': 'Hand — H',
  'toolbar.selection': 'Selection — V',
  'toolbar.mind': 'Mind — M',
  'toolbar.edit': 'Edit',

  // Zoom controls
  'zoom.in': 'Zoom In — Cmd++',
  'zoom.out': 'Zoom Out — Cmd+-',
  'zoom.fit': 'Fit to Screen',
  'zoom.100': 'Zoom to 100%',

  // Themes
  'theme.default': 'Default',
  'theme.colorful': 'Colorful',
  'theme.soft': 'Soft',
  'theme.retro': 'Retro',
  'theme.dark': 'Dark',
  'theme.starry': 'Starry',

  // Colors
  'color.none': 'Topic Color',
  'color.unknown': 'Other Color',
  'color.default': 'Basic Black',
  'color.white': 'White',
  'color.gray': 'Grey',
  'color.deepBlue': 'Deep Blue',
  'color.red': 'Red',
  'color.green': 'Green',
  'color.yellow': 'Yellow',
  'color.purple': 'Purple',
  'color.orange': 'Orange',
  'color.pastelPink': 'Paster Pink',
  'color.cyan': 'Cyan',
  'color.brown': 'Brown',
  'color.forestGreen': 'Forest Green',
  'color.lightGray': 'Light Grey',

  // General
  'general.undo': 'Undo',
  'general.redo': 'Redo',
  'general.menu': 'App Menu',
  'general.delete': 'Delete',
  'general.copyToClipboard': 'Copy to Clipboard',
  'general.copyToClipboard.transparent': 'Transparent',
  // Language
  'language.switcher': 'Language',
  'language.chinese': '中文',
  'language.english': 'English',
  'language.russian': 'Русский',
  'language.arabic': 'عربي',
  'language.vietnamese': 'Tiếng Việt',
  // Menu items
  'menu.open': 'Open',
  'menu.newWindow': 'Open New Window',
  'menu.saveFile': 'Save to current file',
  'menu.saveAsFile': 'Save As',
  'menu.saveAsDrawnixLite': 'DrawnixLite File (.drawnixlite, compact JSON)',
  'menu.saveAsMindForAI': 'MindForAI File (.mindforai, compact text)',
  'menu.saveAsMarkdown': 'Markdown File (.md, standard markdown)',
  'menu.exportImage': 'Export Image',
  'menu.exportImage.svg': 'SVG',
  'menu.exportImage.png': 'PNG',
  'menu.exportImage.jpg': 'JPG',
  'menu.cleanBoard': 'Clear Board',
  'menu.github': 'GitHub',
  'menu.search': 'Search Nodes',
  'menu.help': 'Help',

  // Search panel
  'search.title': 'Search nodes',
  'search.placeholder': 'Search all node text',
  'search.prev': 'Previous match',
  'search.next': 'Next match',
  'search.close': 'Close search',
  'search.noResult': 'No matches',

  // Help dialog
  'help.title': 'Help',
  'help.description': 'Basic operations and common keyboard shortcuts.',
  'help.close': 'Close',
  'help.groupStart': 'Basic operations',
  'help.groupEdit': 'Editing',
  'help.groupView': 'View and nodes',
  'help.groupDocument': 'Document',
  'help.hand': 'Hand tool (pan the canvas)',
  'help.selection': 'Selection tool',
  'help.mind': 'Mind map tool',
  'help.editNode': 'Edit selected node',
  'help.addChild': 'Add a child to the selected node',
  'help.multiSelect': 'Select multiple nodes',
  'help.saveAs': 'Save as',
  'help.exportSvg': 'Export SVG',
  'help.fitViewport': 'Fit view',
  'help.collapseAllNodes': 'Collapse all nodes',
  'help.badgeCtrlClick': 'Expand or collapse all from a collapse badge',
  'help.autoSave': 'Auto save',
  'help.newDocument': 'New / close document',
  'help.search': 'Search nodes',

  // Clean confirm dialog
  'cleanConfirm.title': 'Clear Board',
  'cleanConfirm.description': 'This will clear the entire board. Do you want to continue?',
  'cleanConfirm.cancel': 'Cancel',
  'cleanConfirm.ok': 'OK',

  // Link popup items
  'popupLink.delLink': 'Delete Link',

  // Tool popup items
  'popupToolbar.fillColor': 'Fill Color',
  'popupToolbar.stroke': 'Stroke',
  'popupToolbar.opacity': 'Opacity',
  'popupToolbar.expandAll': 'Expand All',
  'popupToolbar.collapseAll': 'Collapse All',
  'nodeMoreHint.expandAll': 'Ctrl+Click: Expand all (Ctrl + Alt + E)',
  'nodeMoreHint.collapseAll': 'Ctrl+Click: Collapse all (Ctrl + Alt + C)',
  'popupToolbar.insertMermaidFlowchart': 'Insert Mermaid flowchart node',

  // Node context menu items
  'contextMenu.copyNode': 'Copy (mindforai)',
  'contextMenu.copyDrawnixLite': 'Copy (drawnixlite)',
  'contextMenu.copyMarkdown': 'Copy (Markdown)',
  'contextMenu.pasteNodeAsChild': 'Paste',
  'toast.copySuccess': 'Node copied',
  'toast.copyFailed': 'Copy failed, allow clipboard permission',
  'toast.pasteSuccess': 'Pasted as child node',
  'toast.pasteFailed': 'Paste failed, select a mind map node',
  'toast.pasteUnavailable': 'No available node in clipboard',

  // Document status bar
  'statusBar.unsaved': 'Unsaved',
  'statusBar.saved': 'Saved',
  'statusBar.localOnly': 'Local draft only',
  'statusBar.noFile': 'No file',
  'statusBar.autoSave': 'Auto save',
  'statusBar.autoSaveHint':
    'When enabled, saves to the current file after node editing ends and the pointer returns to the canvas',
  'statusBar.nodes': 'Nodes',
  'statusBar.md5': 'MD5',

  // Document title
  'documentTitle.close': 'Close current file',

  // File drag and drop
  'toast.dropFileHint': 'Drop .mindforai / .drawnixlite / .md file here to open',
  'toast.dropFileLoaded': 'Opened file: ',
  'toast.dropFileUnsupported': 'Unsupported file format',
  'toast.mergedFileNamePrefix': 'Merged document (',
  'toast.mergedFileNameSuffix': ' files)',
  'welcome.openOrDrop': 'Open a file, or drop it here',
  'welcome.dropHere': 'Drop files here',
  'welcome.dropActive': 'Release to open the file',
  'welcome.supportedFormats': 'Supported file types',
  'welcome.multiFileHint':
    'Drop multiple files at once; they are organized into one mind map by file name',
  'welcome.openFile': 'Choose file',
  'toast.markdownSaveConverted': 'Markdown converted to mindforai format and saved',
  'toast.saveSuccess': 'File saved',
  'toast.saveFailed': 'Save failed, please try again',

  'textEditor.title': 'File format error',
  'textEditor.description':
    'The file could not be parsed. Fix the errors marked with a red line below, then click "Validate and open".',
  'textEditor.editTitle': 'Edit document text',
  'textEditor.editDescription':
    'Edit the current document as .mindforai text, then format, validate and apply the changes.',
  'textEditor.format': 'Format',
  'textEditor.open': 'Validate and open',
  'textEditor.apply': 'Apply changes',
  'textEditor.applySuccess': 'Document text updated',
  'textEditor.close': 'Close',
  'textEditor.formatSuccess': 'Formatted; remaining errors are still marked in red',
  'textEditor.formatFailed': 'The document still has errors and cannot be formatted',
  'textEditor.stillInvalid': 'The document still has errors. Please keep fixing it.',
  'textEditor.valid': 'Format is valid and ready to open',
  'documentError.unknownFormat': 'Unrecognized file format. Expected .mindforai or .drawnixlite',
  'documentError.missingType': "Missing 'type: mindforai' header",
  'documentError.invalidType': 'Invalid document type declaration',
  'documentError.invalidVersion': 'version must be a positive integer',
  'documentError.missingContent': 'Missing content definition',
  'documentError.invalidContentLine': 'Invalid content line format',
  'documentError.unexpectedLine': 'Unrecognized line',
  'documentError.invalidIndent': 'Indentation level mismatch',
  'documentError.invalidListItem': 'List items must start with "- "',
  'documentError.invalidChildrenHeader': 'Invalid children line format',
  'documentError.inlineChildrenContent': 'children line must not contain inline content',
  'documentError.childrenCountMismatch': 'children count does not match its actual child count',
  'documentError.contentCountMismatch': 'content count does not match its actual root count',
  'documentError.unexpectedChildLine': 'Line is indented too deep or missing a children definition',
  'documentError.jsonSyntax': 'JSON syntax error',
  'documentError.missingCompactContent': 'Missing content array',
  'documentError.invalidCompactNode': 'Invalid node in content',
  'documentError.invalidDocumentStructure': 'Invalid document structure',

  // Text placeholders
  'textPlaceholders.text': 'Text',

  // Line tool
  'line.source': 'Start',
  'line.target': 'End',
  'line.arrow': 'Arrow',
  'line.none': 'None',

  // Stroke style
  'stroke.solid': 'Solid',
  'stroke.dashed': 'Dashed',
  'stroke.dotted': 'Dotted',

  // Draw elements text
  'draw.lineText': 'Text',
  'draw.geometryText': 'Text',

  // Mind map elements text
  'mind.centralText': 'Central Topic',
  'mind.abstractNodeText': 'Summary',

  'tutorial.title': 'MindForAI',
  'tutorial.description':
    'Turn mind maps into AI-ready docs: core documents, TODO lists and bug reports',
  'tutorial.dataDescription':
    'Documents stay in your local files; open or save as .mindforai to feed your AI',
  'tutorial.appToolbar': 'Export, language settings, ...',
  'tutorial.creationToolbar': 'Select a tool to start your creation',
  'tutorial.themeDescription': 'Switch between light and dark themes',
};

export default enTranslations;
