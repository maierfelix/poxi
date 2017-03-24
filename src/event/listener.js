import {
  rgbaToHex,
  rgbaToBytes,
  getRainbowColor
} from "../utils";

import {
  MODES,
  SETTINGS,
  TILE_SIZE
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
  this.onMouseUp(e);
};

/**
 * @param {Event} e
 */
export function onMouseLeave(e) {
  e.preventDefault();
  this.onMouseUp(e);
};

/**
 * @param {Event} e
 */
export function onMouseDown(e) {
  e.preventDefault();
  if (!(e.target instanceof HTMLCanvasElement)) return;
  const x = e.clientX;
  const y = e.clientY;
  const relative = this.getRelativeTileOffset(x, y);
  if (e.which === 1) {
    this.resetSelection();
    // debug helper
    (() => {
      //console.log(relative.x, relative.y);
    })();
    if (this.modes.select) {
      this.states.selecting = true;
      this.selectFrom(x, y);
      this.selectTo(x, y);
    }
    else if (this.modes.arc) {
      this.states.arc = true;
      this.buffers.arc = this.createDynamicBatch();
      const batch = this.buffers.arc;
      const layer = this.getCurrentLayer();
      batch.forceRendering = true;
      batch.prepareBuffer(relative.x, relative.y);
      batch.refreshTexture();
      layer.addBatch(batch);
    }
    else if (this.modes.rect) {
      this.states.rect = true;
      this.buffers.rect = this.createDynamicBatch();
      const batch = this.buffers.rect;
      const layer = this.getCurrentLayer();
      batch.forceRendering = true;
      batch.prepareBuffer(relative.x, relative.y);
      batch.refreshTexture();
      layer.addBatch(batch);
    }
    else if (this.modes.draw) {
      this.states.drawing = true;
      this.buffers.drawing = this.createDynamicBatch();
      const batch = this.buffers.drawing;
      const layer = this.getCurrentLayer();
      batch.forceRendering = true;
      batch.prepareBuffer(relative.x, relative.y);
      batch.drawAt(relative.x, relative.y, SETTINGS.PENCIL_SIZE, this.fillStyle);
      batch.refreshTexture();
      layer.addBatch(batch);
    }
    else if (this.modes.erase) {
      this.states.erasing = true;
      this.buffers.erasing = this.createDynamicBatch();
      const batch = this.buffers.erasing;
      const layer = this.getCurrentLayer();
      batch.forceRendering = true;
      batch.prepareBuffer(relative.x, relative.y);
      batch.clearAt(relative.x, relative.y, SETTINGS.ERASER_SIZE);
      batch.refreshTexture();
      batch.isEraser = true;
      layer.addBatch(batch);
    }
    else if (this.modes.fill) {
      this.fillBucket(relative.x, relative.y, this.fillStyle);
    }
    else if (this.modes.pipette) {
      let color = this.getPixelAt(relative.x, relative.y);
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
  this.last.mdx = x; this.last.mdy = y;
};

/**
 * @param {Event} e
 */
export function onMouseUp(e) {
  e.preventDefault();
  if (!(e.target instanceof HTMLCanvasElement)) return;
  if (e.which === 1) {
    if (this.modes.arc) {
      const batch = this.buffers.arc;
      batch.forceRendering = false;
      this.states.arc = false;
      this.enqueue(CommandKind.ARC_FILL, batch);
      this.buffers.arc = null;
    }
    else if (this.modes.rect) {
      const batch = this.buffers.rect;
      batch.forceRendering = false;
      this.states.rect = false;
      this.enqueue(CommandKind.RECT_FILL, batch);
      this.buffers.rect = null;
    }
    else if (this.modes.select) {
      this.states.selecting = false;
    }
    else if (this.states.drawing) {
      const batch = this.buffers.drawing;
      batch.forceRendering = false;
      this.states.drawing = false;
      this.enqueue(CommandKind.DRAW, batch);
      this.buffers.drawing = null;
    }
    else if (this.states.erasing) {
      const batch = this.buffers.erasing;
      batch.forceRendering = false;
      this.states.erasing = false;
      if (batch.isEmpty()) batch.kill();
      else this.enqueue(CommandKind.ERASE, batch);
      this.buffers.erasing = null;
    }
  }
  if (e.which === 3) {
    this.states.dragging = false;
  }
};

let lastx = 0;
let lasty = 0;
/**
 * @param {Event} e
 */
export function onMouseMove(e) {
  e.preventDefault();
  if (!(e.target instanceof HTMLCanvasElement)) return;
  const x = e.clientX;
  const y = e.clientY;
  const last = this.last;
  const layer = this.getCurrentLayer();
  const relative = this.getRelativeTileOffset(x, y);
  // mouse polling rate isn't 'per-pixel'
  // so we try to interpolate missed offsets
  if (last.mx === relative.x && last.my === relative.y) return;
  this.hover(x, y);
  if (this.states.dragging) {
    this.drag(x, y);
  }
  if (this.states.arc) {
    const batch = this.buffers.arc;
    batch.clear();
    const start = this.getRelativeTileOffset(this.last.mdx, this.last.mdy);
    const radius = pointDistance(start.x, start.y, relative.x, relative.y);
    this.strokeArc(batch, start.x, start.y, radius, this.fillStyle);
    layer.updateBoundings();
    batch.refreshTexture();
  }
  else if (this.states.rect) {
    const batch = this.buffers.rect;
    batch.clear();
    const start = this.getRelativeTileOffset(this.last.mdx, this.last.mdy);
    const ww = relative.x - start.x;
    const hh = relative.y - start.y;
    this.strokeRect(batch, start.x, start.y, ww, hh, this.fillStyle);
    layer.updateBoundings();
    batch.refreshTexture();
  }
  else if (this.states.drawing) {
    const batch = this.buffers.drawing;
    this.insertLine(x, y, lastx, lasty);
    layer.updateBoundings();
    batch.refreshTexture();
  }
  else if (this.states.erasing) {
    const batch = this.buffers.erasing;
    const layer = this.getCurrentLayer();
    this.insertLine(x, y, lastx, lasty);
    batch.clearAt(relative.x, relative.y, SETTINGS.ERASER_SIZE);
    if (!batch.isEmpty()) layer.updateBoundings();
  }
  else if (this.states.dragging) {
    this.drag(x, y);
  }
  else if (this.states.selecting) {
    this.selectTo(x, y);
  }
  lastx = x; lasty = y;
  last.mx = relative.x; last.my = relative.y;
};

/**
 * @param {Event} e
 */
export function onKeyDown(e) {
  e.preventDefault();
  const code = e.keyCode;
  this.keys[code] = 1;
  switch (code) {
    // del
    case 46:
      this.clearRect(this.getSelection());
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
        this.paste(this.last.mx, this.last.my, this.clipboard.copy);
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
    break;
    // f5
    case 116:
      location.reload();
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
  if (code === 16) {
    this.states.select = false;
    this.states.selecting = false;
  }
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
  e.preventDefault();
  const x = e.clientX;
  const y = e.clientY;
  const value = e.deltaY > 0 ? -1 : 1;
  this.click(x, y);
  this.scale(value);
};
