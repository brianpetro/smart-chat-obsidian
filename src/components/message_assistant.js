import { MarkdownRenderer, Component, Notice } from 'obsidian';

/**
 * @function build_html
 * @description Builds raw HTML for an assistant message, now including a copy button.
 * @param {Object} completion
 * @param {Object} opts
 * @returns {string}
 */
export async function build_html(completion, opts = {}) {
  const text = completion.response_text || '';
  // We introduce a small .smart-chat-message-actions area with a copy button
  return `
    <div class="smart-chat-message assistant">
      <div class="smart-chat-message-content"></div>
      <div class="smart-chat-message-actions">
        <span 
          class="smart-chat-message-copy-button" 
          title="Copy raw markdown"
          aria-label="Copy raw markdown to clipboard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 17L8 5C8 3.89543 8.89543 3 10 3H18C19.1046 3 20 3.89543 20 5V17"
              stroke="currentColor" />
            <rect x="4" y="7" width="14" height="14" rx="2" stroke="currentColor" />
          </svg>
        </span>
      </div>
    </div>
  `;
}

/**
 * @function render
 * @description Builds and renders the component, then calls post_process.
 * @param {Object} completion
 * @param {Object} opts
 * @returns {Promise<DocumentFragment>}
 */
export async function render(completion, opts = {}) {
  const html = await build_html.call(this, completion, opts);
  const frag = this.create_doc_fragment(html);
  if(opts.await_post_process) await post_process.call(this, completion, frag, opts);
  else post_process.call(this, completion, frag, opts);
  return frag;
}

/**
 * @function post_process
 * @description
 *  - Renders the final assistant Markdown into .smart-chat-message-content
 *  - Wires up the copy button to copy raw markdown from `completion.response_text`
 * @param {Object} completion
 * @param {DocumentFragment} frag
 * @param {Object} opts
 * @returns {Promise<DocumentFragment>}
 */
export async function post_process(completion, frag, opts = {}) {
  const content = frag.querySelector('.smart-chat-message-content');
  const copyButton = frag.querySelector('.smart-chat-message-copy-button');

  // Render the assistant's response as Obsidian-flavored Markdown
  this.empty(content);
  const plugin = completion.env.smart_chat_plugin || completion.env.smart_connections_plugin;
  await MarkdownRenderer.render(
    plugin.app, 
    completion.response_text,
    content,
    '',
    new Component()
  );

  // Copy raw markdown (un-rendered) on button click
  copyButton?.addEventListener('click', async () => {
    try {
      if (!navigator?.clipboard?.writeText) {
        console.warn('Clipboard API not available.');
        return;
      }
      await navigator.clipboard.writeText(completion.response_text || '');
      new Notice('Copied to clipboard');
    } catch (err) {
      console.error('Failed to copy raw markdown:', err);
    }
  });

  return frag;
}
