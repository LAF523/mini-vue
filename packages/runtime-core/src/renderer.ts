import { ShapeFlags } from "packages/shared/src/shapeFlags";
import { Fragment, Vnode, Text, Comment, isSameType } from "./vnode";
import { patchProps } from "packages/runtime-dom/src/patchProps";
import { nodeOps } from "packages/runtime-dom/src/nodeOps";
import { EMPTY_OBJ, extend } from "@vue/shared";
import { normalizeVnode, renderComponentRoot } from "./componentRenderUtils";
import { createComponentInstance, setupComponent } from "./components";
import { ReactiveEffect } from "packages/reactivity/src/effect";
import { queuePreFlushCb } from "./scheduler";
import { patchKeyedChildren } from "./diff";

// runtime-dom中封装的各种兼容API
interface RenderOptions {
  // 向父元素中锚点位置插入一个元素
  insert: (el: Element, parent: Element, anchor: Element | null) => void;
  // 根据标签名创建HTML元素
  createElement: (tag: string) => Element;
  // 设置元素的text
  setElementText: (el: Element, text: string) => void;
  // 为元素的某个属性打补丁
  patchProps: (el: Element, key: string, preValue: any, nextValue: any) => void;
  // 删除元素
  remove: (el: Element) => void;
  createText: (text: string) => any;
  createComment: (text: string) => any;
  setText: (el: Element, text: string, anchor: Element | null) => void;
}

export function createRenderer(options: RenderOptions) {
  return createBaseRenderer(options);
}

// 将各个模块封装的DOM操作相关的api合并
const renderOptions = extend({ patchProps }, nodeOps);
let renderer;
export const render = (...args) => {
  return ensureRenderer().render(...args);
};

function ensureRenderer(): { render: Function } {
  return renderer || (renderer = createBaseRenderer(renderOptions));
}

