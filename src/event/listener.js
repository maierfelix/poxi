import {
  hexToRgba,
  rgbaToHex,
  rgbaToBytes,
  getRainbowColor
} from "../color";

import {
  MODES,
  SETTINGS,
  TILE_SIZE,
  LIGHT_DARKEN_IMG_PATH,
  LIGHT_LIGHTEN_IMG_PATH
} from "../cfg";

import { pointDistance } from "../math";

import CommandKind from "../stack/kind";

export function initListeners() {

  window.addEventListener("resize", (e) => this.onResize(e));

  window.addEventListener("mousedown", (e) => this.onMouseDown(e));
  window.addEventListener("mouseup", (e) => this.onMouseUp(e));

  window.addEventListener("mousemove", (e) => this.onMouseMove(e));

  window.addEventListener("keydown", (e) => this.onKeyDown(e));
  window.addEventListener("keyup", (e) => this.onKeyUp(e));

  window.addEventListener("contextmenu", (e) => this.onContextmenu(e));

  window.addEventListener("wheel", (e) => this.onMouseWheel(e));
  window.addEventListener("mousewheel", (e) => this.onMouseWheel(e));

  this.view.addEventListener("mouseout", (e) => this.onMouseOut(e));
  this.view.addEventListener("mouseleave", (e) => this.onMouseLeave(e));

  menu.addEventListener("click", (e) => this.onColorMenuClick(e));

};

/**
 * @param {Event} e
 */
export function onResize(e) {
  this.resize(
    window.innerWidth, window.innerHeight
  );
};

/**
 * @param {Event} e
 */
export function onMouseOut(e) {
  e.preventDefault();
  //this.onMouseUp(e);
};

/**
 * @param {Event} e
 */
export function onMouseLeave(e) {
  e.preventDefault();
  //this.onMouseUp(e);
};

export function resetListElementsActiveState(el) {
  for (let ii = 0; ii < el.children.length; ii++) {
    el.children[ii].classList.remove("active");
  };
};

/**
 * @param {HTMLElement} el
 * @return {Void}
 */
export function onColorMenuClick(el) {
  const element = el.target;
  if (element.id) return;
  const value = element.getAttribute("color");
  const rgba = JSON.parse(value);
  this.setUiColor(rgbaToHex(rgba));
  return;
};

/**
 * @param {HTMLElement} el
 */
export function processUIClick(el) {
  const parent = el.parentNode;
  if (!parent) return;
  const id = parent.id;
  if (id === "pencil-size") {
    const value = el.innerHTML;
    SETTINGS.PENCIL_SIZE = parseInt(value);
    this.resetModes();
    this.modes.draw = true;
    tiled.style.opacity = 1.0;
  }
  else if (id === "eraser-size") {
    const value = el.innerHTML;
    SETTINGS.ERASER_SIZE = parseInt(value);
    this.resetModes();
    this.modes.erase = true;
    erase.style.opacity = 1.0;
  }
  else if (id === "light-size") {
    const value = el.innerHTML;
    SETTINGS.LIGHT_SIZE = parseInt(value);
    this.resetModes();
    this.modes.light = true;
    lighting.style.opacity = 1.0;
  }
  else return;
  this.resetListElementsActiveState(el.parentNode);
  el.classList.add("active");
};

/**
 * @param {Event} e
 */
