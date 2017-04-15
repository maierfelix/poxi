import { SETTINGS } from "../cfg";
import { alignToGrid } from "../math";

import {
  getRainbowColor,
  alphaByteToRgbAlpha
} from "../color";

import CommandKind from "../stack/kind";

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x
 * @param {Number} y
 * @return {Void}
 */
export function insertImage(ctx, x, y) {
  const layer = this.getCurrentLayer();
  const batch = this.createDynamicBatch(x, y);
  layer.addBatch(batch);
  const view = ctx.canvas;
  const width = view.width; const height = view.height;
  const data = ctx.getImageData(0, 0, width, height).data;
  const ww = width - 1; const hh = height - 1;
  batch.resizeRectangular(
    x, y,
    width - 1, height - 1
  );
  let count = 0;
  for (let ii = 0; ii < data.length; ii += 4) {
    const idx = (ii / 4) | 0;
    const xx = (idx % width) | 0;
    const yy = (idx / width) | 0;
    const px = (yy * width + xx) * 4;
    const r = data[px + 0];
    const g = data[px + 1];
    const b = data[px + 2];
    const a = data[px + 3];
    if (a <= 0) continue;
    batch.drawPixelFast(x + xx, y + yy, [r, g, b, alphaByteToRgbAlpha(a)]);
    count++;
  };
  // nothing changed
  if (count <= 0) {
    batch.kill();
    return;
  }
  batch.refreshTexture(true);
  batch.resizeByMatrixData();
  this.enqueue(CommandKind.INSERT_IMAGE, batch);
  return;
};

/**
 * @param {Number} x0
 * @param {Number} y0
 * @param {Number} x1
 * @param {Number} y1
 */
export function insertLine(x0, y0, x1, y1) {
  const base = 8 * this.cr;
  const batch = this.getCurrentDrawingBatch();
  const dx = Math.abs(x1 - x0); const dy = Math.abs(y1 - y0);
  const sx = (x0 < x1) ? 1 : -1; const sy = (y0 < y1) ? 1 : -1;
  let err = (dx - dy);
  while (true) {
    const relative = this.getRelativeTileOffset(x0, y0);
    // TODO: limit repeation rate on brush size (take modulo)
    if (this.states.drawing) {
      batch.drawAt(relative.x, relative.y, SETTINGS.PENCIL_SIZE, this.fillStyle);
    }
    else if (this.states.erasing) {
      batch.clearAt(relative.x, relative.y, SETTINGS.ERASER_SIZE);
    }
    else if (this.states.lighting) {
      batch.applyColorLightness(relative.x, relative.y, SETTINGS.LIGHTING_MODE);
    }
    else if (this.states.stroke) {
      batch.drawAt(x0, y0, SETTINGS.PENCIL_SIZE, this.fillStyle);
    }
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  };
};

/**
 * Inserts filled arc at given position
 * @param {Batch} batch
 * @param {Number} x
 * @param {Number} y
 * @param {Number} radius
 * @param {Array} color
 */
export function fillArc(batch, x, y, radius, color) {
  radius = (radius || 1.0) | 0;
  if (!color) color = [255, 255, 255, 1];
  this.insertStrokedArc(batch, x, y, radius, color);
  // TODO: now fill the stroked circle (with fill?)
};

/**
 * Inserts stroked arc at given position
 * @param {Batch} batch
 * @param {Number} x
 * @param {Number} y
 * @param {Number} radius
 * @param {Array} color
 */
export function strokeArc(batch, x, y, radius, color) {
  radius = (radius || 1.0) | 0;
  if (!color) color = [255, 255, 255, 1];
  this.insertStrokedArc(batch, x, y, radius, color);
};

/**
 * Inserts filled arc at given position
 * @param {Batch} batch
 * @param {Number} x1
 * @param {Number} y1
 * @param {Number} radius
 * @param {Array} color
 */
export function insertStrokedArc(batch, x1, y1, radius, color) {
  let x2 = radius;
  let y2 = 0;
  let err = 0;
  const size = SETTINGS.PENCIL_SIZE;
  for (;x2 >= y2;) {
    batch.drawAt(x2 + x1, y2 + y1, size, color);
    batch.drawAt(y2 + x1, x2 + y1, size, color);
    batch.drawAt(-x2 + x1, y2 + y1, size, color);
    batch.drawAt(-y2 + x1, x2 + y1, size, color);
    batch.drawAt(-x2 + x1, -y2 + y1, size, color);
    batch.drawAt(-y2 + x1, -x2 + y1, size, color);
    batch.drawAt(x2 + x1, -y2 + y1, size, color);
    batch.drawAt(y2 + x1, -x2 + y1, size, color);
    if (err <= 0) {
      y2 += 1;
      err += 2 * y2 + 1;
    }
    if (err > 0) {
      x2 -= 1;
      err -= 2 * x2 + 1;
    }
  };
};

/**
 * Inserts filled rectangle at given position
 * @param {Batch} batch
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 * @param {Array} color
 */
export function fillRect(batch, x, y, width, height, color) {
  if (!color) color = [255, 255, 255, 1];
  this.insertRectangleAt(
    batch,
    x | 0, y | 0,
    width | 0, height | 0,
    color, true
  );
};

/**
 * Inserts stroked rectangle at given position
 * @param {Batch} batch
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 * @param {Array} color
 */
export function strokeRect(batch, x, y, width, height, color) {
  if (!color) color = [255, 255, 255, 1];
  this.insertRectangleAt(
    batch,
    x | 0, y | 0,
    width | 0, height | 0,
    color, false
  );
};

/**
 * Inserts rectangle at given position
 * @param {Batch} batch
 * @param {Number} x1
 * @param {Number} y1
 * @param {Number} x2
 * @param {Number} y2
 * @param {Array} color
 * @param {Boolean} filled
 */
export function insertRectangleAt(batch, x1, y1, x2, y2, color, filled) {
  const width = Math.abs(x2);
  const height = Math.abs(y2);
  const dx = (x2 < 0 ? -1 : 1);
  const dy = (y2 < 0 ? -1 : 1);
  const size = SETTINGS.PENCIL_SIZE;
  // stroke rectangle
  if (!filled) {
    for (let ii = 0; ii < width * height; ++ii) {
      const xx = (ii % width) | 0;
      const yy = (ii / width) | 0;
      if (!(
        (xx === 0 || xx >= width-1) ||
        (yy === 0 || yy >= height-1))
      ) continue;
      batch.drawAt(x1 + xx * dx, y1 + yy * dy, size, color);
    };
  // filled rectangle
  } else {
    for (let ii = 0; ii < width * height; ++ii) {
      const xx = (ii % width) | 0;
      const yy = (ii / width) | 0;
      batch.drawAt(x1 + xx * dx, y1 + yy * dy, size, color);
    };
  }
};
