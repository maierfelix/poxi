import extend from "./extend";

import * as _select from "./area/select";
import * as _area_functions from "./area/functions";

import * as _camera from "./camera/functions";

import * as _emitter from "./event/emitter";
import * as _listener from "./event/listener";

import * as _env from "./env/functions";
import * as _fill from "./env/fill";
import * as _insert from "./env/insert";
import * as _transform from "./env/transform";

import * as _buffer from "./render/buffer";
import * as _build from "./render/build";
import * as _draw from "./render/draw";
import * as _generate from "./render/generate";
import * as _main from "./render/main";
import * as _render from "./render/render";
import * as _resize from "./render/resize";
import * as _shaders from "./render/shaders";

import * as _redo from "./stack/redo";
import * as _state from "./stack/state";
import * as _undo from "./stack/undo";

import * as _read from "./storage/read";
import * as _write from "./storage/write";

import * as _ui from "./ui/index";

import * as _setup from "./setup";

import { BASE_SCALE } from "./cfg";

import Layer from "./Layer/index";
import Boundings from "./bounds/index";

/**
 * @class {Poxi}
 */
class Poxi {
  /**
   * @constructor
   */
  constructor() {
    // # webgl related
    // wgl context
    this.gl = null;
    // canvas reference
    this.view = null;
    // webgl program
    this.program = null;
    // global boundings
    this.bounds = new Boundings();
    // # camera related
    this.cx = 0;
    this.cy = 0;
    this.cw = 0;
    this.ch = 0;
    // camera render scale
    this.cr = BASE_SCALE;
    this.cs = BASE_SCALE;
    // camera drag related
    this.dx = 0;
    this.dy = 0;
    // camera zoom related
    this.lx = 0;
    this.ly = 0;
    // selection related
    this.sx = 0;
    this.sy = 0;
    this.sw = -0;
    this.sh = -0;
    this.shape = null;
    // mouse offset
    this.mx = 0;
    this.my = 0;
    // stack related
    this.stack = [];
    this.sindex = -1;
    // layer related
    this.layers = [];
    // general cache
    this.cache = {
      bg: null,
      fg: null,
      // unused base layer
      layer: null,
      fgTexture: null,
      grid: null,
      gridTexture: null,
      // wgl cache
      gl: {
        // empty texture
        empty: null,
        // general buffers
        buffers: {},
        // we use buffered uv coords
        vertices: {},
        // texture pool
        textures: {}
      }
    };
    // last things
    this.last = {
      cx: 1, cy: 1,
      // mouse move coordinates
      mx: 0, my: 0,
      // mouse down coordinates
      mdx: 0, mdy: 0,
      // mouse down relative coordinates
      mdrx: 0, mdry: 0
    };
    // shared buffer related
    this.buffers = {
      arc: null,
      rect: null,
      move: null,
      stroke: null,
      erasing: null,
      drawing: null
    };
    // keyboard related
    this.keys = {};
    // clipboard related
    this.clipboard = {
      copy: null
    };
    // stage stages
    this.states = {
      arc: false,
      rect: false,
      stroke: false,
      moving: false,
      drawing: false,
      pipette: false,
      lighting: false,
      dragging: false,
      select: false,
      selecting: false,
      fastColorMenu: false
    };
    // mode related
    this.modes = {
      arc: false,
      move: false,
      fill: false,
      rect: false,
      draw: false,
      shape: false,
      light: false,
      erase: false,
      flood: false,
      select: false,
      stroke: false,
      pipette: false
    };
    // indicates if we have to redraw our stage
    this.redraw = false;
    // global fill style
    this.fillStyle = [0, 0, 0, 0];
    // favorite used colors
    this.favoriteColors = [];
    this.setup();
  }
};

extend(Poxi, _select);
extend(Poxi, _area_functions);

extend(Poxi, _camera);

extend(Poxi, _emitter);
extend(Poxi, _listener);

extend(Poxi, _env);
extend(Poxi, _fill);
extend(Poxi, _insert);
extend(Poxi, _transform);

extend(Poxi, _buffer);
extend(Poxi, _build);
extend(Poxi, _draw);
extend(Poxi, _generate);
extend(Poxi, _main);
extend(Poxi, _render);
extend(Poxi, _resize);
extend(Poxi, _shaders);

extend(Poxi, _redo);
extend(Poxi, _state);
extend(Poxi, _undo);

extend(Poxi, _read);
extend(Poxi, _write);

extend(Poxi, _ui);

extend(Poxi, _setup);

if (typeof window !== "undefined") {
  window.Poxi = Poxi;
  window.stage = new Poxi();
} else {
  throw new Error("Poxi only runs inside the browser");
}
