// 定义可序列化的节点数据模型
package com.mindforai;

import java.util.ArrayList;
import java.util.List;

public class MindForAINodeData {
    private final String text;
    private final boolean branch;
    private final List<MindForAINodeData> children;

    private MindForAINodeData(String text, boolean branch, List<MindForAINodeData> children) {
        this.text = text;
        this.branch = branch;
        this.children = children;
    }

    public static MindForAINodeData leaf(String text) {
        return new MindForAINodeData(text, false, new ArrayList<>());
    }

    public static MindForAINodeData branch(String text, List<MindForAINodeData> children) {
        return new MindForAINodeData(text, true, children);
    }

    public String getText() {
        return text;
    }

    public boolean isBranch() {
        return branch || !children.isEmpty();
    }

    public List<MindForAINodeData> getChildren() {
        return children;
    }
}
