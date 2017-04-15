import { MODES } from "../cfg";
import { additiveAlphaColorBlending } from "../color";

import CommandKind from "./kind";

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
  //this.updateGlobalBoundings();
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
  const batch = cmd.batch;
  const layer = batch.layer;
  const main = layer.batch;
  const kind = cmd.kind;
  layer.updateBoundings();
  switch (kind) {
    case CommandKind.MOVE:
      const dir = state ? 1 : -1;
      layer.x += (batch.position.x * dir);
      layer.y += (batch.position.y * dir);
    break;
  };
  main.injectMatrix(batch, state);
  main.refreshTexture(true);
};
