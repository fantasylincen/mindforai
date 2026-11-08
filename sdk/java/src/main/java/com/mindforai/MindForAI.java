// 提供 MindForAI 文档的加载、保存与根节点访问能力
package com.mindforai;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

public class MindForAI {
    private Node root;
    private int version;
    private String manifest;

    public MindForAI() {
        this("", 1);
    }

    public MindForAI(String rootText, int version) {
        this.root = new Node(rootText, true);
        this.version = version;
        this.manifest = null;
    }

    public Node getRoot() {
        return root;
    }

    public void setRoot(Node root) {
        if (root == null) {
            throw new MindForAIException("root must not be null");
        }
        this.root = root;
    }

    public int getVersion() {
        return version;
    }

    public void setVersion(int version) {
        this.version = version;
    }

    public String getManifest() {
        return manifest;
    }

    public void setManifest(String manifest) {
        this.manifest = manifest;
    }

    public MindForAI load(String path) throws IOException {
        String contents = new String(Files.readAllBytes(Path.of(path)), StandardCharsets.UTF_8);
        return loadText(contents);
    }

    public MindForAI loadText(String contents) {
        MindForAIDocument data = MindForAITextFormat.parseOrRaise(contents);
        this.version = data.getVersion();
        this.manifest = data.getManifest();
        List<Node> nodes = new ArrayList<>();
        for (MindForAINodeData nodeData : data.getContent()) {
            nodes.add(Node.fromData(nodeData));
        }
        if (nodes.size() == 1 && nodes.get(0).isBranch()) {
            this.root = nodes.get(0);
        } else {
            Node newRoot = new Node("", true);
            for (Node node : nodes) {
                newRoot.insert(node, newRoot.getChildCount());
            }
            this.root = newRoot;
        }
        return this;
    }

    public void save(String path) throws IOException {
        Files.write(Path.of(path), mindForAIText().getBytes(StandardCharsets.UTF_8));
    }

    public String mindForAIText() {
        return MindForAITextFormat.serialize(contentData(), version, manifest);
    }

    private List<MindForAINodeData> contentData() {
        List<MindForAINodeData> content = new ArrayList<>();
        if (root.isBranch() || root.getChildCount() > 0) {
            content.add(root.toData());
        }
        return content;
    }
}
