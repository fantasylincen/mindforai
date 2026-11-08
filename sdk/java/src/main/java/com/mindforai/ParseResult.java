// 定义文档解析结果，包含文档数据与错误列表
package com.mindforai;

import java.util.Collections;
import java.util.List;

public class ParseResult {
    private final MindForAIDocument data;
    private final List<ParseIssue> issues;

    public ParseResult(MindForAIDocument data, List<ParseIssue> issues) {
        this.data = data;
        this.issues = Collections.unmodifiableList(issues);
    }

    public MindForAIDocument getData() {
        return data;
    }

    public List<ParseIssue> getIssues() {
        return issues;
    }

    public boolean isSuccess() {
        return data != null;
    }
}
