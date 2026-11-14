# 定义文档库使用的异常类型


class MindForAIError(Exception):
    # 文档库通用异常基类
    pass


class ParseError(MindForAIError):
    # .toon 文本解析失败时抛出的异常
    pass


class NodeArgumentError(MindForAIError):
    # 节点操作参数非法时抛出的异常
    pass
