/**
 * @message: 处理HTML Attribute
 */
export const patchAttrs = (el: Element, key: string, value: any) => {
  if (value) {
    el.setAttribute(key, value);
  } else {
    el.removeAttribute(key);
  }
};
