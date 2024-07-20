export const enum ShapeFlags {
  // vnode类型
  ELEMENT = 1, // 普通标签
  FUNCTIONAL_COMPONENT = 1 << 1, // 函数式组件
  STATEFUL_COMPONENT = 1 << 2, // 有状态组件
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT, // 有状态 | 函数式组件

  //children类型
  TEXT_CHILDREN = 1 << 3, // Text类型
  ARRAY_CHILDREN = 1 << 4, // Array类型
  SLOTS_CHILDREN = 1 << 5, // 插槽类型
}
