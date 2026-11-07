import {
  buildMermaidMindPayload,
  getMermaidDefinition,
  getMermaidMindData,
  isMermaidFlowchartDefinition,
  isMermaidLeafElement,
  MERMAID_MIND_KEY,
  parseMermaidMindPayload,
} from './mermaid-mind';

describe('mermaid mind payload', () => {
  const elements = [
    {
      id: 'a',
      type: 'geometry',
      points: [
        [0, 0],
        [100, 40],
      ],
      shape: 'rectangle',
    },
  ];

  it('stores the whole flowchart as a json string', () => {
    const payload = buildMermaidMindPayload('flowchart TD\n A --> B', elements);
    expect(typeof payload).toBe('string');
    expect(JSON.parse(payload)).toEqual({
      definition: 'flowchart TD\n A --> B',
      elements,
    });
  });

  it('parses the payload back', () => {
    const payload = buildMermaidMindPayload('flowchart TD\n A --> B', elements);
    expect(parseMermaidMindPayload(payload)).toEqual({
      definition: 'flowchart TD\n A --> B',
      elements,
    });
  });

  it('falls back to the raw definition when payload is not json', () => {
    expect(parseMermaidMindPayload('flowchart TD')).toEqual({
      definition: 'flowchart TD',
      elements: [],
    });
  });

  it('detects flowchart definitions', () => {
    expect(isMermaidFlowchartDefinition('flowchart TD\n A --> B')).toBe(true);
    expect(isMermaidFlowchartDefinition('graph LR\n A --> B')).toBe(true);
    expect(isMermaidFlowchartDefinition('just some text')).toBe(false);
  });

  it('reads the definition from the node topic text', () => {
    const element = {
      id: 'm',
      type: 'mind_child',
      data: {
        topic: { children: [{ text: 'flowchart TD\n A --> B' }], type: 'paragraph' },
      },
      children: [],
    } as any;
    expect(getMermaidDefinition(element)).toBe('flowchart TD\n A --> B');
  });

  it('falls back to legacy mermaid data when the topic is empty', () => {
    const element = {
      id: 'm',
      type: 'mind_child',
      data: {
        topic: { children: [{ text: '' }], type: 'paragraph' },
        [MERMAID_MIND_KEY]: {
          mermaid: buildMermaidMindPayload('flowchart TD\n A --> B', elements),
          width: 200,
          height: 100,
        },
      },
      children: [],
    } as any;
    expect(getMermaidDefinition(element)).toBe('flowchart TD\n A --> B');
  });

  it('ignores stale mermaid data after the topic becomes plain text', () => {
    const element = {
      id: 'm',
      type: 'mind_child',
      data: {
        topic: { children: [{ text: 'plain text' }], type: 'paragraph' },
        [MERMAID_MIND_KEY]: {
          mermaid: 'flowchart TD\n A --> B',
          width: 200,
          height: 100,
        },
      },
      children: [],
    } as any;
    expect(getMermaidDefinition(element)).toBeNull();
  });

  it('detects a flowchart node by its topic text', () => {
    const element = {
      id: 'm',
      type: 'mind_child',
      data: {
        topic: { children: [{ text: 'flowchart TD\n A --> B' }], type: 'paragraph' },
      },
      children: [],
    } as any;
    expect(isMermaidLeafElement(element)).toBe(true);
  });

  it('reads mermaid mind data from a mind element data', () => {
    const element = {
      id: 'm',
      type: 'mind_child',
      data: {
        topic: { children: [{ text: '' }] },
        [MERMAID_MIND_KEY]: {
          mermaid: buildMermaidMindPayload('flowchart TD', elements),
          width: 200,
          height: 100,
        },
      },
    } as any;
    expect(getMermaidMindData(element)).toEqual({
      mermaid: buildMermaidMindPayload('flowchart TD', elements),
      width: 200,
      height: 100,
    });
    expect(isMermaidLeafElement(element)).toBe(true);
    expect(isMermaidLeafElement({ id: 'x', data: {} } as any)).toBe(false);
  });
});
