import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";

// 默认导出一个数组,数组的每一个对象都是一个单独的导出配置,https://www.rollupjs.com/guide/big-list-of-options
export default [
  {
    input: "packages/vue/src/index.ts", //入口文件
    output: [
      // 出口文件
      {
        sourcemap: true, // 开启sourcemap
        file: "./packages/vue/dist/vue.js", // 出口文件输出地址
        format: "iife", // 出口文件为IIFE函数模式
        name: "Myvue", // 全局变量名称,类比Vue
      },
    ],
    // 插件
    plugins: [
      // ts 支持
      typescript({
        sourceMap: true,
      }),
      // 模块导入的路径补全
      resolve(),
      // 将 CommonJS 模块转换为 ES2015
      commonjs(),
    ],
  },
];
