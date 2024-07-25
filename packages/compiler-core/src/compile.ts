import { baseParse } from "@vue/compiler-core";
import { transformElement } from "./transforms/transformElement";
import { extend } from "@vue/shared";
import { transform } from "./transform";
import { tansformText } from "./transforms/transformText";
import { generate } from "./congen";

export function baseCompile(template: string, options = {}) {
  const ast = baseParse(template);
  transform(
    ast,
    extend(options, { nodeTransforms: [transformElement, tansformText] })
  );
  const res = generate(ast);
  return res;
}
