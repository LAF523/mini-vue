import { LifecycleHooks } from "./components";

/**
 * @message: 将钩子函数注册到组件实例中
 */
export function injectHook(type, hook, instance) {
  if (instance) {
    instance[type] = hook;
    return hook;
  }
}
export const createHook = (lifecycle: LifecycleHooks) => {
  return (hook, target) => injectHook(lifecycle, hook, target);
};

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT);
export const onMounted = createHook(LifecycleHooks.MOUNTED);
