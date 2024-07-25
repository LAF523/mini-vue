import { NodeTypes } from "./ast";

export const isText = (node) =>
  node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT;
