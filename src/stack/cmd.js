/**
 * @class Command
 */
class Command {
  /**
   * @param {Number} kind
   * @param {Batch} batch
   * @constructor
   */
  constructor(kind, batch) {
    this.kind = 0;
    this.batch = batch;
  }
};

export default Command;
