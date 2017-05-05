import Command from "./cmd";
import CommandKind from "./kind";

/**
 * @return {Void}
 */
export function redo() {
  // prevent undo/redo when in e.g drawing state
  if (this.isInActiveState()) return;
  if (this.sindex < this.stack.length - 1) {
    this.sindex++;
    const cmd = this.currentStackOperation();
    this.fire(cmd, true);
  }
  this.refreshUiLayers();
  this.updateGlobalBoundings();
  this.redraw = true;
  return;
};

/**
 * @param {Number} kind
 * @param {Batch} batch
 * @return {Void}
 */
export function enqueue(kind, batch) {
  // our stack index is out of position
  // => clean up all more recent batches
  this.refreshStack();
  const cmd = new Command(kind, batch);
  const type = this.getCommandKind(cmd);
  // free the texture from gpu, we dont need it anymore
  if (type === CommandKind.BATCH_OPERATION) {
    batch.destroyTexture();
  }
  const last = this.currentStackOperation();
  this.stack.push(cmd);
  this.redo();
  // delete last operation if it's mergable
  if (last !== null && last.kind === cmd.kind) {
    if (this.isMergeableOperation(cmd.kind)) {
      // delete last 2 commands
      this.stack.splice(this.sindex - 1, this.stack.length);
      this.sindex = this.stack.length - 1;
    }
  }
};
