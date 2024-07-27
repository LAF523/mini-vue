import { isString } from "@vue/shared";
import { createObjectExpression, NodeTypes } from "./ast";

export const isText = (node) =>
  node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT;

// 判断ast中的节点是否是插槽
export const isVslot = (v) => {
  return v.type === NodeTypes.DIRECTIVE && v.name === "slot";
};

// 直接返回node节点即可
export const getMemoedVNodeCall = (node) => {
  return node;
};

// 填充props
export const injectProp = (node, prop) => {
  let propsWithInjection;
  let props =
    node.type === NodeTypes.VNODE_CALL ? node.props : node.arguments[2];

  if (props == null || isString(props)) {
    propsWithInjection = createObjectExpression([prop]);
  }
  if (node.type === NodeTypes.VNODE_CALL) {
    node.props = propsWithInjection;
  }
};
