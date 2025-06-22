import { SmartActions as SmartActionsBase } from 'smart-actions';
import ajson_single_file_data_adapter from 'smart-collections/adapters/ajson_single_file.js';
import * as lookup_context from '../actions/lookup_context.js';
import { SmartActionAdapter } from 'smart-actions/adapters/_adapter.js';
import { SmartAction } from '../items/smart_action.js';

export class SmartActions extends SmartActionsBase {
  async init() {
    Object.entries(this.opts.default_actions).forEach(async ([action_key, module]) => {
      await this.register_included_module(action_key, module);
    });
    // // should this be handled by loading collection item data?
    // if(await this.env.data_fs.exists('actions')){
    //   const custom_actions = await this.env.data_fs.list_files('actions');
    //   custom_actions.forEach(async (action_file) => {
    //     await this.register_mjs_action(this.env.data_fs.get_full_path(action_file.path));
    //   });
    // }

    // const custom_action_files = Object.entries(this.settings.custom_action_files || {}).filter(([action_key, file_path]) => file_path);
    // for(const [action_key, file_path] of custom_action_files){
    //   await this.register_mjs_action(file_path);
    // }
  }
}

export default {
  class: SmartActions,
  item_type: SmartAction,
  data_adapter: ajson_single_file_data_adapter,
  action_adapters: {
    default: SmartActionAdapter,
  },
  default_actions: {
    lookup_context,
  }
};