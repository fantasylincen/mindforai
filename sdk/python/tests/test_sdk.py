# 校验 Python 版文档库的加载、序列化与节点编辑行为
import os
import tempfile
import unittest

from mindforai import MindForAI, Node
from mindforai.errors import ParseError
from mindforai.parser import parse_text, serialize_document

TEMPLATE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    "templates",
    "Templets.toon",
)


class TestMindForAI(unittest.TestCase):
    # 文档加载、保存与文本导出测试

    def test_loads_real_document(self):
        doc = MindForAI()
        doc.load(TEMPLATE)
        self.assertEqual(doc.version, 1)
        self.assertEqual(doc.root.child_count, 4)
        self.assertGreater(len(doc.root.descendants), 1000)

    def test_root_is_accessible(self):
        doc = MindForAI()
        doc.load(TEMPLATE)
        self.assertIsInstance(doc.root, Node)

    def test_round_trip(self):
        doc = MindForAI()
        doc.load(TEMPLATE)
        text = doc.root.mind_for_ai_text()
        again = MindForAI().load_text(text)
        self.assertEqual(again.mind_for_ai_text(), text)

    def test_save_to_file(self):
        doc = MindForAI()
        doc.load(TEMPLATE)
        with tempfile.TemporaryDirectory() as directory:
            path = os.path.join(directory, "out.toon")
            doc.save(path)
            reloaded = MindForAI().load(path)
        self.assertEqual(reloaded.root.mind_for_ai_text(), doc.root.mind_for_ai_text())


class TestNode(unittest.TestCase):
    # 节点增删查改测试

    def test_children_copy(self):
        root = Node("root", True)
        root.add(Node("a"))
        children = root.children
        children.append(Node("ghost"))
        self.assertEqual(root.child_count, 1)

    def test_child_count(self):
        root = Node("root", True)
        root.add("a")
        root.add("b")
        self.assertEqual(root.child_count, 2)
        root.remove(0)
        self.assertEqual(root.child_count, 1)

    def test_descendants(self):
        root = Node("root", True)
        branch = root.add(Node("a", True))
        branch.add("a1")
        branch.add("a2")
        root.add("b")
        self.assertEqual([n.text for n in root.descendants], ["a", "a1", "a2", "b"])

    def test_get(self):
        root = Node("root", True)
        root.add("a")
        self.assertEqual(root.get(0).text, "a")
        with self.assertRaises(IndexError):
            root.get(5)

    def test_add(self):
        root = Node("root", True)
        root.add("a")
        added = root.add("b")
        self.assertIs(root.get(1), added)

    def test_insert(self):
        root = Node("root", True)
        root.add("a")
        root.add("c")
        root.insert("b", 1)
        self.assertEqual([n.text for n in root.children], ["a", "b", "c"])

    def test_insert_clamps(self):
        root = Node("root", True)
        root.add("a")
        root.insert("start", -5)
        root.insert("end", 99)
        self.assertEqual([n.text for n in root.children], ["start", "a", "end"])

    def test_remove_by_index(self):
        root = Node("root", True)
        root.add("a")
        root.add("b")
        removed = root.remove(0)
        self.assertEqual(removed.text, "a")
        self.assertIsNone(removed.parent)
        self.assertEqual([n.text for n in root.children], ["b"])

    def test_remove_by_node(self):
        root = Node("root", True)
        child = root.add("a")
        self.assertIs(root.remove(child), child)
        self.assertEqual(root.child_count, 0)

    def test_text_accessor(self):
        node = Node("old")
        self.assertEqual(node.text, "old")
        node.text = "new"
        self.assertEqual(node.text, "new")

    def test_parent(self):
        root = Node("root", True)
        child = root.add("child")
        self.assertIs(child.parent, root)
        root.remove(child)
        self.assertIsNone(child.parent)

    def test_move_node(self):
        first = Node("first", True)
        second = Node("second", True)
        child = first.add("child")
        second.add(child)
        self.assertEqual(first.child_count, 0)
        self.assertIs(second.get(0), child)

    def test_rejects_cycles(self):
        root = Node("root", True)
        child = root.add(Node("child", True))
        with self.assertRaises(Exception):
            child.add(root)

    def test_mind_for_ai_text(self):
        node = Node("root", True)
        branch = node.add(Node("branch", True))
        branch.add("leaf")
        text = node.mind_for_ai_text()
        self.assertTrue(text.startswith("type: mindforai\nversion: 1\ncontent[1]:"))
        self.assertIsNotNone(parse_text(text)[0])


class TestParser(unittest.TestCase):
    # 文本解析与序列化测试

    def test_empty_document(self):
        text = serialize_document([])
        self.assertEqual(text, "type: mindforai\nversion: 1\ncontent: []")
        self.assertEqual(parse_text(text)[0]["content"], [])

    def test_manifest(self):
        text = serialize_document(["root"], 1, "QUJDREVG")
        self.assertTrue(text.endswith("manifest: QUJDREVG"))
        self.assertEqual(parse_text(text)[0]["manifest"], "QUJDREVG")

    def test_special_characters(self):
        root = Node('root, with: symbols "x"', True)
        root.add(Node("multi\nline", True)).add("text: x")
        root.add("  spaced")
        text = root.mind_for_ai_text()
        data = parse_text(text)[0]
        self.assertEqual(serialize_document(data["content"]), text)

    def test_invalid_document(self):
        data, issues = parse_text("content[1]: a")
        self.assertIsNone(data)
        self.assertGreater(len(issues), 0)

    def test_children_count_mismatch(self):
        text = "type: mindforai\nversion: 1\ncontent[1]:\n  - text: root\n    children[3]:\n      - a"
        data, issues = parse_text(text)
        self.assertIsNone(data)
        self.assertTrue(any(code == "childrenCountMismatch" for _, _, code in issues))

    def test_crlf(self):
        data, _ = parse_text("type: mindforai\r\nversion: 1\r\ncontent[1]:\r\n  - root")
        self.assertEqual(data["content"], ["root"])


if __name__ == "__main__":
    unittest.main()
