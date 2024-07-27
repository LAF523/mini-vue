export const CREATE_ELEMENT_VNODE = Symbol("create_element_vnode");
export const CREATE_VNODE = Symbol("create_vnode");
export const TO_DISPLAY_STRING = Symbol("toDisplayString");
export const CREATE_COMMENT = Symbol("createCommentVnode");

// 将vue中的方法做一个映射,在编译时生成render函数时使用
export const helperNameMap = {
  // 在renderer中通过export {createVnode as createElementVnode }
  [CREATE_ELEMENT_VNODE]: "createElementVnode",
  [CREATE_VNODE]: "createVnode",
  [TO_DISPLAY_STRING]: "toDisplayString",
  [CREATE_COMMENT]: "createCommentVnode",
};
