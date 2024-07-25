import { baseCompile } from "@vue/compiler-core";

export function compile(template: string, options?: object) {
  return baseCompile(template, options);
}
