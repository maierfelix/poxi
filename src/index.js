import Tile from "./Editor/Tile/index";
import Camera from "./Camera/index";
import Editor from "./Editor/index";
import Renderer from "./Renderer/index";

import {
  MIN_SCALE,
  HIDE_GRID,
  DRAW_HASH,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  DEFAULT_GRID_HIDDEN
} from "./cfg";

import {
  inherit,
  loadImage,
  rgbaToHex,
  hashFromString,
  colorToRgbaString,
  createCanvasBuffer
} from "./utils";

import * as _render from "./render";
import * as _generate from "./generate";

/**
 * @class Poxi
 */
class Poxi {

  /**
   * @param {Object} obj
   */
  constructor(obj = {}) {
    // buffers
    this.bg = null;
    this.view = null;
    this.grid = null;
    this.tile = null;
    this.gridTexture = null;
    this.events = {};
    this.camera = new Camera(this);
    this.renderer = new Renderer(this);
    this.editor = new Editor(this);
    // fps
    this.last = 0;
    this.width = 0;
    this.height = 0;
    this.frames = 0;
    this.states = {
      paused: true
    };
    this.hideGrid = false;
    this.createView();
    this.applySettings(obj);
    this.init();
  }

  /**
   * @param {Object} obj
   */
  applySettings(obj) {
    let grid = !DEFAULT_GRID_HIDDEN;
    let width = DEFAULT_WIDTH;
    let height = DEFAULT_HEIGHT;
    // apply sizing
    if (obj.width >= 0) {
      width = obj.width | 0;
    }
    if (obj.height >= 0) {
      height = obj.height | 0;
    }
    // apply grid
    if (obj.grid !== void 0) {
      grid = !!obj.grid;
    }
    this.hideGrid = !grid;
    this.resize(width, height);
  }

  init() {
    this.camera.scale(0);
    this.renderLoop();
  }

  createView() {
    let canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;
    this.view = canvas;
    this.renderer.setup(canvas);
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
   * Is it necessary to show the grid
   * @return {Boolean}
   */
  showGrid() {
    return (
      !this.hideGrid && this.camera.s > (MIN_SCALE + HIDE_GRID)
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
    let bounds = editor.boundings;
    let rx = bounds.x;
    let ry = bounds.y;
    let width = bounds.w;
    let height = bounds.h;
    let ctx = createCanvasBuffer(width, height);
    let view = ctx.canvas;
    let sindex = editor.sindex;
    for (let ii = 0; ii < batches.length; ++ii) {
      let batch = batches[ii];
      // ignore future batches
      if (sindex < ii) continue;
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

  /**
   * Returns given batches from the editor
   * @param {Boolean} relative
   * @return {Array}
   */
  getBatches(relative = false) {
    let data = [];
    let sindex = this.editor.sindex;
    let batches = this.editor.batches;
    for (let ii = 0; ii < batches.length; ++ii) {
      // only take stack relative batches
      if (relative && sindex - ii < 0) continue;
      data.push(batches[ii]);
    };
    return (data);
  }

  /**
   * Get given color at mouse position
   * @param {Number} mx
   * @param {Number} my
   * @return {String}
   */
  getColorAtMouseOffset(mx, my) {
    let relative = this.editor.getRelativeOffset(mx, my);
    let rx = relative.x;
    let ry = relative.y;
    let color = this.editor.getStackRelativeTileColorAt(rx, ry);
    return (color ? rgbaToHex(color) : null);
  }

};

inherit(Poxi, _render);
inherit(Poxi, _generate);

// apply to window
if (typeof window !== "undefined") {
  window.Poxi = Poxi;
} else {
  throw new Error("Please run Poxi inside a browser");
}
