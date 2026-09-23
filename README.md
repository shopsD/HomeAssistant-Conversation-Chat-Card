# Conversation Chat Card
<img src="images/logo.png" alt="Conversation Chat Card" width="256">

A text chat card for Home Assistant dashboards. It can talk to any `conversation.*` entity in Home Assistant, or to an OpenAI-compatible Chat Completions endpoint. Replies are rendered as Markdown. The waiting indicator can be customised or hidden.

The card is a JavaScript module with a separate, locally hosted markdown-it dependency. Both files are included in the ZIP. There is no runtime request to a Markdown CDN and no need to install npm on Home Assistant. There is no microphone or speech output.

## Install
### HACS (Recommended)
1. Open HACS and add a custom repository 
```https://github.com/shopsD/HomeAssistant-Conversation-Chat-Card```
2. Set Type to `Dashboard` and click `Add`
3. Search for `Conversation Chat Card` and click install

### Manual
1. Copy **both** `conversation-chat-card.js` and `markdown-it.umd.min.js` from the ZIP into the **same directory** on your Home Assistant instance, such as `<config>/www/conversation-chat-card/`. Create `www` and restart Home Assistant if that directory did not already exist.
2. Go to **Settings → Dashboards → ⋮ → Resources** and add `/local/conversation-chat-card/conversation-chat-card.js` as a **JavaScript module**. You only add the card as a resource; it imports the renderer automatically.
3. Refresh the dashboard. Select **Conversation Chat Card** from the card picker and use the visual editor, or add a **Manual** card and paste one of the configurations below.


## Visual editor

The visual editor covers the backend, initial conversation entity, allowed agents, appearance, waiting indicator, button controls, Markdown images, persistence, Assist pipelines, and Chat Completions settings. It uses Home Assistant's native entity, icon, pipeline, toggle, and number controls. The entity selector chooses a `conversation.*` entity; the selector shown **inside the card** is controlled separately with `agent_picker`.

Structured options such as `pipelines`, `headers`, and `parameters` use small YAML object fields within the visual editor. You can also edit all settings in the card's YAML editor. Existing YAML configurations remain valid, including the older `persist_hours` name. The browser sends Chat Completions tokens directly to the endpoint; dashboard editors can inspect saved tokens even though the form masks the field.

## Home Assistant conversation agent

```yaml
type: custom:conversation-chat-card
entity: conversation.home_assistant
title: Assistant
placeholder: Type in your question here
welcome: Hello, how can I help?
```

Set `entity` to the conversation entity you want selected initially. The selector in the card lists available `conversation.*` entities by friendly name. Find entity IDs under **Developer Tools → States**.

To fix the card to one agent and hide the selector:

```yaml
type: custom:conversation-chat-card
entity: conversation.home_assistant
agent_picker: false
```

The card normally uses Home Assistant's `conversation/process` API. It displays waiting dots until the complete reply arrives. The `welcome` message is a fixed display message; it is not sent to the agent.

### Live progress through an Assist pipeline

For an agent that emits Assist progress events, associate its entity with a pipeline that uses that **same agent**:

```yaml
type: custom:conversation-chat-card
entity: conversation.home_assistant
pipelines:
  conversation.home_assistant: YOUR_PIPELINE_ID
```

The card runs only the pipeline's text `intent` stage. It displays any content or thinking deltas the agent emits and uses the final response when the pipeline finishes. Home Assistant does not promise deltas for every agent. A configured pipeline can still show only a working indicator followed by the complete answer.

For one fixed initial agent, `pipeline_id: YOUR_PIPELINE_ID` is also supported. `pipelines` is useful when the agent selector has several agents. Agents without a mapped pipeline use `conversation/process`.

## Chat Completions endpoint

```yaml
type: custom:conversation-chat-card
backend: chat_completions
url: https://example.internal/v1/chat/completions
model: your-model-name
token: YOUR_TOKEN
welcome: Hello, how can I help?
stream: true
```

`url` is the full Chat Completions URL. The card sends a Bearer token when `token` is set. It accepts server-sent streaming responses and ordinary JSON responses. The endpoint must allow requests from your Home Assistant dashboard's browser origin. You can set `headers`, `system_prompt`, and `parameters` for additional endpoint options.

This backend does **not** execute tool calls. If the model returns tool calls, the card shows an error. It does not gain access to Home Assistant entities merely by being displayed in a Home Assistant dashboard.

