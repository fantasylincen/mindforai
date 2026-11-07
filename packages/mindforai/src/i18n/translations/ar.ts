import { Translations } from '../types';

const arTranslations: Translations = {
  // Toolbar items
  'toolbar.hand': 'اليد — H',
  'toolbar.selection': 'التحديد — V',
  'toolbar.mind': 'خريطة ذهنية — M',
  'toolbar.edit': 'تحرير',

  // Zoom controls
  'zoom.in': 'تكبير — Cmd++',
  'zoom.out': 'تصغير — Cmd+-',
  'zoom.fit': 'ملاءمة الشاشة',
  'zoom.100': 'تكبير إلى 100%',

  // Themes
  'theme.default': 'افتراضي',
  'theme.colorful': 'ملون',
  'theme.soft': 'ناعم',
  'theme.retro': 'كلاسيكي',
  'theme.dark': 'داكن',
  'theme.starry': 'ليلي',

  // Colors
  'color.none': 'لون الموضوع',
  'color.unknown': 'لون آخر',
  'color.default': 'أسود أساسي',
  'color.white': 'أبيض',
  'color.gray': 'رمادي',
  'color.deepBlue': 'أزرق غامق',
  'color.red': 'أحمر',
  'color.green': 'أخضر',
  'color.yellow': 'أصفر',
  'color.purple': 'بنفسجي',
  'color.orange': 'برتقالي',
  'color.pastelPink': 'وردي فاتح',
  'color.cyan': 'سماوي',
  'color.brown': 'بني',
  'color.forestGreen': 'أخضر غامق (غابة)',
  'color.lightGray': 'رمادي فاتح',

  // General
  'general.undo': 'تراجع',
  'general.redo': 'إعادة',
  'general.menu': 'قائمة التطبيق',
  'general.delete': 'حذف',

  // Language
  'language.switcher': 'اللغة',
  'language.chinese': '中文',
  'language.english': 'English',
  'language.russian': 'Русский',
  'language.arabic': 'عربي',
  'language.vietnamese': 'Tiếng Việt',
  'general.copyToClipboard': 'نسخ إلى الحافظة',
  'general.copyToClipboard.transparent': 'خلفية شفافة',

  // Menu items
  'menu.open': 'فتح',
  'menu.newWindow': 'فتح نافذة جديدة',
  'menu.saveFile': 'حفظ إلى الملف الحالي',
  'menu.saveAsFile': 'حفظ باسم',
  'menu.saveAsDrawnixLite': 'ملف DrawnixLite (.drawnixlite، JSON مضغوط)',
  'menu.saveAsMindForAI': 'ملف MindForAI (.mindforai، نص مضغوط)',
  'menu.saveAsMarkdown': 'ملف Markdown (.md، Markdown قياسي)',
  'menu.exportImage': 'تصدير صورة',
  'menu.exportImage.svg': 'SVG',
  'menu.exportImage.png': 'PNG',
  'menu.exportImage.jpg': 'JPG',
  'menu.cleanBoard': 'مسح اللوحة',
  'menu.github': 'غيت هب',
  'menu.search': 'بحث في العقد',
  'menu.help': 'مساعدة',

  // Search panel
  'search.title': 'بحث في العقد',
  'search.placeholder': 'البحث في نص جميع العقد',
  'search.prev': 'النتيجة السابقة',
  'search.next': 'النتيجة التالية',
  'search.close': 'إغلاق البحث',
  'search.noResult': 'لا توجد نتائج مطابقة',

  // Help dialog
  'help.title': 'مساعدة',
  'help.description': 'العمليات الأساسية واختصارات لوحة المفاتيح الشائعة.',
  'help.close': 'إغلاق',
  'help.groupStart': 'العمليات الأساسية',
  'help.groupEdit': 'التحرير',
  'help.groupView': 'العرض والعقد',
  'help.groupDocument': 'المستند',
  'help.hand': 'أداة اليد (تحريك اللوحة)',
  'help.selection': 'أداة التحديد',
  'help.mind': 'أداة الخريطة الذهنية',
  'help.editNode': 'تحرير العقدة المحددة',
  'help.addChild': 'إضافة عقدة فرعية للعقدة المحددة',
  'help.multiSelect': 'تحديد عدة عقد',
  'help.saveAs': 'حفظ باسم',
  'help.exportSvg': 'تصدير SVG',
  'help.fitViewport': 'ملاءمة العرض',
  'help.collapseAllNodes': 'طي جميع العقد',
  'help.badgeCtrlClick': 'توسيع أو طي الكل من شارة الطي',
  'help.autoSave': 'حفظ تلقائي',
  'help.newDocument': 'مستند جديد / إغلاق المستند',
  'help.search': 'بحث في العقد',

  // Clean confirm dialog
  'cleanConfirm.title': 'مسح اللوحة',
  'cleanConfirm.description': 'سيؤدي هذا إلى مسح اللوحة بالكامل. هل تريد المتابعة؟',
  'cleanConfirm.cancel': 'إلغاء',
  'cleanConfirm.ok': 'موافق',

  // Link popup items
  'popupLink.delLink': 'حذف الرابط',

  // Tool popup items
  'popupToolbar.fillColor': 'لون التعبئة',
  'popupToolbar.stroke': 'الحد',
  'popupToolbar.opacity': 'مستوى شفافية',
  'popupToolbar.expandAll': 'توسيع الكل',
  'popupToolbar.collapseAll': 'طي الكل',
  'nodeMoreHint.expandAll': 'Ctrl+نقر: توسيع الكل (Ctrl + Alt + E)',
  'nodeMoreHint.collapseAll': 'Ctrl+نقر: طي الكل (Ctrl + Alt + C)',
  'popupToolbar.insertMermaidFlowchart': 'إدراج عقدة مخطط Mermaid',

  // Node context menu items
  'contextMenu.copyNode': 'نسخ (mindforai)',
  'contextMenu.copyDrawnixLite': 'نسخ (drawnixlite)',
  'contextMenu.copyMarkdown': 'نسخ (Markdown)',
  'contextMenu.pasteNodeAsChild': 'لصق',
  'toast.copySuccess': 'تم نسخ العقدة',
  'toast.copyFailed': 'فشل النسخ، اسمح بالوصول إلى الحافظة',
  'toast.pasteSuccess': 'تم اللصق كعقدة فرعية',
  'toast.pasteFailed': 'فشل اللصق، اختر عقدة خريطة ذهنية',
  'toast.pasteUnavailable': 'لا توجد عقدة متاحة في الحافظة',

  // Document status bar
  'statusBar.unsaved': 'غير محفوظ',
  'statusBar.saved': 'تم الحفظ',
  'statusBar.localOnly': 'مسودة محلية فقط',
  'statusBar.noFile': 'لا يوجد ملف',
  'statusBar.autoSave': 'حفظ تلقائي',
  'statusBar.autoSaveHint':
    'عند التفعيل، يتم الحفظ في الملف الحالي بعد انتهاء تحرير العقدة وعودة المؤشر إلى اللوحة',
  'statusBar.nodes': 'العقد',
  'statusBar.md5': 'MD5',

  // Document title
  'documentTitle.close': 'إغلاق الملف الحالي',

  // File drag and drop
  'toast.dropFileHint': 'أفلت ملف ‎.mindforai / .drawnixlite / .md هنا لفتحه',
  'toast.dropFileLoaded': 'تم فتح الملف: ',
  'toast.dropFileUnsupported': 'تنسيق ملف غير مدعوم',
  'toast.mergedFileNamePrefix': 'مستند مدمج (',
  'toast.mergedFileNameSuffix': ' ملفات)',
  'welcome.openOrDrop': 'افتح ملفًا أو أفلته هنا',
  'welcome.dropHere': 'أفلت الملفات هنا',
  'welcome.dropActive': 'أفلت لفتح الملف',
  'welcome.supportedFormats': 'أنواع الملفات المدعومة',
  'welcome.multiFileHint':
    'يمكنك إفلات عدة ملفات معًا، وسيتم تنظيمها في خريطة ذهنية واحدة حسب أسماء الملفات',
  'welcome.openFile': 'اختيار ملف',
  'toast.markdownSaveConverted': 'تم تحويل Markdown إلى تنسيق mindforai وحفظه',
  'toast.saveSuccess': 'تم حفظ الملف',
  'toast.saveFailed': 'فشل الحفظ، يرجى المحاولة مرة أخرى',

  'textEditor.title': 'خطأ في تنسيق الملف',
  'textEditor.description':
    'تعذر تحليل الملف. أصلح الأخطاء المحددة بالخط الأحمر أدناه ثم انقر على «التحقق والفتح».',
  'textEditor.editTitle': 'تحرير نص المستند',
  'textEditor.editDescription':
    'حرّر المستند الحالي كنص .mindforai ثم قم بالتنسيق والتحقق وتطبيق التغييرات.',
  'textEditor.format': 'تنسيق',
  'textEditor.open': 'التحقق والفتح',
  'textEditor.apply': 'تطبيق التغييرات',
  'textEditor.applySuccess': 'تم تحديث نص المستند',
  'textEditor.close': 'إغلاق',
  'textEditor.formatSuccess': 'تم التنسيق؛ لا تزال الأخطاء المتبقية محددة باللون الأحمر',
  'textEditor.formatFailed': 'لا يزال المستند يحتوي على أخطاء ولا يمكن تنسيقه',
  'textEditor.stillInvalid': 'لا يزال المستند يحتوي على أخطاء. يرجى متابعة الإصلاح.',
  'textEditor.valid': 'التنسيق صحيح وجاهز للفتح',
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
  'textPlaceholders.text': 'نص',

  // Line tool
  'line.source': 'بداية',
  'line.target': 'نهاية',
  'line.arrow': 'سهم',
  'line.none': 'لا شيء',

  // Stroke style
  'stroke.solid': 'صلب',
  'stroke.dashed': 'متقطع',
  'stroke.dotted': 'منقط',

  // Draw elements text
  'draw.lineText': 'نص',
  'draw.geometryText': 'نص',

  // Mind map elements text
  'mind.centralText': 'الموضوع المركزي',
  'mind.abstractNodeText': 'ملخص',

  'tutorial.title': 'MindForAI',
  'tutorial.description':
    'سبورة شاملة تتضمن الخرائط الذهنية والمخططات الانسيابية والرسم الحر وغير ذلك',
  'tutorial.dataDescription': 'تُحفظ المستندات في ملفاتك المحلية؛ افتحها أو احفظها بصيغة .mindforai',
  'tutorial.appToolbar': 'تصدير، إعدادات اللغة، ...',
  'tutorial.creationToolbar': 'اختر أداة لبدء الإنشاء',
  'tutorial.themeDescription': 'التبديل بين السمة الفاتحة والداكنة',
};

export default arTranslations;