export function onMouseDown(e) {
  // only allow clicking on canvas
  if (!(e.target instanceof HTMLCanvasElement)) {
    this.processUIClick(e.target);
    return;
  }
  const x = e.clientX;
  const y = e.clientY;
  const layer = this.getCurrentLayer();
  const relative = this.getRelativeTileOffset(x, y);
  const rx = relative.x; const ry = relative.y;
  if (e.which === 1) {
    this.resetSelection();
    if (this.modes.move) {
      const layer = this.getLayerByPoint(rx, ry);
      if (layer !== null) {
        this.buffers.mLayer = this.getCurrentLayer();
        this.setActiveLayer(layer);
        this.states.moving = true;
        const batch = this.createDynamicBatch(rx, ry);
        batch.position.mx = rx;
        batch.position.my = ry;
        batch.layer = layer;
        batch.isMover = true;
        this.buffers.move = batch;
      }
    }
    else if (this.modes.select) {
      this.states.selecting = true;
      this.selectFrom(x, y);
      this.selectTo(x, y);
    }
    else if (this.modes.arc) {
      this.states.arc = true;
      this.buffers.arc = layer.createBatchAt(rx, ry);
      const batch = this.buffers.arc;
      batch.forceRendering = true;
      batch.refreshTexture(false);
    }
    else if (this.modes.rect) {
      this.states.rect = true;
      this.buffers.rect = layer.createBatchAt(rx, ry);
      const batch = this.buffers.rect;
      batch.forceRendering = true;
      batch.refreshTexture(false);
    }
    else if (this.modes.draw) {
      this.states.drawing = true;
      this.buffers.drawing = layer.createBatchAt(rx, ry);
      const batch = this.buffers.drawing;
      batch.forceRendering = true;
      batch.drawAt(rx, ry, SETTINGS.PENCIL_SIZE, this.fillStyle);
      batch.refreshTexture(false);
    }
    else if (this.modes.erase) {
      this.states.erasing = true;
      this.buffers.erasing = layer.createBatchAt(rx, ry);
      const batch = this.buffers.erasing;
      batch.forceRendering = true;
      batch.clearRect(rx, ry, SETTINGS.ERASER_SIZE, SETTINGS.ERASER_SIZE);
      batch.refreshTexture(false);
      batch.isEraser = true;
    }
    else if (this.modes.light) {
      this.states.lighting = true;
      this.buffers.lighting = layer.createBatchAt(rx, ry);
      const batch = this.buffers.lighting;
      batch.forceRendering = true;
      batch.applyColorLightness(rx, ry, SETTINGS.LIGHTING_MODE);
      batch.refreshTexture(false);
    }
    else if (this.modes.stroke) {
      this.states.stroke = true;
      this.buffers.stroke = layer.createBatchAt(rx, ry);
      const batch = this.buffers.stroke;
      batch.forceRendering = true;
      batch.refreshTexture(false);
    }
    else if (this.modes.flood) {
      this.floodPaint(rx, ry);
    }
    else if (this.modes.fill) {
      this.fillBucket(rx, ry, this.fillStyle);
    }
    else if (this.modes.shape) {
      const batch = this.getShapeAt(rx, ry);
      this.shape = batch;
    }
    else if (this.modes.pipette) {
      this.states.pipette = true;
      const color = this.getAbsolutePixelAt(rx, ry);
      if (color !== null) {
        this.fillStyle = color;
        color_view.style.background = color.value = rgbaToHex(color);
      }
    }
  }
  else if (e.which === 3) {
    this.states.dragging = true;
    this.click(x, y);
  }
  if (e.which === 1) {
    this.last.mdx = x; this.last.mdy = y;
    const start = this.getRelativeTileOffset(this.last.mdx, this.last.mdy);
    this.last.mdrx = start.x; this.last.mdry = start.y;
  }
};

let lastx = -0;
let lasty = -0;
/**
 * @param {Event} e
 */
