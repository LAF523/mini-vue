import { baseParse } from "@vue/compiler-core";
import { transformElement } from "./transforms/transformElement";
import { extend } from "@vue/shared";
import { transform } from "./transform";
import { tansformText } from "./transforms/transformText";
import { generate } from "./codegen";
import { transformIf } from "./transforms/vIfs";
import { CREATE_COMMENT, CREATE_ELEMENT_VNODE } from "./runtimehelpers";

export function baseCompile(template: string, options = {}) {
  const ast = baseParse(template);

  transform(
    ast,
    extend(options, {
      nodeTransforms: [transformElement, tansformText, transformIf],
    })
  );
  console.log("ast:", JSON.stringify(ast));

  const res = generate(ast);
  return res;
}
