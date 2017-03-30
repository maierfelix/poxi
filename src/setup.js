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
  this.modes.draw = true;
  tiled.style.opacity = 1.0;
  const draw = () => {
    requestAnimationFrame(() => draw());
    this.clear();
    this.render();
  };
  // add some things manually
  (() => {
    this.main = this.createDynamicBatch();
    this.layers.push(new Layer());
  })();
  draw();
  this.setupUi();
  document.body.appendChild(view);
};
