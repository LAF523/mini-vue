import { EMPTY_OBJ, hasChange, isObject, isReactive, isRef } from "@vue/shared";
import {
  EffectScheduler,
  ReactiveEffect,
} from "packages/reactivity/src/effect";
import { queuePreFlushCb } from "./scheduler";

// watch配置项类型
export interface WatchOptions<Immediate = boolean> {
  immediate?: Immediate;
  deep?: boolean;
}

export function watch(source, cb: Function, options?: WatchOptions) {
  return toWatch(source, cb, options);
}

/**
 * @message: 主函数
 */
function toWatch(
  source,
  cb: Function,
  { immediate, deep }: WatchOptions = EMPTY_OBJ
) {
  // 处理getter,最终把getter包装成可以触发依赖收集的函数
  let getter;
  if (isReactive(source)) {
    getter = () => source;
    deep = true;
  } else if (isRef(source)) {
    debugger;
    getter = () => source.value;
  } else {
    getter = () => ({});
  }
  if (cb && deep) {
    const baseGetter = getter;
    getter = () => traverse(baseGetter());
  }

  // 定义job
  const job = () => {
    if (cb) {
      const newValue = effect.run(); // 当数据变化时获取最新的值
      if (deep || hasChange(oldValue, newValue)) {
        cb(oldValue, newValue);
        oldValue = newValue;
      }
    }
  };
  // 定义调度器
  const scheduler: EffectScheduler = () => queuePreFlushCb(job);

  let oldValue = {}; // 赋值为一个空对象,便于: Immediate为true时,hasChange为true,保证顺利执行cb
  // 创建effect
  let effect = new ReactiveEffect(getter, scheduler);

  if (cb) {
    if (immediate) {
      job();
    } else {
      oldValue = effect.run();
    }
  }

  return () => {
    effect.stop();
  };
}

/**
 * @message: 递归访问数据的所有属性,从而触发依赖收集
 */
function traverse(value: any) {
  if (isObject(value)) {
    for (let key in value) {
      traverse(value[key]);
    }
  }
  return value;
}
