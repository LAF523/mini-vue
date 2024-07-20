import { isObject } from "@vue/shared";
import { createVnode } from "./vnode";
import { Text } from "./vnode";

/**
 * @message: 标准化vnode
 */
export function normalizeVnode(child: any) {
  if (isObject(child)) {
    return child;
  }
  return createVnode(Text, null, child);
}
