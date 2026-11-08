// 声明文档库的公开类型
export type MindForAINodeData = string | MindForAIBranchNodeData;

export interface MindForAIBranchNodeData {
  text: string;
  children: MindForAINodeData[];
}

export interface MindForAIParseIssue {
  line: number;
  column: number;
  code: string;
}

export interface MindForAIParseResult {
  data: {
    type: 'mindforai';
    version: number;
    content: MindForAINodeData[];
    manifest?: string;
  } | null;
  issues: MindForAIParseIssue[];
}