The request, including the configured token, is made in the browser. People who can inspect the dashboard can read that token. Use a token appropriate for the people who can access the dashboard. The token is not saved in the card's conversation storage.

## Conversation storage

Storage is off by default. Set `persist_minutes` to a positive number to save the transcript and conversation ID in the browser:

```yaml
type: custom:conversation-chat-card
entity: conversation.home_assistant
persist_minutes: 1440
storage_id: kitchen-tablet
```

The expiry period is measured from the last message activity. The card checks expiry when it loads and before sending another message; an expired conversation starts over. `0` disables storage; negative values are invalid. Older `persist_hours` configurations still work, but `persist_minutes` takes precedence if both are present. Turning persistence off does not erase history saved previously; **Clear chat** clears the visible conversation and removes its browser storage. Storage keys include the Home Assistant user, card `storage_id`, backend, and agent or endpoint. Set distinct `storage_id` values for separate cards that use the same agent on the same browser.

Saving a transcript restores what the card displays. Whether an old conversation ID still restores an agent's context depends on the agent.

## Header, buttons and waiting indicator

The header can be hidden altogether with `show_header: false`. That also hides its title, agent selector, **Remind agent**, and **Clear chat** buttons. **Clear chat** sits on the right and is shown by default. **Remind agent** sits near the title on the left and is hidden by default. You can show or hide either button separately.

Each button accepts a label, an HA icon name (`mdi:...`), and a display mode of `text`, `icon`, or `both`:

```yaml
type: custom:conversation-chat-card
entity: conversation.home_assistant
show_remind_button: true
remind_button_text: Catch up
remind_button_icon: mdi:history
remind_button_mode: both
clear_button_text: Clear
clear_button_icon: mdi:delete-outline
clear_button_mode: both
send_button_text: Send
send_button_icon: mdi:send
send_button_mode: icon
working_message: Thinking…
show_working_bubbles: false
```

Button labels also serve as accessible names in icon mode. With `working_message: ''` and `show_working_bubbles: false`, no waiting bubble appears until content arrives. By default, the card shows animated dots with no waiting text.

### Stop waiting

The optional **Stop** control appears in the footer only while a request is pending. It is shown by default and follows the same text/icon/both pattern:

```yaml
show_stop_button: true
stop_button_text: Stop
stop_button_icon: mdi:stop
stop_button_mode: both
```

Stopping immediately removes the waiting response, re-enables the input and prevents a late result from being added to the card. Chat Completions requests use `AbortController`; Assist pipeline subscriptions are unsubscribed; ordinary Home Assistant conversation requests cannot be cancelled once sent, so their eventual result is ignored. This does not guarantee that Home Assistant, the selected agent, an LLM backend or an MCP server stops its server-side work.

### Resetting context

**Clear chat** removes the visible transcript and browser storage and discards the Home Assistant `conversation_id`. The next message starts a new agent conversation.

For Home Assistant agents, an optional **Reset context** button can discard only the `conversation_id` while leaving the displayed and persisted transcript intact:

```yaml
show_reset_context_button: true
reset_context_button_text: Reset context
reset_context_button_icon: mdi:restart
reset_context_button_mode: both
```

Home Assistant has no generic conversation-context compaction operation. Reset context starts a fresh backend conversation; **Remind agent** can then deliberately send the retained transcript into it. Reset context is not shown for the Chat Completions backend because that backend resends the displayed messages with every request.

**Remind agent** sends a message beginning with `remind_prompt`, followed by the displayed conversation's user and assistant messages. It excludes the welcome message, thinking text, errors, and prior reminder requests. Its own chat bubble shows the button label, while the transcript sent to the agent contains the actual messages. This may repeat context the agent already has. With Chat Completions, earlier chat messages are already sent on every request; the reminder adds the transcript to that one request. A reminder can be sent once there is a completed message in the conversation.

## Markdown images

Markdown images are disabled by default. Local and remote images are controlled separately:

```yaml
type: custom:conversation-chat-card
entity: conversation.home_assistant
allow_local_images: true
allow_remote_images: true
image_url_allowlist:
  - "https://images.example.com/*"
  - "https://*.trusted.example/*"
  - "re:^https://cdn[0-9]+\\.example\\.net/"
```

