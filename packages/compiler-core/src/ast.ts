import { isString } from "@vue/shared";
import { CREATE_COMMENT, CREATE_ELEMENT_VNODE } from "./runtimehelpers";

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
  ROOT, // 0
  ELEMENT, // 1
  TEXT, // 2
  COMMENT, // 3
  SIMPLE_EXPRESSION, // 4
  INTERPOLATION, // 5
  ATTRIBUTE, // 6
  DIRECTIVE, // 7
  // containers
  COMPOUND_EXPRESSION, //8
  IF, //9
  IF_BRANCH, //10
  FOR, //11
  TEXT_CALL, //12
  // codegen
  VNODE_CALL, //13
  JS_CALL_EXPRESSION, //14
  JS_OBJECT_EXPRESSION, //15
  JS_PROPERTY, //16
  JS_ARRAY_EXPRESSION, //17
  JS_FUNCTION_EXPRESSION, //18
  JS_CONDITIONAL_EXPRESSION, //19
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

/**
 * @message:创建符复合表达式类型 <div>hello {{a}} jjj</div> => <div>复合表达式类型节点</div> 该复合表达式类型节点还包含文本节点和插值表达式节点
 */
export function createCompoundExpression(children, loc) {
  return {
    type: NodeTypes.COMPOUND_EXPRESSION,
    loc,
    children,
  };
}

/**
 * 创建调用表达式的节点
 */
export function createCallExpression(callee, args) {
  return {
    type: NodeTypes.JS_CALL_EXPRESSION,
    loc: {},
    callee,
    arguments: args,
  };
}

/**
 * 创建条件表达式的节点
 */
export function createConditionalExpression(
  test,
  consequent,
  alternate,
  newline = true
) {
  return {
    type: NodeTypes.JS_CONDITIONAL_EXPRESSION,
    test,
    consequent,
    alternate,
    newline,
    loc: {},
  };
}

/**
 * 创建简单表达式节点
 */
export function createSimpleExpression(content, isStatic) {
  return {
    type: NodeTypes.SIMPLE_EXPRESSION,
    loc: {},
    content,
    isStatic,
  };
}
/**
 * 创建对象属性节点
 */
export function createObjectProperty(key, value) {
  return {
    type: NodeTypes.JS_PROPERTY,
    loc: {},
    key: isString(key) ? createSimpleExpression(key, true) : key,
    value,
  };
}

/**
 * 创建对象表达式节点
 */
export function createObjectExpression(properties) {
  return {
    type: NodeTypes.JS_OBJECT_EXPRESSION,
    loc: {},
    properties,
  };
}
