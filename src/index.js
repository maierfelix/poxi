import extend from "./extend";

import * as _select from "./area/select";
import * as _area_functions from "./area/functions";

import * as _camera from "./camera/functions";

import * as _emitter from "./event/emitter";
import * as _listener from "./event/listener";

import * as _env from "./env/functions";

import * as _blend from "./filter/blend";
import * as _invert from "./filter/invert";
import * as _onion from "./filter/onion";
import * as _replace from "./filter/replace";
import * as _shading from "./filter/shading";
import * as _smoothing from "./filter/smoothing";

import * as _buffer from "./render/buffer";
import * as _build from "./render/build";
import * as _draw from "./render/draw";
import * as _generate from "./render/generate";
import * as _render from "./render/render";
import * as _resize from "./render/resize";
import * as _shaders from "./render/shaders";

import * as _redo from "./stack/redo";
import * as _state from "./stack/state";
import * as _undo from "./stack/undo";

import * as _read from "./storage/read";
import * as _write from "./storage/write";

import * as _fill from "./transform/fill";
import * as _rotate from "./transform/rotate";
import * as _insert from "./transform/insert";

import * as _ui from "./ui/index";

import * as _setup from "./setup";

import { MIN_SCALE } from "./cfg";

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
    // empty texture
    this.empty = null;
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
    this.cr = MIN_SCALE;
    this.cs = MIN_SCALE;
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
    // mouse offset
    this.mx = 0;
    this.my = 0;
    // stack related
    this.stack = [];
    this.sindex = 0;
    // layer related
    this.layers = [];
    // general cache
    this.cache = {
      main: null,
      mainTexture: null,
      bg: null,
      fg: null,
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
      stroke: false,
      erasing: null,
      drawing: null,
      boundingColor: [1, 0, 0, 0.1]
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
      drawing: false,
      dragging: false,
      select: false,
      selecting: false
    };
    // mode related
    this.modes = {
      arc: false,
      fill: false,
      rect: false,
      draw: false,
      erase: false,
      flood: false,
      select: false,
      stroke: false,
      pipette: false
    };
    // global fill style
    this.fillStyle = [255, 0, 0, 1];
    this.setup();
  }
};

extend(Poxi, _select);
extend(Poxi, _area_functions);

extend(Poxi, _camera);

extend(Poxi, _emitter);
extend(Poxi, _listener);

extend(Poxi, _env);

extend(Poxi, _blend);
extend(Poxi, _invert);
extend(Poxi, _onion);
extend(Poxi, _replace);
extend(Poxi, _shading);
extend(Poxi, _smoothing);

extend(Poxi, _buffer);
extend(Poxi, _build);
extend(Poxi, _draw);
extend(Poxi, _generate);
extend(Poxi, _render);
extend(Poxi, _resize);
extend(Poxi, _shaders);

extend(Poxi, _redo);
extend(Poxi, _state);
extend(Poxi, _undo);

extend(Poxi, _read);
extend(Poxi, _write);

extend(Poxi, _fill);
extend(Poxi, _rotate);
extend(Poxi, _insert);

extend(Poxi, _ui);

extend(Poxi, _setup);

if (typeof window !== "undefined") {
  window.Poxi = Poxi;
  window.stage = new Poxi();
} else {
  throw new Error("Poxi only runs inside the browser");
}
