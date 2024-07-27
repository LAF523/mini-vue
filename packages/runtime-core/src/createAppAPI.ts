import { createVnode } from "./vnode";

export function createAppAPI(render) {
  return function createApp(rootComponent, rootProps = null) {
    const app = {
      _component: rootComponent,
      _container: null,
      mount: (container) => {
        const vnode = createVnode(rootComponent, rootProps);
        render(vnode, container);
      },
    };

    return app;
  };
}
