import chat_css from './chat.css' with { type: 'css' };
import { ChatHistoryModal } from '../chat_history_modal.js';

/**
 * @function build_html
 * @description Builds raw HTML (often a pure function).
 * @param {Object} chat_threads_collection
 * @param {Object} opts
 * @returns {string}
 */
export function build_html(chat_threads_collection, opts = {}) {
  return `
    <div class="smart-chat-chat-container">
      <div class="smart-chat-top-bar-container">
        <input
          class="smart-chat-chat-name-input"
          type="text"
          value=""
          placeholder="Add name to save this chat"
        />
        <button title="New Chat" id="smart-chat-new-chat-button">
          ${this.get_icon_html('plus')}
        </button>
        <button title="Chat History" id="smart-chat-chat-history-button">
          ${this.get_icon_html('history')}
        </button>
        <button title="Chat Settings" id="smart-chat-chat-settings-button">
          ${this.get_icon_html('settings')}
        </button>
      </div>
      <div class="smart-chat-threads-container"></div>
      <div class="smart-chat-brand">
        ${this.get_icon_html('smart-chat')}
        <p>
          <a style="font-weight: 700;" href="https://smartconnections.app/">
            Smart Chat
          </a>
        </p>
      </div>
    </div>
  `;
}

/**
 * @function render
 * @description Builds and renders the component, then calls post_process.
 * @param {Object} chat_threads_collection
 * @param {Object} opts
 * @returns {Promise<DocumentFragment>}
 */
export async function render(chat_threads_collection, opts = {}) {
  const html = await build_html.call(this, chat_threads_collection, opts);
  const frag = this.create_doc_fragment(html);
  chat_threads_collection.container = frag.querySelector('.smart-chat-chat-container');
  this.apply_style_sheet(chat_css);
  post_process.call(this, chat_threads_collection, frag, opts);
  return frag;
}

/**
 * @function post_process
 * @description Attaches event listeners and calls thread.js for the active thread.
 * Also implements naming the chat thread by updating data.key.
 * @param {Object} chat_threads_collection
 * @param {DocumentFragment} frag
 * @param {Object} opts
 * @returns {Promise<DocumentFragment>}
 */
export async function post_process(chat_threads_collection, frag, opts = {}) {
  const env = chat_threads_collection.env;
  const threads_container = chat_threads_collection.container.querySelector('.smart-chat-threads-container');
  let active_thread = chat_threads_collection.active_thread;
  const plugin = env.smart_chat_plugin || env.smart_connections_plugin;

  // If no active thread, create a default new one
  if (!active_thread) {
    active_thread = await chat_threads_collection.create_or_update({
      key: 'Untitled Chat ' + Date.now()
    });
    chat_threads_collection.active_thread = active_thread;
  }

  // Render the active thread
  if (threads_container && active_thread) {
    const thread_frag = await env.render_component('thread', active_thread, opts);
    threads_container.appendChild(thread_frag);
  }

  // 1) Implement naming the chat thread + default timestamp
  const thread_name_input = frag.querySelector('.smart-chat-chat-name-input');
  if (thread_name_input) {
    // Show timestamp as a default if current key is empty
    // or if it starts with 'Untitled Chat ...'
    if (!active_thread.key || /^Untitled Chat \d+$/.test(active_thread.key)) {
      const ts = Date.now();
      active_thread.data.key = `Untitled Chat ${ts}`;
      // Make sure to re-set it in the collection
      chat_threads_collection.set(active_thread);
      thread_name_input.value = active_thread.key;
    } else {
      // Already has a custom key
      thread_name_input.value = active_thread.key;
    }

    // On blur or Enter -> rename the thread
    const renameHandler = (current_thread) => {
      const new_val = thread_name_input.value.trim();
      if (!new_val || new_val === current_thread.key) {
        return;
      }
      rename_thread(chat_threads_collection, current_thread, new_val);
      // Add animation to confirm rename
      thread_name_input.classList.add('smart-chat-name-saved');
      // Remove animation class after animation completes
      setTimeout(() => {
        thread_name_input.classList.remove('smart-chat-name-saved');
      }, 1000);
    };

    // Helper function to get current thread from event
    const get_current_thread_from_event = (e) => {
      const container = e.target.closest('.smart-chat-chat-container');
      const thread_key = container.querySelector('[data-thread-key]').dataset.threadKey;
      return chat_threads_collection.get(thread_key);
    };
    
    // Handle blur event
    thread_name_input.addEventListener('blur', (e) => {
      const current_thread = get_current_thread_from_event(e);
      renameHandler(current_thread);
    });
    
    // Handle Enter key press
    thread_name_input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const current_thread = get_current_thread_from_event(e);
        renameHandler(current_thread);
        // Remove focus to trigger blur
        thread_name_input.blur();
      }
    });
  }

  // 2) Handle "New Chat" button
  const new_chat_button = chat_threads_collection.container.querySelector('#smart-chat-new-chat-button');
  if (new_chat_button) {
    new_chat_button.addEventListener('click', async (e) => {
      e.preventDefault();

      const new_thread = await chat_threads_collection.create_or_update({
        key: 'Untitled Chat ' + Date.now()
      });

      chat_threads_collection.active_thread = new_thread;
      if (threads_container) {
        this.empty(threads_container);
      }
      const thread_frag = await env.render_component('thread', new_thread, opts);
      threads_container.appendChild(thread_frag);

      // Also set the top bar's name input
      if (thread_name_input) {
        thread_name_input.value = new_thread.key;
      }
    });
  }

  // 3) Handle "Chat Settings" button
  const chat_settings_button = chat_threads_collection.container.querySelector('#smart-chat-chat-settings-button');
  if (chat_settings_button) {
    chat_settings_button.addEventListener('click', async (e) => {
      e.preventDefault();
      open_plugin_settings(plugin.app);
    });
  }

  // 4) Handle "Chat History" button
  const chat_history_button = chat_threads_collection.container.querySelector('#smart-chat-chat-history-button');
  if (chat_history_button) {
    chat_history_button.addEventListener('click', async (e) => {
      e.preventDefault();
      const chat_history_modal = new ChatHistoryModal(plugin);
      chat_history_modal.open();
    });
  }

  return frag;
}

/**
 * Programmatically opens the settings pane for a community plugin in Obsidian.
 * @param {App} app - Obsidian App instance.
 * @returns {Promise<void>}
 */
export async function open_plugin_settings(app) {
  await app.setting.open();
  await app.setting.openTabById('smart-chat');
}

/**
 * Renames the thread (changes data.key), re-registers with the collection,
 * and updates the active_thread_key if needed.
 * @param {Object} collection
 * @param {Object} thread
 * @param {string} new_key
 */
function rename_thread(collection, thread, new_key) {
  const old_key = thread.key;
  // Remove old key from items
  delete collection.items[old_key];

  thread.data.key = new_key;
  // Re-register
  collection.set(thread);

  // If this was the active thread, update the setting
  if (collection.settings.active_thread_key === old_key) {
    collection.settings.active_thread_key = new_key;
  }

  // Mark for save
  thread.queue_save();
  collection.process_save_queue();
}
