import Camera from "./Camera/index";
import Editor from "./Editor/index";
import Tile from "./Editor/Tile/index";

import {
  DRAW_HASH
} from "./cfg";

import {
  inherit,
  hashFromString,
  colorToRgbaString,
  createCanvasBuffer
} from "./utils";

import * as _render from "./render";

/**
 * @class Poxi
 */
class Poxi {

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
    let buffer = createCanvasBuffer(this.width, this.height);
    this.ctx = buffer;
    this.view = buffer.canvas;
  }

  renderLoop() {
    // try again to render in 16ms
    if (this.states.paused === true) {
      setTimeout(() => this.renderLoop(), 16);
    } else {
      requestAnimationFrame(() => {
        this.events[DRAW_HASH].fn();
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
    let hash = hashFromString(kind);
    if (this.events[hash]) this.events[hash] = null; // safely clean old emitters
    this.events[hash] = {
      fn: fn
    };
    this.processEmitter(hash, fn);
  }

  /**
   * @param {Number} hash
   * @param {Function} fn
   */
  processEmitter(hash, fn) {
    // begin drawing as soon as we got something to do there
    if (this.frames === 0 && hash === DRAW_HASH) {
      this.states.paused = false;
    }
  }

  /**
   * Export the current view to base64 encoded png string
   * @return {String}
   */
  exportAsDataUrl() {
    let editor = this.editor;
    let batches = editor.batches;
    let info = editor.getAbsoluteBoundings(batches);
    let rx = info.x;
    let ry = info.y;
    let width = info.w;
    let height = info.h;
    let ctx = createCanvasBuffer(width, height);
    let view = ctx.canvas;
    for (let ii = 0; ii < batches.length; ++ii) {
      let batch = batches[ii];
      // background
      if (batch.isBackground) {
        ctx.fillStyle = colorToRgbaString(batch.bgcolor);
        ctx.fillRect(
          0, 0,
          view.width, view.height
        );
        continue;
      }
      // buffer
      if (batch.isBuffered) {
        ctx.drawImage(
          batch.buffer.view,
          (batch.x - rx) | 0, (batch.y - ry) | 0,
          batch.width | 0, batch.height | 0
        );
        continue;
      }
      // tiles
      if (batch.tiles.length) {
        let tiles = batch.tiles;
        for (let ii = 0; ii < tiles.length; ++ii) {
          let tile = tiles[ii];
          let x = (tile.x - rx) | 0;
          let y = (tile.y - ry) | 0;
          let color = colorToRgbaString(tile.colors[tile.cindex]);
          ctx.fillStyle = color;
          ctx.fillRect(
            x, y,
            1, 1
          );
        };
        continue;
      }
    };
    return (view.toDataURL());
  }

};

inherit(Poxi, _render);

// apply to window
if (typeof window !== "undefined") {
  window.Poxi = Poxi;
} else {
  throw new Error("Please run Poxi inside a browser");
}
