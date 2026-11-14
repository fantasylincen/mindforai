# 实现 MindForAI 文档的加载、保存与根节点访问
from .node import Node, build_nodes
from .parser import parse_or_raise, serialize_document
from .errors import NodeArgumentError


class MindForAI:
    # MindForAI 文档对象，持有根节点与文档版本信息

    def __init__(self, root_text="", version=1):
        self._root = Node(root_text, branch=True)
        self._version = version
        self._manifest = None

    @property
    def root(self):
        # 获取根节点
        return self._root

    @root.setter
    def root(self, node):
        # 设置根节点
        if not isinstance(node, Node):
            raise NodeArgumentError("root must be a Node")
        self._root = node

    @property
    def version(self):
        # 文档版本号
        return self._version

    @version.setter
    def version(self, value):
        # 设置文档版本号
        self._version = int(value)

    @property
    def manifest(self):
        # 内嵌清单字段原文
        return self._manifest

    @manifest.setter
    def manifest(self, value):
        # 设置内嵌清单字段原文
        self._manifest = value if value else None

    def load(self, path):
        # 从文件加载文档
        with open(path, "r", encoding="utf-8") as handle:
            return self.load_text(handle.read())

    def load_text(self, contents):
        # 从 .toon 文本加载文档并返回自身
        data = parse_or_raise(contents)
        self._version = data.get("version", 1)
        self._manifest = data.get("manifest")
        nodes = build_nodes(data.get("content", []))
        root = Node(data.get("root_text", ""), branch=True)
        if len(nodes) == 1:
            single = nodes[0]
            if single.is_branch or single.children:
                root = single
        else:
            for node in nodes:
                root._children.append(node)
                node._parent = root
        self._root = root
        return self

    def save(self, path):
        # 把根节点保存为 .toon 文件
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(self.mind_for_ai_text())

    def mind_for_ai_text(self):
        # 把整篇文档转换为 .toon 标准文本
        return serialize_document(self._content_data(), self._version, self._manifest)

    def _content_data(self):
        if self._root.is_branch or self._root.children:
            return [self._root.to_data()]
        return []

    def __repr__(self):
        return f"MindForAI(version={self._version}, children={self._root.child_count})"
