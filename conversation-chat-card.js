/* Conversation Chat Card 2.0.0 — Home Assistant dashboard module. MIT. Requires markdown-it.umd.min.js in the same directory. */
/* Conversation Chat Card. MIT. Install markdown-it.umd.min.js alongside this module. */
import './markdown-it.umd.min.js';
(() => {
  'use strict';
  const TAG = 'conversation-chat-card';
  if (customElements.get(TAG)) return;
  const markdown = globalThis.markdownit({ html: false, linkify: true, breaks: true });
  markdown.disable('image'); // Do not fetch URLs supplied in model responses.
  const defaultLink = markdown.renderer.rules.link_open || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
  markdown.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    tokens[idx].attrSet('target', '_blank');
    tokens[idx].attrSet('rel', 'noopener noreferrer');
    return defaultLink(tokens, idx, options, env, self);
  };
  const css = `
    :host { display:block; height:100%; min-height:280px; color:var(--primary-text-color); font-family:var(--paper-font-body1_-_font-family,inherit) }
    ha-card { display:flex; flex-direction:column; height:100%; min-height:280px; overflow:hidden; background:var(--ha-card-background,var(--card-background-color,#fff)) }
    .head { display:flex; flex-wrap:wrap; gap:8px; align-items:center; padding:12px 14px; border-bottom:1px solid var(--divider-color,#ddd) }
    .title { font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
    select { min-width:100px; flex:1; border:1px solid var(--divider-color,#ddd); border-radius:7px; background:var(--card-background-color,#fff); color:var(--primary-text-color); padding:7px }
    button { cursor:pointer; font:inherit } button:disabled { opacity:.55; cursor:default }
    .clear, .remind { display:inline-flex; align-items:center; justify-content:center; gap:5px; background:none; border:0; padding:6px 8px; border-radius:7px; white-space:nowrap }
    .clear { margin-left:auto; color:var(--error-color,#b00020) }
    .clear:hover { background:var(--error-background-color,rgba(176,0,32,.12)) }
    .remind { color:var(--primary-text-color) }
    .remind:hover { background:var(--secondary-background-color,#eee) }
    .clear ha-icon, .remind ha-icon, .send ha-icon { --mdc-icon-size:20px; width:20px; height:20px }
    .log { flex:1; min-height:0; overflow:auto; display:flex; flex-direction:column; gap:12px; padding:14px; scroll-behavior:smooth }
    .bubble { max-width:min(90%,800px); min-width:0; box-sizing:border-box; border-radius:13px; padding:9px 13px; overflow-wrap:anywhere; line-height:1.45 }
    .user { align-self:flex-end; background:var(--primary-color,#03a9f4); color:var(--text-primary-color,#fff); white-space:pre-wrap }
    .assistant { align-self:flex-start; background:var(--secondary-background-color,#eee) }
    .error { align-self:flex-start; color:var(--error-color,#b00020); background:var(--secondary-background-color,#eee) }
    .md > :first-child { margin-top:0 } .md > :last-child { margin-bottom:0 }
    .md p { margin:.5em 0 } .md pre { overflow:auto; padding:10px; border-radius:7px; background:var(--code-editor-background-color,rgba(128,128,128,.14)) }
    .md code { font-family:monospace } .md :not(pre)>code { background:rgba(128,128,128,.14); border-radius:3px; padding:1px 3px }
    .md table { border-collapse:collapse; display:block; overflow:auto } .md th,.md td { border:1px solid var(--divider-color,#aaa); padding:4px 8px }
    .md blockquote { margin:8px 0; padding-left:10px; border-left:3px solid var(--primary-color,#03a9f4) }
    .md a { color:var(--primary-color,#03a9f4) }
    details { margin-bottom:8px; border-left:2px solid var(--divider-color,#aaa); padding-left:9px; color:var(--secondary-text-color,#666) }
    summary { cursor:pointer; user-select:none; font-size:.87em } details .md { padding-top:6px; font-size:.94em }
    .status { display:flex; align-items:center; gap:8px; color:var(--secondary-text-color,#666); font-size:.84em; margin-bottom:5px }
    .dots { display:inline-flex; gap:3px } .dots i { width:5px; height:5px; background:currentColor; border-radius:50%; animation:cc-pulse 1.2s infinite ease-in-out }
    .dots i:nth-child(2) { animation-delay:.16s } .dots i:nth-child(3) { animation-delay:.32s }
    @keyframes cc-pulse { 0%,65%,100% { opacity:.3; transform:scale(.8) } 30% { opacity:1; transform:scale(1.15) } }
    .foot { display:flex; gap:8px; align-items:flex-end; padding:10px 12px; border-top:1px solid var(--divider-color,#ddd) }
    textarea { flex:1; min-width:0; max-height:140px; resize:vertical; box-sizing:border-box; border:1px solid var(--divider-color,#bbb); border-radius:10px; background:var(--card-background-color,#fff); color:var(--primary-text-color); font:inherit; padding:9px; line-height:1.4 }
    .send { display:inline-flex; align-items:center; justify-content:center; gap:5px; background:var(--primary-color,#03a9f4); border:0; border-radius:9px; color:var(--text-primary-color,#fff); padding:10px 13px; min-height:40px }
    .hint { color:var(--secondary-text-color,#666); text-align:center; margin:auto; padding:16px }
  `;
  const safe = value => String(value ?? '');
  const normalized = value => safe(value).trim();
  const unique = values => [...new Set(values.filter(Boolean))];
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const button = (className, label, icon, mode) => {
    const el = document.createElement('button'); el.type = 'button'; el.className = className;
    el.setAttribute('aria-label', safe(label));
    if (mode === 'icon' || mode === 'both') {
      const glyph = document.createElement('ha-icon'); glyph.setAttribute('icon', safe(icon)); glyph.setAttribute('aria-hidden', 'true'); el.append(glyph);
    }
    if (mode !== 'icon') { const span = document.createElement('span'); span.textContent = safe(label); el.append(span); }
    return el;
  };

  class ConversationChatCard extends HTMLElement {
    static getStubConfig() { return { backend: 'home_assistant', agent_picker: true, show_header: true, show_clear_button: true, show_working_bubbles: true, show_thinking: true, send_button_mode: 'text', clear_button_mode: 'text', remind_button_mode: 'text' }; }
    static getConfigForm() {
      const text = name => ({ name, selector: { text: {} } });
      const multiline = name => ({ name, selector: { text: { multiline: true } } });
      const toggle = name => ({ name, selector: { boolean: {} } });
      const icon = name => ({ name, selector: { icon: {} } });
      const mode = name => ({ name, selector: { select: { options: ['text', 'icon', 'both'], mode: 'dropdown' } } });
      const group = (name, title, schema) => ({ type: 'expandable', name, title, flatten: true, schema });
      return {
        schema: [
          { name: 'backend', selector: { select: { options: [{ value: 'home_assistant', label: 'Home Assistant' }, { value: 'chat_completions', label: 'Chat Completions' }], mode: 'dropdown' } } },
          { name: 'entity', selector: { entity: { domain: 'conversation' } } },
          { name: 'agent_picker', selector: { boolean: {} } },
          { name: 'agents', selector: { entity: { domain: 'conversation', multiple: true } } },
          group('appearance', 'Appearance', [text('title'), text('placeholder'), multiline('welcome'), { name: 'height', selector: { number: { min: 280, mode: 'box', unit_of_measurement: 'px' } } }, toggle('show_header'), toggle('show_thinking'), toggle('thinking_open')]),
          group('waiting', 'While waiting', [text('working_message'), toggle('show_working_bubbles')]),
          group('send_button', 'Send button', [text('send_button_text'), icon('send_button_icon'), mode('send_button_mode')]),
          group('clear_button', 'Clear chat button', [toggle('show_clear_button'), text('clear_button_text'), icon('clear_button_icon'), mode('clear_button_mode')]),
          group('remind_button', 'Remind agent button', [toggle('show_remind_button'), text('remind_button_text'), icon('remind_button_icon'), mode('remind_button_mode'), multiline('remind_prompt')]),
          group('storage', 'Conversation storage', [{ name: 'persist_minutes', selector: { number: { min: 0, mode: 'box', step: 'any', unit_of_measurement: 'min' } } }, text('storage_id')]),
          group('assist', 'Assist streaming', [{ name: 'pipeline_id', selector: { assist_pipeline: {} } }, { name: 'pipelines', selector: { object: {} } }]),
          group('completions', 'Chat Completions', [text('url'), text('model'), { name: 'token', selector: { text: { type: 'password' } } }, toggle('stream'), multiline('system_prompt'), { name: 'headers', selector: { object: {} } }, { name: 'parameters', selector: { object: {} } }]),
        ],
        computeLabel: field => ({ backend: 'Backend', entity: 'Conversation agent', agent_picker: 'Show agent picker', agents: 'Allowed agents', title: 'Title', placeholder: 'Input placeholder', welcome: 'Welcome message', height: 'Card height', show_header: 'Show header', show_thinking: 'Show thinking', thinking_open: 'Expand thinking by default', working_message: 'Waiting message', show_working_bubbles: 'Show waiting dots', show_clear_button: 'Show Clear chat', show_remind_button: 'Show Remind agent', clear_button_text: 'Button text', remind_button_text: 'Button text', send_button_text: 'Button text', clear_button_icon: 'Icon', remind_button_icon: 'Icon', send_button_icon: 'Icon', clear_button_mode: 'Display', remind_button_mode: 'Display', send_button_mode: 'Display', remind_prompt: 'Reminder instruction', persist_minutes: 'Keep chat for (minutes)', storage_id: 'Storage ID', pipeline_id: 'Assist pipeline (same agent)', pipelines: 'Pipeline per agent', url: 'Endpoint URL', model: 'Model', token: 'Bearer token', stream: 'Stream response', system_prompt: 'System prompt', headers: 'Additional headers', parameters: 'Additional request parameters' })[field.name],
        computeHelper: field => ({ entity: 'Pick the initial conversation agent. Leave blank to use the first available.', agents: 'Leave blank to show all agents.', persist_minutes: '0 disables storage. Existing persist_hours YAML is still accepted.', pipeline_id: 'Choose a pipeline configured for the selected conversation agent.', pipelines: 'Map conversation entity IDs to Assist pipeline IDs (YAML object).', token: 'Stored in the dashboard configuration and sent directly by your browser.', remind_prompt: 'Sent before the transcript when you press Remind agent.' })[field.name],
      };
    }
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._cfg = null;
      this._hass = null;
      this._messages = [];
      this._conversationId = null;
      this._busy = false;
      this._agent = '';
      this._loadedKey = '';
      this._persistedBefore = false;
      this._generation = 0;
    }
    setConfig(config) {
      if (!config || (config.backend && !['home_assistant', 'chat_completions'].includes(config.backend))) throw new Error('backend must be home_assistant or chat_completions');
      if (config.backend === 'chat_completions' && (!config.url || !config.model)) throw new Error('Chat Completions requires url and model');
      const minutes = config.persist_minutes ?? (config.persist_hours == null ? 0 : Number(config.persist_hours) * 60);
      if (!Number.isFinite(Number(minutes)) || Number(minutes) < 0) throw new Error('persist_minutes must be >= 0');
      for (const name of ['clear_button_mode', 'remind_button_mode', 'send_button_mode']) {
        if (config[name] != null && !['text', 'icon', 'both'].includes(config[name])) throw new Error(`${name} must be text, icon or both`);
      }
      this._cfg = { backend: 'home_assistant', title: 'Conversation', stream: true, show_working_bubbles: true, show_header: true, show_clear_button: true, show_remind_button: false, clear_button_text: 'Clear chat', clear_button_icon: 'mdi:delete-outline', clear_button_mode: 'text', remind_button_text: 'Remind agent', remind_button_icon: 'mdi:refresh', remind_button_mode: 'text', send_button_text: 'Send', send_button_icon: 'mdi:send', send_button_mode: 'text', working_message: '', ...config, persist_minutes: Number(minutes) };
      const first = this._cfg.entity || '';
      if (!this._agent || this._cfg.agent_picker === false) this._agent = first;
      this._loadedKey = '';
      this._persistedBefore = false;
      this._mount();
    }
    set hass(value) {
      this._hass = value;
      if (!this._cfg) return;
      this._updateAgentOptions();
      this._loadIfNeeded();
    }
    getCardSize() { return Math.ceil((Number(this._cfg?.height) || 440) / 50); }
    connectedCallback() { if (this._cfg && !this._log) this._mount(); }
    _mount() {
      if (!this._cfg) return;
      this.shadowRoot.replaceChildren();
      const style = document.createElement('style'); style.textContent = css;
      const card = document.createElement('ha-card');
      card.style.height = this._cfg.height ? `${Math.max(280, Number(this._cfg.height) || 440)}px` : '440px';
      const head = document.createElement('div'); head.className = 'head';
      if (this._cfg.show_header !== false) {
      const title = document.createElement('span'); title.className = 'title'; title.textContent = safe(this._cfg.title); head.append(title);
      if (this._cfg.show_remind_button === true) {
        this._remindButton = button('remind', this._cfg.remind_button_text, this._cfg.remind_button_icon, this._cfg.remind_button_mode);
        this._remindButton.addEventListener('click', () => this._remind()); head.append(this._remindButton);
      } else this._remindButton = null;
      if (this._cfg.backend === 'home_assistant' && this._cfg.agent_picker !== false) {
        this._select = document.createElement('select'); this._select.setAttribute('aria-label', 'Conversation agent');
        this._select.addEventListener('change', () => this._switchAgent(this._select.value)); head.append(this._select);
      } else this._select = null;
      if (this._cfg.show_clear_button !== false) {
        this._clearButton = button('clear', this._cfg.clear_button_text, this._cfg.clear_button_icon, this._cfg.clear_button_mode);
        this._clearButton.addEventListener('click', () => { if (!this._busy) this._newChat(); }); head.append(this._clearButton);
      } else this._clearButton = null;
      } else { this._select = null; this._clearButton = null; this._remindButton = null; }
      this._log = document.createElement('div'); this._log.className = 'log'; this._log.setAttribute('role', 'log'); this._log.setAttribute('aria-live', 'polite');
      const foot = document.createElement('div'); foot.className = 'foot';
      this._input = document.createElement('textarea'); this._input.rows = 1; this._input.placeholder = safe(this._cfg.placeholder || 'Type a message…'); this._input.setAttribute('aria-label', 'Message');
      this._input.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); this._send(); } });
      const send = button('send', this._cfg.send_button_text, this._cfg.send_button_icon, this._cfg.send_button_mode);
      send.addEventListener('click', () => this._send()); this._sendButton = send;
      foot.append(this._input, send); if (this._cfg.show_header !== false) card.append(head); card.append(this._log, foot); this.shadowRoot.append(style, card);
      this._updateAgentOptions(); this._render(); this._loadIfNeeded();
    }
    _agents() {
      if (!this._hass) return [];
      const allowed = Array.isArray(this._cfg.agents) ? this._cfg.agents : null;
      return Object.keys(this._hass.states || {}).filter(id => id.startsWith('conversation.') && (!allowed || allowed.includes(id))).sort((a, b) => safe(this._hass.states[a]?.attributes?.friendly_name || a).localeCompare(safe(this._hass.states[b]?.attributes?.friendly_name || b)));
    }
    _updateAgentOptions() {
      if (!this._cfg || this._cfg.backend !== 'home_assistant') return;
      const agents = this._agents();
      if (!this._agent && agents.length) this._agent = agents[0];
      if (!this._select) return;
      const options = unique([...agents, this._agent, this._cfg.entity]);
      const key = options.map(id => `${id}:${this._hass?.states?.[id]?.attributes?.friendly_name || ''}`).join('|');
      if (this._optionsKey !== key) {
        this._select.replaceChildren();
        for (const id of options) { const option = document.createElement('option'); option.value = id; option.textContent = this._hass?.states?.[id]?.attributes?.friendly_name || id; this._select.append(option); }
        this._optionsKey = key;
      }
      if (this._agent) this._select.value = this._agent;
    }
    _switchAgent(agent) {
      if (this._busy || agent === this._agent) { if (this._select) this._select.value = this._agent; return; }
      this._agent = agent; this._messages = []; this._conversationId = null; this._loadedKey = '';
      this._persistedBefore = false;
      this._loadIfNeeded(); this._render();
    }
    _scope() {
      if (!this._hass || !this._cfg) return '';
      const user = this._hass.user?.id || 'unknown-user';
      const identity = this._cfg.backend === 'home_assistant' ? this._agent : `${this._cfg.url}|${this._cfg.model}`;
      return `conversation-chat-card:v1:${user}:${this._cfg.storage_id || 'default'}:${this._cfg.backend}:${identity}`;
    }
    _readStored(key) {
      if (!key || this._cfg.persist_minutes <= 0) return null;
      try {
        const value = JSON.parse(localStorage.getItem(key) || 'null');
        const ttl = this._cfg.persist_minutes * 60000;
        if (!value || !Number.isFinite(value.lastActivity) || Date.now() - value.lastActivity > ttl || value.lastActivity > Date.now() + 60000 || !Array.isArray(value.messages)) {
          localStorage.removeItem(key); return null;
        }
        return value;
      } catch { try { localStorage.removeItem(key); } catch {} return null; }
    }
    _loadIfNeeded() {
      const key = this._scope();
      if (!key || key === this._loadedKey || !this._log) return;
      this._loadedKey = key;
      const value = this._readStored(key);
      this._persistedBefore = Boolean(value);
      this._messages = value ? value.messages.filter(m => m && ['user', 'assistant'].includes(m.role) && typeof m.text === 'string').slice(-100) : [];
      this._conversationId = value && typeof value.conversationId === 'string' ? value.conversationId : null;
      this._render();
    }
    _save() {
      const key = this._scope();
      if (!key || this._cfg.persist_minutes <= 0) return;
      // Check expiry before renewing lastActivity. An expired session cannot be revived.
      if (this._persistedBefore && !this._readStored(key)) {
        this._messages = []; this._conversationId = null; this._persistedBefore = false;
        this._render(); return;
      }
      try {
        localStorage.setItem(key, JSON.stringify({ lastActivity: Date.now(), conversationId: this._conversationId, messages: this._messages.filter(m => !m.pending && ['user','assistant'].includes(m.role)).slice(-100) }));
        this._persistedBefore = true;
      } catch (error) { console.warn(TAG, 'Could not save conversation', error); }
    }
    _expireBeforeSend() {
      const key = this._scope();
      if (!key || this._cfg.persist_minutes <= 0) return;
      if (this._persistedBefore && !this._readStored(key)) {
        this._messages = []; this._conversationId = null; this._persistedBefore = false; this._render();
      }
    }
    _newChat() {
      ++this._generation;
      try { localStorage.removeItem(this._scope()); } catch {}
      this._messages = []; this._conversationId = null; this._persistedBefore = false;
      this._render(); this._input?.focus();
    }
    _busyState(busy) {
      this._busy = busy; this._sendButton.disabled = busy; this._input.disabled = busy;
      if (this._select) this._select.disabled = busy;
      if (this._clearButton) this._clearButton.disabled = busy;
      if (this._remindButton) this._remindButton.disabled = busy || !this._reminderMessages().length;
      if (!busy) this._input.focus();
    }
    _render() {
      if (!this._log) return;
      this._log.replaceChildren();
      if (this._cfg.welcome) {
        const greeting = document.createElement('div'); greeting.className = 'bubble assistant';
        const body = document.createElement('div'); body.className = 'md'; body.innerHTML = markdown.render(safe(this._cfg.welcome));
        greeting.append(body); this._log.append(greeting);
      } else if (!this._messages.length) {
        const hint = document.createElement('div'); hint.className = 'hint'; hint.textContent = safe(this._cfg.welcome || 'Start a conversation'); this._log.append(hint);
      }
      for (const msg of this._messages) {
        const bubble = document.createElement('div'); bubble.className = `bubble ${msg.role}`;
        if (msg.role === 'user' || msg.role === 'error') bubble.textContent = msg.text;
        else {
          if (msg.thinking && this._cfg.show_thinking !== false) {
            const details = document.createElement('details'); details.open = Boolean(this._cfg.thinking_open);
            const summary = document.createElement('summary'); summary.textContent = 'Thinking';
            const thought = document.createElement('div'); thought.className = 'md'; thought.innerHTML = markdown.render(msg.thinking);
            details.append(summary, thought); bubble.append(details);
          }
          if (msg.pending && (this._cfg.show_working_bubbles !== false || normalized(this._cfg.working_message))) {
            const status = document.createElement('div'); status.className = 'status';
            if (this._cfg.show_working_bubbles !== false) {
              const dots = document.createElement('span'); dots.className = 'dots'; dots.setAttribute('aria-hidden','true');
              for (let i = 0; i < 3; i++) dots.append(document.createElement('i'));
              status.append(dots);
            }
            if (normalized(this._cfg.working_message)) { const label = document.createElement('span'); label.textContent = safe(this._cfg.working_message); status.append(label); }
            bubble.append(status);
          }
          if (msg.text) { const body = document.createElement('div'); body.className = 'md'; body.innerHTML = markdown.render(msg.text); bubble.append(body); }
        }
        if (bubble.children.length || msg.role === 'user' || msg.role === 'error') this._log.append(bubble);
      }
      if (this._remindButton) this._remindButton.disabled = this._busy || !this._reminderMessages().length;
      this._log.scrollTop = this._log.scrollHeight;
    }
    _splitThinking(message) {
      const source = safe(message.raw || message.text);
      if (!source.includes('<think>') && !source.includes('</think>')) return;
      const chunks = source.split(/(<\/?think>)/i);
      let inside = false, answer = '', thinking = '';
      for (const chunk of chunks) {
        if (/^<think>$/i.test(chunk)) { inside = true; continue; }
        if (/^<\/think>$/i.test(chunk)) { inside = false; continue; }
        if (inside) thinking += chunk; else answer += chunk;
      }
      message.text = answer; message.thinking = [message.explicitThinking || '', thinking].filter(Boolean).join('\n');
    }
    _appendDelta(message, delta) {
      if (delta.thinking_content || delta.reasoning_content || delta.reasoning) {
        message.explicitThinking = (message.explicitThinking || '') + safe(delta.thinking_content || delta.reasoning_content || delta.reasoning);
        message.thinking = message.explicitThinking;
      }
      if (typeof delta.content === 'string') { message.raw = (message.raw || '') + delta.content; message.text = message.raw; this._splitThinking(message); }
      if (delta.tool_calls) message.status = 'Using tools';
      this._render();
    }
    _reminderMessages() { return this._messages.filter(msg => !msg.pending && !msg.reminder && (msg.role === 'user' || msg.role === 'assistant') && normalized(msg.text)); }
    _remind() {
      if (this._busy) return;
      this._expireBeforeSend();
      const messages = this._reminderMessages();
      if (!messages.length) return;
      const prompt = safe(this._cfg.remind_prompt || 'Here is a reminder of our conversation so far. Use it as context for your next response. Do not repeat the transcript unless asked.');
      const transcript = messages.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`).join('\n\n');
      return this._send(`${prompt}\n\n${transcript}`, true);
    }
    async _send(overrideText, reminder = false) {
      if (this._busy || !this._hass) return;
      const text = normalized(overrideText === undefined ? this._input.value : overrideText);
      if (!text) return;
      this._expireBeforeSend();
      if (this._cfg.backend === 'home_assistant' && !this._agent) { this._showError('No conversation agent is available'); return; }
      if (!reminder) this._input.value = '';
      this._messages.push({ role: 'user', text: reminder ? safe(this._cfg.remind_button_text) : text, reminder });
      const reply = { role: 'assistant', text: '', thinking: '', pending: true };
      this._messages.push(reply); this._render(); this._busyState(true);
      this._save();
      const generation = this._generation;
      try {
        if (this._cfg.backend === 'chat_completions') await this._chatCompletions(reply, reminder ? text : null);
        else {
          const pipeline = this._pipelineForAgent();
          if (pipeline) await this._runPipeline(text, pipeline, reply);
          else await this._conversationProcess(text, reply);
        }
        if (!reply.text && !reply.thinking) reply.text = '(No response)';
      } catch (error) { reply.role = 'error'; reply.text = error?.message || safe(error); reply.thinking = ''; }
      finally {
        reply.pending = false;
        if (generation === this._generation) { this._busyState(false); this._render(); this._save(); }
      }
    }
    _pipelineForAgent() {
      const mapping = this._cfg.pipelines;
      return (mapping && typeof mapping === 'object' && mapping[this._agent]) || (this._agent === this._cfg.entity ? this._cfg.pipeline_id : null);
    }
    async _conversationProcess(text, reply) {
      const result = await this._hass.connection.sendMessagePromise({ type: 'conversation/process', text, agent_id: this._agent, language: this._hass.language, ...(this._conversationId ? { conversation_id: this._conversationId } : {}) });
      if (result?.conversation_id) this._conversationId = result.conversation_id;
      const response = result?.response;
      if (response?.response_type === 'error') throw new Error(response.speech?.plain?.speech || response.data?.code || 'Conversation error');
      reply.raw = safe(response?.speech?.plain?.speech || ''); reply.text = reply.raw; this._splitThinking(reply);
    }
    _runPipeline(text, pipeline, reply) {
      return new Promise((resolve, reject) => {
        let unsubscribe = null, done = false;
        const finish = (err) => {
          if (done) return;
          done = true;
          if (unsubscribe) { try { unsubscribe(); } catch {} }
          if (err) reject(err); else resolve();
        };
        this._hass.connection.subscribeMessage(event => {
          if (done) return;
          const data = event?.data || {};
          if (event.type === 'run-start') { reply.status = 'Processing'; this._render(); }
          if (event.type === 'intent-start') { reply.status = 'Agent is responding'; this._render(); }
          if (event.type === 'intent-progress') this._appendDelta(reply, data.chat_log_delta || {});
          if (event.type === 'intent-end') {
            const out = data.intent_output || {};
            if (out.conversation_id) this._conversationId = out.conversation_id;
            if (out.response?.response_type === 'error') return finish(new Error(out.response.speech?.plain?.speech || out.response.data?.code || 'Conversation error'));
            const final = out.response?.speech?.plain?.speech;
            if (typeof final === 'string' && final) { reply.raw = final; reply.text = final; this._splitThinking(reply); }
            finish();
          }
          if (event.type === 'error') finish(new Error(data.message || 'Assist pipeline error'));
          if (event.type === 'run-end' && !done) finish();
        }, { type: 'assist_pipeline/run', start_stage: 'intent', end_stage: 'intent', input: { text }, pipeline, ...(this._conversationId ? { conversation_id: this._conversationId } : {}) })
          .then(fn => { unsubscribe = fn; if (done) { try { fn(); } catch {} } })
          .catch(finish);
      });
    }
    async _chatCompletions(reply, reminderText = null) {
      const cfg = this._cfg;
      const headers = { 'Content-Type': 'application/json', ...(cfg.headers || {}) };
      if (cfg.token) headers.Authorization = /^Bearer\s/i.test(cfg.token) ? cfg.token : `Bearer ${cfg.token}`;
      const messages = [];
      if (cfg.system_prompt) messages.push({ role: 'system', content: safe(cfg.system_prompt) });
      for (const message of this._messages) {
        if (message.role === 'user' || (message.role === 'assistant' && !message.pending)) {
          messages.push({ role: message.role, content: reminderText != null && message === this._messages.at(-2) && message.reminder ? reminderText : message.text });
        }
      }
      const response = await fetch(cfg.url, { method: 'POST', headers, body: JSON.stringify({ model: cfg.model, messages, stream: cfg.stream !== false, ...(cfg.parameters || {}) }) });
      if (!response.ok) throw new Error(`Chat Completions HTTP ${response.status}`);
      const type = response.headers.get('content-type') || '';
      if (cfg.stream === false || !type.includes('text/event-stream') || !response.body) {
        const data = await response.json();
        const choice = data?.choices?.[0];
        if (choice?.message?.tool_calls?.length) throw new Error('The endpoint requested tool calls, which this card cannot execute');
        reply.raw = safe(choice?.message?.content || ''); reply.text = reply.raw;
        reply.explicitThinking = safe(choice?.message?.reasoning_content || choice?.message?.thinking_content || '');
        reply.thinking = reply.explicitThinking; this._splitThinking(reply); return;
      }
      const reader = response.body.getReader(); const decoder = new TextDecoder();
      let buffer = '', ended = false, sawTools = false;
      try {
        while (!ended) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
          const frames = buffer.split('\n\n'); buffer = frames.pop();
          for (const frame of frames) {
            const payload = frame.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
            if (!payload) continue;
            if (payload.trim() === '[DONE]') { ended = true; break; }
            let data;
            try { data = JSON.parse(payload); } catch { continue; }
            if (data.error) throw new Error(data.error.message || 'Streaming error');
            const choice = data.choices?.[0];
            if (choice?.delta?.tool_calls?.length) sawTools = true;
            if (choice?.delta) this._appendDelta(reply, choice.delta);
          }
        }
      } finally { reader.releaseLock(); }
      if (sawTools) throw new Error('The endpoint requested tool calls, which this card cannot execute');
    }
    _showError(message) { this._messages.push({ role: 'error', text: message }); this._render(); }
  }
  customElements.define(TAG, ConversationChatCard);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: TAG, name: 'Conversation Chat Card', description: 'Markdown chat with Home Assistant conversation agents or Chat Completions.' });
})();
