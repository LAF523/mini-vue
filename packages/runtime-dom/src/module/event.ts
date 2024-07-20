export function patchEvent(
  el: Element & { _vei: object },
  rawname: string,
  preValue: any,
  nextValue: any
) {
  // 缓存优化
  let invokers = getCache(el);
  console.log("invokers === el._vei:", invokers === el._vei);

  const existingInvoker = invokers[rawname];
  if (nextValue && existingInvoker) {
    // 更新
    existingInvoker.value = nextValue;
  } else {
    const name = parseName(rawname);

    if (nextValue) {
      // 添加事件
      const invoker = createInvoker(nextValue);
      addEventListener(el, name, invoker);
      invokers[rawname] = invoker;
    } else {
      // 删除
      removeEventListener(el, name, existingInvoker);
    }
  }
}

function getCache(el: Element & { _vei: object }) {
  if (!el._vei) {
    el._vei = {};
  }
  return el._vei;
}
/**
 * @message: 转换事件名 onClick => click
 */
function parseName(rawname: string) {
  return rawname.slice(2).toLowerCase();
}
/**
 * @message: 事件缓存对象,将回调挂载到value上,是为了更新时修改value即可,不用再创建和销毁原事件监听器
 */
function createInvoker(value) {
  const invoker = (e: Event) => {
    invoker.value && invoker.value(e);
  };
  invoker.value = value;
  return invoker;
}

function addEventListener(el: Element, name: string, invoker: any) {
  el.addEventListener(name, invoker);
}

function removeEventListener(el: Element, name: string, invoker: any) {
  el.removeEventListener(name, invoker);
}
