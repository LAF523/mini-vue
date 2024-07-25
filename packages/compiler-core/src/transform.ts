import { NodeTypes } from "./ast";
import { isSingleElementRoot } from "./hoistStatic";

interface TransformContext {
  root; // 根节点
  parent: null; //每次转化时记录父节点
  childrenIndex: number; //每次转化时记录子节点索引
  currentNode; // 当前正在处理的节点
  helpers: Map<symbol, number>; // 协助创建 JavaScript AST 属性 helpers，该属性是一个 Map，key 值为 Symbol(方法名)，表示 render 函数中创建 节点 的方法
  helper: <T extends symbol>(name: T) => T;
  nodeTransforms: any[]; // 转化方法的集合
}

export function transform(root, options) {
  // 生成context对象
  const context = createTransformContext(root, options);

  //深度优先依次进行节点转化
  traverseNode(root, context);
  createRootCodegen(root);
  root.helpers = [...context.helpers.keys()];
  root.components = [];
  root.directives = [];
  root.imports = [];
  root.hoists = [];
  root.temps = [];
  root.cached = [];
}

/**
 * 为根节点添加codegenNode
 */
function createRootCodegen(root) {
  const { children } = root;

  // 仅支持一个根节点
  if ((children.length = 1)) {
    // children的长度为1,那里边的元素就是根节点
    const child = children[0];
    if (isSingleElementRoot(root, child) && child.codegenNode) {
      root.codegenNode = child.codegenNode;
    }
  }
}

/**
 * 前节点的状态需要子节点的情况来确定,所以需要深度优先
 */
function traverseNode(node, context: TransformContext) {
  context.currentNode = node;

  // 从所有处理方法中获取转化当前节点的方法,并保存
  const { nodeTransforms } = context;
  const onExits: any[] = [];
  nodeTransforms.forEach((fn) => {
    const onExit = fn(node, context);
    if (onExit) {
      onExits.push(onExit);
    }
  });

  // 有子节点则先(递归)处理子节点
  switch (node.type) {
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context);
      break;
  }

  // 最后执行转化函数
  context.currentNode = node;
  let i = onExits.length;
  while (i) {
    i--;
    onExits[i]();
  }
}
function traverseChildren(parent, context: TransformContext) {
  parent.children.forEach((child) => {
    context.parent = parent;
    context.currentNode = child;
    traverseNode(child, context); // 继续递归处理子节点
  });
}

/**
 * 创建context对象
 */
function createTransformContext(root, options): TransformContext {
  const context: TransformContext = {
    // state
    root,
    parent: null,
    currentNode: root,
    childrenIndex: 0,
    helpers: new Map(),

    //options
    nodeTransforms: options.nodeTransforms || [],

    // methods
    helper: (name) => {
      const count = context.helpers.get(name) || 0;
      context.helpers.set(name, count + 1);
      return name;
    },
  };
  return context;
}
