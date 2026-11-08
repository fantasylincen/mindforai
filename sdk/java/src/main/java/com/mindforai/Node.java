// 提供思维导图节点树及其增删查改与文本导出能力
package com.mindforai;

import java.util.ArrayList;
import java.util.List;

public class Node {
    private String text;
    private boolean branch;
    private final List<Node> children = new ArrayList<>();
    private Node parent;

    public Node() {
        this("", false);
    }

    public Node(String text) {
        this(text, false);
    }

    public Node(String text, boolean branch) {
        this.text = text == null ? "" : text;
        this.branch = branch;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text == null ? "" : text;
    }

    public Node getParent() {
        return parent;
    }

    public boolean isBranch() {
        return branch || !children.isEmpty();
    }

    public List<Node> getChildren() {
        return new ArrayList<>(children);
    }

    public int getChildCount() {
        return children.size();
    }

    public List<Node> getDescendants() {
        List<Node> result = new ArrayList<>();
        collectDescendants(this, result);
        return result;
    }

    public Node get(int index) {
        if (index < 0 || index >= children.size()) {
            throw new MindForAIException("child index out of range");
        }
        return children.get(index);
    }

    public Node add(Node node) {
        return insert(node, children.size());
    }

    public Node add(String text) {
        return add(new Node(text));
    }

    public Node insert(Node node, int index) {
        if (node == null) {
            throw new MindForAIException("child must not be null");
        }
        int position = Math.max(0, Math.min(index, children.size()));
        if (node == this) {
            throw new MindForAIException("cannot insert a node into itself");
        }
        if (isAncestorOf(node)) {
            throw new MindForAIException("cannot insert an ancestor node as a child");
        }
        if (node.parent != null) {
            node.parent.detach(node);
        }
        children.add(position, node);
        node.parent = this;
        return node;
    }

    public Node insert(String text, int index) {
        return insert(new Node(text), index);
    }

    public Node remove(int index) {
        if (index < 0 || index >= children.size()) {
            throw new MindForAIException("child index out of range");
        }
        Node removed = children.remove(index);
        removed.parent = null;
        return removed;
    }

    public Node remove(Node node) {
        if (node == null) {
            throw new MindForAIException("remove requires a node");
        }
        int position = indexOf(node);
        if (position < 0) {
            throw new MindForAIException("node is not a child of this node");
        }
        Node removed = children.remove(position);
        removed.parent = null;
        return removed;
    }

    public int indexOf(Node node) {
        for (int i = 0; i < children.size(); i++) {
            if (children.get(i) == node) {
                return i;
            }
        }
        return -1;
    }

    public void clear() {
        for (Node child : children) {
            child.parent = null;
        }
        children.clear();
    }

    public String mindForAIText() {
        List<MindForAINodeData> content = new ArrayList<>();
        content.add(toData());
        return MindForAITextFormat.serialize(content, 1, null);
    }

    public MindForAINodeData toData() {
        if (!isBranch()) {
            return MindForAINodeData.leaf(text);
        }
        List<MindForAINodeData> childData = new ArrayList<>();
        for (Node child : children) {
            childData.add(child.toData());
        }
        return MindForAINodeData.branch(text, childData);
    }

    public static Node fromData(MindForAINodeData data) {
        if (data == null) {
            return new Node();
        }
        Node node = new Node(data.getText(), data.isBranch());
        for (MindForAINodeData childData : data.getChildren()) {
            node.insert(fromData(childData), node.getChildCount());
        }
        return node;
    }

    private static void collectDescendants(Node node, List<Node> result) {
        for (Node child : node.children) {
            result.add(child);
            collectDescendants(child, result);
        }
    }

    private boolean isAncestorOf(Node node) {
        Node current = this;
        while (current != null) {
            if (current == node) {
                return true;
            }
            current = current.parent;
        }
        return false;
    }

    private void detach(Node node) {
        int position = indexOf(node);
        if (position >= 0) {
            children.remove(position);
            node.parent = null;
        }
    }
}
