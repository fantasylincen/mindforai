// 校验 Java 版文档库的加载、序列化与节点编辑行为
package com.mindforai;

import java.util.ArrayList;
import java.util.List;

public class MindForAITest {
    private static int passed = 0;
    private static int failed = 0;

    public static void main(String[] args) {
        String templatePath = args.length > 0 ? args[0] : "../../templates/Templets.toon";
        run("loads real document", () -> loadsRealDocument(templatePath));
        run("round trip", () -> roundTrip(templatePath));
        run("children copy", MindForAITest::childrenCopy);
        run("child count", MindForAITest::childCount);
        run("descendants", MindForAITest::descendants);
        run("get", MindForAITest::getByIndex);
        run("add", MindForAITest::addAppends);
        run("insert", MindForAITest::insertAt);
        run("insert clamps", MindForAITest::insertClamps);
        run("remove index", MindForAITest::removeByIndex);
        run("remove node", MindForAITest::removeByNode);
        run("text accessor", MindForAITest::textAccessor);
        run("parent", MindForAITest::parentLink);
        run("move node", MindForAITest::moveNode);
        run("reject cycles", MindForAITest::rejectCycles);
        run("mindForAIText", MindForAITest::mindForAIText);
        run("special chars", MindForAITest::specialCharacters);
        run("empty document", MindForAITest::emptyDocument);
        run("manifest", MindForAITest::manifestField);
        run("invalid document", MindForAITest::invalidDocument);
        run("children count mismatch", MindForAITest::childrenCountMismatch);
        run("crlf", MindForAITest::crlf);
        System.out.println("passed=" + passed + " failed=" + failed);
        if (failed > 0) {
            System.exit(1);
        }
    }

    private interface Check {
        void run() throws Exception;
    }

    private static void run(String name, Check check) {
        try {
            check.run();
            passed++;
            System.out.println("PASS " + name);
        } catch (Throwable throwable) {
            failed++;
            System.out.println("FAIL " + name + " : " + throwable.getMessage());
        }
    }

    private static void assertTrue(boolean condition, String message) {
        if (!condition) {
            throw new IllegalStateException(message);
        }
    }

    private static void assertEquals(Object expected, Object actual) {
        if (expected == null ? actual != null : !expected.equals(actual)) {
            throw new IllegalStateException("expected " + expected + " but was " + actual);
        }
    }

    private static void loadsRealDocument(String templatePath) throws Exception {
        MindForAI doc = new MindForAI();
        doc.load(templatePath);
        assertEquals(1, doc.getVersion());
        assertEquals(4, doc.getRoot().getChildCount());
        assertTrue(doc.getRoot().getDescendants().size() > 1000, "descendants");
    }

    private static void roundTrip(String templatePath) throws Exception {
        MindForAI doc = new MindForAI();
        doc.load(templatePath);
        String text = doc.getRoot().mindForAIText();
        MindForAI again = new MindForAI().loadText(text);
        assertEquals(text, again.mindForAIText());
    }

    private static void childrenCopy() {
        Node root = new Node("root", true);
        root.add(new Node("a"));
        List<Node> children = root.getChildren();
        children.add(new Node("ghost"));
        assertEquals(1, root.getChildCount());
    }

    private static void childCount() {
        Node root = new Node("root", true);
        root.add("a");
        root.add("b");
        assertEquals(2, root.getChildCount());
        root.remove(0);
        assertEquals(1, root.getChildCount());
    }

    private static void descendants() {
        Node root = new Node("root", true);
        Node branch = root.add(new Node("a", true));
        branch.add("a1");
        branch.add("a2");
        root.add("b");
        List<String> texts = new ArrayList<>();
        for (Node node : root.getDescendants()) {
            texts.add(node.getText());
        }
        assertEquals(List.of("a", "a1", "a2", "b"), texts);
    }

    private static void getByIndex() {
        Node root = new Node("root", true);
        root.add("a");
        assertEquals("a", root.get(0).getText());
        boolean thrown = false;
        try {
            root.get(5);
        } catch (MindForAIException exception) {
            thrown = true;
        }
        assertTrue(thrown, "expected exception");
    }

    private static void addAppends() {
        Node root = new Node("root", true);
        root.add("a");
        Node added = root.add("b");
        assertEquals(added, root.get(1));
    }

