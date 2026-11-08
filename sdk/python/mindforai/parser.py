# 实现 .mindforai 文本的转义、序列化与解析
from .errors import ParseError

INDENT_UNIT = "  "
MANIFEST_FIELD = "manifest"


def _escape_text(text):
    escaped = []
    for character in text:
        if character == "\\":
            escaped.append("\\\\")
        elif character == "\n":
            escaped.append("\\n")
        elif character == "\r":
            escaped.append("\\r")
        elif character == "\t":
            escaped.append("\\t")
        else:
            escaped.append(character)
    result = "".join(escaped)
    if result.startswith('"'):
        result = "\\" + result
    if result.endswith('"') and not result.endswith('\\"'):
        result = result[:-1] + '\\"'
    return result


def _unescape_text(text):
    result = []
    index = 0
    length = len(text)
    while index < length:
        character = text[index]
        if character != "\\":
            result.append(character)
            index += 1
            continue
        next_character = text[index + 1] if index + 1 < length else ""
        if next_character == "n":
            result.append("\n")
            index += 2
        elif next_character == "r":
            result.append("\r")
            index += 2
        elif next_character == "t":
            result.append("\t")
            index += 2
        elif next_character == '"':
            result.append('"')
            index += 2
        elif next_character == "\\":
            result.append("\\")
            index += 2
        elif next_character == "u":
            code = text[index + 2:index + 6]
            if len(code) == 4 and all(c in "0123456789abcdefABCDEF" for c in code):
                result.append(chr(int(code, 16)))
                index += 6
            else:
                result.append(character)
                index += 1
        else:
            result.append(character)
            index += 1
    return "".join(result)


def _decode_value(raw_value):
    if len(raw_value) >= 2 and raw_value.startswith('"') and raw_value.endswith('"'):
        return _unescape_text(raw_value[1:-1])
    return _unescape_text(raw_value)


def serialize_node_lines(node, depth, lines):
    indent = INDENT_UNIT * depth
    if isinstance(node, str):
        escaped_text = _escape_text(node)
        if escaped_text.startswith("text:"):
            lines.append(f"{indent}- text: {escaped_text}")
        else:
            lines.append(f"{indent}- {escaped_text}")
        return
    text = node.get("text", "") if isinstance(node.get("text"), str) else ""
    escaped_text = _escape_text(text)
    lines.append(f"{indent}- text: {escaped_text}" if escaped_text else f"{indent}- text:")
    children = node.get("children", [])
    if not isinstance(children, list) or not children:
        return
    lines.append(f"{indent}{INDENT_UNIT}children[{len(children)}]:")
    for child in children:
        serialize_node_lines(child, depth + 2, lines)


def serialize_document(content, version=1, manifest=None):
    if not isinstance(content, list):
        content = []
    lines = ["type: mindforai", f"version: {version}"]
    if not content:
        lines.append("content: []")
        if isinstance(manifest, str) and manifest.strip():
            lines.append(f"{MANIFEST_FIELD}: {manifest.strip()}")
        return "\n".join(lines)
    lines.append(f"content[{len(content)}]:")
    for node in content:
        serialize_node_lines(node, 1, lines)
    if isinstance(manifest, str) and manifest.strip():
        lines.append(f"{MANIFEST_FIELD}: {manifest.strip()}")
    return "\n".join(lines)


def _count_indent(line):
    return len(line) - len(line.lstrip(" "))


def _find_next_content_line(lines, start_index):
    index = start_index
    while index < len(lines):
        if lines[index].strip():
            return index
        index += 1
    return -1


def _parse_node_list(lines, start_index, list_indent, issues):
    nodes = []
    index = start_index
    while index < len(lines):
        line = lines[index]
        if not line.strip():
            index += 1
            continue
        indent = _count_indent(line)
        if indent < list_indent:
            break
        if indent > list_indent:
            issues.append((index + 1, indent + 1, "invalidIndent"))
            index += 1
            continue
        item_text = line[indent:]
        if not item_text.startswith("- ") and item_text != "-":
            issues.append((index + 1, indent + 1, "invalidListItem"))
            index += 1
            continue
        body = "" if item_text == "-" else item_text[2:]
        next_content_index = _find_next_content_line(lines, index + 1)
        next_indent = _count_indent(lines[next_content_index]) if next_content_index >= 0 else -1
        if not (next_content_index >= 0 and next_indent > indent):
            if body == "text:":
                raw_text = ""
            elif body.startswith("text: "):
                raw_text = body[6:]
            else:
                raw_text = body
            nodes.append(_decode_value(raw_text))
            index += 1
            continue
        if not (body == "text:" or body.startswith("text: ")):
            issues.append((next_content_index + 1, 1, "unexpectedChildLine"))
            nodes.append(_decode_value(body))
            index += 1
            continue
        raw_text = "" if body == "text:" else body[6:]
        child_header_line = lines[next_content_index].strip()
        child_header_match = _match_children_header(child_header_line)
        if child_header_match is None or child_header_match[1]:
            issues.append(
                (
                    next_content_index + 1,
                    1,
                    "inlineChildrenContent" if child_header_match else "invalidChildrenHeader",
                )
            )
            nodes.append(_decode_value(raw_text))
            index = next_content_index
            continue
        expected_child_count = child_header_match[0]
        children_header_indent = next_indent
        first_child_index = _find_next_content_line(lines, next_content_index + 1)
        children = []
        next_index = next_content_index + 1
        if first_child_index >= 0 and _count_indent(lines[first_child_index]) > children_header_indent:
            child_list, child_next_index = _parse_node_list(
                lines, first_child_index, _count_indent(lines[first_child_index]), issues
            )
            children = child_list
            next_index = child_next_index
        if expected_child_count is not None and len(children) != expected_child_count:
            issues.append((next_content_index + 1, 1, "childrenCountMismatch"))
        nodes.append({"text": _decode_value(raw_text), "children": children})
        index = next_index
    return nodes, index