export function onMouseMove(e) {
  e.preventDefault();
  const x = e.clientX; const y = e.clientY;
  if (!(e.target instanceof HTMLCanvasElement)) return;
  const last = this.last;
  const layer = this.getCurrentLayer();
  const relative = this.getRelativeTileOffset(x, y);
  const rx = relative.x; const ry = relative.y;
  // mouse polling rate isn't 'per-pixel'
  // so we try to interpolate missed offsets
  if (this.modes.move) {
    this.redraw = true;
  }
  if (this.states.dragging) {
    this.drag(x, y);
    this.hover(x, y);
    lastx = x; lasty = y;
    last.mx = rx; last.my = ry;
    return;
  }
  if (last.mx === rx && last.my === ry) return;
  this.hover(x, y);
  this.redraw = true;
  if (this.states.moving) {
    const batch = this.buffers.move;
    batch.move(rx, ry);
    batch.refreshTexture(false);
  }
  else if (this.states.arc) {
    const batch = this.buffers.arc;
    batch.clear();
    const sx = this.last.mdrx;
    const sy = this.last.mdry;
    const radius = pointDistance(sx, sy, rx, ry);
    this.strokeArc(batch, sx, sy, radius, this.fillStyle);
    batch.refreshTexture(false);
  }
  else if (this.states.rect) {
    const batch = this.buffers.rect;
    batch.clear();
    const sx = this.last.mdrx;
    const sy = this.last.mdry;
    const ww = rx - sx;
    const hh = ry - sy;
    this.strokeRect(batch, sx, sy, ww, hh, this.fillStyle);
    batch.refreshTexture(false);
  }
  else if (this.states.stroke) {
    const batch = this.buffers.stroke;
    batch.clear();
    this.insertLine(this.last.mdrx, this.last.mdry, rx, ry);
    batch.refreshTexture(false);
  }
  else if (this.states.drawing) {
    const batch = this.buffers.drawing;
    this.insertLine(x, y, lastx, lasty);
    batch.refreshTexture(false);
  }
  else if (this.states.erasing) {
    const batch = this.buffers.erasing;
    const layer = this.getCurrentLayer();
    this.insertLine(x, y, lastx, lasty);
    batch.refreshTexture(false);
  }
  else if (this.states.lighting) {
    const batch = this.buffers.lighting;
    const layer = this.getCurrentLayer();
    this.insertLine(x, y, lastx, lasty);
    batch.refreshTexture(false);
  }
  else if (this.states.dragging) {
    this.drag(x, y);
  }
  else if (this.states.selecting) {
    this.selectTo(x, y);
  }
  else if (this.states.pipette) {
    const color = this.getAbsolutePixelAt(rx, ry);
    if (color !== null) {
      this.fillStyle = color;
      color_view.style.background = color.value = rgbaToHex(color);
    }
  }
  lastx = x; lasty = y;
  last.mx = rx; last.my = ry;
};

/**
 * @param {Event} e
 */
export function onMouseUp(e) {
  e.preventDefault();
  if (!(e.target instanceof HTMLCanvasElement)) return;
  if (e.which === 1) {
    if (this.modes.move && this.buffers.move) {
      const batch = this.buffers.move;
      const layer = batch.layer;
      this.states.move = false;
      this.states.moving = false;
      // only enqueue if batch not empty
      if (batch.position.x !== 0 || batch.position.y !== 0) {
        layer.x -= batch.position.x;
        layer.y -= batch.position.y;
        this.enqueue(CommandKind.LAYER_MOVE, batch);
      } else {
        batch.kill();
      }
      this.setActiveLayer(this.buffers.mLayer);
      this.buffers.move = null;
    }
    else if (this.modes.arc) {
      const batch = this.buffers.arc;
      batch.forceRendering = false;
      this.states.arc = false;
      batch.resizeByMatrixData();
      batch.refreshTexture(false);
      if (batch.isEmpty()) batch.kill();
      else this.enqueue(CommandKind.ARC_FILL, batch);
      this.buffers.arc = null;
    }
    else if (this.modes.rect) {
      const batch = this.buffers.rect;
      batch.forceRendering = false;
      this.states.rect = false;
      batch.resizeByMatrixData();
      batch.refreshTexture(false);
      if (batch.isEmpty()) batch.kill();
      else this.enqueue(CommandKind.RECT_FILL, batch);
      this.buffers.rect = null;
    }
    else if (this.modes.stroke) {
      const batch = this.buffers.stroke;
      batch.forceRendering = false;
      this.states.stroke = false;
      batch.resizeByMatrixData();
      batch.refreshTexture(false);
      if (batch.isEmpty()) batch.kill();
      else this.enqueue(CommandKind.STROKE, batch);
      this.buffers.stroke = null;
    }
    else if (this.modes.select) {
      this.states.selecting = false;
      this.redraw = true;
    }
    else if (this.states.drawing) {
      const batch = this.buffers.drawing;
      batch.forceRendering = false;
      batch.resizeByMatrixData();
      this.states.drawing = false;
      this.enqueue(CommandKind.DRAW, batch);
      this.buffers.drawing = null;
    }
    else if (this.states.erasing) {
      const batch = this.buffers.erasing;
      batch.forceRendering = false;
      batch.resizeByMatrixData();
      this.states.erasing = false;
      if (batch.isEmpty()) batch.kill();
      else this.enqueue(CommandKind.ERASE, batch);
      this.buffers.erasing = null;
    }
    else if (this.states.lighting) {
      const batch = this.buffers.lighting;
      batch.forceRendering = false;
      this.states.lighting = false;
      this.enqueue(CommandKind.LIGHTING, batch);
      this.buffers.lighting = null;
    }
    else if (this.states.pipette) {
      this.states.pipette = false;
    }
  }
  if (e.which === 3) {
    this.states.dragging = false;
  }
};

