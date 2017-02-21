import Camera from "./Camera/index";
import Editor from "./Editor/index";

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
    // view only passed, skip options
    if (obj && this.isViewElement(obj)) {
      this.applyView(obj);
      return;
    }
    // apply view
    this.applyView(obj.view);
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
   * @param {HTMLCanvasElement} view
   */
  applyView(view) {
    if (this.isViewElement(view)) {
      this.view = view;
      this.ctx = view.getContext("2d");
    } else {
      throw new Error("Invalid view element provided");
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

};

inherit(Picaxo, _render);

// apply to window
if (typeof window !== "undefined") {
  window.Picaxo = Picaxo;
} else {
  throw new Error("Picaxo needs to run as a website");
}