`allow_local_images` permits relative, root-relative and absolute HTTP(S) image URLs whose origin exactly matches the Home Assistant dashboard origin. For example, `/local/example.png` serves `<config>/www/example.png`. It does not permit `file://` URLs.

Remote images require both `allow_remote_images: true` and at least one matching `image_url_allowlist` entry. Patterns are matched against the complete normalized URL. Ordinary entries are anchored globs where `*` matches any sequence and `?` matches one character. Entries beginning with `re:` are JavaScript regular expressions. An empty list denies all remote images; use `"*"` only if every HTTP(S) remote image should be allowed.

Only HTTP and HTTPS images are accepted. URLs containing embedded credentials and schemes such as `javascript:`, `file:`, `blob:` and `data:` are rejected. Rendered images use lazy loading and send no referrer. Raw Markdown HTML remains disabled.

## Options

| Option | Default | Description |
| --- | --- | --- |
| `backend` | `home_assistant` | `home_assistant` or `chat_completions`. |
| `entity` | First available agent | Initially selected `conversation.*` entity. |
| `agent_picker` | `true` | Show the agent selector for Home Assistant. |
| `agents` | All available | List of conversation entity IDs to offer in the selector. |
| `pipelines` | None | Map agent entity IDs to Assist pipeline IDs. |
| `pipeline_id` | None | Assist pipeline for the initial `entity`. |
| `title` | `Conversation` | Card heading. |
| `show_header` | `true` | Show the header and its controls. |
| `placeholder` | `Type a message…` | Text entry placeholder. |
| `welcome` | None | Fixed first assistant message, displayed but not submitted. |
| `height` | `440` | Card height in pixels; minimum 280. |
| `working_message` | Empty | Optional waiting text. |
| `show_working_bubbles` | `true` | Show animated waiting dots. |
| `show_stop_button` | `true` | Show Stop while a request is pending. |
| `stop_button_text`, `stop_button_icon`, `stop_button_mode` | `Stop`, `mdi:stop`, `text` | Stop button display. |
| `show_clear_button` | `true` | Show right-aligned Clear chat control when the header is visible. |
| `clear_button_text`, `clear_button_icon`, `clear_button_mode` | `Clear chat`, `mdi:delete-outline`, `text` | Clear chat button display. |
| `show_remind_button` | `false` | Show left-aligned Remind agent control when the header is visible. |
| `remind_button_text`, `remind_button_icon`, `remind_button_mode` | `Remind agent`, `mdi:refresh`, `text` | Remind agent button display. |
| `remind_prompt` | Built-in reminder instruction | Instruction before the transcript sent to the agent. |
| `show_reset_context_button` | `false` | Show Reset context for Home Assistant agents when the header is visible. |
| `reset_context_button_text`, `reset_context_button_icon`, `reset_context_button_mode` | `Reset context`, `mdi:restart`, `text` | Reset context button display. |
| `send_button_text`, `send_button_icon`, `send_button_mode` | `Send`, `mdi:send`, `text` | Send button display. Use `text`, `icon`, or `both` for button mode. |
| `show_thinking` | `true` | Show thinking supplied by the agent or endpoint. |
| `thinking_open` | `false` | Start the thinking section expanded. |
| `allow_local_images` | `false` | Allow HTTP(S) images from the Home Assistant origin. |
| `allow_remote_images` | `false` | Allow matching external HTTP(S) images. |
| `image_url_allowlist` | Empty | Full normalized remote URL glob patterns or `re:` regular expressions. |
| `persist_minutes` | `0` | Browser storage lifetime in minutes; `0` disables storage. |
| `storage_id` | `default` | Separates storage between card instances. |
| `url`, `model` | Required for Chat Completions | Full endpoint URL and model name. |
| `token`, `headers` | None | Chat Completions authorisation and additional HTTP headers. |
| `stream` | `true` | Request Chat Completions streaming. |
| `system_prompt` | None | System message for Chat Completions. |
| `parameters` | None | Extra Chat Completions request fields. |

Press **Enter** to send; use **Shift+Enter** for a new line. Markdown raw HTML is disabled, and images are disabled unless explicitly enabled by the image policy options. Thinking is shown only when the backend provides a thinking field or `<think>...</think>` content; the card does not generate it.

## Licence

The card is MIT licensed; see `LICENSE`. Its separately installed renderer is markdown-it, licensed under the MIT licence included as `markdown-it.LICENSE` in the ZIP.
