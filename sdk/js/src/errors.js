// 定义文档库使用的异常类型
export class MindForAIError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MindForAIError';
  }
}

export class ParseError extends MindForAIError {
  constructor(message) {
    super(message);
    this.name = 'ParseError';
  }
}
