import { isObject } from "@vue/shared";
import { createVnode } from "./vnode";
import { Text } from "./vnode";
import { ShapeFlags } from "packages/shared/src/shapeFlags";

/**
 * @message: 标准化vnode
 */
export function normalizeVnode(child: any) {
  if (isObject(child)) {
    return child;
  }
  return createVnode(Text, null, child);
}

/**
 * @message: 执行render,获取组件返回的vnode
 */
export function renderComponentRoot(instance) {
  const { vnode, render, data = {} } = instance;
  let result;
  try {
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      const componentRenderVnode = render.call(data, data);
      result = normalizeVnode(componentRenderVnode);
    }
  } catch (e) {
    console.error(e);
  }

  return result;
}
