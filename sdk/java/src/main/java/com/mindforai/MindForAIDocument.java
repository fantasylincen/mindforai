// 定义文档数据模型，包含类型、版本、内容与内嵌清单
package com.mindforai;

import java.util.ArrayList;
import java.util.List;

public class MindForAIDocument {
    private static final String TYPE = "mindforai";
    private int version;
    private List<MindForAINodeData> content;
    private String manifest;

    public MindForAIDocument(int version, List<MindForAINodeData> content, String manifest) {
        this.version = version;
        this.content = content == null ? new ArrayList<>() : content;
        this.manifest = manifest;
    }

    public String getType() {
        return TYPE;
    }

    public int getVersion() {
        return version;
    }

    public void setVersion(int version) {
        this.version = version;
    }

    public List<MindForAINodeData> getContent() {
        return content;
    }

    public void setContent(List<MindForAINodeData> content) {
        this.content = content;
    }

    public String getManifest() {
        return manifest;
    }

    public void setManifest(String manifest) {
        this.manifest = manifest;
    }
}
