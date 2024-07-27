import { isFunction, isObject } from "@vue/shared";
import { Vnode } from "./vnode";
import { reactive } from "@vue/reactivity";
import { onBeforeMount, onMount, onMounted } from "./apiLifecycle";
let uid = 0;

let compile: any; // 存放编译器

export const enum LifecycleHooks {
  BEFORE_CREATE = "bc",
  CREATED = "c",
  BEFORE_MOUNT = "bm",
  MOUNTED = "m",
}
/**
 * @message: 创建组件实例
 */
export const createComponentInstance = (vnode: Vnode) => {
  const type = vnode.type;
  const instance = {
    uid: uid++, // 唯一标记
    vnode, // 虚拟节点
    type, // 组件类型
    subTree: null, // render 函数的返回值
    effect: null, // ReactiveEffect 实例
    update: null, // update 函数，触发 effect.run
    render: null, // 组件内的 render 函数
    isMounted: false,
    bc: null, //beforeCreate
    c: null, //created
    bm: null, // beforeMounted
    m: null, // mounted
  };

  return instance;
};

export const setupComponent = (instance) => {
  // 为render赋值
  const setupResult = setupStateFulComponent(instance);
  return setupResult;
};

const setupStateFulComponent = (instance) => {
  const component = instance.type;
  const { setup } = component;

  // 如果setup函数存在,表示使用setup函数的语法,则从setup中获取render
  if (setup) {
    const setupResult = setup();
    handleSetupResult(instance, setupResult);
  } else {
    finishComponentSetup(instance);
  }
};

const finishComponentSetup = (instance) => {
  const component = instance.type;
  if (!instance.render) {
    if (compile && !component.render) {
      if (component.template) {
        // 说明组件没有提供render函数,需要将template转换成render
        component.render = compile(component.template);
      }
    }
    // 如果没有render函数,说明不是setup语法,使用setup语法的情况下,上一步已经为render赋值了
    instance.render = component.render;
  }

  applyOptions(instance);
};
export function registerRuntimeCompiler(_compile) {
  compile = _compile;
}

/**
 * @message: 处理组件的各个配置,数据,计算属性,侦听器,生命周期等等
 */
function applyOptions(instance) {
  const {
    data: dataOptions,
    beforeCreate,
    created,
    beforeMount,
    mounted,
  } = instance.type;

  // 处理各个options之前,执行onBeforeCreate
  if (beforeCreate) {
    callHook(beforeCreate, instance.data);
  }

  if (dataOptions) {
    const data = dataOptions();
    if (isObject(data)) {
      instance.data = reactive(data);
    }
  }

  const registerLifecycleHook = (register: Function, hook?: Function) => {
    register(hook, instance);
  };
  // 注册其他没执行的其他钩子到instance
  registerLifecycleHook(onBeforeMount, beforeMount?.bind(instance.data));
  registerLifecycleHook(onMounted, mounted?.bind(instance.data));

  // 处理各个options之后,执行onCreated
  if (created) {
    callHook(created, instance.data);
  }
}

/**
 * @message: 为生命周期钩子绑定this
 */
function callHook(hook: Function, proxy) {
  hook.call(proxy);
}

function handleSetupResult(instance, setupResult) {
  if (isFunction(setupResult)) {
    instance.render = setupResult;
  }
  finishComponentSetup(instance);
}
