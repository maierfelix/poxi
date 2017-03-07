import { inherit } from "../utils";

import * as _draw from "./draw";
import * as _setup from "./setup";
import * as _buffer from "./buffer";

/**
 * @class WGLRenderer
 */
class WGLRenderer {
  /**
   * @param {Poxi} instance
   * @constructor
   */
  constructor(instance) {
    // View to render on
    this.view = null;
    // Wgl context
    this.ctx = null;
    // empty texture
    this.empty = null;
    // Clear colors
    this.colors = [0, 0, 0, 1];
    // View sizes
    this.width = 0;
    this.height = 0;
    // Vertice cache
    this.vertices = {
      idx: null,
      position: null,
      rotation: null
    };
    // Buffer cache
    this.buffers = {
      idxs: null,
      position: null,
      rotation: null
    };
    // Texture pool
    this.textures = {};
    // Save poxi instance
    this.instance = instance;
    // Save poxi camera
    this.camera = this.instance.camera;
  }
};

inherit(WGLRenderer, _draw);
inherit(WGLRenderer, _setup);
inherit(WGLRenderer, _buffer);

export default WGLRenderer;
