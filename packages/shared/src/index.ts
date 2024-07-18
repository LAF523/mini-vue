import { Vnode } from "packages/runtime-core/src/vnode";

export const isArray = Array.isArray;
export const isObject = (v: any) => {
  return v !== null && typeof v === "object";
};
/**
 * @message: 是否是ref创建的响应式数据
 */
export const isRef = (r: any): boolean => {
  return !!(r && r.__v_isRef === true);
};
export const isReactive = (r: any): boolean => {
  return !!(r && r.__v_isReactive === true);
};
/**
 * @message: 检测两个值是否有差异
 */
export const hasChange = (v1: any, v2: any) => {
  return !Object.is(v1, v2);
};

export const isFunction = (v: any): v is Function => {
  return typeof v === "function";
};

export const extend = Object.assign;

export const EMPTY_OBJ: { readonly [key: string]: any } = {};

export const isString = (v: any): v is String => {
  return v && typeof v === "string";
};

export const isVnode = (v: any): v is Vnode => {
  return v && v.__V_isVnode === true;
};
const isOnRegx = /^on[^a-z]/;
export const isOn = (key: string) => {
  return isOnRegx.test(key);
};
