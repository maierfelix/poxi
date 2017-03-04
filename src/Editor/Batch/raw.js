import { alphaByteToRgbAlpha } from "../../utils";

import Tile from "../Tile/index";
import Texture from "./Texture/index";

/**
 * @param {CanvasRenderingContext2D}
 * @param {Number} x
 * @param {Number} y
 */
export function createRawBufferAt(ctx, x, y) {
  let view = ctx.canvas;
  this.x = x;
  this.y = y;
  this.width = view.width;
  this.height = view.height;
  this.isBuffered = true;
  this.isRawBuffer = true;
  this.isBackground = false;
  this.buffer = new Texture(ctx, x, y);
};

/**
 * Warning: does not update boundings!
 * @param {Number} x
 * @param {Number} y
 * @param {Array} color
 */
export function createRawTileAt(x, y, color) {
  let tile = new Tile();
  tile.x = x;
  tile.y = y;
  tile.colors[0] = color;
  // push in without updating boundings each time
  this.tiles.push(tile);
};

/**
 * Access cached imageData
 * @param {Number} x
 * @param {Number} y
 * @return {Array}
 */
export function getRawColorAt(x, y) {
  // normalize our point
  let xx = x - this.x;
  let yy = y - this.y;
  // abort if point isn't inside our buffer boundings
  if (
    (xx < 0 || xx >= this.width) ||
    (yy < 0 || yy >= this.height)
  ) return (null);
  // now extract the data
  let data = this.buffer.data;
  // imagedata array is 1d
  let idx = (yy * this.width + xx) * 4;
  // get each color value
  let r = data[idx + 0];
  let g = data[idx + 1];
  let b = data[idx + 2];
  let a = data[idx + 3];
  let color = [r, g, b, alphaByteToRgbAlpha(a)];
  // dont return anything if we got no valid color
  if (a <= 0) return (null);
  // finally return the color array
  return (color);
};
