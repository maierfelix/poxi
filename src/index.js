import Camera from "./Camera/index";
import Editor from "./Editor/index";
import Tile from "./Editor/Tile/index";

import { TILE_SIZE } from "./cfg";

import { inherit } from "./utils";

import * as _render from "./render";

/**
 * @class Picaxo
 */
class Picaxo {

  /**
   * @param {Object} obj
   */
  constructor(obj) {
    this.bg = null;
    this.ctx = null;
    this.view = null;
    this.events = {};
    this.camera = new Camera(this);
    this.editor = new Editor(this);
    // fps
    this.last = 0;
    this.width = 0;
    this.height = 0;
    this.frames = 0;
    this.states = {
      paused: true
    };
    this.createView();
    // apply sizing
    if (obj.width >= 0 && obj.height >= 0) {
      this.resize(obj.width, obj.height);
    } else {
      this.resize(view.width, view.height);
    }
    this.init();
  }

  init() {
    this.renderLoop();
  }

  createView() {
    let buffer = this.createCanvasBuffer(this.width, this.height);
    this.ctx = buffer;
    this.view = buffer.canvas;
  }

  renderLoop() {
    // try again to render in 16ms
    if (this.states.paused === true) {
      setTimeout(() => this.renderLoop(), 16);
    } else {
      requestAnimationFrame(() => {
        this.events["draw"].fn();
        this.frames++;
        this.renderLoop();
      });
    }
  }

  /**
   * @param {HTMLCanvasElement} el
   */
  isViewElement(el) {
    return (
      el && el instanceof HTMLCanvasElement
    );
  }

  /**
   * Event emitter
   * @param {String} kind
   * @param {Function} fn
   */
  on(kind, fn) {
    if (!(typeof kind === "string")) {
      throw new Error("Expected emitter kind to be string");
    }
    if (!(fn instanceof Function)) {
      throw new Error("Received emitter trigger is not a function");
    }
    if (this.events[kind]) this.events[kind] = null; // safely clean old emitters
    this.events[kind] = {
      fn: fn
    };
    this.processEmitter(kind, fn);
  }

  /**
   * @param {String} kind
   * @param {Function} fn
   */
  processEmitter(kind, fn) {
    // begin drawing as soon as we got something to do there
    if (this.frames === 0 && kind === "draw") {
      this.states.paused = false;
    }
  }

  /**
   * @param {Number} width
   * @param {Number} height
   * @return {CanvasRenderingContext2D}
   */
  createCanvasBuffer(width, height) {
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    this.applyImageSmoothing(ctx, false);
    return (ctx);
  };

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {Boolean} state
   */
  applyImageSmoothing(ctx, state) {
    ctx.imageSmoothingEnabled = state;
    ctx.oImageSmoothingEnabled = state;
    ctx.msImageSmoothingEnabled = state;
    ctx.webkitImageSmoothingEnabled = state;
  };

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {Number} x
   * @param {Number} y
   */
  insertSpriteContextAt(ctx, x, y) {
    let canvas = ctx.canvas;
    let width = canvas.width;
    let height = canvas.height;
    let data = ctx.getImageData(0, 0, width, height).data;
    let buffer = this.createCanvasBuffer(width, height);
    let tiles = [];
    let xx = 0;
    let yy = 0;
    let editor = this.editor;
    let position = editor.getRelativeOffset(x, y);
    let mx = position.x;
    let my = position.y;
    for (let yy = 0; yy < height; ++yy) {
      for (let xx = 0; xx < width; ++xx) {
        let idx = (xx+(yy*width))*4;
        let a = data[idx+3];
        if (a <= 0) continue;
        let r = data[idx+0];
        let g = data[idx+1];
        let b = data[idx+2];
        let tile = new Tile();
        tile.x = mx + (xx * TILE_SIZE);
        tile.y = my + (yy * TILE_SIZE);
        tile.colors.unshift([r,g,b,a]);
        tiles.push(tile);
      };
    };
    if (tiles.length) {
      editor.batches.tiles.push(tiles);
      editor.finalizeBatchOperation();
    }
  }

};

inherit(Picaxo, _render);

// apply to window
if (typeof window !== "undefined") {
  window.Picaxo = Picaxo;
} else {
  throw new Error("Please run Picaxo inside a browser");
}
