import { getConfigForm, getStubConfig, normalizeConfig } from './config.js';
import emittedStylesheetUrl from './conversation-chat-card.css?url';
import { runChatCompletions } from './backends/chat-completions.js';
import { pipelineForAgent, runAssistPipeline, runConversationProcess } from './backends/home-assistant.js';
import { renderMarkdown } from './markdown.js';
import { clearStoredConversation, createStorageKey, readStoredConversation, writeStoredConversation } from './storage.js';
import { canSpeak, speakText } from './text-to-speech.js';
import { normalized, safe, unique } from './utils.js';

const TAG = 'conversation-chat-card';
const moduleUrl = new URL(import.meta.url);
const stylesheetUrl = new URL(emittedStylesheetUrl.split('/').pop(), moduleUrl);
stylesheetUrl.search = moduleUrl.search;
const button = (className, label, icon, mode) => {
  const el = document.createElement('button'); 
  el.type = 'button';
  el.className = className;
  el.setAttribute('aria-label', safe(label));
  
  if (mode === 'icon' || mode === 'both') {
    const glyph = document.createElement('ha-icon'); 
    glyph.setAttribute('icon', safe(icon)); 
    glyph.setAttribute('aria-hidden', 'true'); 
    el.append(glyph);
  }
  if (mode !== 'icon') {
    const span = document.createElement('span'); 
    span.textContent = safe(label); 
    el.append(span); 
  }
  return el;
};

