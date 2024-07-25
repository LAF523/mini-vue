import { isArray, isString } from "@vue/shared";
import { NodeTypes } from "./ast";
import {
  CREATE_ELEMENT_VNODE,
  CREATE_VNODE,
  helperNameMap,
} from "./runtimehelpers";

/**
 * 根据ast中的信息,生成render函数字符串,.如:
 * const _Vue = Myvue

  return function render(_ctx, _cache) {
      const { createElementVNode: _createElementVNode } = _Vue

      return _createElementVNode("div", [], [" hello world "])
  }
 */
export function generate(ast) {
  // 创建codegen上下文对象
  const context = createCodegenContext(ast);
  const { push, indent, deindent, newline } = context;

  // 1.拼接函数体的前置代码: const _Vue=Myvue
  genFunctionPreamble(context);

  // 2.拼接函数主体
  const functionName = "render";
  const args = ["_ctx", "_cache"];
  const signature = args.join(", ");
  push(`function ${functionName}(${signature}) {`);
  indent();

  // 定义变量
  if (ast.helpers.length) {
    const str = ast.helpers
      .map((key) => {
        const fnName = helperNameMap[key];
        return `${fnName}:_${fnName}`;
      })
      .join(", ");
    push(`const {${str}} = _Vue`);
    push("\n");
    newline();
  }

  // return
  newline();
  push(`return `);
  if (ast.codegenNode) {
    genNode(ast.codegenNode, context);
  } else {
    push("null");
  }

  deindent();
  push("}");
  return {
    ast,
    code: context.code,
  };
}

function genNode(node, context) {
  switch (node.type) {
    case NodeTypes.VNODE_CALL:
      genVnodeCall(node, context);
      break;
    case NodeTypes.TEXT:
      genText(node, context);
      break;
  }
}

/**
 * 拼接文本节点
 */
function genText(node, context) {
  context.push(JSON.stringify(node.content));
}

// vnodecall处理
function genVnodeCall(node, context) {
  const { push, helper } = context;
  const { tag, props, children, isComponent, patchFlag, dynamicProps } = node;

  const vnodeHelper = getVnodeHelper(context.isSSR, isComponent);
  push(helper(vnodeHelper) + "("); // 拼接到_createElementVNode(了

  // 处理参数
  const args = getNullableArgs([tag, props, children, patchFlag, dynamicProps]);
  genNodeList(args, context);
  push(")");
}
// 处理参数具体的内容
function genNodeList(args, context) {
  const { push } = context;
  args.forEach((arg, index) => {
    if (isString(arg)) {
      push(arg);
    } else if (isArray(arg)) {
      // 某个参数有多个内容
      push("[");
      genNodeList(arg, context);
      push("]");
    } else {
      // 子节点
      genNode(arg, context);
    }
    // 参数之间的逗号分隔
    if (index < args.length - 1) {
      push(",");
    }
  });
}

/**
 * 处理空的参数
 */
function getNullableArgs(args) {
  let i = args.length;
  while (i--) {
    if (args[i] != null) {
      break;
    }
  }
  return args.slice(0, i + 1).map((arg) => arg || "null");
}
/**
 * 获取render中需要使用的函数
 */
function getVnodeHelper(isSSR, isComponent) {
  return isSSR || isComponent ? CREATE_VNODE : CREATE_ELEMENT_VNODE;
}

/**
 * 拼接函数体的前置代码
 */
function genFunctionPreamble(context) {
  const { push, runtimeGlobalName, newline } = context;
  const content = `const _Vue=${runtimeGlobalName}\n`;
  push(content);
  newline(); // 换行
  push(`return `);
}

/**
 * 上下文对象包含: 解析过程中的各种信息: 结果,全局变量名,封装的方法
 */
function createCodegenContext(ast) {
  const context = {
    code: "", // 最终拼接好的函数字符串
    runtimeGlobalName: "Myvue", // 全局变量名称,生成的render函数中会通过解构,从这个变量名中获取生成vnode的方法
    source: ast.loc.source,
    indentLeve: 0, // 当前的缩进层级
    helper: (key) => `_${helperNameMap[key]}`, // 从映射中获取方法名
    push: (code: string) => (context.code += code), // 拼接方法
    newline: () => {
      newLine(context.indentLeve);
    }, // 换行
    indent: () => {
      newLine(++context.indentLeve);
    }, // 增加缩进
    deindent: () => {
      newLine(--context.indentLeve);
    }, // 减少缩进
  };

  function newLine(n: number) {
    context.code + "\n" + `  `.repeat(n);
  }

  return context;
}
