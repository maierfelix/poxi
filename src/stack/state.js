import { additiveAlphaColorBlending } from "../color";

/**
 * Manually refresh the stack,
 * clear future operations etc.
 */
export function refreshStack() {
  if (this.sindex < this.stack.length - 1) {
    this.dequeue(this.sindex, this.stack.length - 1);
  } else {
    this.stack.splice(this.sindex + 1, this.stack.length);
  }
  this.updateGlobalBoundings();
};

/**
 * Returns the latest stack operation
 * @return {Object}
 */
export function currentStackOperation() {
  return (this.stack[this.sindex]);
};

/**
 * @param {Command} cmd
 * @param {Boolean} state
 */
export function fire(cmd, state) {
  const main = this.main;
  const bounds = this.bounds;
  if (this.workingAreaHasResized() && state) {
    // sync main bounds with new bounds
    main.bounds.update(
      bounds.x, bounds.y,
      bounds.w, bounds.h
    );
    const xx = this.last.gx; const yy = this.last.gy;
    const ww = this.last.gw; const hh = this.last.gh;
    main.resizeMatrix(
      xx - main.bounds.x, yy - main.bounds.y,
      main.bounds.w - ww, main.bounds.h - hh
    );
    console.log("Resized working area");
  } else {
    console.log("Updated working area");
  }
  main.mergeMatrix(cmd.batch, state);
  main.refreshTexture(true);
};
