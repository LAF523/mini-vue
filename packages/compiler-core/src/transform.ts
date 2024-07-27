import { isArray, isString } from "@vue/shared";
import { ElementTypes, NodeTypes } from "./ast";
import { isSingleElementRoot } from "./hoistStatic";
import { TO_DISPLAY_STRING } from "./runtimehelpers";
import { isVslot } from "./utils";

export interface TransformContext {
  root; // 根节点
  parent: null; //每次转化时记录父节点
  childrenIndex: number; //每次转化时记录子节点索引
  currentNode; // 当前正在处理的节点
  helpers: Map<symbol, number>; // 协助创建 JavaScript AST 属性 helpers，该属性是一个 Map，key 值为 Symbol(方法名)，表示 render 函数中创建 节点 的方法
  helper: <T extends symbol>(name: T) => T;
  nodeTransforms: any[]; // 转化方法的集合
  replaceNode(node): void; // 切换currentNode
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
  const exitFns: any[] = [];

  for (let i = 0; i < nodeTransforms.length; i++) {
    const onExit = nodeTransforms[i](node, context);
    if (onExit) {
      // 指令的transforms返回是数组,所以需要解构
      if (isArray(onExit)) {
        exitFns.push(...onExit);
      } else {
        exitFns.push(onExit);
      }
    }

    //触发了repalceNode,这里的context.currentNode可能发生变化,需要校正一下
    if (!context.currentNode) {
      // 节点被移除了
      return;
    } else {
      node = context.currentNode;
    }
  }

  // 有子节点则先(递归)处理子节点
  switch (node.type) {
    case NodeTypes.IF_BRANCH:
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context);
      break;
    case NodeTypes.INTERPOLATION: // 处理插值表达式
      context.helper(TO_DISPLAY_STRING);
      break;
    // if指令
    case NodeTypes.IF:
      for (let i = 0; i < node.branches.length; i++) {
        traverseNode(node.branches[i], context);
      }
      break;
  }

  // 最后执行转化函数
  context.currentNode = node;
  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
}
function traverseChildren(parent, context: TransformContext) {
  parent.children.forEach((child, index) => {
    context.parent = parent;
    context.childrenIndex = index;
    traverseNode(child, context); // 继续递归处理子节点
  });
}

/**
 * 创建context对象
 */
function createTransformContext(
  root,
  { nodeTransforms = [] }
): TransformContext {
  const context: TransformContext = {
    // state
    root,
    parent: null,
    currentNode: root,
    childrenIndex: 0,
    helpers: new Map(),

    //options
    nodeTransforms,

    // methods
    helper: (name) => {
      const count = context.helpers.get(name) || 0;
      context.helpers.set(name, count + 1);
      return name;
    },
    replaceNode(node) {
      context.parent!.children[context.childrenIndex] = context.currentNode =
        node;
    },
  };
  return context;
}

/**
 * @message:针对指令的处理,根据每个指令生成不同的处理函数
 * @param {string} name 匹配具体的指令
 * @param {*} fn 指令的具体处理方法
 * @return {*} 返回一个闭包函数
 */
export function createStructuralDirectiveTransform(name: string | RegExp, fn) {
  const matches = isString(name)
    ? (n: string) => n === name
    : (n: string) => name.test(n);

  return (node, context) => {
    // 目前只处理ELEMENT类型中的指令
    if (node.type === NodeTypes.ELEMENT) {
      const { props } = node;

      //结构的转换与v-slot无关
      if (node.tagType === ElementTypes.TEMPLATE && props.some(isVslot)) {
        return;
      }

      // 存储指令转换函数
      const exitFns: any = [];

      for (let i = 0; i < props.length; i++) {
        const prop = props[i];
        // 只处理表示指令的属性
        if (prop.type === NodeTypes.DIRECTIVE && matches(prop.name)) {
          // 删除匹配到的prop,避免无限递归
          props.splice(i, 1);
          i--;

          const onExit = fn(node, prop, context);
          if (onExit) {
            exitFns.push(onExit);
          }
        }
      }

      return exitFns;
    }
  };
}
