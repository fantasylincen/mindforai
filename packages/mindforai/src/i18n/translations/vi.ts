import { Translations } from '../types';

const viTranslations: Translations = {
  // Toolbar items
  'toolbar.hand': 'Kéo — H',
  'toolbar.selection': 'Chọn — V',
  'toolbar.mind': 'Mind Map — M',
  'toolbar.edit': 'Chỉnh sửa',

  // Zoom controls
  'zoom.in': 'Phóng to — Cmd++',
  'zoom.out': 'Thu nhỏ — Cmd+-',
  'zoom.fit': 'Vừa màn hình',
  'zoom.100': 'Zoom 100%',

  // Themes
  'theme.default': 'Mặc định',
  'theme.colorful': 'Đầy màu sắc',
  'theme.soft': 'Nhẹ nhàng',
  'theme.retro': 'Cổ điển',
  'theme.dark': 'Tối',
  'theme.starry': 'Bầu trời sao',

  // Colors
  'color.none': 'Màu chủ đề',
  'color.unknown': 'Màu khác',
  'color.default': 'Đen cơ bản',
  'color.white': 'Trắng',
  'color.gray': 'Xám',
  'color.deepBlue': 'Xanh đậm',
  'color.red': 'Đỏ',
  'color.green': 'Xanh lá',
  'color.yellow': 'Vàng',
  'color.purple': 'Tím',
  'color.orange': 'Cam',
  'color.pastelPink': 'Hồng phấn',
  'color.cyan': 'Xanh lơ',
  'color.brown': 'Nâu',
  'color.forestGreen': 'Xanh rừng',
  'color.lightGray': 'Xám nhạt',

  // General
  'general.undo': 'Hoàn tác',
  'general.redo': 'Làm lại',
  'general.menu': 'Menu ứng dụng',
  'general.delete': 'Xóa',

  'general.copyToClipboard': 'Sao chép vào bộ nhớ tạm',
  'general.copyToClipboard.transparent': 'Nền trong suốt',
  // Language
  'language.switcher': 'Ngôn ngữ',
  'language.chinese': '中文',
  'language.english': 'English',
  'language.russian': 'Русский',
  'language.arabic': 'عربي',
  'language.vietnamese': 'Tiếng Việt',

  // Menu items
  'menu.open': 'Mở',
  'menu.newWindow': 'Mở cửa sổ mới',
  'menu.saveFile': 'Lưu vào tệp hiện tại',
  'menu.saveAsFile': 'Lưu thành',
  'menu.saveAsDrawnixLite': 'Tệp DrawnixLite (.drawnixlite, JSON rút gọn)',
  'menu.saveAsMindForAI': 'Tệp MindForAI (.mindforai, văn bản rút gọn)',
  'menu.saveAsMarkdown': 'Tệp Markdown (.md, markdown tiêu chuẩn)',
  'menu.exportImage': 'Xuất hình ảnh',
  'menu.exportImage.svg': 'SVG',
  'menu.exportImage.png': 'PNG',
  'menu.exportImage.jpg': 'JPG',
  'menu.cleanBoard': 'Xóa bảng',
  'menu.github': 'GitHub',
  'menu.search': 'Tìm kiếm nút',
  'menu.help': 'Trợ giúp',

  // Search panel
  'search.title': 'Tìm kiếm nút',
  'search.placeholder': 'Tìm trong văn bản của mọi nút',
  'search.prev': 'Kết quả trước',
  'search.next': 'Kết quả sau',
  'search.close': 'Đóng tìm kiếm',
  'search.noResult': 'Không có kết quả phù hợp',

  // Help dialog
  'help.title': 'Trợ giúp',
  'help.description': 'Các thao tác cơ bản và phím tắt thường dùng.',
  'help.close': 'Đóng',
  'help.groupStart': 'Thao tác cơ bản',
  'help.groupEdit': 'Chỉnh sửa',
  'help.groupView': 'Hiển thị và nút',
  'help.groupDocument': 'Tài liệu',
  'help.hand': 'Công cụ bàn tay (kéo bảng)',
  'help.selection': 'Công cụ chọn',
  'help.mind': 'Công cụ sơ đồ tư duy',
  'help.editNode': 'Chỉnh sửa nút đã chọn',
  'help.addChild': 'Thêm nút con cho nút đã chọn',
  'help.multiSelect': 'Chọn nhiều nút',
  'help.saveAs': 'Lưu thành',
  'help.exportSvg': 'Xuất SVG',
  'help.fitViewport': 'Vừa khung nhìn',
  'help.collapseAllNodes': 'Thu gọn tất cả nút',
  'help.badgeCtrlClick': 'Mở rộng hoặc thu gọn tất cả từ huy hiệu thu gọn',
  'help.autoSave': 'Tự động lưu',
  'help.newDocument': 'Tài liệu mới / đóng tài liệu',
  'help.search': 'Tìm kiếm nút',

  // Clean confirm dialog
  'cleanConfirm.title': 'Xóa bảng',
  'cleanConfirm.description': 'Thao tác này sẽ xóa toàn bộ bảng. Bạn có muốn tiếp tục không?',
  'cleanConfirm.cancel': 'Hủy',
  'cleanConfirm.ok': 'Đồng ý',

  // Link popup items
  'popupLink.delLink': 'Xóa liên kết',

  // Tool popup items
  'popupToolbar.fillColor': 'Màu tô',
  'popupToolbar.stroke': 'Đường viền',
  'popupToolbar.opacity': 'Độ trong suốt',
  'popupToolbar.expandAll': 'Mở rộng tất cả',
  'popupToolbar.collapseAll': 'Thu gọn tất cả',
  'nodeMoreHint.expandAll': 'Ctrl+Nhấp: mở rộng tất cả (Ctrl + Alt + E)',
  'nodeMoreHint.collapseAll': 'Ctrl+Nhấp: thu gọn tất cả (Ctrl + Alt + C)',
  'popupToolbar.insertMermaidFlowchart': 'Chèn nút lưu đồ Mermaid',

  // Node context menu items
  'contextMenu.copyNode': 'Sao chép (mindforai)',
  'contextMenu.copyDrawnixLite': 'Sao chép (drawnixlite)',
  'contextMenu.copyMarkdown': 'Sao chép (Markdown)',
  'contextMenu.pasteNodeAsChild': 'Dán',
  'toast.copySuccess': 'Đã sao chép nút',
  'toast.copyFailed': 'Sao chép thất bại, hãy cho phép quyền clipboard',
  'toast.pasteSuccess': 'Đã dán làm nút con',
  'toast.pasteFailed': 'Dán thất bại, hãy chọn nút sơ đồ tư duy',
  'toast.pasteUnavailable': 'Không có nút khả dụng trong clipboard',

  // Document status bar
  'statusBar.unsaved': 'Chưa lưu',
  'statusBar.saved': 'Đã lưu',
  'statusBar.localOnly': 'Chỉ bản nháp cục bộ',
  'statusBar.noFile': 'Không có tệp',
  'statusBar.autoSave': 'Tự động lưu',
  'statusBar.autoSaveHint':
    'Khi bật, tài liệu sẽ được lưu vào tệp hiện tại sau khi chỉnh sửa nút xong và con trỏ quay lại khung vẽ',
  'statusBar.nodes': 'Số nút',
  'statusBar.md5': 'MD5',

  // Document title
  'documentTitle.close': 'Đóng tệp hiện tại',

  // File drag and drop
  'toast.dropFileHint': 'Thả tệp .mindforai / .drawnixlite / .md vào đây để mở',
  'toast.dropFileLoaded': 'Đã mở tệp: ',
  'toast.dropFileUnsupported': 'Định dạng tệp không được hỗ trợ',
  'toast.mergedFileNamePrefix': 'Tài liệu hợp nhất (',
  'toast.mergedFileNameSuffix': ' tệp)',
  'welcome.openOrDrop': 'Mở tệp hoặc kéo tệp vào đây',
  'welcome.dropHere': 'Kéo tệp vào đây',
  'welcome.dropActive': 'Thả để mở tệp',
  'welcome.supportedFormats': 'Định dạng tệp được hỗ trợ',
  'welcome.multiFileHint':
    'Có thể kéo nhiều tệp cùng lúc, tự động sắp xếp thành một sơ đồ tư duy theo tên tệp',
  'welcome.openFile': 'Chọn tệp',
  'toast.markdownSaveConverted': 'Markdown đã được chuyển sang định dạng mindforai và lưu',
  'toast.saveSuccess': 'Đã lưu tệp',
  'toast.saveFailed': 'Lưu thất bại, vui lòng thử lại',

  'textEditor.title': 'Lỗi định dạng tệp',
  'textEditor.description':
    'Không thể phân tích tệp. Hãy sửa các lỗi được đánh dấu bằng đường đỏ bên dưới rồi nhấn "Kiểm tra và mở".',
  'textEditor.editTitle': 'Chỉnh sửa văn bản tài liệu',
  'textEditor.editDescription':
    'Chỉnh sửa tài liệu hiện tại dưới dạng văn bản .mindforai, sau đó định dạng, kiểm tra và áp dụng thay đổi.',
  'textEditor.format': 'Định dạng',
  'textEditor.open': 'Kiểm tra và mở',
  'textEditor.apply': 'Áp dụng thay đổi',
  'textEditor.applySuccess': 'Đã cập nhật văn bản tài liệu',
  'textEditor.close': 'Đóng',
  'textEditor.formatSuccess': 'Đã định dạng; các lỗi còn lại vẫn được đánh dấu đỏ',
  'textEditor.formatFailed': 'Tài liệu vẫn còn lỗi nên không thể định dạng',
  'textEditor.stillInvalid': 'Tài liệu vẫn còn lỗi. Vui lòng tiếp tục sửa.',
  'textEditor.valid': 'Định dạng hợp lệ và có thể mở',
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
  'textPlaceholders.text': 'Văn bản',

  // Line tool
  'line.source': 'Bắt đầu',
  'line.target': 'Kết thúc',
  'line.arrow': 'Mũi tên',
  'line.none': 'Không',

  // Stroke style
  'stroke.solid': 'Nét liền',
  'stroke.dashed': 'Nét đứt',
  'stroke.dotted': 'Nét chấm',

  // Draw elements text
  'draw.lineText': 'Văn bản',
  'draw.geometryText': 'Văn bản',

  // Mind map elements text
  'mind.centralText': 'Chủ đề trung tâm',
  'mind.abstractNodeText': 'Tóm tắt',

  'tutorial.title': 'MindForAI',
  'tutorial.description':
    'Bảng trắng tất cả trong một, bao gồm sơ đồ tư duy, lưu đồ, vẽ tự do và hơn thế nữa',
  'tutorial.dataDescription':
    'Tài liệu chỉ nằm trong tệp cục bộ của bạn; hãy mở hoặc lưu dưới dạng .mindforai',
  'tutorial.appToolbar': 'Xuất, cài đặt ngôn ngữ, ...',
  'tutorial.creationToolbar': 'Chọn một công cụ để bắt đầu sáng tạo',
  'tutorial.themeDescription': 'Chuyển đổi giữa chế độ sáng và tối',
};

export default viTranslations;
