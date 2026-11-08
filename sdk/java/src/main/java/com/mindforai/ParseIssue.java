// 提供文档解析错误的行号、列号与错误码信息
package com.mindforai;

public class ParseIssue {
    private final int line;
    private final int column;
    private final String code;

    public ParseIssue(int line, int column, String code) {
        this.line = line;
        this.column = column;
        this.code = code;
    }

    public int getLine() {
        return line;
    }

    public int getColumn() {
        return column;
    }

    public String getCode() {
        return code;
    }

    @Override
    public String toString() {
        return code + " at line " + line + ", column " + column;
    }
}
