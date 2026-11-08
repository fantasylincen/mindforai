// 实现 .mindforai 文本的转义、序列化与解析
package com.mindforai;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class MindForAITextFormat {
    public static final String INDENT_UNIT = "  ";
    public static final String MANIFEST_FIELD = "manifest";
    private static final Pattern CHILDREN_HEADER = Pattern.compile("^children(?:\\[(\\d+)\\])?:\\s*(.*)$");
    private static final Pattern CONTENT_HEADER = Pattern.compile("^content(?:\\[(\\d+)\\])?:\\s*(.*)$");

    private MindForAITextFormat() {
    }

    public static String serialize(List<MindForAINodeData> content, int version, String manifest) {
        List<String> lines = new ArrayList<>();
        lines.add("type: mindforai");
        lines.add("version: " + version);
        List<MindForAINodeData> nodes = content == null ? new ArrayList<>() : content;
        if (nodes.isEmpty()) {
            lines.add("content: []");
            appendManifest(lines, manifest);
            return String.join("\n", lines);
        }
        lines.add("content[" + nodes.size() + "]:");
        for (MindForAINodeData node : nodes) {
            writeNodeLines(node, 1, lines);
        }
        appendManifest(lines, manifest);
        return String.join("\n", lines);
    }

    private static void appendManifest(List<String> lines, String manifest) {
        if (manifest != null && !manifest.trim().isEmpty()) {
            lines.add(MANIFEST_FIELD + ": " + manifest.trim());
        }
    }

    private static void writeNodeLines(MindForAINodeData node, int depth, List<String> lines) {
        StringBuilder indentBuilder = new StringBuilder();
        for (int i = 0; i < depth; i++) {
            indentBuilder.append(INDENT_UNIT);
        }
        String indent = indentBuilder.toString();
        if (!node.isBranch()) {
            String escapedText = escapeText(node.getText());
            if (escapedText.startsWith("text:")) {
                lines.add(indent + "- text: " + escapedText);
            } else {
                lines.add(indent + "- " + escapedText);
            }
            return;
        }
        String escapedText = escapeText(node.getText());
        lines.add(escapedText.isEmpty() ? indent + "- text:" : indent + "- text: " + escapedText);
        List<MindForAINodeData> children = node.getChildren();
        if (children.isEmpty()) {
            return;
        }
        lines.add(indent + INDENT_UNIT + "children[" + children.size() + "]:");
        for (MindForAINodeData child : children) {
            writeNodeLines(child, depth + 2, lines);
        }
    }

    private static String escapeText(String text) {
        StringBuilder escaped = new StringBuilder();
        for (int index = 0; index < text.length(); index++) {
            char character = text.charAt(index);
            if (character == '\\') {
                escaped.append("\\\\");
            } else if (character == '\n') {
                escaped.append("\\n");
            } else if (character == '\r') {
                escaped.append("\\r");
            } else if (character == '\t') {
                escaped.append("\\t");
            } else {
                escaped.append(character);
            }
        }
        String result = escaped.toString();
        if (result.startsWith("\"")) {
            result = "\\" + result;
        }
        if (result.endsWith("\"") && !result.endsWith("\\\"")) {
            result = result.substring(0, result.length() - 1) + "\\\"";
        }
        return result;
    }

    private static String unescapeText(String text) {
        StringBuilder result = new StringBuilder();
        for (int index = 0; index < text.length(); index++) {
            char character = text.charAt(index);
            if (character != '\\') {
                result.append(character);
                continue;
            }
            char nextCharacter = index + 1 < text.length() ? text.charAt(index + 1) : '\0';
            if (nextCharacter == 'n') {
                result.append('\n');
                index++;
            } else if (nextCharacter == 'r') {
                result.append('\r');
                index++;
            } else if (nextCharacter == 't') {
                result.append('\t');
                index++;
            } else if (nextCharacter == '"') {
                result.append('"');
                index++;
            } else if (nextCharacter == '\\') {
                result.append('\\');
                index++;
            } else if (nextCharacter == 'u') {
                String code = index + 6 <= text.length() ? text.substring(index + 2, index + 6) : "";
                if (code.matches("[0-9a-fA-F]{4}")) {
                    result.append((char) Integer.parseInt(code, 16));
                    index += 5;
                } else {
                    result.append(character);
                }
            } else {
                result.append(character);
            }
        }
        return result.toString();
    }

    private static String decodeValue(String rawValue) {
        if (rawValue.length() >= 2 && rawValue.startsWith("\"") && rawValue.endsWith("\"")) {
            return unescapeText(rawValue.substring(1, rawValue.length() - 1));
        }
        return unescapeText(rawValue);
    }

    private static int countIndent(String line) {
        int count = 0;
        while (count < line.length() && line.charAt(count) == ' ') {
            count++;
        }
        return count;
    }

    private static int findNextContentLine(List<String> lines, int startIndex) {
        for (int index = startIndex; index < lines.size(); index++) {
            if (!lines.get(index).trim().isEmpty()) {
                return index;
            }
        }
        return -1;
    }

    private static class NodeListResult {
        private final List<MindForAINodeData> nodes;
        private final int nextIndex;

        private NodeListResult(List<MindForAINodeData> nodes, int nextIndex) {
            this.nodes = nodes;
            this.nextIndex = nextIndex;
        }
    }

    private static NodeListResult parseNodeList(List<String> lines, int startIndex, int listIndent,
            List<ParseIssue> issues) {
        List<MindForAINodeData> nodes = new ArrayList<>();
        int index = startIndex;
        while (index < lines.size()) {
            String line = lines.get(index);
            if (line.trim().isEmpty()) {
                index++;
                continue;
            }
            int indent = countIndent(line);
            if (indent < listIndent) {
                break;
            }
            if (indent > listIndent) {
                issues.add(new ParseIssue(index + 1, indent + 1, "invalidIndent"));
                index++;
                continue;
            }
            String itemText = line.substring(indent);
            if (!itemText.startsWith("- ") && !itemText.equals("-")) {
                issues.add(new ParseIssue(index + 1, indent + 1, "invalidListItem"));
                index++;
                continue;
            }
            String body = itemText.equals("-") ? "" : itemText.substring(2);
            int nextContentIndex = findNextContentLine(lines, index + 1);
            int nextIndent = nextContentIndex >= 0 ? countIndent(lines.get(nextContentIndex)) : -1;
            if (!(nextContentIndex >= 0 && nextIndent > indent)) {
                String rawText;
                if (body.equals("text:")) {
                    rawText = "";
                } else if (body.startsWith("text: ")) {
                    rawText = body.substring(6);
                } else {
                    rawText = body;
                }
                nodes.add(MindForAINodeData.leaf(decodeValue(rawText)));
                index++;
                continue;
            }
            if (!(body.equals("text:") || body.startsWith("text: "))) {
                issues.add(new ParseIssue(nextContentIndex + 1, 1, "unexpectedChildLine"));
                nodes.add(MindForAINodeData.leaf(decodeValue(body)));
                index++;
                continue;
            }
            String rawText = body.equals("text:") ? "" : body.substring(6);
            String childHeaderLine = lines.get(nextContentIndex).trim();
            Matcher childHeaderMatch = CHILDREN_HEADER.matcher(childHeaderLine);
            if (!childHeaderMatch.matches() || !childHeaderMatch.group(2).isEmpty()) {
                issues.add(new ParseIssue(nextContentIndex + 1, 1,
                        childHeaderMatch.matches() ? "inlineChildrenContent" : "invalidChildrenHeader"));
                nodes.add(MindForAINodeData.leaf(decodeValue(rawText)));
                index = nextContentIndex;
                continue;
            }
            Integer expectedChildCount = childHeaderMatch.group(1) != null
                    ? Integer.valueOf(childHeaderMatch.group(1))
                    : null;
            int childrenHeaderIndent = nextIndent;
            int firstChildIndex = findNextContentLine(lines, nextContentIndex + 1);
            List<MindForAINodeData> children = new ArrayList<>();
            int nextIndex = nextContentIndex + 1;
            if (firstChildIndex >= 0 && countIndent(lines.get(firstChildIndex)) > childrenHeaderIndent) {
                NodeListResult childList = parseNodeList(lines, firstChildIndex,
                        countIndent(lines.get(firstChildIndex)), issues);
                children = childList.nodes;
                nextIndex = childList.nextIndex;
            }
            if (expectedChildCount != null && children.size() != expectedChildCount) {
                issues.add(new ParseIssue(nextContentIndex + 1, 1, "childrenCountMismatch"));
            }
            nodes.add(MindForAINodeData.branch(decodeValue(rawText), children));
            index = nextIndex;
        }
        return new NodeListResult(nodes, index);
    }

    public static ParseResult parse(String contents) {
        List<String> rawLines = splitLines(contents);
        String manifestPrefix = MANIFEST_FIELD + ":";
        String manifest = null;
        List<String> lines = new ArrayList<>();
        for (String line : rawLines) {
            String trimmedLine = line.trim();
            if (trimmedLine.startsWith(manifestPrefix)) {
                String value = trimmedLine.substring(manifestPrefix.length()).trim();
                manifest = value.isEmpty() ? null : value;
                continue;
            }
            lines.add(line);
        }
        List<ParseIssue> issues = new ArrayList<>();
        boolean isMindForAIDocument = false;
        boolean hasTypeDeclaration = false;
        int version = 1;
        int contentIndex = -1;
        int contentIndent = 0;
        Integer expectedContentCount = null;
        for (int index = 0; index < lines.size(); index++) {
            String trimmedLine = lines.get(index).trim();
            if (trimmedLine.isEmpty()) {
                continue;
            }
            if (trimmedLine.startsWith("type:")) {
                hasTypeDeclaration = true;
                if (trimmedLine.equals("type: mindforai")) {
                    isMindForAIDocument = true;
                } else {
                    issues.add(new ParseIssue(index + 1, 1, "invalidType"));
                }
                continue;
            }
            if (trimmedLine.startsWith("version:")) {
                String rawVersion = trimmedLine.substring("version:".length()).trim();
                try {
                    int parsedVersion = Integer.parseInt(rawVersion);
                    if (parsedVersion > 0) {
                        version = parsedVersion;
                    } else {
                        issues.add(new ParseIssue(index + 1, 1, "invalidVersion"));
                    }
                } catch (NumberFormatException exception) {
                    issues.add(new ParseIssue(index + 1, 1, "invalidVersion"));
                }
                continue;
            }
            Matcher contentMatch = CONTENT_HEADER.matcher(trimmedLine);
            if (contentMatch.matches()) {
                contentIndex = index;
                contentIndent = countIndent(lines.get(index));
                expectedContentCount = contentMatch.group(1) != null
                        ? Integer.valueOf(contentMatch.group(1))
                        : null;
                String inlineContent = contentMatch.group(2);
                if (inlineContent.equals("[]")) {
                    if (isMindForAIDocument && issues.isEmpty()) {
                        return new ParseResult(new MindForAIDocument(version, new ArrayList<>(), manifest), issues);
                    }
                    return new ParseResult(null, issues);
                }
                if (!inlineContent.isEmpty()) {
                    issues.add(new ParseIssue(index + 1, 1, "invalidContentLine"));
                    return new ParseResult(null, issues);
                }
                break;
            }
            issues.add(new ParseIssue(index + 1, 1, "unexpectedLine"));
        }
        if (!hasTypeDeclaration) {
            issues.add(new ParseIssue(1, 1, "missingType"));
        }
        if (contentIndex < 0) {
            issues.add(new ParseIssue(Math.max(1, lines.size()), 1, "missingContent"));
            return new ParseResult(null, issues);
        }
        int firstContentIndex = findNextContentLine(lines, contentIndex + 1);
        if (firstContentIndex < 0) {
            if (expectedContentCount != null && expectedContentCount != 0) {
                issues.add(new ParseIssue(contentIndex + 1, 1, "contentCountMismatch"));
            }
            if (issues.isEmpty() && isMindForAIDocument) {
                return new ParseResult(new MindForAIDocument(version, new ArrayList<>(), manifest), issues);
            }
            return new ParseResult(null, issues);
        }
        if (countIndent(lines.get(firstContentIndex)) <= contentIndent) {
            issues.add(new ParseIssue(firstContentIndex + 1, 1, "invalidIndent"));
            return new ParseResult(null, issues);
        }
        NodeListResult parsedList = parseNodeList(lines, firstContentIndex,
                countIndent(lines.get(firstContentIndex)), issues);
        if (expectedContentCount != null && parsedList.nodes.size() != expectedContentCount) {
            issues.add(new ParseIssue(contentIndex + 1, 1, "contentCountMismatch"));
        }
        int trailingIndex = findNextContentLine(lines, parsedList.nextIndex);
        if (trailingIndex >= 0) {
            issues.add(new ParseIssue(trailingIndex + 1, 1, "unexpectedLine"));
        }
        if (!issues.isEmpty() || !isMindForAIDocument) {
            return new ParseResult(null, issues);
        }
        return new ParseResult(new MindForAIDocument(version, parsedList.nodes, manifest), issues);
    }

    public static MindForAIDocument parseOrRaise(String contents) {
        ParseResult result = parse(contents);
        if (result.getData() == null) {
            ParseIssue first = result.getIssues().isEmpty() ? null : result.getIssues().get(0);
            if (first != null) {
                throw new ParseException(first.toString(), first.getLine(), first.getColumn(), first.getCode());
            }
            throw new ParseException("invalid mindforai document", 1, 1, "invalidDocument");
        }
        return result.getData();
    }

    private static List<String> splitLines(String contents) {
        String normalized = contents.replace("\r\n", "\n").replace("\r", "\n");
        List<String> lines = new ArrayList<>();
        int start = 0;
        for (int index = 0; index < normalized.length(); index++) {
            if (normalized.charAt(index) == '\n') {
                lines.add(normalized.substring(start, index));
                start = index + 1;
            }
        }
        lines.add(normalized.substring(start));
        return lines;
    }
}
