import { isObject } from "@vue/shared";
import { mutableHandlers } from "./basehandlers";

export enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
}
// 缓存target对应的proxyObj
const reactiveMap: WeakMap<object, any> = new WeakMap();
export function reactive(target: object) {
  return createReactiveObject(target, mutableHandlers, reactiveMap);
}

// 根据target生成proxy实例,并构建两者的缓存映射
function createReactiveObject(
  target: object,
  mutableHandlers: ProxyHandler<object>,
  proxyMap: WeakMap<object, any>
) {
  let existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }

  existingProxy = new Proxy(target, mutableHandlers);
  existingProxy[ReactiveFlags.IS_REACTIVE] = true; // 表示reactive创建的数据
  // 构建target和proxy的映射
  proxyMap.set(target, existingProxy);

  return existingProxy;
}

/**
 * @message: 如果是object类型的数据,直接使用reactive创建响应式数据
 */
export function toReactive(value: any) {
  return isObject(value) ? reactive(value) : value;
}
