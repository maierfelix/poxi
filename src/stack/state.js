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
 * @return {Command}
 */
export function currentStackOperation() {
  return (this.stack[this.sindex] || null);
};

/**
 * Indicates if an operation is mergeable
 * with an older same kind but opposite operation
 * @param {Number} kind
 * @return {Boolean}
 */
export function isMergeableOperation(kind) {
  return (
    kind === CommandKind.LAYER_LOCK ||
    kind === CommandKind.LAYER_FLIP_VERTICAL ||
    kind === CommandKind.LAYER_FLIP_HORIZONTAL ||
    kind === CommandKind.LAYER_VISIBILITY
  );
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
    case CommandKind.CONTAINER_OPERATION:
      this.fireContainerOperation(cmd, state);
    break;
  };
};

/**
 * @param {Command} cmd
 * @param {Boolean} state
 */
export function fireContainerOperation(cmd, state) {
  const batch = cmd.batch;
  const container = batch.container;
  if (state) {
    this.containers.push(container);
  } else {
    for (let ii = 0; ii < this.containers.length; ++ii) {
      if (this.containers[ii].id === container.id) {
        this.containers.splice(ii, 1);
        break;
      }
    };
  }
};

/**
 * @param {Command} cmd
 * @param {Boolean} state
 */
export function fireLayerOperation(cmd, state) {
  const kind = cmd.kind;
  const batch = cmd.batch;
  const layer = batch.layer;
  const main = layer.batch;
  switch (kind) {
    case CommandKind.LAYER_MERGE:
      layer.updateBoundings();
      const data = cmd.batch.data;
      if (state) {
        layer.removeUiReference();
        this.layers.splice(batch.index, 1);
        let index = batch.index < 0 ? 0 : batch.index;
        index = index === this.layers.length ? index - 1 : index;
        const merge = this.getLayerByIndex(index);
        this.setActiveLayer(merge);
        merge.updateBoundings();
        merge.batch.injectMatrix(data, true);
        merge.batch.refreshTexture(true);
      } else {
        const merge = this.getLayerByIndex(batch.index);
        this.layers.splice(batch.index, 0, layer);
        layer.addUiReference();
        this.setActiveLayer(layer);
        merge.batch.injectMatrix(data, false);
        merge.batch.refreshTexture(true);
      }
    break;
    case CommandKind.LAYER_CLONE:
    case CommandKind.LAYER_CLONE_REF:
    case CommandKind.LAYER_ADD:
      if (state) {
        this.layers.splice(batch.index, 0, layer);
        layer.addUiReference();
        this.setActiveLayer(layer);
      } else {
        layer.removeUiReference();
        this.layers.splice(batch.index, 1);
        const index = batch.index < 0 ? 0 : batch.index;
        this.setActiveLayer(this.getLayerByIndex(index));
      }
    break;
    case CommandKind.LAYER_REMOVE:
      if (!state) {
        this.layers.splice(batch.index, 0, layer);
        layer.addUiReference();
        this.setActiveLayer(layer);
      } else {
        layer.removeUiReference();
        this.layers.splice(batch.index, 1);
        let index = batch.index < 0 ? 0 : batch.index;
        index = index === this.layers.length ? index - 1 : index;
        this.setActiveLayer(this.getLayerByIndex(index));
      }
    break;
    case CommandKind.LAYER_RENAME:
      layer.name = batch[state ? "name": "oname"];
    break;
    case CommandKind.LAYER_LOCK:
      layer.locked = !layer.locked;
    break;
    case CommandKind.LAYER_VISIBILITY:
      layer.visible = !layer.visible;
    break;
    case CommandKind.LAYER_OPACITY:
      layer.opacity = batch[state ? "opacity" : "oopacity"];
    break;
    case CommandKind.LAYER_ORDER:
      if (state) {
        const tmp = this.layers[batch.oindex];
        this.layers[batch.oindex] = this.layers[batch.index];
        this.layers[batch.index] = tmp;
        tmp.removeUiReference(); tmp.addUiReference();
        this.setActiveLayer(tmp);
      } else {
        const tmp = this.layers[batch.index];
        this.layers[batch.index] = this.layers[batch.oindex];
        this.layers[batch.oindex] = tmp;
        tmp.removeUiReference(); tmp.addUiReference();
        this.setActiveLayer(tmp);
      }
    break;
    case CommandKind.LAYER_MOVE:
      layer.updateBoundings();
      const dir = state ? 1 : -1;
      layer.x += (batch.position.x * dir);
      layer.y += (batch.position.y * dir);
    break;
    case CommandKind.LAYER_FLIP_VERTICAL:
      this.flipVertically(layer);
    break;
    case CommandKind.LAYER_FLIP_HORIZONTAL:
      this.flipHorizontally(layer);
    break;
    case CommandKind.LAYER_ROTATE_LEFT:
      if (state) this.rotateLeft(layer);
      else this.rotateRight(layer);
    break;
    case CommandKind.LAYER_ROTATE_RIGHT:
      if (state) this.rotateRight(layer);
      else this.rotateLeft(layer);
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

/**
 * @param {Command} cmd
 * @return {Number}
 */
export function getCommandKind(cmd) {
  const kind = cmd.kind;
  switch (kind) {
    case CommandKind.LAYER_LOCK:
    case CommandKind.LAYER_MOVE:
    case CommandKind.LAYER_ORDER:
    case CommandKind.LAYER_RENAME:
    case CommandKind.LAYER_ROTATE_LEFT:
    case CommandKind.LAYER_ROTATE_RIGHT:
    case CommandKind.LAYER_VISIBILITY:
    case CommandKind.LAYER_OPACITY:
    case CommandKind.LAYER_ADD:
    case CommandKind.LAYER_REMOVE:
    case CommandKind.LAYER_MERGE:
    case CommandKind.LAYER_CLONE:
    case CommandKind.LAYER_CLONE_REF:
    case CommandKind.LAYER_FLIP_VERTICAL:
    case CommandKind.LAYER_FLIP_HORIZONTAL:
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
    case CommandKind.CONTAINER_ADD:
    case CommandKind.CONTAINER_REMOVE:
      return (CommandKind.CONTAINER_OPERATION);
    break;
  };
  return (CommandKind.UNKNOWN);
};
