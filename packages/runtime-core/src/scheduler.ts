let isFlushPending = false;
// 等待执行jobs
const pendingPreFlushCbs: Function[] = [];
// 当前正在执行的promise
let currentFlushPromise: Promise<void> | null = null;
// 创建一个成功状态的promise
const resolvedPromise = Promise.resolve() as Promise<any>;

export function queuePreFlushCb(cb: Function) {
  queueCb(cb, pendingPreFlushCbs);
}

function queueCb(cb: Function, pendingQueue: Function[]) {
  pendingQueue.push(cb);
  queueFlush();
}

function queueFlush() {
  if (!isFlushPending) {
    isFlushPending = true;
    currentFlushPromise = resolvedPromise.then(flushJobs); // 相当于向微任务队列放了一个任务,同步代码执行完就会执行该任务
  }
}

function flushJobs() {
  isFlushPending = false;
  flushPreFlushCbs();
}

/**
 * @message: 真正开始执行job
 */
function flushPreFlushCbs() {
  if (pendingPreFlushCbs.length) {
    const activePreFlushCbs = [...new Set(pendingPreFlushCbs)]; // 去重以保证任务不重复执行
    pendingPreFlushCbs.length = 0;
    activePreFlushCbs.forEach((item) => item());
  }
}
