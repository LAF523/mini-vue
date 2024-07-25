import { CREATE_ELEMENT_VNODE } from "./runtimehelpers";

/**
 * @message: 标签的类型
 */
export const enum ElementTypes {
  ELEMENT,
  COMPONENT,
  SLOT,
  TEMPLATE,
}

/**
 * @message: 节点的类型
 */
export const enum NodeTypes {
  ROOT,
  ELEMENT,
  TEXT,
  COMMENT,
  SIMPLE_EXPRESSION,
  INTERPOLATION,
  ATTRIBUTE,
  DIRECTIVE,
  // containers
  COMPOUND_EXPRESSION,
  IF,
  IF_BRANCH,
  FOR,
  TEXT_CALL,
  // codegen
  VNODE_CALL,
  JS_CALL_EXPRESSION,
  JS_OBJECT_EXPRESSION,
  JS_PROPERTY,
  JS_ARRAY_EXPRESSION,
  JS_FUNCTION_EXPRESSION,
  JS_CONDITIONAL_EXPRESSION,
  JS_CACHE_EXPRESSION,

  // ssr codegen
  JS_BLOCK_STATEMENT,
  JS_TEMPLATE_LITERAL,
  JS_IF_STATEMENT,
  JS_ASSIGNMENT_EXPRESSION,
  JS_SEQUENCE_EXPRESSION,
  JS_RETURN_STATEMENT,
}

/**
 * 创建codegenNode,在这里指定给节点的render函数需要使用哪个方法(CREATE_ELEMENT_VNODE)
 */
export function createVnodeCall(context, tag, props, children) {
  if (context) {
    context.helper(CREATE_ELEMENT_VNODE);
  }

  return {
    type: NodeTypes.VNODE_CALL,
    tag,
    props,
    children,
  };
}

export function createCompoundExpression(children, loc) {
  return {
    type: NodeTypes.COMPOUND_EXPRESSION,
    loc,
    children,
  };
}
