import { getWGLContext } from "./utils";

import Batch from "./batch/index";
import Layer from "./layer/index";

export function setup() {
  const view = document.createElement("canvas");
  const width = window.innerWidth;
  const height = window.innerHeight;
  view.width = width;
  view.height = height;
  this.setupRenderer(view);
  this.initListeners();
  this.resize(width, height);
  this.scale(0);
  const draw = () => {
    requestAnimationFrame(() => draw());
    if (this.redraw) {
      this.clear();
      this.render();
    }
  };
  // add some things manually
  (() => {
    this.main = this.createDynamicBatch(0, 0);
    this.layers.push(new Layer());
  })();
  requestAnimationFrame(() => draw());
  this.setupUi();
  document.body.appendChild(view);
};
