import { Translations } from '../types';

const ruTranslations: Translations = {
  // Toolbar items
  'toolbar.hand': 'Рука — H',
  'toolbar.selection': 'Выделение — V',
  'toolbar.mind': 'Mind-карта — M',
  'toolbar.edit': 'Редактировать',

  // Zoom controls
  'zoom.in': 'Увеличить — Cmd++',
  'zoom.out': 'Уменьшить — Cmd+-',
  'zoom.fit': 'По размеру экрана',
  'zoom.100': 'Сбросить к 100%',

  // Themes
  'theme.default': 'Стандартная',
  'theme.colorful': 'Красочная',
  'theme.soft': 'Мягкая',
  'theme.retro': 'Старинная',
  'theme.dark': 'Тёмная',
  'theme.starry': 'Звёздная',

  // Colors
  'color.none': 'Автоматически',
  'color.unknown': 'Другой цвет',
  'color.default': 'Чёрный',
  'color.white': 'Белый',
  'color.gray': 'Серый',
  'color.deepBlue': 'Голубой',
  'color.red': 'Красный',
  'color.green': 'Зелёный',
  'color.yellow': 'Жёлтый',
  'color.purple': 'Фиолетовый',
  'color.orange': 'Оранжевый',
  'color.pastelPink': 'Розовый',
  'color.cyan': 'Лиловый',
  'color.brown': 'Коричневый',
  'color.forestGreen': 'Сосновный',
  'color.lightGray': 'Светло-серый',

  // General
  'general.undo': 'Отменить',
  'general.redo': 'Вернуть',
  'general.menu': 'Меню приложения',
  'general.delete': 'Удалить',

  'general.copyToClipboard': 'Копировать в буфер обмена',
  'general.copyToClipboard.transparent': 'Прозрачный фон',
  // Language
  'language.switcher': 'Language',
  'language.chinese': '中文',
  'language.english': 'English',
  'language.russian': 'Русский',
  'language.arabic': 'عربي',
  'language.vietnamese': 'Tiếng Việt',

  // Menu items
  'menu.open': 'Открыть',
  'menu.newWindow': 'Открыть новое окно',
  'menu.saveFile': 'Сохранить в текущий файл',
  'menu.saveAsFile': 'Сохранить как',
  'menu.saveAsDrawnixLite': 'Файл DrawnixLite (.drawnixlite, сжатый JSON)',
  'menu.saveAsMindForAI': 'Файл MindForAI (.mindforai, компактный текст)',
  'menu.saveAsMarkdown': 'Файл Markdown (.md, стандартный markdown)',
  'menu.exportImage': 'Экспортировать',
  'menu.exportImage.svg': 'SVG',
  'menu.exportImage.png': 'PNG',
  'menu.exportImage.jpg': 'JPG',
  'menu.cleanBoard': 'Очистить доску',
  'menu.github': 'GitHub',
  'menu.search': 'Поиск узлов',
  'menu.help': 'Справка',

  // Search panel
  'search.title': 'Поиск узлов',
  'search.placeholder': 'Поиск по тексту всех узлов',
  'search.prev': 'Предыдущее совпадение',
  'search.next': 'Следующее совпадение',
  'search.close': 'Закрыть поиск',
  'search.noResult': 'Совпадений нет',

  // Help dialog
  'help.title': 'Справка',
  'help.description': 'Основные операции и распространённые сочетания клавиш.',
  'help.close': 'Закрыть',
  'help.groupStart': 'Основные операции',
  'help.groupEdit': 'Редактирование',
  'help.groupView': 'Вид и узлы',
  'help.groupDocument': 'Документ',
  'help.hand': 'Инструмент «Рука» (перемещение холста)',
  'help.selection': 'Инструмент выделения',
  'help.mind': 'Инструмент интеллект-карты',
  'help.editNode': 'Редактировать выбранный узел',
  'help.addChild': 'Добавить дочерний узел к выбранному',
  'help.multiSelect': 'Выбрать несколько узлов',
  'help.saveAs': 'Сохранить как',
  'help.exportSvg': 'Экспорт SVG',
  'help.fitViewport': 'Подогнать вид',
  'help.collapseAllNodes': 'Свернуть все узлы',
  'help.badgeCtrlClick': 'Развернуть или свернуть всё через значок сворачивания',
  'help.autoSave': 'Автосохранение',
  'help.newDocument': 'Новый / закрыть документ',
  'help.search': 'Поиск узлов',

  // Clean confirm dialog
  'cleanConfirm.title': 'Очистить доску',
  'cleanConfirm.description': 'Это удалит всё содержимое доски. Вы хотите продолжить?',
  'cleanConfirm.cancel': 'Отмена',
  'cleanConfirm.ok': 'ОК',

  // Link popup items
  'popupLink.delLink': 'Удалить ссылку',

  // Tool popup items
  'popupToolbar.fillColor': 'Цвет заливки',
  'popupToolbar.stroke': 'Контур',
  'popupToolbar.opacity': 'Прозрачность',
  'popupToolbar.expandAll': 'Развернуть все',
  'popupToolbar.collapseAll': 'Свернуть все',
  'nodeMoreHint.expandAll': 'Ctrl+клик: развернуть все (Ctrl + Alt + E)',
  'nodeMoreHint.collapseAll': 'Ctrl+клик: свернуть все (Ctrl + Alt + C)',
  'popupToolbar.insertMermaidFlowchart': 'Вставить узел блок-схемы Mermaid',

  // Node context menu items
  'contextMenu.copyNode': 'Копировать (mindforai)',
  'contextMenu.copyDrawnixLite': 'Копировать (drawnixlite)',
  'contextMenu.copyMarkdown': 'Копировать (Markdown)',
  'contextMenu.pasteNodeAsChild': 'Вставить',
  'toast.copySuccess': 'Узел скопирован',
  'toast.copyFailed': 'Не удалось скопировать, разрешите доступ к буферу',
  'toast.pasteSuccess': 'Вставлено как дочерний узел',
  'toast.pasteFailed': 'Не удалось вставить, выберите узел карты',
  'toast.pasteUnavailable': 'В буфере нет доступного узла',

  // Document status bar
  'statusBar.unsaved': 'Не сохранено',
  'statusBar.saved': 'Сохранено',
  'statusBar.localOnly': 'Только локальный черновик',
  'statusBar.noFile': 'Нет файла',
  'statusBar.autoSave': 'Автосохранение',
  'statusBar.autoSaveHint':
    'Если включено, документ сохраняется в текущий файл после завершения редактирования узла и возврата указателя на холст',
  'statusBar.nodes': 'Узлов',
  'statusBar.md5': 'MD5',

  // Document title
  'documentTitle.close': 'Закрыть текущий файл',

  // File drag and drop
  'toast.dropFileHint': 'Перетащите файл .mindforai / .drawnixlite / .md сюда, чтобы открыть',
  'toast.dropFileLoaded': 'Открыт файл: ',
  'toast.dropFileUnsupported': 'Неподдерживаемый формат файла',
  'toast.mergedFileNamePrefix': 'Объединённый документ (',
  'toast.mergedFileNameSuffix': ' файлов)',
  'welcome.openOrDrop': 'Откройте файл или перетащите его сюда',
  'welcome.dropHere': 'Перетащите файлы сюда',
  'welcome.dropActive': 'Отпустите, чтобы открыть файл',
  'welcome.supportedFormats': 'Поддерживаемые типы файлов',
  'welcome.multiFileHint':
    'Можно перетащить несколько файлов сразу — они объединятся в одну карту по именам файлов',
  'welcome.openFile': 'Выбрать файл',
  'toast.markdownSaveConverted': 'Markdown преобразован в формат mindforai и сохранён',
  'toast.saveSuccess': 'Файл сохранён',
  'toast.saveFailed': 'Не удалось сохранить, попробуйте ещё раз',

  'textEditor.title': 'Ошибка формата файла',
  'textEditor.description':
    'Не удалось разобрать файл. Исправьте отмеченные красным ошибки ниже и нажмите «Проверить и открыть».',
  'textEditor.editTitle': 'Редактирование текста документа',
  'textEditor.editDescription':
    'Редактируйте текущий документ как текст .mindforai, затем отформатируйте, проверьте и примените изменения.',
  'textEditor.format': 'Форматировать',
  'textEditor.open': 'Проверить и открыть',
  'textEditor.apply': 'Применить изменения',
  'textEditor.applySuccess': 'Текст документа обновлён',
  'textEditor.close': 'Закрыть',
  'textEditor.formatSuccess': 'Отформатировано; оставшиеся ошибки по-прежнему отмечены красным',
  'textEditor.formatFailed': 'В документе ещё есть ошибки, форматирование невозможно',
  'textEditor.stillInvalid': 'В документе ещё есть ошибки. Продолжите исправление.',
  'textEditor.valid': 'Формат корректен, можно открыть',
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
  'textPlaceholders.text': 'Текст',

  // Line tool
  'line.source': 'Начало',
  'line.target': 'Конец',
  'line.arrow': 'Стрелка',
  'line.none': 'Нет',

  // Stroke style
  'stroke.solid': 'Сплошной',
  'stroke.dashed': 'Штриховой',
  'stroke.dotted': 'Пунктирный',

  // Draw elements text
  'draw.lineText': 'Текст',
  'draw.geometryText': 'Текст',

  // Mind map elements text
  'mind.centralText': 'Центральная тема',
  'mind.abstractNodeText': 'Резюме',

  'tutorial.title': 'MindForAI',
  'tutorial.description':
    'Универсальная доска: майнд-карты, блок-схемы, свободное рисование и многое другое',
  'tutorial.dataDescription':
    'Документы хранятся в ваших локальных файлах; открывайте или сохраняйте как .mindforai',
  'tutorial.appToolbar': 'Экспорт, настройки языка, ...',
  'tutorial.creationToolbar': 'Выберите инструмент, чтобы начать творить',
  'tutorial.themeDescription': 'Переключение между светлой и тёмной темами',
};

export default ruTranslations;
