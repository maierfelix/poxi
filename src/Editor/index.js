import { TILE_SIZE } from "../cfg";
import { inherit } from "../utils";

import * as _stack from "./stack";
import * as _tiles from "./tiles";

/**
 * @class Editor
 */
class Editor {

  /**
   * @param {Picaxo} instance
   */
  constructor(instance) {
    this.instance = instance;
    this.modes = {
      draw: false,
      selectAll: false
    };
    this.batches = [];
    // mouse position, negative to be hidden initially
    this.mx = -TILE_SIZE;
    this.my = -TILE_SIZE;
    this.hovered = [];
    this.colorTest = null;
    this.camera = instance.camera;
    // stack related
    this.sindex = -1;
    this.stack = [];
  }

};

inherit(Editor, _stack);
inherit(Editor, _tiles);

export default Editor;