function createBaseRenderer(renderOptions: RenderOptions): {
  render: Function;
} {
  // 获取runtime-dom中的api
  const {
    insert: hostInsert,
    createElement: hostCreateElement,
    setElementText: hostSetElementText,
    patchProps: hostPatchProps,
    remove: hostRemove,
    createText: hostCreateText,
    setText: hostSetText,
    createComment: hostCreateComment,
  } = renderOptions;

  /**
   * @message: 渲染函数
   * @param vnode 新的虚拟DOM
   * @param {*} container 容器
   */
  const render = (
    vnode: Vnode | null,
    container: Element & { _vnode: Vnode | null }
  ) => {
    const needUnMount = vnode === null;
    if (needUnMount) {
      //  需要卸载
      if (container._vnode) {
        unmount(container._vnode);
      }
    } else {
      // 需要挂载或更新
      patch(container._vnode, vnode, container);
    }
    container._vnode = vnode;
  };

  /**
   * @message: 对vnode打补丁(挂载和更新)
   * @param {Vnode} oldVnode
   * @param {Vnode} newVnode
   */
  const patch = (
    oldVnode: Vnode | null = null,
    newVnode: Vnode,
    container: Element,
    anchor: Element | null = null
  ) => {
    if (oldVnode === newVnode) {
      return;
    }
    // 如果新旧节点类型不同,删除旧节点
    if (oldVnode && !isSameType(oldVnode, newVnode)) {
      // 删除旧节点
      unmount(oldVnode);
      oldVnode = null;
    }

    const { type, shapeFlag } = newVnode;
    switch (type) {
      case Text:
        processText(oldVnode, newVnode, container, anchor);
        break;
      case Fragment:
        processFragment(oldVnode, newVnode, container, anchor);
        break;
      case Comment:
        processComment(oldVnode, newVnode, container, anchor);
        break;
      default: {
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 类型是HTML标签
          processElement(oldVnode, newVnode, container, anchor);
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          // 类型是组件
          processComponent(oldVnode, newVnode, container, anchor);
        }
      }
    }
  };

  /**
   * @message: 处理组件类型vnode
   */
  function processComponent(
    oldVnode: Vnode | null,
    newVnode: Vnode,
    container: Element,
    anchor: Element | null = null
  ) {
    if (oldVnode === null) {
      // 挂载
      mountComponent(newVnode, container, anchor);
    } else {
      // 更新
    }
  }

  /**
   * @message: 处理代码片段元素
   */
  function processFragment(
    oldVnode: Vnode | null,
    newVnode: Vnode,
    container: Element,
    anchor: Element | null = null
  ) {
    if (oldVnode == null) {
      // 挂载
      mountChildren(newVnode.children, container, anchor);
    } else {
      // 更新
      patchChildren(oldVnode, newVnode, container, anchor);
    }
  }

  /**
   * @message: 处理注释节点
   */
  function processComment(
    oldVnode: Vnode | null,
    newVnode: Vnode,
    container: Element,
    anchor: Element | null = null
  ) {
    if (oldVnode === null) {
      // 挂载
      newVnode.el = hostCreateComment(newVnode.children);
      hostInsert(newVnode.el, container, anchor);
    } else {
      // 更新
      newVnode.el = oldVnode.el;
    }
  }

  /**
   * @message: 处理文本节点
   */
  function processText(
    oldVnode: Vnode | null,
    newVnode: Vnode,
    container: Element,
    anchor: Element | null = null
  ) {
    if (oldVnode == null) {
      // 挂载
      newVnode.el = hostCreateText(newVnode.children);
      hostInsert(newVnode.el, container, anchor);
    } else {
      // 更新
      const el = (newVnode.el = oldVnode.el!);
      if (oldVnode.children !== newVnode.children) {
        hostSetText(el, newVnode.children, anchor);
      }
    }
  }

  /**
   * @message: 处理Element类型vnode的挂载和更新
   */
  const processElement = (
    oldVnode: Vnode | null = null,
    newVnode: Vnode,
    container: Element,
    anchor: Element | null = null
  ) => {
    if (oldVnode === null) {
      // 挂载
      mountElement(newVnode, container, anchor);
    } else {
      // 更新
      patchElement(oldVnode, newVnode);
    }
  };

  /**
   * @message: DOM挂载
   */
  const mountElement = (
    vnode: Vnode,
    contanier: Element,
    anchor: Element | null = null
  ) => {
    // 创建标签
    const tag = vnode.type;
    const el = hostCreateElement(tag);
    vnode.el = el;
    // 初始化属性
    const props = vnode.props;
    for (let key in props) {
      if (props.hasOwnProperty(key)) {
        hostPatchProps(el, key, null, props[key]);
      }
    }
    // 为真实DOM添加子元素
    const shapeFlag = vnode.shapeFlag;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 渲染text类型的子元素
      hostSetElementText(el, vnode.children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      //  渲染组件类型的子元素
      mountChildren(vnode.children, el, anchor);
    }
    // 将真实DOM添加到容器
    hostInsert(el, contanier, anchor);
  };

  /**
   * @message: 处理Element类型vnode更新
   */
  const patchElement = (oldVnode: Vnode, newVnode: Vnode) => {
    // 同步vnode的容器
    const el = (newVnode.el = oldVnode.el);
    // 更新children
    patchChildren(oldVnode, newVnode, el);
    // 更新props
    const newProps = newVnode.props || EMPTY_OBJ;
    const oldProps = oldVnode.props || EMPTY_OBJ;
    patchProps(oldProps, newProps, el);
  };

  /**
   * @message: 处理子组件的更新
   */
  function patchChildren(
    oldVnode: Vnode,
    newVnode: Vnode,
    container: Element,
    anchor: Element | null = null
  ) {
    const { children: c1, shapeFlag: oldFlag = 0 } = oldVnode;
    const { children: c2, shapeFlag: newFlag } = newVnode;
    // 根据新旧元素的类型不同进行不同的处理

    // 1.新子节点为Text
    if (newFlag & ShapeFlags.TEXT_CHILDREN) {
      if (oldFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 先卸载掉旧节点
        oldVnode.children((child) => unmount(child));
      }
      if (c1 !== c2) {
        // 说明新节点是文本节点,暂时不考虑插槽类型
        hostSetElementText(container, c2);
      }
    } else {
      //说明新节点是array类型的children

      if (oldFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (newFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 新旧节点的子元素都是数组,则进行diff算法
          patchKeyedChildren(
            oldVnode.children,
            newVnode.children,
            container,
            anchor
          );
        } else {
          //TODO 卸载旧节点
        }
      } else {
        if (oldFlag & ShapeFlags.TEXT_CHILDREN) {
          // 删除旧节点的文本
          hostSetElementText(container, "");
        }
        if (newFlag & ShapeFlags.ARRAY_CHILDREN) {
          // TODO 渲染新节点的children
        }
      }
    }
  }

  function patchProps(oldProps, newProps, el: Element) {
    if (newProps === oldProps) {
      return;
    }
    // 遍历新属性,设置新值
    for (let key in newProps) {
      if (newProps.hasOwnProperty(key)) {
        const newVal = newProps[key];
        const oldVal = oldProps[key];
        if (newVal !== oldVal) {
          hostPatchProps(el, key, oldVal, newVal);
        }
      }
    }
    // 遍历旧属性,删除没有使用的旧值
    for (let key in oldProps) {
      if (oldProps.hasOwnProperty(key)) {
        if (!(key in newProps)) {
          hostPatchProps(el, key, oldProps[key], null);
        }
      }
    }
  }

  /**
   * @message: 卸载元素
   */
  function unmount(vnode: Vnode) {
    hostRemove(vnode.el);
  }

  /**
   * @message: 挂载代码片段
   */
  function mountChildren(
    childs: any,
    container: Element,
    anchor: Element | null = null
  ) {
    const children = (childs = [...childs]);

    for (let item of children) {
      const childVnode = normalizeVnode(item);
      patch(null, childVnode, container, anchor);
    }
  }

  /**
   * @message: 挂载组件类型vnode
   */
  function mountComponent(
    newVnode: Vnode,
    container: Element,
    anchor: Element | null = null
  ) {
    // createComponentInstance创建组件实例.保存在Vnode的component属性上
    const instance = (newVnode.component = createComponentInstance(newVnode));
    // setupComponent 标准化组件实例,添加render,处理数据
    setupComponent(instance);
    // setupRenderEffect 设置组件渲染
    setupRenderEffect(instance, newVnode, container, anchor);
  }

  /**
   * @message: 组件渲染
   */
  function setupRenderEffect(
    instance,
    newVnode: Vnode,
    container: Element,
    anchor: Element | null = null
  ) {
    const componentUpDateFn = () => {
      const { bm, m } = instance;
      if (!instance.isMounted) {
        // 执行onBeforeMounted
        if (bm) {
          bm();
        }

        // 生成组件vnode
        instance.subtree = renderComponentRoot(instance);
        // 渲染vnode
        patch(null, instance.subtree, container, anchor);

        // 声明周期onMounted
        if (m) {
          m();
        }

        newVnode.el = instance.subtree.el;
        instance.isMounted = true;
      } else {
        // 生成新的vnode,然后patch
        let { next, vnode } = instance;
        if (!next) {
          next = vnode;
        }
        // TODO 执行beforeUpdate hook

        const nextTree = renderComponentRoot(instance);
        const preTree = instance.subtree;
        instance.subtree = nextTree;

        patch(preTree, nextTree, container, anchor);
        next.el = nextTree.el;

        // TODO 执行updated hook
      }
    };

    instance.effect = new ReactiveEffect(componentUpDateFn, () =>
      queuePreFlushCb(instance.update)
    );
    instance.update = () => instance.effect.run();

    instance.update();
  }

  /**
   * @message: diff算法
   */
  function patchKeyedChildren(
    oldChildren: Vnode[],
    newChildren: Vnode[],
    container: Element,
    parentAnchor: Element | null = null
  ) {
    let i = 0;
    let newChilrenLength = newChildren.length;
    let oldChildrenEnd = oldChildren.length - 1;
    let newChildrenEnd = newChildren.length - 1;

    // 第一种情况: 从前往后比较,处理前面所有相同的vnode
    while (i <= oldChildrenEnd && i <= newChildrenEnd) {
      const newChild = normalizeVnode(newChildren[i]);
      const oldChild = oldChildren[i];

      if (isSameType(newChild, oldChild)) {
        patch(oldChild, newChild, container, parentAnchor);
        i++;
      } else {
        break;
      }
    }

    // 第二种情况: 从后往前比较,处理后面所有相同的vnode
    while (i <= oldChildrenEnd && i <= newChildrenEnd) {
      const newChild = normalizeVnode(newChildren[newChildrenEnd]);
      const oldChild = oldChildren[oldChildrenEnd];

      if (isSameType(newChild, oldChild)) {
        patch(oldChild, newChild, container, parentAnchor);
        oldChildrenEnd--;
        newChildrenEnd--;
      } else {
        break;
      }
    }

    // 第三种情况:旧节点遍历完毕,新节点还没遍历完毕,说明:新children多于旧children,则需要把新的添加上,
    // 判断条件释义: 当前坐标小于新, 大于旧, 说明旧的没了, 新的还没对比完
    if (i > oldChildrenEnd) {
      if (i <= newChildrenEnd) {
        const nextPos = newChildrenEnd + 1;
        // 当多余的节点在旧children之前时,那么多出来的新节点应该在已处理的节点之前插入
        const anchor =
          nextPos < newChilrenLength ? newChildren[nextPos].el : parentAnchor;
        while (i <= newChildrenEnd) {
          patch(null, normalizeVnode(newChildren[i]), container, anchor);
          i++;
        }
      }
    }

    // 第四种情况:新节点遍历完毕,旧节点还有剩余,说明:旧的children多于新的children,则需要把多余旧的删除掉,
    else if (i > newChildrenEnd) {
      while (i <= oldChildrenEnd) {
        unmount(oldChildren[i]);
        i++;
      }
    }

    // 第五种情况: 乱序,两个children都没处理完毕,那么根据情况需要进行: 打补丁,挂载,删除,移动等操作
    else {
      const oldChildrenStart = i;
      const newChildrenStart = i;
      //第一步: 构建新节点key和index的映射{key:index}
      const keyToNewIndexMap: Map<string | number | symbol, number> = new Map();
      for (i = newChildrenStart; i <= newChildrenEnd; i++) {
        const newChild = newChildren[i];
        if (newChild.key != null) {
          if (keyToNewIndexMap.has(newChild.key)) {
            console.warn("存在重复的key");
          }
          keyToNewIndexMap.set(newChild.key, i);
        }
      }

      //第二步: 循环旧节点,在映射中查找旧节点的key是否存在,存在:渲染,不存在:删除
      let j;
      let patched = 0; // 已经处理过的节点数量
      let toBePatched = newChildrenEnd - newChildrenStart + 1; // 还剩下需要处理的节点数量
      let moved = false; // 本次处理的节点是否需要移动
      let maxNewIndex = 0;

      // 存放key相同节点在newChildren中下标和oldChildren中的下标映射
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0);
      for (i = oldChildrenStart; i <= oldChildrenEnd; i++) {
        const oldChild = oldChildren[i];
        if (patched >= toBePatched) {
          // 表示没有需要处理的新节点了
          unmount(oldChild);
          continue;
        }

        // 查找新节点中是否存在该旧节点,存在,说明需要复用旧节点
        let newIndex;
        if (oldChild.key != null) {
          newIndex = keyToNewIndexMap.get(oldChild.key);
        }
        if (newIndex === undefined) {
          // 表示没有找到
          unmount(oldChild);
        } else {
          // 表示找到了
          newIndexToOldIndexMap[newIndex - newChildrenStart] = i + 1;
          if (newIndex >= maxNewIndex) {
            maxNewIndex = newIndex;
          } else {
            // 到这里,说明有个节点可以复用,接下来判断该节点需不需要移动
            // 现在的遍历顺序是按照旧节点的顺序遍历,因此,如果newChildren中节点顺序和oldChildren中节点顺序相同,newIndex应该是递增的,
            // 反之,如果newChildren中的节点顺序和oldChildren中节点顺序不同,则newIndex一定不是递增的
            // 根据上面推述:如果newIndex递增,则表示新节点顺序和老节点顺序相同,不需要移动老节点
            //             如果newIdnex不是递增的,则表示新节点顺序和老节点顺序不同,需要移动老节点
            moved = true;
          }
          patch(oldChild, newChildren[newIndex], container, null);
        }
        patched++;
      }

      //第三步: 移动和挂载
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : [];
      j = increasingNewIndexSequence.length - 1;
      for (i = toBePatched - 1; i >= 0; i--) {
        const newIndex = newChildrenStart + i;
        const newChild = newChildren[newIndex];
        const anchor =
          newIndex + 1 < newChilrenLength
            ? newChildren[newIndex + 1].el
            : parentAnchor;
        if (newIndexToOldIndexMap[i] === 0) {
          // 表示这个节点是新增的,如果是可以复用的在上一步会被替换为非0
          patch(null, newChild, container, anchor);
        } else if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            move(newChild, container, anchor);
          } else {
            j--;
          }
        }
      }
    }
  }

  function move(vnode: Vnode, container: Element, anchor) {
    const { el } = vnode;
    hostInsert(el, container, anchor);
  }

  return {
    render,
  };
}

/**
 * @message: 获取最长递增子序列,保证diff是移动的元素最少
 */
function getSequence(arr: number[]): number[] {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
