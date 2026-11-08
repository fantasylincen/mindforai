# 实现思维导图节点树及其增删查改与文本导出
from .errors import NodeArgumentError


class Node:
    # 思维导图节点，提供子节点访问与编辑能力

    def __init__(self, text="", branch=False):
        self._text = text if isinstance(text, str) else str(text)
        self._branch = bool(branch)
        self._children = []
        self._parent = None

    @property
    def text(self):
        # 节点的文本内容
        return self._text

    @text.setter
    def text(self, value):
        # 设置节点文本
        self._text = value if isinstance(value, str) else str(value)

    @property
    def parent(self):
        # 父节点，根或孤立节点为 None
        return self._parent

    @property
    def is_branch(self):
        # 节点是否以分支（children）形式存在
        return self._branch or len(self._children) > 0

    @property
    def children(self):
        # 全部直接子节点的列表副本
        return list(self._children)

    @property
    def child_count(self):
        # 直接子节点数量
        return len(self._children)

    @property
    def descendants(self):
        # 全部层级的子孙节点列表，不含自身，按先序排列
        result = []
        for child in self._children:
            result.append(child)
            result.extend(child.descendants)
        return result

    def get(self, index):
        # 通过索引位置获取子节点
        if not isinstance(index, int):
            raise NodeArgumentError("index must be an integer")
        if index < 0 or index >= len(self._children):
            raise IndexError("child index out of range")
        return self._children[index]

    def add(self, node):
        # 在最后一个位置增加一个子节点并返回该节点
        return self.insert(node, len(self._children))

    def insert(self, node, index):
        # 在指定索引位置插入子节点并返回该节点
        target = self._coerce_node(node)
        if not isinstance(index, int):
            raise NodeArgumentError("index must be an integer")
        if index < 0:
            index = 0
        if index > len(self._children):
            index = len(self._children)
        if target is self:
            raise NodeArgumentError("cannot insert a node into itself")
        if self._is_ancestor_of(target):
            raise NodeArgumentError("cannot insert an ancestor node as a child")
        if target._parent is not None:
            target._parent._detach(target)
        self._children.insert(index, target)
        target._parent = self
        return target

    def remove(self, target):
        # 删除指定子节点或指定索引处的子节点并返回被删除的节点
        if isinstance(target, int):
            index = target
            if index < 0 or index >= len(self._children):
                raise IndexError("child index out of range")
            removed = self._children.pop(index)
            removed._parent = None
            return removed
        if not isinstance(target, Node):
            raise NodeArgumentError("remove requires a Node or an index")
        if target not in self._children:
            raise NodeArgumentError("node is not a child of this node")
        removed = self._detach(target)
        return removed

    def clear(self):
        # 移除全部子节点
        for child in self._children:
            child._parent = None
        self._children = []

    def index_of(self, target):
        # 返回子节点的索引位置，不存在时返回 -1
        if not isinstance(target, Node):
            raise NodeArgumentError("index_of requires a Node")
        for index, child in enumerate(self._children):
            if child is target:
                return index
        return -1

    def mind_for_ai_text(self):
        # 把自己和全部子孙节点转换为 .mindforai 标准文本
        from .parser import serialize_document
        return serialize_document([self.to_data()])

    def to_data(self):
        # 转换为可用于序列化的字典结构
        if not self._branch and not self._children:
            return self._text
        return {"text": self._text, "children": [child.to_data() for child in self._children]}

    def __repr__(self):
        return f"Node(text={self._text!r}, children={len(self._children)})"

    def _coerce_node(self, node):
        if isinstance(node, Node):
            return node
        if isinstance(node, str):
            return Node(node)
        raise NodeArgumentError("child must be a Node or a string")

    def _is_ancestor_of(self, node):
        current = self
        while current is not None:
            if current is node:
                return True
            current = current._parent
        return False

    def _detach(self, target):
        for index, child in enumerate(self._children):
            if child is target:
                removed = self._children.pop(index)
                removed._parent = None
                return removed
        return target


def build_nodes(content):
    # 把解析得到的字典或字符串列表转换为 Node 列表
    return [_build_node(item) for item in content]


def _build_node(item):
    if isinstance(item, str):
        return Node(item, branch=False)
    if isinstance(item, dict):
        node = Node(item.get("text", ""), branch=True)
        for child in item.get("children", []):
            node._children.append(_build_node(child))
        for child in node._children:
            child._parent = node
        return node
    return Node(str(item))
