import { MAX_SAFE_INTEGER } from "../cfg";

import { inherit, hexToRgba } from "../utils";

import * as _stack from "./stack";
import * as _tiles from "./tiles";
import * as _batch from "./batch";
import * as _insert from "./insert";
import * as _transform from "./transform";

/**
 * @class Editor
 */
class Editor {

  /**
   * @param {Poxi} instance
   */
  constructor(instance) {
    this.instance = instance;
    this.modes = {
      draw: false,
      selectAll: false
    };
    this.batches = [];
    // mouse position, negative to be hidden initially
    this.mx = -1;
    this.my = -1;
    this._fillStyle = [255,255,255,1];
    this.camera = instance.camera;
    // stack related
    this.sindex = -1;
    this.stack = [];
  }

  /**
   * @return {Array}
   */
  get fillStyle() {
    return (this._fillStyle);
  }
  /**
   * @param {*} value
   */
  set fillStyle(value) {
    if (typeof value === "string") {
      this._fillStyle = hexToRgba(value);
    }
    else if (value instanceof Array && value.length === 4) {
      this._fillStyle = value;
    }
    else throw new Error("Unsupported or invalid color");
  }

  /**
   * @param {Number} x
   * @param {Number} y
   * @return {Boolean}
   */
  offsetExceedsIntegerLimit(x, y) {
    return (
      Math.abs(x) > MAX_SAFE_INTEGER || Math.abs(y) > MAX_SAFE_INTEGER
    );
  }

};

inherit(Editor, _stack);
inherit(Editor, _tiles);
inherit(Editor, _batch);
inherit(Editor, _insert);
inherit(Editor, _transform);

export default Editor;
