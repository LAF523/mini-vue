export const isArray = Array.isArray;
export const isObject = (v: any) => {
  return v !== null && typeof v === "object";
};
/**
 * @message: 是否是ref创建的响应式数据
 */
export const isRef = (r: any): boolean => {
  return !!(r && r._v_isRef === true);
};
/**
 * @message: 检测两个值是否有差异
 */
export const hasChange = (v1: any, v2: any) => {
  return !Object.is(v1, v2);
};