export class ConversationChatCard extends HTMLElement {
  static getStubConfig() { return getStubConfig(); }
  static getConfigForm() { return getConfigForm(); }
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
      this._activeRequest = null;
    }
    setConfig(config) {
      this._cfg = normalizeConfig(config);
      const first = this._cfg.entity || '';
      if (!this._agent || this._cfg.agent_picker === false) this._agent = first;
      this._loadedKey = '';
      this._persistedBefore = false;
      this._mount();
    }
    set hass(value) {
      this._hass = value;
      if (!this._cfg) { return; }
      this._updateAgentOptions();
      this._loadIfNeeded();
    }
    getCardSize() { return Math.ceil((Number(this._cfg?.height) || 440) / 50); }
    connectedCallback() { 
      if (this._cfg && !this._log) {
        this._mount();
      }
    }
    disconnectedCallback() {
      this._audio?.pause();
      this._audio = null;
    }
    _mount() {
      if (!this._cfg) { return; }
      this.shadowRoot.replaceChildren();
      const stylesheet = document.createElement('link'); 
      stylesheet.rel = 'stylesheet'; stylesheet.href = stylesheetUrl;
      
      const card = document.createElement('ha-card');
      card.style.height = this._cfg.height ? `${Math.max(280, Number(this._cfg.height) || 440)}px` : '440px';
      
      const head = document.createElement('div'); 
      head.className = 'head';
      
      if (this._cfg.show_header !== false) {
        const title = document.createElement('span'); 
        title.className = 'title'; 
        title.textContent = safe(this._cfg.title); 
        head.append(title);
        
        if (this._cfg.show_remind_button === true) {
          this._remindButton = button('remind', this._cfg.remind_button_text, this._cfg.remind_button_icon, this._cfg.remind_button_mode);
          this._remindButton.addEventListener('click', () => this._remind()); 
          head.append(this._remindButton);
        } else {
          this._remindButton = null;
        }
        
        if (this._cfg.backend === 'home_assistant' && this._cfg.show_reset_context_button === true) {
          this._resetContextButton = button('reset', this._cfg.reset_context_button_text, this._cfg.reset_context_button_icon, this._cfg.reset_context_button_mode);
          this._resetContextButton.addEventListener('click', () => this._resetContext()); 
          head.append(this._resetContextButton);
        } else {
          this._resetContextButton = null;
        }
        
        if (this._cfg.backend === 'home_assistant' && this._cfg.agent_picker !== false) {
          this._select = document.createElement('select'); 
          this._select.setAttribute('aria-label', 'Conversation agent');
          this._select.addEventListener('change', () => this._switchAgent(this._select.value)); 
          head.append(this._select);
        } else {
          this._select = null;
        }
        
        if (this._cfg.show_clear_button !== false) {
          this._clearButton = button('clear', this._cfg.clear_button_text, this._cfg.clear_button_icon, this._cfg.clear_button_mode);
          this._clearButton.addEventListener('click', () => { 
            if (!this._busy) {
              this._newChat(); 
            }
          });
          head.append(this._clearButton);
        } else {
          this._clearButton = null;
        }
      } else { 
        this._select = null; 
        this._clearButton = null; 
        this._remindButton = null; 
        this._resetContextButton = null;
      }
      this._log = document.createElement('div'); 
      this._log.className = 'log';
      this._log.setAttribute('role', 'log'); 
      this._log.setAttribute('aria-live', 'polite');
      const foot = document.createElement('div'); 
      foot.className = 'foot';
      this._input = document.createElement('textarea'); 
      this._input.rows = 1; 
      this._input.placeholder = safe(this._cfg.placeholder || 'Type a message…'); 
      this._input.setAttribute('aria-label', 'Message');
      this._input.addEventListener('keydown', event => { 
        if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { 
          event.preventDefault(); this._send(); 
        } 
      });
      this._stopButton = this._cfg.show_stop_button === false ? null : button('stop', this._cfg.stop_button_text, this._cfg.stop_button_icon, this._cfg.stop_button_mode);
      
      if (this._stopButton) { 
        this._stopButton.hidden = true; 
        this._stopButton.addEventListener('click', () => this._stopWaiting()); 
      }

      const send = button('send', this._cfg.send_button_text, this._cfg.send_button_icon, this._cfg.send_button_mode);
      send.addEventListener('click', () => this._send()); 
      this._sendButton = send;
      this._speakLastButton = this._cfg.show_speak_last_button === true ? button('speak-last', this._cfg.speak_last_button_text, this._cfg.speak_last_button_icon, this._cfg.speak_last_button_mode) : null;
      if (this._speakLastButton) {
        this._speakLastButton.addEventListener('click', () => this._speakLastReply());
        foot.append(this._speakLastButton);
      }
      foot.append(this._input); 
      if (this._stopButton) {
        foot.append(this._stopButton); 
      }
      foot.append(send);
      if (this._cfg.show_header !== false) {
        card.append(head);
      }
      card.append(this._log, foot);
      this.shadowRoot.append(stylesheet, card);
      this._updateAgentOptions(); this._render(); 
      this._loadIfNeeded();
    }

    _agents() {
      if (!this._hass) return [];
      const allowed = Array.isArray(this._cfg.agents) ? this._cfg.agents : null;
      return Object.keys(this._hass.states || {}).filter(id => 
        id.startsWith('conversation.') && 
        (!allowed || allowed.includes(id))).sort((a, b) => 
          safe(this._hass.states[a]?.attributes?.friendly_name || a)
          .localeCompare(safe(this._hass.states[b]?.attributes?.friendly_name || b)));
    }

    _updateAgentOptions() {
      if (!this._cfg || this._cfg.backend !== 'home_assistant') { return; }
      const agents = this._agents();
      if (!this._agent && agents.length) {this._agent = agents[0];}
      if (!this._select) { return; }
      
      const options = unique([...agents, this._agent, this._cfg.entity]);
      const key = options.map(id => `${id}:${this._hass?.states?.[id]?.attributes?.friendly_name || ''}`).join('|');
      
      if (this._optionsKey !== key) {
        this._select.replaceChildren();
        for (const id of options) {
           const option = document.createElement('option'); option.value = id; 
           option.textContent = this._hass?.states?.[id]?.attributes?.friendly_name || id; 
           this._select.append(option); 
        }
        this._optionsKey = key;
      }
      if (this._agent) {this._select.value = this._agent;}
    }
    _switchAgent(agent) {
      if (this._busy || agent === this._agent) { 
        if (this._select) {
          this._select.value = this._agent; 
          return;
        } 
      }
      this._agent = agent; 
      this._messages = []; 
      this._conversationId = null; 
      this._loadedKey = '';
      this._persistedBefore = false;
      this._loadIfNeeded(); this._render();
    }
    _scope() {
      return createStorageKey(this._hass, this._cfg, this._agent);
    }
    _readStored(key) {
      return readStoredConversation(key, this._cfg.persist_minutes);
    }
    _loadIfNeeded() {
      const key = this._scope();
      if (!key || key === this._loadedKey || !this._log) { return; }
      this._loadedKey = key;
      const value = this._readStored(key);
      this._persistedBefore = Boolean(value);
      this._messages = value ? value.messages.filter(m => m && ['user', 'assistant'].includes(m.role) && typeof m.text === 'string').slice(-100) : [];
      this._conversationId = value && typeof value.conversationId === 'string' ? value.conversationId : null;
      this._render();
    }
    _save() {
      const key = this._scope();
      if (!key || this._cfg.persist_minutes <= 0) { return; }
      // Check expiry before renewing lastActivity. An expired session cannot be revived.
      if (this._persistedBefore && !this._readStored(key)) {
        this._messages = []; 
        this._conversationId = null; 
        this._persistedBefore = false;
        this._render(); 
        return;
      }
      try {
        writeStoredConversation(key, this._conversationId, this._messages);
        this._persistedBefore = true;
      } catch (error) { console.warn(TAG, 'Could not save conversation', error); }
    }
    _expireBeforeSend() {
      const key = this._scope();
      if (!key || this._cfg.persist_minutes <= 0) { return; }
      if (this._persistedBefore && !this._readStored(key)) {
        this._messages = []; 
        this._conversationId = null; 
        this._persistedBefore = false; 
        this._render();
      }
    }
    _newChat() {
      ++this._generation;
      clearStoredConversation(this._scope());
      this._messages = []; 
      this._conversationId = null; 
      this._persistedBefore = false;
      this._render(); 
      this._input?.focus();
    }
    _resetContext() {
      if (this._busy || this._cfg.backend !== 'home_assistant') { return; }
      this._conversationId = null;
      this._save(); 
      this._render(); 
      this._input?.focus();
    }
    _stopWaiting() {
      const request = this._activeRequest;
      if (!this._busy || !request) { return; }
      request.cancelled = true;
      ++this._generation;
      try { request.controller.abort(); } catch {}
      try { request.cancelTransport?.(); } catch {}
      this._messages = this._messages.filter(message => message !== request.reply);
      this._activeRequest = null;
      this._busyState(false); 
      this._render(); 
      this._save();
    }
    _busyState(busy) {
      this._busy = busy; this._sendButton.disabled = busy; this._input.disabled = busy;
      if (this._select){ this._select.disabled = busy;}
      if (this._clearButton) {this._clearButton.disabled = busy;}
      if (this._remindButton) {this._remindButton.disabled = busy || !this._reminderMessages().length;}
      if (this._resetContextButton) {this._resetContextButton.disabled = busy || !this._conversationId;}
      if (this._stopButton) {this._stopButton.hidden = !busy;}
      if (this._speakLastButton) {this._speakLastButton.disabled = !this._canSpeak() || !this._lastSpeakableMessage();}
      if (!busy) {this._input.focus();}
    }
    _imagePatternMatches(url, pattern) {
      try {
        if (pattern.startsWith('re:')) {return new RegExp(pattern.slice(3)).test(url);}
        const expression = pattern.replace(/[.+^$|(){}[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
        return new RegExp(`^${expression}$`).test(url);
      } catch (error) {
        console.warn(TAG, `Ignoring invalid image allowlist pattern: ${pattern}`, error);
        return false;
      }
    }
    _resolveImageUrl(source) {
      try {
        const base = globalThis.location?.href;
        if (!base) {return null;}
        const url = new URL(source, base);
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password){ return null;}
        if (url.origin === globalThis.location.origin) {return this._cfg.allow_local_images === true ? url.href : null;}
        if (this._cfg.allow_remote_images !== true || !this._cfg.image_url_allowlist.length){ return null;}
        return this._cfg.image_url_allowlist.some(pattern => this._imagePatternMatches(url.href, pattern)) ? url.href : null;
      } catch {
        return null;
      }
    }
    _markdown(source) {
      return renderMarkdown(source, url => this._resolveImageUrl(url));
    }
    _render() {
      if (!this._log) { return; }
      this._log.replaceChildren();
      if (this._cfg.welcome) {
        const greeting = document.createElement('div'); 
        greeting.className = 'bubble assistant';
        const body = document.createElement('div'); 
        body.className = 'md'; 
        body.innerHTML = this._markdown(this._cfg.welcome);
        greeting.append(body);
        this._log.append(greeting);
      } else if (!this._messages.length) {
        const hint = document.createElement('div');
        hint.className = 'hint';
        hint.textContent = safe(this._cfg.welcome || 'Start a conversation');
        this._log.append(hint);
      }
      for (const msg of this._messages) {
        const bubble = document.createElement('div'); bubble.className = `bubble ${msg.role}`;
        if (msg.role === 'user' || msg.role === 'error') {
          bubble.textContent = msg.text;
        }else {
          if (msg.thinking && this._cfg.show_thinking !== false) {
            const details = document.createElement('details'); 
            details.open = Boolean(this._cfg.thinking_open);
            const summary = document.createElement('summary'); 
            summary.textContent = 'Thinking';
            const thought = document.createElement('div'); 
            thought.className = 'md'; 
            thought.innerHTML = this._markdown(msg.thinking);
            details.append(summary, thought); 
            bubble.append(details);
          }
          if (msg.pending && (this._cfg.show_working_bubbles !== false || normalized(this._cfg.working_message))) {
            const status = document.createElement('div'); 
            status.className = 'status';
            if (this._cfg.show_working_bubbles !== false) {
              const dots = document.createElement('span'); 
              dots.className = 'dots'; 
              dots.setAttribute('aria-hidden','true');
              for (let i = 0; i < 3; i++) {
                dots.append(document.createElement('i'));
              }
              status.append(dots);
            }
            if (normalized(this._cfg.working_message)) { 
              const label = document.createElement('span'); 
              label.textContent = safe(this._cfg.working_message);
              status.append(label); 
            }
            bubble.append(status);
          }
          if (msg.text) { 
            const body = document.createElement('div'); 
            body.className = 'md'; 
            body.innerHTML = this._markdown(msg.text);
             bubble.append(body);
          }
          if (!msg.pending && msg.text && this._cfg.show_speak_buttons === true) {
            const actions = document.createElement('div');
            actions.className = 'bubble-actions';
            const speak = button('speak-response', this._cfg.speak_button_text, this._cfg.speak_button_icon, this._cfg.speak_button_mode);
            speak.disabled = !this._canSpeak();
            speak.addEventListener('click', () => this._speakReply(msg.text));
            actions.append(speak);
            bubble.append(actions);
          }
        }
        if (bubble.children.length || msg.role === 'user' || msg.role === 'error') {this._log.append(bubble);}
      }
      if (this._remindButton){ this._remindButton.disabled = this._busy || !this._reminderMessages().length;}
      if (this._resetContextButton) {this._resetContextButton.disabled = this._busy || !this._conversationId;}
      if (this._speakLastButton) {this._speakLastButton.disabled = !this._canSpeak() || !this._lastSpeakableMessage();}
      this._log.scrollTop = this._log.scrollHeight;
    }
    _splitThinking(message) {
      const source = safe(message.raw || message.text);
      if (!source.includes('<think>') && !source.includes('</think>')) { return; }
      const chunks = source.split(/(<\/?think>)/i);
      let inside = false, answer = '', thinking = '';
      for (const chunk of chunks) {
        if (/^<think>$/i.test(chunk)) { inside = true; continue; }
        if (/^<\/think>$/i.test(chunk)) { inside = false; continue; }
        if (inside) {
          thinking += chunk;
        } else {
          answer += chunk;
        }
      }
      message.text = answer; 
      message.thinking = [message.explicitThinking || '', thinking].filter(Boolean).join('\n');
    }
    _appendDelta(message, delta) {
      if (delta.thinking_content || delta.reasoning_content || delta.reasoning) {
        message.explicitThinking = (message.explicitThinking || '') + safe(delta.thinking_content || delta.reasoning_content || delta.reasoning);
        message.thinking = message.explicitThinking;
      }
      if (typeof delta.content === 'string') { 
        message.raw = (message.raw || '') + delta.content; 
        message.text = message.raw; 
        this._splitThinking(message); 
      }
      if (delta.tool_calls) {message.status = 'Using tools';}
      this._render();
    }
    _reminderMessages() { 
      return this._messages.filter(msg => !msg.pending && !msg.reminder && (msg.role === 'user' || msg.role === 'assistant') && normalized(msg.text)); 
    }
    _remind() {
      if (this._busy) { return; }
      this._expireBeforeSend();
      const messages = this._reminderMessages();
      if (!messages.length) { return; }
      const prompt = safe(this._cfg.remind_prompt || 'Here is a reminder of our conversation so far. Use it as context for your next response. Do not repeat the transcript unless asked.');
      const transcript = messages.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`).join('\n\n');
      return this._send(`${prompt}\n\n${transcript}`, true);
    }
    async _send(overrideText, reminder = false) {
      if (this._busy || !this._hass) { return; }
      const text = normalized(overrideText === undefined ? this._input.value : overrideText);
      if (!text) { return; }
      this._expireBeforeSend();
      if (this._cfg.backend === 'home_assistant' && !this._agent) { 
        this._showError('No conversation agent is available'); 
        return; 
      }
      if (!reminder) {this._input.value = '';}
      this._messages.push({ role: 'user', text: reminder ? safe(this._cfg.remind_button_text) : text, reminder });
      const reply = { role: 'assistant', text: '', thinking: '', pending: true };
      this._messages.push(reply); 
      this._render(); 
      this._busyState(true);
      this._save();
      const request = { generation: this._generation, reply, cancelled: false, controller: new AbortController(), cancelTransport: null };
      this._activeRequest = request;
      try {
        if (this._cfg.backend === 'chat_completions') {
          await this._chatCompletions(reply, reminder ? text : null, request);
        } else {
          const pipeline = this._pipelineForAgent();
          if (pipeline) {
            await this._runPipeline(text, pipeline, reply, request);
          }else {
            await this._conversationProcess(text, reply, request);
          }
        }
        if (request.cancelled) { return; }
        if (!reply.text && !reply.thinking) {reply.text = '(No response)';}
      } catch (error) {
        if (!request.cancelled) { 
          reply.role = 'error'; 
          reply.text = error?.message || safe(error); 
          reply.thinking = ''; 
        }
      }
      finally {
        reply.pending = false;
        if (this._activeRequest === request) {this._activeRequest = null;}
        if (!request.cancelled && request.generation === this._generation) { 
          this._busyState(false); 
          this._render(); 
          this._save(); 
          if (reply.role === 'assistant' && this._cfg.tts_auto === true) {
            void this._speakReply(reply.text);
          }
        }
      }
    }
    async _speakReply(markdown) {
      const content = document.createElement('div');
      content.innerHTML = this._markdown(markdown);
      for (const lineBreak of content.querySelectorAll('br')) {
        lineBreak.replaceWith(' ');
      }
      for (const block of content.querySelectorAll('p, li, blockquote, pre, h1, h2, h3, h4, h5, h6')) {
        block.append(' ');
      }
      try {
        await speakText(this._hass, this._cfg, content.textContent, source => this._playBrowserAudio(source));
      } catch (error) {
        console.warn(TAG, 'Could not speak assistant reply', error);
      }
    }
    _canSpeak() {
      return canSpeak(this._hass, this._cfg);
    }
    async _playBrowserAudio(source) {
      if (this._audio) {
        this._audio.pause();
      }
      const audio = new Audio(source);
      this._audio = audio;
      audio.addEventListener('ended', () => {
        if (this._audio === audio) {
          this._audio = null;
        }
      }, { once: true });
      await audio.play();
    }
    _lastSpeakableMessage() {
      for (let index = this._messages.length - 1; index >= 0; index--) {
        const message = this._messages[index];
        if (message.role === 'assistant' && !message.pending && normalized(message.text)) {
          return message;
        }
      }
      return null;
    }
    _speakLastReply() {
      const message = this._lastSpeakableMessage();
      if (message) {
        void this._speakReply(message.text);
      }
    }
    _pipelineForAgent() {
      return pipelineForAgent(this._cfg, this._agent);
    }
    async _conversationProcess(text, reply, request) {
      const result = await runConversationProcess({ hass: this._hass, text, agent: this._agent, conversationId: this._conversationId, request });
      if (!result) { return; }
      this._conversationId = result.conversationId;
      reply.raw = result.raw; 
      reply.text = reply.raw; 
      this._splitThinking(reply);
    }
    async _runPipeline(text, pipeline, reply, request) {
      const result = await runAssistPipeline({
        hass: this._hass,
        text,
        pipeline,
        conversationId: this._conversationId,
        request,
        onStatus: status => { 
          reply.status = status; 
          this._render(); 
        },
        onDelta: delta => {this._appendDelta(reply, delta)}
      });
      if (request.cancelled || !result) { return; }
      this._conversationId = result.conversationId;
      if (result.raw) { 
        reply.raw = result.raw; 
        reply.text = result.raw; 
        this._splitThinking(reply); 
      }
    }
    async _chatCompletions(reply, reminderText, request) {
      const result = await runChatCompletions({
        config: this._cfg,
        conversation: this._messages,
        reminderText,
        request,
        onDelta: delta => this._appendDelta(reply, delta)
      });
      if (!result) { return; }
      reply.raw = result.raw; reply.text = reply.raw;
      reply.explicitThinking = result.explicitThinking;
      reply.thinking = reply.explicitThinking; 
      this._splitThinking(reply);
    }
    _showError(message) { 
      this._messages.push({ role: 'error', text: message }); 
      this._render();
    }
}
