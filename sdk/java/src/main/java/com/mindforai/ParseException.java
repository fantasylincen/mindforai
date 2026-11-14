// 提供 .toon 文本解析失败时使用的异常类型
package com.mindforai;

public class ParseException extends MindForAIException {
    private final int line;
    private final int column;
    private final String code;

    public ParseException(String message, int line, int column, String code) {
        super(message);
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
}