    private static void insertAt() {
        Node root = new Node("root", true);
        root.add("a");
        root.add("c");
        root.insert("b", 1);
        assertEquals("a", root.get(0).getText());
        assertEquals("b", root.get(1).getText());
        assertEquals("c", root.get(2).getText());
    }

    private static void insertClamps() {
        Node root = new Node("root", true);
        root.add("a");
        root.insert("start", -5);
        root.insert("end", 99);
        assertEquals("start", root.get(0).getText());
        assertEquals("a", root.get(1).getText());
        assertEquals("end", root.get(2).getText());
    }

    private static void removeByIndex() {
        Node root = new Node("root", true);
        root.add("a");
        root.add("b");
        Node removed = root.remove(0);
        assertEquals("a", removed.getText());
        assertEquals(null, removed.getParent());
        assertEquals("b", root.get(0).getText());
    }

    private static void removeByNode() {
        Node root = new Node("root", true);
        Node child = root.add("a");
        assertEquals(child, root.remove(child));
        assertEquals(0, root.getChildCount());
    }

    private static void textAccessor() {
        Node node = new Node("old");
        assertEquals("old", node.getText());
        node.setText("new");
        assertEquals("new", node.getText());
    }

    private static void parentLink() {
        Node root = new Node("root", true);
        Node child = root.add("child");
        assertEquals(root, child.getParent());
        root.remove(child);
        assertEquals(null, child.getParent());
    }

    private static void moveNode() {
        Node first = new Node("first", true);
        Node second = new Node("second", true);
        Node child = first.add("child");
        second.add(child);
        assertEquals(0, first.getChildCount());
        assertEquals(child, second.get(0));
    }

    private static void rejectCycles() {
        Node root = new Node("root", true);
        Node child = root.add(new Node("child", true));
        boolean thrown = false;
        try {
            child.add(root);
        } catch (MindForAIException exception) {
            thrown = true;
        }
        assertTrue(thrown, "expected cycle rejection");
    }

    private static void mindForAIText() {
        Node node = new Node("root", true);
        Node branch = node.add(new Node("branch", true));
        branch.add("leaf");
        String text = node.mindForAIText();
        assertTrue(text.startsWith("type: toon\nversion: 1\ncontent[1]:"), "prefix");
        assertTrue(MindForAITextFormat.parse(text).isSuccess(), "parseable");
    }

    private static void specialCharacters() {
        Node root = new Node("root, with: symbols \"x\"", true);
        root.add(new Node("multi\nline", true)).add("text: x");
        root.add("  spaced");
        String text = root.mindForAIText();
        MindForAIDocument data = MindForAITextFormat.parseOrRaise(text);
        assertEquals(text, MindForAITextFormat.serialize(data.getContent(), data.getVersion(), data.getManifest()));
    }

    private static void emptyDocument() {
        String text = MindForAITextFormat.serialize(new ArrayList<>(), 1, null);
        assertEquals("type: toon\nversion: 1\ncontent: []", text);
        assertEquals(0, MindForAITextFormat.parseOrRaise(text).getContent().size());
    }

    private static void manifestField() {
        List<MindForAINodeData> content = new ArrayList<>();
        content.add(MindForAINodeData.leaf("root"));
        String text = MindForAITextFormat.serialize(content, 1, "QUJDREVG");
        assertTrue(text.endsWith("manifest: QUJDREVG"), "manifest suffix");
        assertEquals("QUJDREVG", MindForAITextFormat.parseOrRaise(text).getManifest());
    }

    private static void invalidDocument() {
        assertTrue(!MindForAITextFormat.parse("content[1]: a").isSuccess(), "invalid should fail");
    }

    private static void childrenCountMismatch() {
        String text = "type: mindforai\nversion: 1\ncontent[1]:\n  - text: root\n    children[3]:\n      - a";
        ParseResult result = MindForAITextFormat.parse(text);
        boolean found = false;
        for (ParseIssue issue : result.getIssues()) {
            if (issue.getCode().equals("childrenCountMismatch")) {
                found = true;
            }
        }
        assertTrue(found, "expected childrenCountMismatch");
    }

    private static void crlf() {
        MindForAIDocument data = MindForAITextFormat.parseOrRaise("type: mindforai\r\nversion: 1\r\ncontent[1]:\r\n  - root");
        assertEquals("root", data.getContent().get(0).getText());
    }
}