def _match_children_header(header_line):
    prefix = "children"
    if not header_line.startswith(prefix):
        return None
    rest = header_line[len(prefix):]
    expected = None
    if rest.startswith("["):
        close_index = rest.find("]")
        if close_index < 0:
            return None
        count_text = rest[1:close_index]
        if count_text.isdigit():
            expected = int(count_text)
        rest = rest[close_index + 1:]
    if not rest.startswith(":"):
        return None
    return (expected, rest[1:].strip())


def parse_text(contents):
    raw_lines = contents.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    manifest_prefix = f"{MANIFEST_FIELD}:"
    manifest = None
    lines = []
    for line in raw_lines:
        trimmed = line.strip()
        if trimmed.startswith(manifest_prefix):
            value = trimmed[len(manifest_prefix):].strip()
            manifest = value if value else None
            continue
        lines.append(line)
    issues = []
    is_mindforai_document = False
    has_type_declaration = False
    version = 1
    content_index = -1
    content_indent = 0
    expected_content_count = None
    index = 0
    while index < len(lines):
        trimmed = lines[index].strip()
        if not trimmed:
            index += 1
            continue
        if trimmed.startswith("type:"):
            has_type_declaration = True
            if trimmed == "type: mindforai":
                is_mindforai_document = True
            else:
                issues.append((index + 1, 1, "invalidType"))
            index += 1
            continue
        if trimmed.startswith("version:"):
            raw_version = trimmed[len("version:"):].strip()
            try:
                parsed_version = float(raw_version)
            except ValueError:
                parsed_version = None
            if parsed_version is not None and parsed_version.is_integer() and parsed_version > 0:
                version = int(parsed_version)
            else:
                issues.append((index + 1, 1, "invalidVersion"))
            index += 1
            continue
        content_match = _match_content_header(trimmed)
        if content_match is not None:
            content_index = index
            content_indent = _count_indent(lines[index])
            expected_content_count = content_match[0]
            inline_content = content_match[1]
            if inline_content == "[]":
                if is_mindforai_document and not issues:
                    return _build_data([], version, manifest), issues
                return None, issues
            if inline_content:
                issues.append((index + 1, 1, "invalidContentLine"))
                return None, issues
            break
        issues.append((index + 1, 1, "unexpectedLine"))
        index += 1
    if not has_type_declaration:
        issues.append((1, 1, "missingType"))
    if content_index < 0:
        issues.append((max(1, len(lines)), 1, "missingContent"))
        return None, issues
    first_content_index = _find_next_content_line(lines, content_index + 1)
    if first_content_index < 0:
        if expected_content_count is not None and expected_content_count != 0:
            issues.append((content_index + 1, 1, "contentCountMismatch"))
        if not issues and is_mindforai_document:
            return _build_data([], version, manifest), issues
        return None, issues
    if _count_indent(lines[first_content_index]) <= content_indent:
        issues.append((first_content_index + 1, 1, "invalidIndent"))
        return None, issues
    parsed_nodes, parsed_next_index = _parse_node_list(
        lines, first_content_index, _count_indent(lines[first_content_index]), issues
    )
    if expected_content_count is not None and len(parsed_nodes) != expected_content_count:
        issues.append((content_index + 1, 1, "contentCountMismatch"))
    trailing_index = _find_next_content_line(lines, parsed_next_index)
    if trailing_index >= 0:
        issues.append((trailing_index + 1, 1, "unexpectedLine"))
    if issues or not is_mindforai_document:
        return None, issues
    return _build_data(parsed_nodes, version, manifest), issues


def _match_content_header(header_line):
    prefix = "content"
    if not header_line.startswith(prefix):
        return None
    rest = header_line[len(prefix):]
    expected = None
    if rest.startswith("["):
        close_index = rest.find("]")
        if close_index < 0:
            return None
        count_text = rest[1:close_index]
        if count_text.isdigit():
            expected = int(count_text)
        rest = rest[close_index + 1:]
    if not rest.startswith(":"):
        return None
    return (expected, rest[1:].strip())


def _build_data(content, version, manifest):
    data = {"type": "mindforai", "version": version, "content": content}
    if manifest:
        data["manifest"] = manifest
    return data


def parse_or_raise(contents):
    data, issues = parse_text(contents)
    if data is None:
        if issues:
            line, column, code = issues[0]
            raise ParseError(f"{code} at line {line}, column {column}")
        raise ParseError("invalid mindforai document")
    return data
