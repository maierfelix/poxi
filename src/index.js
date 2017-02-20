import Camera from "./Camera/index";
import Editor from "./Editor/index";
import Commander from "./Commander/index";

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
    this.camera = new Camera(this);
    this.commander = new Commander(this);
    this.editor = new Editor(this);
    // fps
    this.last = 0;
    this.width = 0;
    this.height = 0;
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

};

inherit(Picaxo, _render);

// apply to window
if (typeof window !== "undefined") {
  window.Picaxo = Picaxo;
} else {
  throw new Error("Picaxo needs to run as a website");
}