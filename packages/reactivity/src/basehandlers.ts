import { track, trigger } from "./effect";

const get = createGetter();
const set = createSetter();

export const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
};

function createGetter() {
  return function (target: object, key: string | symbol, receiver: object) {
    const res = Reflect.get(target, key, receiver);

    // 依赖收集
    track(target, key);

    return res;
  };
}
function createSetter() {
  return function (
    target: object,
    key: string | symbol,
    value: any,
    receiver: object
  ) {
    Reflect.set(target, key, value, receiver);

    // 触发依赖
    trigger(target, key, value);

    return true;
  };
}
