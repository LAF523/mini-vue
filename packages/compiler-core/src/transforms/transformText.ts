import { createCompoundExpression, NodeTypes } from "../ast";
import { isText } from "../utils";

/**
 * 将相邻的文本节点和表达式合并为一个表达式
 * 如: <div>hello {{msg}}</div>
 * 上述模板包含两个节点
 * 1.hello:TEXT文本节点
 * 2.{{msg}}:INTERPOLATION节点
 * 在生成render函数时,需要把这两个节点合并起来: 'hello' + _toDisplayString(_ctx.msg)
 * 在这里需要添加上'+'号
 */
export function tansformText(node, context) {
  const needProcess = [
    NodeTypes.ROOT,
    NodeTypes.ELEMENT,
    NodeTypes.FOR,
    NodeTypes.IF_BRANCH,
  ].includes(node.type);

  if (needProcess) {
    return () => {
      const children = node.children;
      let currContainer;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isText(children)) {
          // 当前节点为text
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j];
            if (isText(next)) {
              // 如果下一个节点也是next

              if (!currContainer) {
                currContainer = children[i] = createCompoundExpression(
                  [children],
                  child.loc
                );
              }
              currContainer.children.push(`+`, next);
              children.splice(j, 1); // 这个已经处理完毕,需要删除
              j--;
            } else {
              currContainer = undefined;
              break;
            }
          }
        }
      }
    };
  }
}
