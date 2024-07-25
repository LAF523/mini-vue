import { ElementTypes, NodeTypes } from "./ast";

interface ParserContext {
  source: string;
}
const enum TagType {
  Start, // 开始标签
  End, // 结束标签
}

/**
 * @message: 根据模板生成ast
 */
export function baseParse(template: string) {
  const context = createParserContext(template);
  const children = parseChildren(context, []);
  return createRoot(children);
}

function createRoot(children) {
  return {
    type: NodeTypes.ROOT,
    children,
    loc: {},
  };
}

function parseChildren(context: ParserContext, ancestors: []) {
  const nodes = []; // 存放所有的节点

  while (!isEnd(context, ancestors)) {
    const s = context.source;
    let node;
    // 是不是模板
    // 是不是标签的开始
    if (startsWith(s, "{{")) {
      // 是模板
      // node = parseInterpolation(context, ancestores);
    } else if (s[0] === "<") {
      if (/[a-z]/i.test(s[1])) {
        // 是标签名称
        node = parseElement(context, ancestors);
      }
    }

    // 不满足上述情况,表示是内容
    if (!node) {
      node = parseText(context, ancestors);
    }

    pushNode(nodes, node);
  }
  return nodes;
}
/**
 * 解析文本类型的节点
 */
function parseText(context: ParserContext, ancestors) {
  const endToken = ["{{", "<"];
  let endIndex = context.source.length;
  for (let i = 0; i < endToken.length; i++) {
    const index = context.source.indexOf(endToken[i], 1);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }

  const content = parseTextData(context, endIndex);
  return {
    type: NodeTypes.TEXT,
    content,
  };
}

/**
 * 返回文本类型的值
 */
function parseTextData(context: ParserContext, endIndex: number) {
  const content = context.source.slice(0, endIndex);

  advanceBy(context, endIndex);

  return content;
}

function parseElement(context: ParserContext, ancestors) {
  const element = parseTag(context, TagType.Start);

  // 递归处理标签中间的内容children
  ancestors.push(element);
  const children = parseChildren(context, ancestors);
  ancestors.pop();
  element.children = children;

  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End);
  }

  return element;
}

/**
 * 解析标签,生成element对象
 */
function parseTag(context: ParserContext, type: TagType) {
  const match = /^<\/?([a-z][^\r\n\t\f />]*)/i.exec(context.source)!;
  const tag = match[1]; // 获取标签名称

  //标签名称解析好了,步进
  advanceBy(context, match[0].length);

  let isSelfClosing = startsWith(context.source, "/>");
  advanceBy(context, isSelfClosing ? 2 : 1); // 处理完标签<div部分后,自闭和标签<div />需要步进2位,双标签<div>需要步进1位

  const tagType = ElementTypes.ELEMENT;

  return {
    type: NodeTypes.ELEMENT,
    tagType,
    tag,
    children: [],
    props: [], //没有用到但需要添加上,否则生成的ast在vue中会报错
  };
}

/**
 * 步进函数
 */
function advanceBy(context: ParserContext, length: number) {
  context.source = context.source.slice(length);
}

/**
 * 是否是结束标签
 */
function isEnd(context: ParserContext, ancestors) {
  const s = context.source;

  if (startsWith(s, "</")) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      if (startsWithEndTagOpen(s, ancestors[i].tag)) {
        return true;
      }
    }
  }
  return !s;
}

/**
 * @message: 是否是结束标签tag的开始部分
 * @param {string} </div>
 * @param {string} div
 * @return {*} true
 * @since: 2024-07-24 14:33:23
 */
function startsWithEndTagOpen(s: string, tag: string): Boolean {
  return (
    startsWith(s, "</") && // 以</开头
    s.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase() && // </紧跟tag
    /[\t\r\n\f />]/.test(s[2 + tag.length] || ">")
  );
}

function startsWith(source: string, search: string) {
  return source.startsWith(search);
}

function createParserContext(template: string): ParserContext {
  return { source: template };
}

function pushNode(nodes, node) {
  nodes.push(node);
}
