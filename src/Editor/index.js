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

  /**
   * @param {Number} x
   * @param {Number} y
   */
  drag(x, y) {
    if (this.modes.drag) {
      if (this.modes.draw) {
        this.pushTileBatch(x, y);
      }
    }
  }

  /**
   * Hover & unhover tiles
   * @param {Number} x
   * @param {Number} y
   */
  hover(x, y) {
    this.unHoverAllTiles();
    let tile = this.getTileFromMouseOffset(x, y);
    if (tile !== null) {
      // set current tile as hovered
      this.hovered.push(tile);
      tile.isHovered = true;
    }
  }

};

inherit(Editor, _stack);
inherit(Editor, _tiles);

export default Editor;
