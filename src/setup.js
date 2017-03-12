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
    this.clear();
    this.render();
  };
  draw();
  // add some things manually
  (() => {
    let batch = new Batch();
    batch.bounds.x = 8;
    batch.bounds.y = 8;
    batch.bounds.w = 2;
    batch.bounds.h = 3;
    let batch2 = new Batch();
    batch2.bounds.x = -2;
    batch2.bounds.y = 2;
    batch2.bounds.w = 2;
    batch2.bounds.h = 2;
    let layer = new Layer();
    layer.pushBatch(batch);
    layer.pushBatch(batch2);
    this.layers.push(layer);
  })();
  document.body.appendChild(view);
};
