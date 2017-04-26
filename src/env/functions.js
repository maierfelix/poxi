import {
  SETTINGS,
  MAX_SAFE_INTEGER
} from "../cfg";

import {
  colorToRgbaString,
  alphaByteToRgbAlpha
} from "../color";

import Layer from "../layer/index";
import Batch from "../batch/index";
import CommandKind from "../stack/kind";

/**
 * @return {Boolean}
 */
export function isInActiveState() {
  const states = this.states;
  for (let key in states) {
    // ignore dragging state
    if (key === "dragging") continue;
    if (states[key]) return (true);
  };
  return (false);
};

/**
 * @param {Number} id
 * @return {Batch}
 */
export function getBatchById(id) {
  let result = null;
  const layers = this.layers;
  for (let ii = 0; ii < layers.length; ++ii) {
    const idx = layers.length - 1 - ii;
    const layer = layers[idx];
    let batch = layer.getBatchById(id);
    if (batch !== null) {
      result = batch;
      break;
    }
  };
  return (result);
};

/**
 * @return {Layer}
 */
export function addLayer() {
  const layer = new Layer(this);
  layer.addUiReference();
  this.layers.push(layer);
  return (layer);
};

/**
 * @return {Layer}
 */
export function getCurrentLayer() {
  return (this.activeLayer || null);
};

/**
 * @param {HTMLElement} node
 * @return {Layer}
 */
export function getLayerByNode(node) {
  for (let ii = 0; ii < this.layers.length; ++ii) {
    const layer = this.layers[ii];
    if (layer.node === node) return (layer);
  };
  return (null);
};

/**
 * @param {Number} index
 * @return {Layer}
 */
export function getLayerByIndex(index) {
  return (this.layers[index] || null);
};

/**
 * @param {Layer} layer
 */
export function setActiveLayer(layer) {
  const old = this.getCurrentLayer();
  if (old && old.node) {
    old.node.classList.remove("selected");
  }
  if (layer) layer.node.classList.add("selected");
  this.activeLayer = layer;
  this.redraw = true;
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Layer}
 */
export function getLayerByPoint(x, y) {
  const layers = this.layers;
  // search by active pixel
  for (let ii = 0; ii < layers.length; ++ii) {
    const layer = layers[ii];
    const xx = x - layer.x;
    const yy = y - layer.y;
    if (layer.locked) continue;
    if (layer.bounds.isPointInside(xx, yy)) {
      if (layer.getPixelAt(x, y)) {
        return (layer);
      }
    }
  };
  // active pixel search failed
  // so now search by point inside
  for (let ii = 0; ii < layers.length; ++ii) {
    const idx = layers.length - 1 - ii;
    const layer = layers[ii];
    const xx = x - layer.x;
    const yy = y - layer.y;
    if (layer.locked) continue;
    if (layer.bounds.isPointInside(xx, yy)) {
      return (layer);
    }
  };
  return (null);
};

/**
 * Get batch to insert at by current active state
 * @return {Batch}
 */
export function getCurrentDrawingBatch() {
  for (let key in this.states) {
    const state = this.states[key];
    if (state === true && this.buffers[key]) {
      return (this.buffers[key]);
    }
  };
  return (null);
};

/**
 * @param {Number} x
 * @param {Number} y
 * @return {Batch}
 */
export function createDynamicBatch(x, y) {
  const batch = new Batch(this);
  batch.prepareMatrix(x, y);
  return (batch);
};

