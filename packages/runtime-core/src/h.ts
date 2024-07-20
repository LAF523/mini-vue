import { isArray, isObject, isVnode } from "@vue/shared";
import { createVnode } from "./vnode";

export function h(type: any, propsOrChildren: any, children: any) {
  // 处理参数
  const l = arguments.length;
  if (l === 2) {
    // 只有两个参数,第二个参数可能是children也可能是props也有可能是vndoe
    const isProps = isObject(propsOrChildren) && !isArray(propsOrChildren);
    if (isProps) {
      if (isVnode(propsOrChildren)) {
        return createVnode(type, null, [propsOrChildren]);
      }
      return createVnode(type, propsOrChildren);
    } else {
      return createVnode(type, null, propsOrChildren);
    }
  } else {
    if (l > 3) {
      children = [...arguments].slice(2);
    } else if (l === 3 && isVnode(children)) {
      children = [children];
    }
    return createVnode(type, propsOrChildren, children);
  }
}
