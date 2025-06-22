import { SmartAction as SmartActionBase } from "smart-actions";
import { SmartActionAdapter } from "smart-actions/adapters/_adapter.js";

export class SmartAction extends SmartActionBase {
  get adapters() { return {
    default: SmartActionAdapter,
  } }
  async init() {
    if(!this.action_adapter) {
      delete this.collection.items[this.key];
      return;
    }
    await this.action_adapter.load();
  }
  async run_action(params = {}) {
    params = await this.pre_process(params);
    let result = await this.action_adapter.run(params);
    result = await this.post_process(params, result);
    return result;
  }
}