/**
 * Get absolute pixel
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
export function getAbsolutePixelAt(x, y) {
  // normalize coordinates
  const bw = this.bounds.w;
  const bh = this.bounds.h;
  const xx = x - this.bounds.x;
  const yy = y - this.bounds.y;
  // check if point inside boundings
  if (
    (xx < 0 || yy < 0) ||
    (bw <= 0 || bh <= 0) ||
    (xx >= bw || yy >= bh)
  ) return (null);
  // go through each layer reversed
  // and search for the given pixel
  const layers = this.layers;
  for (let ii = 0; ii < layers.length; ++ii) {
    const pixel = layers[ii].getPixelAt(x, y);
    if (pixel !== null) return (pixel);
  };
  return (null);
};

/**
 * Get layer relative pixel
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
export function getRelativePixelAt(x, y) {
  // normalize coordinates
  const bw = this.bounds.w;
  const bh = this.bounds.h;
  const xx = x - this.bounds.x;
  const yy = y - this.bounds.y;
  // check if point inside boundings
  if (
    (xx < 0 || yy < 0) ||
    (bw <= 0 || bh <= 0) ||
    (xx >= bw || yy >= bh)
  ) return (null);
  // search for the pixel at given layer
  const layer = this.getCurrentLayer();
  if (layer !== null) {
    return (layer.getPixelAt(x, y));
  }
  return (null);
};

export function updateGlobalBoundings() {
  const layers = this.layers;
  const bounds = this.bounds;
  let x = MAX_SAFE_INTEGER;  let y = MAX_SAFE_INTEGER;
  let w = -MAX_SAFE_INTEGER; let h = -MAX_SAFE_INTEGER;
  let count = 0;
  for (let ii = 0; ii < layers.length; ++ii) {
    const layer = layers[ii];
    layer.updateBoundings();
    const bounds = layer.bounds;
    const bx = layer.x + bounds.x; const by = layer.y + bounds.y;
    const bw = bx + bounds.w; const bh = by + bounds.h;
    // ignore empty layers
    if (bounds.w === 0 && bounds.h === 0) continue;
    // calculate x
    if (x < 0 && bx < x) x = bx;
    else if (x >= 0 && (bx < 0 || bx < x)) x = bx;
    // calculate y
    if (y < 0 && by < y) y = by;
    else if (y >= 0 && (by < 0 || by < y)) y = by;
    // calculate width
    if (bw > w) w = bw;
    // calculate height
    if (bh > h) h = bh;
    count++;
  };
  // update our boundings
  if (count > 0) {
    //this.updateSelectionMatrix();
    this.bounds.update(x, y, -x + w, -y + h);
  }
};

/**
 * Uses preallocated binary grid with the size of the absolute boundings
 * of our working area. In the next step we trace "alive cells" in the grid,
 * then we take the boundings of the used area of our grid and crop out
 * the relevant part. Next we can process each tile=^2 traced as inside shape
 * @param {Number} x
 * @param {Number} y
 * @param {Array} base
 * @return {Uint8Array}
 */
export function getBinaryShape(x, y, base) {
  const layer = this.getCurrentLayer();
  const bounds = layer.bounds;
  const bx = layer.x + bounds.x; const by = layer.y + bounds.y;
  const bw = bounds.w; const bh = bounds.h;
  const isEmpty = base[3] === 0;
  const gridl = bw * bh;
  // allocate and do a basic fill onto the grid
  let grid = new Uint8Array(bw * bh);
  for (let ii = 0; ii < gridl; ++ii) {
    const xx = ii % bw;
    const yy = (ii / bw) | 0;
    const color = layer.getPixelAt(bx + xx, by + yy);
    // empty tile based
    if (isEmpty) { if (color !== null) continue; }
    // color based
    else {
      if (color === null) continue;
      if (!(base[0] === color[0] && base[1] === color[1] && base[2] === color[2])) continue;
    }
    // fill tiles with 1's if we got a color match
    grid[yy * bw + xx] = 1;
  };
  // trace connected tiles by [x,y]=2
  let queue = [{x: x - bx, y: y - by}];
  while (queue.length > 0) {
    const point = queue.pop();
    const x = point.x; const y = point.y;
    const idx = y * bw + x;
    // set this grid tile to 2, if it got traced earlier as a color match
    if (grid[idx] === 1) grid[idx] = 2;
    const nn = (y-1) * bw + x;
    const ee = y * bw + (x+1);
    const ss = (y+1) * bw + x;
    const ww = y * bw + (x-1);
    if (grid[nn] === 1) queue.push({x, y:y-1});
    if (grid[ee] === 1) queue.push({x:x+1, y});
    if (grid[ss] === 1) queue.push({x, y:y+1});
    if (grid[ww] === 1) queue.push({x:x-1, y});
  };
  return (grid);
};

/**
 * @return {Number}
 */
export function getCursorSize() {
  for (let key in this.modes) {
    if (!this.modes[key]) continue;
    switch (key) {
      case "arc":
      case "draw":
      case "rect":
      case "stroke":
        return (SETTINGS.PENCIL_SIZE);
      break;
      case "erase":
        return (SETTINGS.ERASER_SIZE);
      break;
      case "light":
        return (SETTINGS.LIGHT_SIZE);
      break;
      case "move":
      case "fill":
      case "shape":
      case "flood":
      case "select":
        return (1);
      break;
      case "pipette":
        return (1);
      break;
    };
  };
  return (1);
};
