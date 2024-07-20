import { ShapeFlags } from "packages/shared/src/shapeFlags";
import { Fragment, Vnode, Text, Comment, isSameType } from "./vnode";
import { patchProps } from "packages/runtime-dom/src/patchProps";
import { nodeOps } from "packages/runtime-dom/src/nodeOps";
import { EMPTY_OBJ, extend } from "@vue/shared";
import { normalizeVnode } from "./componentRenderUtils";

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
  setText: (el: Element, text: string, anchor: null) => void;
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
      // TODO: 需要卸载
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
    anchor = null
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
        }
      }
    }
  };

  /**
   * @message: 处理代码片段元素
   */
  function processFragment(
    oldVnode: Vnode | null,
    newVnode: Vnode,
    container: Element,
    anchor = null
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
    anchor = null
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
    anchor = null
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
    anchor = null
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
  const mountElement = (vnode: Vnode, contanier: Element, anchor = null) => {
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
      // 处理text类型的子元素
      hostSetElementText(el, vnode.children);
    } else if (shapeFlag & ShapeFlags.COMPONENT) {
      // TODO 处理组件类型的子元素
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
    anchor? = null
  ) {
    const { children: c1, shapeFlag: oldFlag = 0 } = oldVnode;
    const { children: c2, shapeFlag: newFlag } = newVnode;
    // 根据新旧元素的类型不同进行不同的处理

    // 1.新子节点为Text
    if (newFlag & ShapeFlags.TEXT_CHILDREN) {
      if (oldFlag & ShapeFlags.ARRAY_CHILDREN) {
        // TODO 先卸载掉旧节点
      }
      if (c1 !== c2) {
        // 说明新节点是文本节点,暂时不考虑插槽类型
        hostSetElementText(container, c2);
      }
    } else {
      //说明新节点是array类型的children

      if (oldFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (newFlag & ShapeFlags.ARRAY_CHILDREN) {
          // TODO 新旧节点的子元素都是数组,则进行diff算法
        } else {
          //TODO 卸载旧节点
        }
      } else {
        if (oldFlag & ShapeFlags.TEXT_CHILDREN) {
          // TODO 删除旧节点的文本
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
  function mountChildren(childs: any, container: Element, anchor = null) {
    const children = (childs = [...childs]);

    for (let item of children) {
      const childVnode = normalizeVnode(item);
      patch(null, childVnode, container, anchor);
    }
  }

  return {
    render,
  };
}
