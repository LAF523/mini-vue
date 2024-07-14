import { isArray } from "@vue/shared";
import { createDep, Dep } from "./deps";

// 存放每个target和其对应的所有依赖
type KeyToMap = Map<any, Set<ReactiveEffect>>;
let targetMap = new WeakMap<any, KeyToMap>();
// 存放当前收集到的ReactveEffect
export let activeEffect: ReactiveEffect | undefined;

/**
 * @message: 依赖收集,存储target每个属性对应的依赖
 */
export function track(target: object, key: string | symbol) {
  // 如果没有依赖对象,则不用收集
  if (!activeEffect) {
    return;
  }

  let depsMap = targetMap.get(target);
  if (!depsMap) {
    // depsMap不存在,说明是第一次收集到依赖,创建一个新的来存储key对应的依赖对象
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  // 多依赖处理
  let dep = depsMap.get(key);
  if (!dep) {
    dep = createDep();
    depsMap.set(key, dep);
  }
  trackEffets(dep);
}

/**
 * @message: 依赖触发,触发track收集的所有依赖
 */
export function trigger(target: object, key: string | symbol, value: any) {
  const depsMap = targetMap.get(target); // 获取target对应的所有依赖
  if (!depsMap) {
    return;
  }
  const dep = depsMap.get(key); // 根据setter修改的key,找到key对应的所有依赖,并触发
  if (!dep) {
    return;
  }
  triggerEffects(dep);
}

/**
 * @message: 将依赖创建为依赖对象,并保存到全局变量activeEffect
 */
export function effect<T = any>(fn: () => T) {
  const _effect = new ReactiveEffect(fn);
  _effect.run(); // 调用run 保存这个实例到activeEffect,并执行依赖
}

// 包含依赖实例
export class ReactiveEffect<T = any> {
  public fn: () => T;
  constructor(fn: () => T) {
    this.fn = fn; // 将依赖函数保存在fn中,这样每个实例都能保存对应的依赖,保存这个实例,就可以拿到依赖函数了
  }

  run() {
    activeEffect = this; // 指定当前处理的依赖,以便收集的时候获取

    this.fn();
  }
}
/**
 * @message: 添加依赖到dep中
 */
export function trackEffets(dep: Dep) {
  dep.add(activeEffect!);
}

/**
 * @message: 触发所有的依赖
 */
export function triggerEffects(dep: Dep) {
  const effects = isArray(dep) ? dep : [...dep];
  for (const effect of effects) {
    triggerEffect(effect);
  }
}
/**
 * @message: 触发指定依赖
 */
export function triggerEffect(effect: ReactiveEffect) {
  effect.run();
}
