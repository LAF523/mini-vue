import { hasChange, isRef } from "@vue/shared";
import { createDep, Dep } from "./deps";
import { toReactive } from "./reactive";
import { activeEffect, trackEffets, triggerEffects } from "./effect";

export interface Ref<T = any> {
  value: T;
}
/**
 * @message: 常见深层响应式数据
 */
export function ref(value?: unknown) {
  // 创建深层响应式数据
  return createRef(value, false);
}
/**
 * @message: 创建RefImpl实例,shallow是否创建浅层响应式数据
 */
function createRef<T = any>(rawValue: any, shallow: boolean): RefImpl<T> {
  if (isRef(rawValue)) {
    return rawValue;
  }
  return new RefImpl(rawValue, shallow);
}

/**
 * @message: ref类,用来生成ref数据实例
 */
class RefImpl<T> {
  public _rawValue: T;
  private _value: T;
  public dep?: Dep = undefined; // 存放该实例的依赖
  public readonly __v_isRef = true; // 标志位,用来判断数据是否为ref实例
  constructor(
    rawValue: T,
    public readonly __v_isShallow: boolean
  ) {
    this._rawValue = rawValue;
    this._value = __v_isShallow ? rawValue : toReactive(rawValue);
  }
  get value() {
    trackRefValue(this);
    return this._value;
  }
  set value(newValue) {
    // 值有变化时,设置新值并触发依赖
    if (hasChange(this._value, newValue)) {
      this._rawValue = newValue;
      this._value = toReactive(newValue);
      triggerRefValue(this);
    }
  }
}
/**
 * @message: 收集依赖
 */
function trackRefValue(ref) {
  if (activeEffect) {
    if (!ref.dep) {
      ref.dep = createDep();
    }
    trackEffets(ref.dep);
  }
}
/**
 * @message: 触发收集的依赖
 */
function triggerRefValue(ref) {
  triggerEffects(ref.dep);
}
