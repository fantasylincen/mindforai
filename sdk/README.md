# MindForAI SDK

`.toon` 文档数据结构的多种语言 API 程序库，支持 Python / JavaScript / TypeScript / Java。

## 文档格式

`.toon` 为行式缩进树状文本：叶子独占一行、文本不加引号，分支节点写 `- text:` 后跟 `children[n]:`；末尾可选 `manifest:` 字段（ZIP+Base64 清单），解析时被读取为文档的 `manifest`。

```
type: mindforai
version: 1
content[1]:
  - text: 根节点
    children[2]:
      - 叶子节点
      - text: 另一个分支
        children[1]:
          - 更深一层的叶子
```

## 公开接口

`MindForAI`

- `new MindForAI()` / `MindForAI()` / `new MindForAI()`：创建空文档
- `load(path)`：从文件加载
- `loadText(text)` / `load_text(text)`：从字符串加载
- `save(path)` / `save_text`：保存到文件
- `root` / `getRoot()`：获取根节点
- `mindForAIText()` / `mind_for_ai_text()`：整篇文档导出为 `.toon` 文本

`Node`

- `children` / `getChildren()`：全部直接子节点（副本）
- `childCount` / `getChildCount()`：子节点数量
- `descendants` / `getDescendants()`：全部层级子孙节点
- `get(index)`：按索引获取子节点
- `add(node)`：末尾增加子节点
- `insert(node, index)`：在指定位置插入
- `remove(index | node)`：删除并返回被删除节点
- `text`：节点文本
- `parent`：父节点
- `mindForAIText()` / `mind_for_ai_text()`：自身和子孙节点导出为 `.toon` 文本

## 各语言用法

### Python

```python
from mindforai import MindForAI, Node

doc = MindForAI()
doc.load("./example.toon")
node = doc.root
print(node.text, node.child_count)
node.add(Node("新节点"))
print(doc.root.descendants)
```

运行测试：`cd sdk/python && python3 -m unittest discover -s tests -v`

### JavaScript

```js
const { MindForAI, Node } = require('./sdk/js/dist/src/index.js');

const doc = new MindForAI();
doc.load('./example.toon');
console.log(doc.root.text, doc.root.childCount);
doc.root.add(new Node('new node'));
```

构建：`cd sdk/js && npm run build`；测试：`npm test`。

### TypeScript

```ts
import { MindForAI, Node } from './src/index';

const doc = new MindForAI();
doc.load('./example.toon');
const node: Node = doc.root.get(0);
console.log(node.mindForAIText());
```

源码位于 `sdk/js/src`，与 JavaScript 版本共用一套 TypeScript 实现（`npm run build` 产出 `dist/src`）。
TypeScript 单元测试：`cd sdk/js && npx vitest run`。

### Java

```java
import com.mindforai.MindForAI;
import com.mindforai.Node;

MindForAI doc = new MindForAI();
doc.load("./example.toon");
Node root = doc.getRoot();
root.add("new node");
System.out.println(root.getDescendants().size());
```

构建：`cd sdk/java && mvn package`；测试类：`src/test/java/com/mindforai/MindForAITest.java`。

## 解析错误

Python 抛 `ParseError`，JS/TS 抛 `ParseError`，Java 抛 `ParseException`（含行号、列号、错误码）。JS/TS/Python 还提供返回错误列表的解析函数（`parseText` / `parse_text`）用于容错处理。
