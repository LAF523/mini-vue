/**
 * @message: 为class属性打补丁
 */
export const patchClass = (el: Element, value: string) => {
  if (value) {
    el.className = value;
  } else {
    el.removeAttribute("class");
  }
};
