import { mutableHandlers } from "./basehandlers";

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
  // 构建target和proxy的映射
  proxyMap.set(target, existingProxy);

  return existingProxy;
}
