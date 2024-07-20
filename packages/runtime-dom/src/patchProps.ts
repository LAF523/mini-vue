import { isOn } from "@vue/shared";
import { patchClass } from "./module/class";
import { patchDOMProps } from "./module/props";
import { patchAttrs } from "./module/attr";
import { patchStyles } from "./module/styles";
import { patchEvent } from "./module/event";

// 封装处理DOM属性的操作
export const patchProps = (
  el: Element,
  key: string,
  preValue: any,
  nextValue: any
) => {
  if (key === "class") {
    patchClass(el, nextValue);
  } else if (key === "style") {
    // 处理style属性
    patchStyles(el, preValue, nextValue);
  } else if (isOn(key)) {
    // 处理事件
    patchEvent(el, key, preValue, nextValue);
  } else if (shouldSetAsProp(el, key, nextValue)) {
    // 处理 DOM Props
    patchDOMProps(el, key, nextValue);
  } else {
    // 处理HTML Attribute
    patchAttrs(el, key, nextValue);
  }
};

/**
 * @message: 判断key是否需要通过DOM对象直接设置
 */
function shouldSetAsProp(el, key, value) {
  // form标签的属性是只读的,必须通过setAttribute设置
  if (key === "form") {
    return false;
  }

  //
  if (key === "list" && el.tagName === "INPUT") {
    return false;
  }

  if (key === "type" && el.tagName === "TEXTAREA") {
    return false;
  }

  return key in el;
}
