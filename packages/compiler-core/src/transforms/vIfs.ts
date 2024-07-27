import {
  createCallExpression,
  createConditionalExpression,
  createObjectProperty,
  createSimpleExpression,
  NodeTypes,
} from "../ast";
import { CREATE_COMMENT } from "../runtimehelpers";
import {
  createStructuralDirectiveTransform,
  TransformContext,
} from "../transform";
import { getMemoedVNodeCall, injectProp } from "../utils";

export const transformIf = createStructuralDirectiveTransform(
  /^(if|else|else-if)$/,
  (node, dir, context) => {
    return processIf(node, dir, context, (ifNode, branch, isRoot) => {
      // TODO:暂时不处理兄弟节点的情况
      let key = 0;
      //退出回调,当所有节点处理完成,完成codegenNode
      return () => {
        if (isRoot) {
          ifNode.codegenNode = createCodegenNodeForBranch(branch, key, context);
        } else {
          // TODO:非根节点
        }
      };
    });
  }
);
// 具体处理if指令的函数
export const processIf = (
  node,
  dir,
  context: TransformContext,
  processCodegen?: (node, branch, isRoot: boolean) => (() => void) | undefined
) => {
  if (dir.name === "if") {
    // 创建branch属性
    const branch = createIfBranch(node, dir);

    const ifNode = {
      type: NodeTypes.IF,
      loc: node.loc,
      branches: [branch],
    };

    //切换当前的节点为ifNode
    context.replaceNode(ifNode);

    // 生成对应的codegen属性
    if (processCodegen) {
      return processCodegen(ifNode, branch, true);
    }
  }
};

// 生成if指令的branch属性节点
function createIfBranch(node, dir) {
  return {
    type: NodeTypes.IF_BRANCH,
    loc: node.loc,
    condition: dir.exp,
    children: [node],
  };
}

// 生成分支节点的codegenNode
function createCodegenNodeForBranch(
  branch,
  keyIndex: number,
  context: TransformContext
) {
  if (branch.condition) {
    return createConditionalExpression(
      branch.condition,
      createChildrenCodegenNode(branch, keyIndex),
      // 以注释的形式展示 v-if.
      createCallExpression(context.helper(CREATE_COMMENT), ['"v-if"', "true"])
    );
  } else {
    return createChildrenCodegenNode(branch, keyIndex);
  }
}

/**
 * 创建某个子节点的codegen节点
 */
function createChildrenCodegenNode(branch, keyIndex: number) {
  const keyProperty = createObjectProperty(
    `key`,
    createSimpleExpression(`${keyIndex}`, false)
  );
  const { children } = branch;
  const firstChild = children[0];

  const ret = firstChild.codegenNode;
  const vnodeCall = getMemoedVNodeCall(ret);
  // 填充 props
  injectProp(vnodeCall, keyProperty);
  return ret;
}
