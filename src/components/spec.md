## Components API

### chat_context_builder.js

| Function | Description |
| --- | --- |
| `render(ctx, opts)` | Renders a context builder element derived from `smart-context-obsidian`. Adds chat controls like **Edit** and **Send** when supplied a `completion`. |
| `post_process(ctx, container, opts)` | Attaches chat-specific behaviour to the builder element. |

```mermaid
flowchart TD
  A[completion] --> B{chat_context_builder}
  B --> C[Edit]
  B --> D[Send]
  C -->|opens| E(Context Selector Modal)
  D -->|updates| F(thread)
```

### chat.js

| Function | Description |
| --- | --- |
| `rename_thread(collection, thread, new_name)` | Stores a friendly name in `data.name` and queues a save. |
