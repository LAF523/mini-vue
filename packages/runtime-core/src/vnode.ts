import { isArray, isFunction, isObject, isString } from "@vue/shared";
import { ShapeFlags } from "packages/shared/src/shapeFlags";

export interface Vnode {
  __v_isVnode: true;
  type: any;
  props: any;
  children: any;
  shapeFlag: number;
  el: Element;
  key: any;
  component?: any;
}

// 定义三种虚拟DOM类型
export const Text = Symbol("Text");
export const Comment = Symbol("Comment");
export const Fragment = Symbol("Fragment");

export function createVnode(type: any, props: any, children?: any) {
  // 增强class和style
  if (props) {
    const { class: klass } = props;
    if (klass) {
      props.class = normalizeClass(klass);
    }
  }
  // 根据type创建shapflag
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
      ? ShapeFlags.STATEFUL_COMPONENT
      : 0;
  return createBaseVnode(type, props, children, shapeFlag);
}

/**
 * @message: 创建vnode
 */
function createBaseVnode(
  type: any,
  props: any,
  children: any,
  shapeFlag: number
) {
  // 生成vnode
  const vnode: Vnode = {
    __v_isVnode: true,
    type,
    props: props,
    children,
    shapeFlag,
    key: props?.key || undefined,
  };

  normalizeChildren(vnode, children);
  return vnode;
}

/**
 * @message: 根据children类型,设置shapeFlag的值
 */
function normalizeChildren(vnode: Vnode, children: any) {
  let type = 0;
  if (children == null) {
    children = null;
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN;
  } else if (isObject(children)) {
  } else if (isFunction(children)) {
  } else {
    vnode.children = String(children);
    // 为 type 指定 Flags
    type = ShapeFlags.TEXT_CHILDREN;
  }
  // 修改 vnode 的 chidlren
  vnode.children = children;
  // 按位或赋值
  vnode.shapeFlag |= type;
}
/**
 * @message: 增强class处理,以便支持class的多种写法: 字符串,数组,对象
 */
function normalizeClass(klass: any): String {
  let res = "";
  if (isString(klass)) {
    return klass;
  }
  if (isArray(klass)) {
    res = klass.reduce((acc, curr) => {
      acc += ` ${normalizeClass(curr)}`;
      return acc;
    }, "");
  } else if (isObject(klass)) {
    res = Object.entries(klass).reduce((acc, [key, value]) => {
      if (value) {
        acc += key;
      }
      return acc;
    }, "");
  }
  return res.trim();
}

/**
 * @message: 是否是相同类型的vnode
 */
export const isSameType = (v1: Vnode, v2: Vnode) => {
  return v1.type === v2.type && v1.key === v2.key;
};

// 创建注释类型vnode
export function createCommentVnode(text) {
  return createVnode(Comment, null, text);
}
