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
 * @return {Number}
 */
export function getCommandKind(cmd) {
  const kind = cmd.kind;
  switch (kind) {
    case CommandKind.LAYER_LOCK:
    case CommandKind.LAYER_FLIP:
    case CommandKind.LAYER_MOVE:
    case CommandKind.LAYER_ORDER:
    case CommandKind.LAYER_RENAME:
    case CommandKind.LAYER_ROTATE:
    case CommandKind.LAYER_VISIBILITY:
    case CommandKind.LAYER_ADD:
    case CommandKind.LAYER_REMOVE:
      return (CommandKind.LAYER_OPERATION);
    break;
    case CommandKind.DRAW:
    case CommandKind.ERASE:
    case CommandKind.FILL:
    case CommandKind.BACKGROUND:
    case CommandKind.PASTE:
    case CommandKind.CUT:
    case CommandKind.INSERT_IMAGE:
    case CommandKind.STROKE:
    case CommandKind.RECT_FILL:
    case CommandKind.RECT_STROKE:
    case CommandKind.ARC_FILL:
    case CommandKind.ARC_STROKE:
    case CommandKind.FLOOD_FILL:
    case CommandKind.LIGHTING:
      return (CommandKind.BATCH_OPERATION);
    break;
  };
  return (CommandKind.UNKNOWN);
};

/**
 * @param {Command} cmd
 * @param {Boolean} state
 */
export function fire(cmd, state) {
  const kind = this.getCommandKind(cmd);
  switch (kind) {
    case CommandKind.LAYER_OPERATION:
      this.fireLayerOperation(cmd, state);
    break;
    case CommandKind.BATCH_OPERATION:
      this.fireBatchOperation(cmd, state);
    break;
  };
};

/**
 * @param {Command} cmd
 * @param {Boolean} state
 */
export function fireLayerOperation(cmd, state) {
  const kind = cmd.kind;
  const batch = cmd.batch;
  const layer = batch.layer;
  switch (kind) {
    case CommandKind.LAYER_ADD:
      if (state) {
        layer.addUiReference();
        this.layers.push(layer);
        this.setActiveLayer(layer);
      } else {
        let index = layer.getIndex() - 1;
        index = index < 0 ? 0 : index;
        layer.removeUiReference();
        layer.removeFromLayers();
        const nlayer = this.getLayerByIndex(index);
        this.setActiveLayer(nlayer);
      }
    break;
    case CommandKind.LAYER_REMOVE:
      if (state) {
        let index = layer.getIndex() - 1;
        index = index < 0 ? 0 : index;
        layer.removeUiReference();
        layer.removeFromLayers();
        const nlayer = this.getLayerByIndex(index);
        this.setActiveLayer(nlayer);
      } else {
        layer.addUiReference();
        this.layers.push(layer);
        this.setActiveLayer(layer);
      }
    break;
    case CommandKind.LAYER_RENAME:
      layer.name = cmd.batch[state ? "name": "oname"];
    break;
    case CommandKind.LAYER_LOCK:
      layer.locked = !layer.locked;
    break;
    case CommandKind.LAYER_VISIBILITY:
      layer.visible = !layer.visible;
    break;
    case CommandKind.LAYER_MOVE:
      layer.updateBoundings();
      const dir = state ? 1 : -1;
      layer.x += (batch.position.x * dir);
      layer.y += (batch.position.y * dir);
    break;
  };
};

/**
 * @param {Command} cmd
 * @param {Boolean} state
 */
export function fireBatchOperation(cmd, state) {
  const batch = cmd.batch;
  const layer = batch.layer;
  const main = layer.batch;
  const kind = cmd.kind;
  layer.updateBoundings();
  main.injectMatrix(batch, state);
  main.refreshTexture(true);
};
