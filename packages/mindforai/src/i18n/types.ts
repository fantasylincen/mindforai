import { ReactNode } from 'react';

// Define supported languages
export type Language = 'zh' | 'en' | 'ru' | 'ar' | 'vi';

// Define translation keys and their corresponding values
export interface Translations {
  // Toolbar items
  'toolbar.hand': string;
  'toolbar.selection': string;
  'toolbar.mind': string;
  'toolbar.edit': string;

  // Zoom controls
  'zoom.in': string;
  'zoom.out': string;
  'zoom.fit': string;
  'zoom.100': string;

  // Themes
  'theme.default': string;
  'theme.colorful': string;
  'theme.soft': string;
  'theme.retro': string;
  'theme.dark': string;
  'theme.starry': string;

  // Colors
  'color.none': string;
  'color.unknown': string;
  'color.default': string;
  'color.white': string;
  'color.gray': string;
  'color.deepBlue': string;
  'color.red': string;
  'color.green': string;
  'color.yellow': string;
  'color.purple': string;
  'color.orange': string;
  'color.pastelPink': string;
  'color.cyan': string;
  'color.brown': string;
  'color.forestGreen': string;
  'color.lightGray': string;

  // General
  'general.undo': string;
  'general.redo': string;
  'general.menu': string;
  'general.delete': string;
  'general.copyToClipboard': string;
  'general.copyToClipboard.transparent': string;

  // Language
  'language.switcher': string;
  'language.chinese': string;
  'language.english': string;
  'language.russian': string;
  'language.arabic': string;
  'language.vietnamese': string;

  // Menu items
  'menu.open': string;
  'menu.newWindow': string;
  'menu.saveFile': string;
  'menu.saveAsFile': string;
  'menu.saveAsDrawnixLite': string;
  'menu.saveAsMindForAI': string;
  'menu.saveAsMarkdown': string;
  'menu.exportImage': string;
  'menu.exportImage.svg': string;
  'menu.exportImage.png': string;
  'menu.exportImage.jpg': string;
  'menu.cleanBoard': string;
  'menu.github': string;
  'menu.search': string;
  'menu.help': string;

  // Search panel
  'search.title': string;
  'search.placeholder': string;
  'search.prev': string;
  'search.next': string;
  'search.close': string;
  'search.noResult': string;

  // Help dialog
  'help.title': string;
  'help.description': string;
  'help.close': string;
  'help.groupStart': string;
  'help.groupEdit': string;
  'help.groupView': string;
  'help.groupDocument': string;
  'help.hand': string;
  'help.selection': string;
  'help.mind': string;
  'help.editNode': string;
  'help.addChild': string;
  'help.multiSelect': string;
  'help.saveAs': string;
  'help.exportSvg': string;
  'help.fitViewport': string;
  'help.collapseAllNodes': string;
  'help.badgeCtrlClick': string;
  'help.autoSave': string;
  'help.newDocument': string;
  'help.search': string;

  // Clean confirm dialog
  'cleanConfirm.title': string;
  'cleanConfirm.description': string;
  'cleanConfirm.cancel': string;
  'cleanConfirm.ok': string;

  // Link popup items
  'popupLink.delLink': string;

  // Tool popup items
  'popupToolbar.fillColor': string;
  'popupToolbar.stroke': string;
  'popupToolbar.opacity': string;
  'popupToolbar.expandAll': string;
  'popupToolbar.collapseAll': string;
  'popupToolbar.insertMermaidFlowchart': string;

  // Node more (expand / collapse badge) hint
  'nodeMoreHint.expandAll': string;
  'nodeMoreHint.collapseAll': string;

  // Node context menu items
  'contextMenu.copyNode': string;
  'contextMenu.copyDrawnixLite': string;
  'contextMenu.copyMarkdown': string;
  'contextMenu.pasteNodeAsChild': string;
  'toast.copySuccess': string;
  'toast.copyFailed': string;
  'toast.pasteSuccess': string;
  'toast.pasteFailed': string;
  'toast.pasteUnavailable': string;

  // Document status bar
  'statusBar.unsaved': string;
  'statusBar.saved': string;
  'statusBar.localOnly': string;
  'statusBar.noFile': string;
  'statusBar.autoSave': string;
  'statusBar.autoSaveHint': string;
  'statusBar.nodes': string;
  'statusBar.md5': string;

  // Document title
  'documentTitle.close': string;


  // File drag and drop
  'toast.dropFileHint': string;
  'toast.dropFileLoaded': string;
  'toast.dropFileUnsupported': string;
  'toast.mergedFileNamePrefix': string;
  'toast.mergedFileNameSuffix': string;
  'welcome.openOrDrop': string;
  'welcome.dropHere': string;
  'welcome.dropActive': string;
  'welcome.supportedFormats': string;
  'welcome.multiFileHint': string;
  'welcome.openFile': string;
  'toast.markdownSaveConverted': string;
  'toast.saveSuccess': string;
  'toast.saveFailed': string;

  'textEditor.title': string;
  'textEditor.description': string;
  'textEditor.editTitle': string;
  'textEditor.editDescription': string;
  'textEditor.format': string;
  'textEditor.open': string;
  'textEditor.apply': string;
  'textEditor.applySuccess': string;
  'textEditor.close': string;
  'textEditor.formatSuccess': string;
  'textEditor.formatFailed': string;
  'textEditor.stillInvalid': string;
  'textEditor.valid': string;
  'documentError.unknownFormat': string;
  'documentError.missingType': string;
  'documentError.invalidType': string;
  'documentError.invalidVersion': string;
  'documentError.missingContent': string;
  'documentError.invalidContentLine': string;
  'documentError.unexpectedLine': string;
  'documentError.invalidIndent': string;
  'documentError.invalidListItem': string;
  'documentError.invalidChildrenHeader': string;
  'documentError.inlineChildrenContent': string;
  'documentError.childrenCountMismatch': string;
  'documentError.contentCountMismatch': string;
  'documentError.unexpectedChildLine': string;
  'documentError.jsonSyntax': string;
  'documentError.missingCompactContent': string;
  'documentError.invalidCompactNode': string;
  'documentError.invalidDocumentStructure': string;

  // Text placeholders
  'textPlaceholders.text': string;

  // Line tool
  'line.source': string;
  'line.target': string;
  'line.arrow': string;
  'line.none': string;

  // Stroke style
  'stroke.solid': string;
  'stroke.dashed': string;
  'stroke.dotted': string;

  // Draw elements text
  'draw.lineText': string;
  'draw.geometryText': string;

  // Mind map elements text
  'mind.centralText': string;
  'mind.abstractNodeText': string;

  'tutorial.title': string;
  'tutorial.description': string;
  'tutorial.dataDescription': string;
  'tutorial.appToolbar': string;
  'tutorial.creationToolbar': string;
  'tutorial.themeDescription': string;
}

// I18n context interface
export interface I18nContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof Translations) => string;
}

// Provider props
export interface I18nProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
  initialLanguage?: Language;
  onLanguageChange?: (language: Language) => void;
}
