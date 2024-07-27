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
      node = parseInterpolation(context);
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
 * 解析插值表达式
 */
function parseInterpolation(context: ParserContext) {
  const [open, close] = ["{{", "}}"];
  advanceBy(context, open.length);

  const endIndex = context.source.indexOf(close);
  const content = parseTextData(context, endIndex).trim();
  advanceBy(context, close.length);

  return {
    type: NodeTypes.INTERPOLATION, // 插值表达式类型
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION, // 复合表达式类型
      isStatic: false,
      content,
    },
  };
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

  // 处理指令
  advanceSpaces(context); // 处理空格
  let props = parseAttributes(context, type);

  let isSelfClosing = startsWith(context.source, "/>");
  advanceBy(context, isSelfClosing ? 2 : 1); // 处理完标签<div部分后,自闭和标签<div />需要步进2位,双标签<div>需要步进1位

  const tagType = ElementTypes.ELEMENT;

  return {
    type: NodeTypes.ELEMENT,
    tagType,
    tag,
    children: [],
    props,
  };
}

function parseAttributes(context, type) {
  const props: any = [];
  const attributeNames = new Set();

  // 每循环依次处理一个标签
  while (isDone(context)) {
    const attr = parseAttribute(context, attributeNames);
    if (type === TagType.Start) {
      props.push(attr);
    }
    advanceSpaces(context);
  }

  return props;

  // 遇到闭合标签停止解析
  function isDone(context) {
    return (
      context.source.length > 0 &&
      !startsWith(context.source, ">") &&
      !startsWith(context.source, "/>")
    );
  }
}
// 单个属性处理
function parseAttribute(context, nameSet) {
  // 获取属性名
  // 获取属性名称。例如：v-if
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)!;
  const name = match[0];
  // 添加当前的处理属性
  nameSet.add(name);
  advanceBy(context, name.length);

  //获取属性值
  let value;
  if (/^[\t\r\n\f ]*=/.test(context.source)) {
    // 解析等号
    advanceSpaces(context); // 等号前面有可能有空格去去空格
    advanceBy(context, 1);
    advanceSpaces(context); // 等号后面有可能有空格去去空格
    value = parseAttributeValue(context); // 获取属性值
  }

  // 处理指令,带v的都是指令
  if (/^(v-[A-Za-z0-9-]|:|\.|@|#)/.test(name)) {
    const match =
      /(?:^v-([a-z0-9-]+))?(?:(?::|^\.|^@|^#)(\[[^\]]+\]|[^\.]+))?(.+)?$/i.exec(
        name
      )!;
    let dirName = match[1]; // v-if的if

    //TODO: v-on
    //TODO:v-bind

    //  指令
    return {
      type: NodeTypes.DIRECTIVE,
      name: dirName,
      exp: value && {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: value.content,
        isStatic: false,
        loc: value.loc,
      },
      arg: undefined,
      modifiers: undefined,
      loc: {},
    };
  }

  // 普通属性
  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: value && {
      type: NodeTypes.TEXT,
      content: value.content,
      loc: value.loc,
    },
    loc: {},
  };
}

// 解析属性值
function parseAttributeValue(context: ParserContext) {
  let content = "";

  // 单双引号
  const quote = context.source[0];
  const isQuoted = quote === `"` || quote === `'`;

  if (isQuoted) {
    advanceBy(context, 1);
    const endIndex = context.source.indexOf(quote);
    if (endIndex === -1) {
      content = parseTextData(context, context.source.length);
    } else {
      content = parseTextData(context, endIndex);
      advanceBy(context, 1);
    }
  }

  return { content, isQuoted, loc: {} };
}

/**
 * 前进非固定步数,主要用来处理空格
 */
function advanceSpaces(context: ParserContext) {
  const match = /^[\t\r\n\f ]+/.exec(context.source);
  if (match) {
    advanceBy(context, match[0].length);
  }
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
