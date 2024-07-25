import { createVnodeCall, NodeTypes } from "../ast";

/**
 * @message: 转换element节点的方法
 */
export function transformElement(node, context) {
  // 添加codegenNode
  return function postTransformElement() {
    node = context.currentNode; // 校准

    if (node.type !== NodeTypes.ELEMENT) {
      // 只处理ELEMENT类型
      return;
    }

    const { tag } = node;

    let vnodeTag = `"${tag}"`;
    let vnodeProps = [];
    let vnodeChildren = node.children;

    node.codegenNode = createVnodeCall(
      context,
      vnodeTag,
      vnodeProps,
      vnodeChildren
    );
  };
}