/**
 * @param {Event} e
 */
export function onKeyDown(e) {
  const code = e.keyCode;
  const target = e.target;
  if (target !== document.body) {
    return;
  }
  e.preventDefault();
  this.keys[code] = 1;
  switch (code) {
    // ctrl
    case 17:
      if (this.modes.light) {
        // lighting mode is darken
        SETTINGS.LIGHTING_MODE = -(Math.abs(SETTINGS.LIGHTING_MODE));
        lighting.src = LIGHT_DARKEN_IMG_PATH;
      }
    break;
    // del
    case 46:
      this.clearSelection(this.getSelection());
      this.resetSelection();
    break;
    // c | ctrl+c
    case 67:
      if (this.keys[17]) {
        this.copy(this.getSelection());
      }
    break;
    // x | ctrl+x
    case 88:
      if (this.keys[17]) {
        this.cut(this.getSelection());
        this.resetSelection();
      }
    break;
    // v + ctrl+v
    case 86:
      if (this.keys[17]) {
        this.pasteAt(this.last.mx, this.last.my, this.getSelection());
        this.resetSelection();
      }
    break;
    // z | ctr+z
    case 90:
      if (this.keys[17]) {
        this.undo();
      }
    break;
    // y | ctrl+y
    case 89:
      if (this.keys[17]) {
        this.redo();
      }
    break;
    // f2
    case 113:
      MODES.DEV = !MODES.DEV;
      this.redraw = true;
    break;
    // f5
    case 116:
      location.reload();
    break;
    // space
    case 32:
      // already open, close so
      if (this.states.fastColorMenu) {
        this.closeFastColorPickerMenu();
        return;
      }
      const width = menu.clientWidth;
      const height = menu.clientHeight;
      const btmWidth = document.querySelector(".bottom-menu").clientHeight;
      let yy = lasty;
      let xx = (lastx - (width / 2) | 0);
      // invert menu position since we are out of window view
      if (yy + height > stage.ch - btmWidth) {
        yy = yy - height;
      }
      menu.style.top = yy + "px";
      menu.style.left = xx + "px";
      this.openFastColorPickerMenu();
    break;
    default:
      return;
    break;
  };
};

/**
 * @param {Event} e
 */
export function onKeyUp(e) {
  e.preventDefault();
  const code = e.keyCode;
  this.keys[code] = 0;
  switch (code) {
    // ctrl
    case 17:
      // lighting mode is lighten
      if (this.modes.light) {
        SETTINGS.LIGHTING_MODE = Math.abs(SETTINGS.LIGHTING_MODE);
        lighting.src = LIGHT_LIGHTEN_IMG_PATH;
      }
    break;
  };
};

/**
 * @param {Event} e
 */
export function onContextmenu(e) {
  e.preventDefault();
};

/**
 * @param {Event} e
 */
export function onMouseWheel(e) {
  if (!(e.target instanceof HTMLCanvasElement)) return;
  e.preventDefault();
  const x = e.clientX;
  const y = e.clientY;
  const value = e.deltaY > 0 ? -1 : 1;
  this.click(x, y);
  this.scale(value);
  this.hover(x, y);
};
