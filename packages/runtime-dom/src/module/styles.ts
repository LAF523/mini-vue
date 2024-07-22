import { EMPTY_OBJ, isArray, isObject, isString } from "@vue/shared";

/**
 * @message: 处理样式
 */
export const patchStyles = (el: Element, preValue: any, nextValue: any) => {
  const style = (el as HTMLElement).style;
  if (nextValue && !isString(nextValue)) {
    // 删除旧的
    if (preValue && !isString(preValue)) {
      for (let key in preValue) {
        setStyle(style, key, "");
      }
    }
    // 添加新的
    for (let key in nextValue) {
      setStyle(style, key, nextValue[key]);
    }
  }
};

const setStyle = (style: CSSStyleDeclaration, key: string, value: any) => {
  style[key] = value;
};
