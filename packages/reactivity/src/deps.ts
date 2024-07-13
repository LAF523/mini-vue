import { ReactiveEffect } from "./effect";

export type Dep = Set<ReactiveEffect>;
/**
 * @message:依据effects生成dep实例,保存key对应的所有依赖
 */
export function createDep(effets?: ReactiveEffect[]): Dep {
  const dep = new Set<ReactiveEffect>(effets);
  return dep;
}
