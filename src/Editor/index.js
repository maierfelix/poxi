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
    this.modes = {
      draw: false,
      drag: false,
      selectAll: false
    };
    this.batches = {
      tiles: []
    };
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
