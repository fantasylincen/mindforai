// 提供 .toon 文档库的通用异常类型
package com.mindforai;

public class MindForAIException extends RuntimeException {
    public MindForAIException(String message) {
        super(message);
    }
}
