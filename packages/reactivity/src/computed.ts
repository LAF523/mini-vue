import { isFunction } from "@vue/shared";
import { Dep } from "./deps";
import { ReactiveEffect } from "./effect";
import { trackRefValue, triggerRefValue } from "./ref";

export function computed(getterOrOptions) {
  let getter;
  const onlyGetter = isFunction(getterOrOptions);
  if (onlyGetter) {
    getter = getterOrOptions;
  }
  const cRef = new ComputedRefImpl(getter);
  return cRef;
}

export class ComputedRefImpl<T> {
  private _value!: T;
  public dep?: Dep;
  public readonly effect: ReactiveEffect<T>; // 重要属性,该实例保存了计算属性中的函数参数,也就是说每次需要获取计算属性的值,都要调用这个属性的run方法
  public readonly __v_isRef: boolean = true;
  public _dirty: boolean = true; // 重要属性,决定是否重新计算和触发计算属性的依赖

  constructor(getter) {
    // 传递调度器的原因: 在响应式数据触发依赖时,执行一些其他逻辑,而不是依赖的run函数.
    // 这里的scheduler指定, 响应式数据触发依赖时, 计算属性进行依赖触发
    // 原因: 计算属性不一定有set操作所以不能在set中进行依赖触发,
    // 但计算属性的依赖一定需要计算属性的值变化时触发才能完成响应式, 计算属性的值变化依赖于某些响应式数据,那么当响应式数据变化时触发依赖即可
    // 当前的响应式收集依赖和触发依赖都是通过执行effect的run方法,现在的场景需要:
    //     收集依赖时通过run方法, 触发依赖时执行其他方法, 于是在effect中新加一个属性, 触发依赖时, 这个属性有值, 就执行这个属性
    // 因此将依赖触发的逻辑放在scheduler中,
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
        triggerRefValue(this);
      }
    });
    this.effect.computed = this;
  }

  get value() {
    // 依赖收集
    trackRefValue(this);
    if (this._dirty) {
      this._dirty = false;
      this._value = this.effect.run()!;
    }

    // 返回_value
    return this._value;
  }
}
