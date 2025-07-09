import { CollectionItem } from 'smart-collections';
import { add_thread_item, list_thread_items } from '../utils/add_thread_item.js';
import { contains_self_referential_keywords } from '../utils/self_referential_keywords.js';
import { replace_folder_tree_var } from 'smart-context-obsidian/src/utils/replace_folder_tree_var.js';

/**
 * @class SmartChatThread
 * @extends CollectionItem
 * @description Represents a single chat thread with multiple completions.
 */
export class SmartChatThread extends CollectionItem {
  static get defaults() {
    return {
      data: {
        system_prompt: '',
        items: {}
      }
    };
  }

  get_key() {
    return this.data.key || (this.data.key = Date.now().toString());
  }

  get chat_model() {
    return this.collection.chat_model;
  }

  new_completion(opts = {}) {
    const completion_opts = {
      key: `${this.key}-${Date.now()}`,
      thread_key: this.key,
      stream: this.collection.settings.stream,
      ...opts
    };

    if (this.has_default_system_prompt && !this.completions[0]?.data?.system_message) {
      completion_opts.system_message = this.get_system_prompt(completion_opts);
    }

    const completion = new this.env.smart_completions.item_type(this.env, completion_opts);
    this.env.smart_completions.set(completion);
    completion.chat_model = this.chat_model;
    add_thread_item(this, completion.key);
    this.current_completion = completion;

    if (this.message_container) {
      completion.env.render_component('completion', completion).then(container => {
        this.message_container.appendChild(container);
      });
    }

    this.queue_save();
    this.collection.process_save_queue();
    return completion;
  }

  /**
   * Updates the context for the current completion.
   * @param {object|null} context
   */
  update_current_context(context, opts = {}) {
    if (!this.current_completion) {
      this.new_completion();
    }

    const comp = this.current_completion;

    comp.data.context_key = context.key;
  }

  async update_current_completion(data = {}) {
    if (!this.current_completion) return;
    this.current_completion.data = { ...this.current_completion.data, ...data };
    await this.current_completion.env.render_component('completion', this.current_completion);
  }

  get current_completion() {
    if (this._current_completion && this._current_completion.data.completion.responses.length !== 0) {
      this._current_completion = null;
    }
    return this._current_completion;
  }
  set current_completion(completion) {
    this._current_completion = completion;
  }

  get last_completion() {
    return this.completions[this.completions.length - 2];
  }

  get completion_keys() {
    return list_thread_items(this);
  }
  get completions() {
    return this.completion_keys.map(key => this.env.smart_completions.get(key)).filter(Boolean);
  }

  get has_default_system_prompt() {
    return this.settings.system_prompt.trim().length > 0;
  }

  /**
   * Build system-prompt text, expanding {{folder_tree}} if present.
   * @param {object} [opts={}]  optional { system_message }
   * @returns {string}
   */
  get_system_prompt(opts = {}) {
    let prompt = this.settings.system_prompt || '';
    if (opts.system_message) {
      prompt = prompt
        ? `${prompt}\n\n${opts.system_message}`
        : opts.system_message;
    }

    // If the prompt contains {{folder_tree}}, replace it with the folder tree string.
    if (prompt.includes('{{folder_tree}}')) {
      prompt = replace_folder_tree_var(prompt);
    }

    return prompt;
  }


  get messages() {
    return this.completions.map(completion => completion.messages).flat();
  }

  /**
   * Checks if the user_message contains self-referential pronouns
   * (only if user enabled the detection in settings).
   * @param {string} user_message 
   * @returns {boolean} 
   */
  has_self_referential_pronoun(user_message) {
    if (!user_message) return false;
    if (!this.collection.settings.detect_self_referential) return false;
    const lang = this.collection.settings.language || 'en';
    return contains_self_referential_keywords(user_message, lang);
  }
}