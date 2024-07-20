/**
 * @message: 设置DOM props
 */
export const patchDOMProps = (el: Element, key: string, value: any) => {
  try {
    el[key] = value;
  } catch (err) {
    console.log(err);
  }
};
