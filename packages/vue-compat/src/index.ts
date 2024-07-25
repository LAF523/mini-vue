import { compile } from "@vue/compiler-dom";

export function compileToFunction(template, options?) {
  const { code } = compile(template, options);
  const render = new Function(code)();
  return render;
}

export { compileToFunction as compile };
