import { Plugin, Notice, addIcon } from "obsidian";
import { SmartEnv } from "obsidian-smart-env";
import { merge_env_config } from "obsidian-smart-env";
import { smart_env_config as smart_context_env_config } from "smart-context-obsidian/smart_env.config.js";
// // chat model
// import { SmartChatModel } from "smart-chat-model";
// import {
//   SmartChatModelAnthropicAdapter,
//   SmartChatModelAzureAdapter,
//   // SmartChatModelCohereAdapter,
//   SmartChatModelCustomAdapter,
//   SmartChatModelGeminiAdapter,
//   SmartChatModelGroqAdapter,
//   SmartChatModelLmStudioAdapter,
//   SmartChatModelOllamaAdapter,
//   SmartChatModelOpenaiAdapter,
//   SmartChatModelOpenRouterAdapter,
// } from "smart-chat-model/adapters.js";
// import { SmartHttpRequest, SmartHttpObsidianRequestAdapter } from "smart-http-request";
// import { requestUrl } from "obsidian";

import { smart_env_config } from "./smart_env.config.js";

import {SmartChatView} from "./src/smart_chat.obsidian.js";
import { SmartChatSettingTab } from "./src/settings_tab.js";

export default class SmartChatPlugin extends Plugin {
  compiled_smart_env_config = smart_env_config;
  /**
   * Example environment config. Adjust to your needs.
   * @type {Object}
   */
  smart_env_config = {
    collections: {
      // smart_sources: {
      //   process_embed_queue: true,
      // }
    },
    modules: {
      // smart_chat_model: {
      //   class: SmartChatModel,
      //   // DEPRECATED FORMAT: will be changed (requires SmartModel adapters getters update)
      //   adapters: {
      //     anthropic: SmartChatModelAnthropicAdapter,
      //     azure: SmartChatModelAzureAdapter,
      //     custom: SmartChatModelCustomAdapter,
      //     gemini: SmartChatModelGeminiAdapter,
      //     groq: SmartChatModelGroqAdapter,
      //     lm_studio: SmartChatModelLmStudioAdapter,
      //     ollama: SmartChatModelOllamaAdapter,
      //     open_router: SmartChatModelOpenRouterAdapter,
      //     openai: SmartChatModelOpenaiAdapter,
      //   },
      //   http_adapter: new SmartHttpRequest({
      //     adapter: SmartHttpObsidianRequestAdapter,
      //     obsidian_request_url: requestUrl,
      //   }),
      // },
    },
  };

  onload() {
    const merged_config = merge_env_config(this.compiled_smart_env_config, this.smart_env_config);
    merge_env_config(merged_config, smart_context_env_config);
    SmartEnv.create(this, merged_config);
    this.app.workspace.onLayoutReady(this.initialize.bind(this));
  }

  async initialize() {
    console.log("Loading Smart Chat plugin...");
    await SmartEnv.wait_for({ loaded: true });
    SmartChatView.register_view(this);
    this.addSettingTab(new SmartChatSettingTab(this.app, this));
  }

  onunload() {
    console.log("Unloading Smart Chat plugin...");
    this.env?.unload_main?.(this);
  }


}

export {SmartChatPlugin};