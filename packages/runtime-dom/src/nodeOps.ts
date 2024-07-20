// 封装浏览器相关的DOM操作
export const nodeOps = {
  insert,
  createElement,
  setElementText,
  remove,
  createText,
  setText,
  createComment,
};
/**
 * @message: 插入元素
 */
function insert(el: Element, parent: Element, anchor: Node | null = null) {
  parent.insertBefore(el, anchor);
}
/**
 * @message: 创建元素
 */
function createElement(tag: string) {
  const el = document.createElement(tag);
  return el;
}

/**
 * @message: 设置元素文本内容
 */
function setElementText(el: Element, text: string) {
  el.textContent = text;
}

/**
 * @message: 删除DOM元素
 */
function remove(el: Element) {
  el?.remove();
}

/**
 * @message: 创建纯文本节点
 */
function createText(text: string) {
  return document.createTextNode(text);
}

function setText(el: Element, text: string) {
  el.nodeValue = text;
}

/**
 * @message: 创建注释节点
 */
function createComment(text: string) {
  return document.createComment(text);
}
