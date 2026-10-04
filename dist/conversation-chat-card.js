/* Conversation Chat Card 2.1.0 — Home Assistant dashboard module. MIT. Requires its CSS and markdown-it files in the same directory. */
import "./markdown-it.umd.min.js";
//#region src/utils.js
var safe = (value) => String(value ?? "");
var normalized = (value) => safe(value).trim();
var unique = (values) => [...new Set(values.filter(Boolean))];
//#endregion
//#region src/config.js
var DEFAULT_CONFIG = {
	backend: "home_assistant",
	title: "Conversation",
	stream: true,
	show_working_bubbles: true,
	show_header: true,
	show_clear_button: true,
	show_remind_button: false,
	show_reset_context_button: false,
	show_stop_button: true,
	allow_local_images: false,
	allow_remote_images: false,
	clear_button_text: "Clear chat",
	clear_button_icon: "mdi:delete-outline",
	clear_button_mode: "text",
	remind_button_text: "Remind agent",
	remind_button_icon: "mdi:refresh",
	remind_button_mode: "text",
	reset_context_button_text: "Reset context",
	reset_context_button_icon: "mdi:restart",
	reset_context_button_mode: "text",
	stop_button_text: "Stop",
	stop_button_icon: "mdi:stop",
	stop_button_mode: "text",
	send_button_text: "Send",
	send_button_icon: "mdi:send",
	send_button_mode: "text",
	working_message: "",
	tts_auto: false,
	tts_cache: true
};
function getStubConfig() {
	return {
		backend: "home_assistant",
		agent_picker: true,
		show_header: true,
		show_clear_button: true,
		show_stop_button: true,
		show_working_bubbles: true,
		show_thinking: true,
		allow_local_images: false,
		allow_remote_images: false,
		tts_auto: false,
		tts_cache: true,
		send_button_mode: "text",
		clear_button_mode: "text",
		remind_button_mode: "text",
		reset_context_button_mode: "text",
		stop_button_mode: "text"
	};
}
function getConfigForm() {
	const text = (name) => ({
		name,
		selector: { text: {} }
	});
	const multiline = (name) => ({
		name,
		selector: { text: { multiline: true } }
	});
	const toggle = (name) => ({
		name,
		selector: { boolean: {} }
	});
	const icon = (name) => ({
		name,
		selector: { icon: {} }
	});
	const mode = (name) => ({
		name,
		selector: { select: {
			options: [
				"text",
				"icon",
				"both"
			],
			mode: "dropdown"
		} }
	});
	const group = (name, title, schema) => ({
		type: "expandable",
		name,
		title,
		flatten: true,
		schema
	});
	return {
		schema: [
			{
				name: "backend",
				selector: { select: {
					options: [{
						value: "home_assistant",
						label: "Home Assistant"
					}, {
						value: "chat_completions",
						label: "Chat Completions"
					}],
					mode: "dropdown"
				} }
			},
			{
				name: "entity",
				selector: { entity: { domain: "conversation" } }
			},
			{
				name: "agent_picker",
				selector: { boolean: {} }
			},
			{
				name: "agents",
				selector: { entity: {
					domain: "conversation",
					multiple: true
				} }
			},
			group("appearance", "Appearance", [
				text("title"),
				text("placeholder"),
				multiline("welcome"),
				{
					name: "height",
					selector: { number: {
						min: 280,
						mode: "box",
						unit_of_measurement: "px"
					} }
				},
				toggle("show_header"),
				toggle("show_thinking"),
				toggle("thinking_open")
			]),
			group("waiting", "While waiting", [text("working_message"), toggle("show_working_bubbles")]),
			group("text_to_speech", "Text to speech", [
				toggle("tts_auto"),
				{
					name: "tts_entity",
					selector: { entity: { domain: "tts" } }
				},
				{
					name: "tts_media_player",
					selector: { entity: { domain: "media_player" } }
				},
				text("tts_language"),
				toggle("tts_cache")
			]),
			group("send_button", "Send button", [
				text("send_button_text"),
				icon("send_button_icon"),
				mode("send_button_mode")
			]),
			group("clear_button", "Clear chat button", [
				toggle("show_clear_button"),
				text("clear_button_text"),
				icon("clear_button_icon"),
				mode("clear_button_mode")
			]),
			group("remind_button", "Remind agent button", [
				toggle("show_remind_button"),
				text("remind_button_text"),
				icon("remind_button_icon"),
				mode("remind_button_mode"),
				multiline("remind_prompt")
			]),
			group("reset_context_button", "Reset context button", [
				toggle("show_reset_context_button"),
				text("reset_context_button_text"),
				icon("reset_context_button_icon"),
				mode("reset_context_button_mode")
			]),
			group("stop_button", "Stop waiting button", [
				toggle("show_stop_button"),
				text("stop_button_text"),
				icon("stop_button_icon"),
				mode("stop_button_mode")
			]),
			group("storage", "Conversation storage", [{
				name: "persist_minutes",
				selector: { number: {
					min: 0,
					mode: "box",
					step: "any",
					unit_of_measurement: "min"
				} }
			}, text("storage_id")]),
			group("images", "Markdown images", [
				toggle("allow_local_images"),
				toggle("allow_remote_images"),
				{
					name: "image_url_allowlist",
					selector: { text: { multiple: true } }
				}
			]),
			group("assist", "Assist streaming", [{
				name: "pipeline_id",
				selector: { assist_pipeline: {} }
			}, {
				name: "pipelines",
				selector: { object: {} }
			}]),
			group("completions", "Chat Completions", [
				text("url"),
				text("model"),
				{
					name: "token",
					selector: { text: { type: "password" } }
				},
				toggle("stream"),
				multiline("system_prompt"),
				{
					name: "headers",
					selector: { object: {} }
				},
				{
					name: "parameters",
					selector: { object: {} }
				}
			])
		],
		computeLabel: (field) => ({
			backend: "Backend",
			entity: "Conversation agent",
			agent_picker: "Show agent picker",
			agents: "Allowed agents",
			title: "Title",
			placeholder: "Input placeholder",
			welcome: "Welcome message",
			height: "Card height",
			show_header: "Show header",
			show_thinking: "Show thinking",
			thinking_open: "Expand thinking by default",
			working_message: "Waiting message",
			show_working_bubbles: "Show waiting dots",
			tts_auto: "Automatically speak replies",
			tts_entity: "TTS engine",
			tts_media_player: "Media player",
			tts_language: "Language",
			tts_cache: "Cache generated speech",
			show_clear_button: "Show Clear chat",
			show_remind_button: "Show Remind agent",
			show_reset_context_button: "Show Reset context",
			show_stop_button: "Show while waiting",
			clear_button_text: "Button text",
			remind_button_text: "Button text",
			reset_context_button_text: "Button text",
			stop_button_text: "Button text",
			send_button_text: "Button text",
			clear_button_icon: "Icon",
			remind_button_icon: "Icon",
			reset_context_button_icon: "Icon",
			stop_button_icon: "Icon",
			send_button_icon: "Icon",
			clear_button_mode: "Display",
			remind_button_mode: "Display",
			reset_context_button_mode: "Display",
			stop_button_mode: "Display",
			send_button_mode: "Display",
			remind_prompt: "Reminder instruction",
			allow_local_images: "Allow local images",
			allow_remote_images: "Allow remote images",
			image_url_allowlist: "Remote URL allowlist",
			persist_minutes: "Keep chat for (minutes)",
			storage_id: "Storage ID",
			pipeline_id: "Assist pipeline (same agent)",
			pipelines: "Pipeline per agent",
			url: "Endpoint URL",
			model: "Model",
			token: "Bearer token",
			stream: "Stream response",
			system_prompt: "System prompt",
			headers: "Additional headers",
			parameters: "Additional request parameters"
		})[field.name],
		computeHelper: (field) => ({
			entity: "Pick the initial conversation agent. Leave blank to use the first available.",
			agents: "Leave blank to show all agents.",
			tts_auto: "Speaks each new completed assistant reply. The TTS engine and media player are both required.",
			tts_entity: "The tts.* provider or voice used by Home Assistant.",
			tts_media_player: "The media_player.* entity that plays generated speech.",
			tts_language: "Optional language code supported by the selected TTS engine.",
			image_url_allowlist: "Full-URL glob patterns, or regular expressions prefixed with re:. Empty denies remote images.",
			persist_minutes: "0 disables storage. Existing persist_hours YAML is still accepted.",
			pipeline_id: "Choose a pipeline configured for the selected conversation agent.",
			pipelines: "Map conversation entity IDs to Assist pipeline IDs (YAML object).",
			token: "Stored in the dashboard configuration and sent directly by your browser.",
			remind_prompt: "Sent before the transcript when you press Remind agent."
		})[field.name]
	};
}
function normalizeConfig(config) {
	if (!config || config.backend && !["home_assistant", "chat_completions"].includes(config.backend)) throw new Error("backend must be home_assistant or chat_completions");
	if (config.backend === "chat_completions" && (!config.url || !config.model)) throw new Error("Chat Completions requires url and model");
	const minutes = config.persist_minutes ?? (config.persist_hours == null ? 0 : Number(config.persist_hours) * 60);
	if (!Number.isFinite(Number(minutes)) || Number(minutes) < 0) throw new Error("persist_minutes must be >= 0");
	for (const name of [
		"clear_button_mode",
		"remind_button_mode",
		"reset_context_button_mode",
		"stop_button_mode",
		"send_button_mode"
	]) if (config[name] != null && ![
		"text",
		"icon",
		"both"
	].includes(config[name])) throw new Error(`${name} must be text, icon or both`);
	const imageAllowlist = config.image_url_allowlist == null ? [] : (Array.isArray(config.image_url_allowlist) ? config.image_url_allowlist : [config.image_url_allowlist]).map(normalized).filter(Boolean);
	return {
		...DEFAULT_CONFIG,
		...config,
		image_url_allowlist: imageAllowlist,
		persist_minutes: Number(minutes)
	};
}
//#endregion
//#region src/conversation-chat-card.css?url
var conversation_chat_card_default = "/conversation-chat-card.css";
//#endregion
//#region src/backends/chat-completions.js
async function runChatCompletions({ config, conversation, reminderText, request, onDelta }) {
	const headers = {
		"Content-Type": "application/json",
		...config.headers || {}
	};
	if (config.token) headers.Authorization = /^Bearer\s/i.test(config.token) ? config.token : `Bearer ${config.token}`;
	const messages = [];
	if (config.system_prompt) messages.push({
		role: "system",
		content: safe(config.system_prompt)
	});
	for (const message of conversation) if (message.role === "user" || message.role === "assistant" && !message.pending) messages.push({
		role: message.role,
		content: reminderText != null && message === conversation.at(-2) && message.reminder ? reminderText : message.text
	});
	const response = await fetch(config.url, {
		method: "POST",
		headers,
		signal: request.controller.signal,
		body: JSON.stringify({
			model: config.model,
			messages,
			stream: config.stream !== false,
			...config.parameters || {}
		})
	});
	if (request.cancelled) return null;
	if (!response.ok) throw new Error(`Chat Completions HTTP ${response.status}`);
	const type = response.headers.get("content-type") || "";
	if (config.stream === false || !type.includes("text/event-stream") || !response.body) {
		const choice = (await response.json())?.choices?.[0];
		if (choice?.message?.tool_calls?.length) throw new Error("The endpoint requested tool calls, which this card cannot execute");
		return {
			raw: safe(choice?.message?.content || ""),
			explicitThinking: safe(choice?.message?.reasoning_content || choice?.message?.thinking_content || "")
		};
	}
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	let ended = false;
	let sawTools = false;
	try {
		while (!ended) {
			const { value, done } = await reader.read();
			if (done) break;
			if (request.cancelled) return null;
			buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
			const frames = buffer.split("\n\n");
			buffer = frames.pop();
			for (const frame of frames) {
				const payload = frame.split("\n").filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trimStart()).join("\n");
				if (!payload) continue;
				if (payload.trim() === "[DONE]") {
					ended = true;
					break;
				}
				let data;
				try {
					data = JSON.parse(payload);
				} catch {
					continue;
				}
				if (data.error) throw new Error(data.error.message || "Streaming error");
				const choice = data.choices?.[0];
				if (choice?.delta?.tool_calls?.length) sawTools = true;
				if (choice?.delta) onDelta(choice.delta);
			}
		}
	} finally {
		reader.releaseLock();
	}
	if (sawTools) throw new Error("The endpoint requested tool calls, which this card cannot execute");
	return null;
}
//#endregion
//#region src/backends/home-assistant.js
function pipelineForAgent(config, agent) {
	const mapping = config.pipelines;
	return mapping && typeof mapping === "object" && mapping[agent] || (agent === config.entity ? config.pipeline_id : null);
}
async function runConversationProcess({ hass, text, agent, conversationId, request }) {
	const result = await hass.connection.sendMessagePromise({
		type: "conversation/process",
		text,
		agent_id: agent,
		language: hass.language,
		...conversationId ? { conversation_id: conversationId } : {}
	});
	if (request.cancelled) return null;
	const response = result?.response;
	if (response?.response_type === "error") throw new Error(response.speech?.plain?.speech || response.data?.code || "Conversation error");
	return {
		conversationId: result?.conversation_id || conversationId,
		raw: safe(response?.speech?.plain?.speech || "")
	};
}
function runAssistPipeline({ hass, text, pipeline, conversationId, request, onStatus, onDelta }) {
	return new Promise((resolve, reject) => {
		let unsubscribe = null;
		let done = false;
		let nextConversationId = conversationId;
		let raw = "";
		const finish = (error) => {
			if (done) return;
			done = true;
			if (unsubscribe) try {
				unsubscribe();
			} catch {}
			if (error) reject(error);
			else resolve({
				conversationId: nextConversationId,
				raw
			});
		};
		request.cancelTransport = () => finish();
		hass.connection.subscribeMessage((event) => {
			if (done || request.cancelled) return;
			const data = event?.data || {};
			if (event.type === "run-start") onStatus("Processing");
			if (event.type === "intent-start") onStatus("Agent is responding");
			if (event.type === "intent-progress") onDelta(data.chat_log_delta || {});
			if (event.type === "intent-end") {
				const output = data.intent_output || {};
				if (output.conversation_id) nextConversationId = output.conversation_id;
				if (output.response?.response_type === "error") return finish(new Error(output.response.speech?.plain?.speech || output.response.data?.code || "Conversation error"));
				const final = output.response?.speech?.plain?.speech;
				if (typeof final === "string" && final) raw = final;
				finish();
			}
			if (event.type === "error") finish(new Error(data.message || "Assist pipeline error"));
			if (event.type === "run-end" && !done) finish();
		}, {
			type: "assist_pipeline/run",
			start_stage: "intent",
			end_stage: "intent",
			input: { text },
			pipeline,
			...conversationId ? { conversation_id: conversationId } : {}
		}).then((callback) => {
			unsubscribe = callback;
			if (done) try {
				callback();
			} catch {}
		}).catch(finish);
	});
}
//#endregion
//#region src/markdown.js
var markdown = globalThis.markdownit({
	html: false,
	linkify: true,
	breaks: true
});
markdown.renderer.rules.image = (tokens, idx, options, env, self) => {
	const token = tokens[idx];
	const source = token.attrGet("src") || "";
	const resolved = typeof env?.resolveImageUrl === "function" ? env.resolveImageUrl(source) : null;
	const alt = self.renderInlineAsText(token.children || [], options, env);
	if (!resolved) return `<span class="md-image-blocked">[${markdown.utils.escapeHtml(alt || "Image blocked")}]</span>`;
	const title = token.attrGet("title");
	return [
		"<img src=\"",
		markdown.utils.escapeHtml(resolved),
		"\" alt=\"",
		markdown.utils.escapeHtml(alt),
		"\" loading=\"lazy\" decoding=\"async\" referrerpolicy=\"no-referrer\"",
		title ? ` title="${markdown.utils.escapeHtml(title)}"` : "",
		">"
	].join("");
};
var defaultLink = markdown.renderer.rules.link_open || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
markdown.renderer.rules.link_open = (tokens, idx, options, env, self) => {
	tokens[idx].attrSet("target", "_blank");
	tokens[idx].attrSet("rel", "noopener noreferrer");
	return defaultLink(tokens, idx, options, env, self);
};
function renderMarkdown(source, resolveImageUrl) {
	return markdown.render(safe(source), { resolveImageUrl });
}
//#endregion
//#region src/storage.js
var STORAGE_PREFIX = "conversation-chat-card:v1";
function createStorageKey(hass, config, agent) {
	if (!hass || !config) return "";
	const user = hass.user?.id || "unknown-user";
	const identity = config.backend === "home_assistant" ? agent : `${config.url}|${config.model}`;
	return `${STORAGE_PREFIX}:${user}:${config.storage_id || "default"}:${config.backend}:${identity}`;
}
function readStoredConversation(key, persistMinutes) {
	if (!key || persistMinutes <= 0) return null;
	try {
		const value = JSON.parse(localStorage.getItem(key) || "null");
		const ttl = persistMinutes * 6e4;
		if (!value || !Number.isFinite(value.lastActivity) || Date.now() - value.lastActivity > ttl || value.lastActivity > Date.now() + 6e4 || !Array.isArray(value.messages)) {
			localStorage.removeItem(key);
			return null;
		}
		return value;
	} catch {
		try {
			localStorage.removeItem(key);
		} catch {}
		return null;
	}
}
function writeStoredConversation(key, conversationId, messages) {
	localStorage.setItem(key, JSON.stringify({
		lastActivity: Date.now(),
		conversationId,
		messages: messages.filter((message) => !message.pending && ["user", "assistant"].includes(message.role)).slice(-100)
	}));
}
function clearStoredConversation(key) {
	try {
		localStorage.removeItem(key);
	} catch {}
}
//#endregion
//#region src/text-to-speech.js
async function speakText(hass, config, message) {
	const text = normalized(message);
	const ttsEntity = normalized(config.tts_entity);
	const mediaPlayer = normalized(config.tts_media_player);
	if (config.tts_auto !== true || !text || !ttsEntity || !mediaPlayer) return false;
	const data = {
		message: text,
		media_player_entity_id: mediaPlayer,
		cache: config.tts_cache !== false
	};
	const language = normalized(config.tts_language);
	if (language) data.language = language;
	await hass.callService("tts", "speak", data, { entity_id: ttsEntity });
	return true;
}
//#endregion
//#region src/conversation-chat-card.js
var TAG$1 = "conversation-chat-card";
var button = (className, label, icon, mode) => {
	const el = document.createElement("button");
	el.type = "button";
	el.className = className;
	el.setAttribute("aria-label", safe(label));
	if (mode === "icon" || mode === "both") {
		const glyph = document.createElement("ha-icon");
		glyph.setAttribute("icon", safe(icon));
		glyph.setAttribute("aria-hidden", "true");
		el.append(glyph);
	}
	if (mode !== "icon") {
		const span = document.createElement("span");
		span.textContent = safe(label);
		el.append(span);
	}
	return el;
};
var ConversationChatCard = class extends HTMLElement {
	static getStubConfig() {
		return getStubConfig();
	}
	static getConfigForm() {
		return getConfigForm();
	}
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this._cfg = null;
		this._hass = null;
		this._messages = [];
		this._conversationId = null;
		this._busy = false;
		this._agent = "";
		this._loadedKey = "";
		this._persistedBefore = false;
		this._generation = 0;
		this._activeRequest = null;
	}
	setConfig(config) {
		this._cfg = normalizeConfig(config);
		const first = this._cfg.entity || "";
		if (!this._agent || this._cfg.agent_picker === false) this._agent = first;
		this._loadedKey = "";
		this._persistedBefore = false;
		this._mount();
	}
	set hass(value) {
		this._hass = value;
		if (!this._cfg) return;
		this._updateAgentOptions();
		this._loadIfNeeded();
	}
	getCardSize() {
		return Math.ceil((Number(this._cfg?.height) || 440) / 50);
	}
	connectedCallback() {
		if (this._cfg && !this._log) this._mount();
	}
	_mount() {
		if (!this._cfg) return;
		this.shadowRoot.replaceChildren();
		const stylesheet = document.createElement("link");
		stylesheet.rel = "stylesheet";
		stylesheet.href = conversation_chat_card_default;
		const card = document.createElement("ha-card");
		card.style.height = this._cfg.height ? `${Math.max(280, Number(this._cfg.height) || 440)}px` : "440px";
		const head = document.createElement("div");
		head.className = "head";
		if (this._cfg.show_header !== false) {
			const title = document.createElement("span");
			title.className = "title";
			title.textContent = safe(this._cfg.title);
			head.append(title);
			if (this._cfg.show_remind_button === true) {
				this._remindButton = button("remind", this._cfg.remind_button_text, this._cfg.remind_button_icon, this._cfg.remind_button_mode);
				this._remindButton.addEventListener("click", () => this._remind());
				head.append(this._remindButton);
			} else this._remindButton = null;
			if (this._cfg.backend === "home_assistant" && this._cfg.show_reset_context_button === true) {
				this._resetContextButton = button("reset", this._cfg.reset_context_button_text, this._cfg.reset_context_button_icon, this._cfg.reset_context_button_mode);
				this._resetContextButton.addEventListener("click", () => this._resetContext());
				head.append(this._resetContextButton);
			} else this._resetContextButton = null;
			if (this._cfg.backend === "home_assistant" && this._cfg.agent_picker !== false) {
				this._select = document.createElement("select");
				this._select.setAttribute("aria-label", "Conversation agent");
				this._select.addEventListener("change", () => this._switchAgent(this._select.value));
				head.append(this._select);
			} else this._select = null;
			if (this._cfg.show_clear_button !== false) {
				this._clearButton = button("clear", this._cfg.clear_button_text, this._cfg.clear_button_icon, this._cfg.clear_button_mode);
				this._clearButton.addEventListener("click", () => {
					if (!this._busy) this._newChat();
				});
				head.append(this._clearButton);
			} else this._clearButton = null;
		} else {
			this._select = null;
			this._clearButton = null;
			this._remindButton = null;
			this._resetContextButton = null;
		}
		this._log = document.createElement("div");
		this._log.className = "log";
		this._log.setAttribute("role", "log");
		this._log.setAttribute("aria-live", "polite");
		const foot = document.createElement("div");
		foot.className = "foot";
		this._input = document.createElement("textarea");
		this._input.rows = 1;
		this._input.placeholder = safe(this._cfg.placeholder || "Type a message…");
		this._input.setAttribute("aria-label", "Message");
		this._input.addEventListener("keydown", (event) => {
			if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
				event.preventDefault();
				this._send();
			}
		});
		this._stopButton = this._cfg.show_stop_button === false ? null : button("stop", this._cfg.stop_button_text, this._cfg.stop_button_icon, this._cfg.stop_button_mode);
		if (this._stopButton) {
			this._stopButton.hidden = true;
			this._stopButton.addEventListener("click", () => this._stopWaiting());
		}
		const send = button("send", this._cfg.send_button_text, this._cfg.send_button_icon, this._cfg.send_button_mode);
		send.addEventListener("click", () => this._send());
		this._sendButton = send;
		foot.append(this._input);
		if (this._stopButton) foot.append(this._stopButton);
		foot.append(send);
		if (this._cfg.show_header !== false) card.append(head);
		card.append(this._log, foot);
		this.shadowRoot.append(stylesheet, card);
		this._updateAgentOptions();
		this._render();
		this._loadIfNeeded();
	}
	_agents() {
		if (!this._hass) return [];
		const allowed = Array.isArray(this._cfg.agents) ? this._cfg.agents : null;
		return Object.keys(this._hass.states || {}).filter((id) => id.startsWith("conversation.") && (!allowed || allowed.includes(id))).sort((a, b) => safe(this._hass.states[a]?.attributes?.friendly_name || a).localeCompare(safe(this._hass.states[b]?.attributes?.friendly_name || b)));
	}
	_updateAgentOptions() {
		if (!this._cfg || this._cfg.backend !== "home_assistant") return;
		const agents = this._agents();
		if (!this._agent && agents.length) this._agent = agents[0];
		if (!this._select) return;
		const options = unique([
			...agents,
			this._agent,
			this._cfg.entity
		]);
		const key = options.map((id) => `${id}:${this._hass?.states?.[id]?.attributes?.friendly_name || ""}`).join("|");
		if (this._optionsKey !== key) {
			this._select.replaceChildren();
			for (const id of options) {
				const option = document.createElement("option");
				option.value = id;
				option.textContent = this._hass?.states?.[id]?.attributes?.friendly_name || id;
				this._select.append(option);
			}
			this._optionsKey = key;
		}
		if (this._agent) this._select.value = this._agent;
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
		this._loadedKey = "";
		this._persistedBefore = false;
		this._loadIfNeeded();
		this._render();
	}
	_scope() {
		return createStorageKey(this._hass, this._cfg, this._agent);
	}
	_readStored(key) {
		return readStoredConversation(key, this._cfg.persist_minutes);
	}
	_loadIfNeeded() {
		const key = this._scope();
		if (!key || key === this._loadedKey || !this._log) return;
		this._loadedKey = key;
		const value = this._readStored(key);
		this._persistedBefore = Boolean(value);
		this._messages = value ? value.messages.filter((m) => m && ["user", "assistant"].includes(m.role) && typeof m.text === "string").slice(-100) : [];
		this._conversationId = value && typeof value.conversationId === "string" ? value.conversationId : null;
		this._render();
	}
	_save() {
		const key = this._scope();
		if (!key || this._cfg.persist_minutes <= 0) return;
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
		} catch (error) {
			console.warn(TAG$1, "Could not save conversation", error);
		}
	}
	_expireBeforeSend() {
		const key = this._scope();
		if (!key || this._cfg.persist_minutes <= 0) return;
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
		if (this._busy || this._cfg.backend !== "home_assistant") return;
		this._conversationId = null;
		this._save();
		this._render();
		this._input?.focus();
	}
	_stopWaiting() {
		const request = this._activeRequest;
		if (!this._busy || !request) return;
		request.cancelled = true;
		++this._generation;
		try {
			request.controller.abort();
		} catch {}
		try {
			request.cancelTransport?.();
		} catch {}
		this._messages = this._messages.filter((message) => message !== request.reply);
		this._activeRequest = null;
		this._busyState(false);
		this._render();
		this._save();
	}
	_busyState(busy) {
		this._busy = busy;
		this._sendButton.disabled = busy;
		this._input.disabled = busy;
		if (this._select) this._select.disabled = busy;
		if (this._clearButton) this._clearButton.disabled = busy;
		if (this._remindButton) this._remindButton.disabled = busy || !this._reminderMessages().length;
		if (this._resetContextButton) this._resetContextButton.disabled = busy || !this._conversationId;
		if (this._stopButton) this._stopButton.hidden = !busy;
		if (!busy) this._input.focus();
	}
	_imagePatternMatches(url, pattern) {
		try {
			if (pattern.startsWith("re:")) return new RegExp(pattern.slice(3)).test(url);
			const expression = pattern.replace(/[.+^$|(){}[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
			return new RegExp(`^${expression}$`).test(url);
		} catch (error) {
			console.warn(TAG$1, `Ignoring invalid image allowlist pattern: ${pattern}`, error);
			return false;
		}
	}
	_resolveImageUrl(source) {
		try {
			const base = globalThis.location?.href;
			if (!base) return null;
			const url = new URL(source, base);
			if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
			if (url.origin === globalThis.location.origin) return this._cfg.allow_local_images === true ? url.href : null;
			if (this._cfg.allow_remote_images !== true || !this._cfg.image_url_allowlist.length) return null;
			return this._cfg.image_url_allowlist.some((pattern) => this._imagePatternMatches(url.href, pattern)) ? url.href : null;
		} catch {
			return null;
		}
	}
	_markdown(source) {
		return renderMarkdown(source, (url) => this._resolveImageUrl(url));
	}
	_render() {
		if (!this._log) return;
		this._log.replaceChildren();
		if (this._cfg.welcome) {
			const greeting = document.createElement("div");
			greeting.className = "bubble assistant";
			const body = document.createElement("div");
			body.className = "md";
			body.innerHTML = this._markdown(this._cfg.welcome);
			greeting.append(body);
			this._log.append(greeting);
		} else if (!this._messages.length) {
			const hint = document.createElement("div");
			hint.className = "hint";
			hint.textContent = safe(this._cfg.welcome || "Start a conversation");
			this._log.append(hint);
		}
		for (const msg of this._messages) {
			const bubble = document.createElement("div");
			bubble.className = `bubble ${msg.role}`;
			if (msg.role === "user" || msg.role === "error") bubble.textContent = msg.text;
			else {
				if (msg.thinking && this._cfg.show_thinking !== false) {
					const details = document.createElement("details");
					details.open = Boolean(this._cfg.thinking_open);
					const summary = document.createElement("summary");
					summary.textContent = "Thinking";
					const thought = document.createElement("div");
					thought.className = "md";
					thought.innerHTML = this._markdown(msg.thinking);
					details.append(summary, thought);
					bubble.append(details);
				}
				if (msg.pending && (this._cfg.show_working_bubbles !== false || normalized(this._cfg.working_message))) {
					const status = document.createElement("div");
					status.className = "status";
					if (this._cfg.show_working_bubbles !== false) {
						const dots = document.createElement("span");
						dots.className = "dots";
						dots.setAttribute("aria-hidden", "true");
						for (let i = 0; i < 3; i++) dots.append(document.createElement("i"));
						status.append(dots);
					}
					if (normalized(this._cfg.working_message)) {
						const label = document.createElement("span");
						label.textContent = safe(this._cfg.working_message);
						status.append(label);
					}
					bubble.append(status);
				}
				if (msg.text) {
					const body = document.createElement("div");
					body.className = "md";
					body.innerHTML = this._markdown(msg.text);
					bubble.append(body);
				}
			}
			if (bubble.children.length || msg.role === "user" || msg.role === "error") this._log.append(bubble);
		}
		if (this._remindButton) this._remindButton.disabled = this._busy || !this._reminderMessages().length;
		if (this._resetContextButton) this._resetContextButton.disabled = this._busy || !this._conversationId;
		this._log.scrollTop = this._log.scrollHeight;
	}
	_splitThinking(message) {
		const source = safe(message.raw || message.text);
		if (!source.includes("<think>") && !source.includes("</think>")) return;
		const chunks = source.split(/(<\/?think>)/i);
		let inside = false, answer = "", thinking = "";
		for (const chunk of chunks) {
			if (/^<think>$/i.test(chunk)) {
				inside = true;
				continue;
			}
			if (/^<\/think>$/i.test(chunk)) {
				inside = false;
				continue;
			}
			if (inside) thinking += chunk;
			else answer += chunk;
		}
		message.text = answer;
		message.thinking = [message.explicitThinking || "", thinking].filter(Boolean).join("\n");
	}
	_appendDelta(message, delta) {
		if (delta.thinking_content || delta.reasoning_content || delta.reasoning) {
			message.explicitThinking = (message.explicitThinking || "") + safe(delta.thinking_content || delta.reasoning_content || delta.reasoning);
			message.thinking = message.explicitThinking;
		}
		if (typeof delta.content === "string") {
			message.raw = (message.raw || "") + delta.content;
			message.text = message.raw;
			this._splitThinking(message);
		}
		if (delta.tool_calls) message.status = "Using tools";
		this._render();
	}
	_reminderMessages() {
		return this._messages.filter((msg) => !msg.pending && !msg.reminder && (msg.role === "user" || msg.role === "assistant") && normalized(msg.text));
	}
	_remind() {
		if (this._busy) return;
		this._expireBeforeSend();
		const messages = this._reminderMessages();
		if (!messages.length) return;
		const prompt = safe(this._cfg.remind_prompt || "Here is a reminder of our conversation so far. Use it as context for your next response. Do not repeat the transcript unless asked.");
		const transcript = messages.map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.text}`).join("\n\n");
		return this._send(`${prompt}\n\n${transcript}`, true);
	}
	async _send(overrideText, reminder = false) {
		if (this._busy || !this._hass) return;
		const text = normalized(overrideText === void 0 ? this._input.value : overrideText);
		if (!text) return;
		this._expireBeforeSend();
		if (this._cfg.backend === "home_assistant" && !this._agent) {
			this._showError("No conversation agent is available");
			return;
		}
		if (!reminder) this._input.value = "";
		this._messages.push({
			role: "user",
			text: reminder ? safe(this._cfg.remind_button_text) : text,
			reminder
		});
		const reply = {
			role: "assistant",
			text: "",
			thinking: "",
			pending: true
		};
		this._messages.push(reply);
		this._render();
		this._busyState(true);
		this._save();
		const request = {
			generation: this._generation,
			reply,
			cancelled: false,
			controller: new AbortController(),
			cancelTransport: null
		};
		this._activeRequest = request;
		try {
			if (this._cfg.backend === "chat_completions") await this._chatCompletions(reply, reminder ? text : null, request);
			else {
				const pipeline = this._pipelineForAgent();
				if (pipeline) await this._runPipeline(text, pipeline, reply, request);
				else await this._conversationProcess(text, reply, request);
			}
			if (request.cancelled) return;
			if (!reply.text && !reply.thinking) reply.text = "(No response)";
		} catch (error) {
			if (!request.cancelled) {
				reply.role = "error";
				reply.text = error?.message || safe(error);
				reply.thinking = "";
			}
		} finally {
			reply.pending = false;
			if (this._activeRequest === request) this._activeRequest = null;
			if (!request.cancelled && request.generation === this._generation) {
				this._busyState(false);
				this._render();
				this._save();
				if (reply.role === "assistant") this._speakReply(reply.text);
			}
		}
	}
	async _speakReply(markdown) {
		const content = document.createElement("div");
		content.innerHTML = this._markdown(markdown);
		for (const lineBreak of content.querySelectorAll("br")) lineBreak.replaceWith(" ");
		for (const block of content.querySelectorAll("p, li, blockquote, pre, h1, h2, h3, h4, h5, h6")) block.append(" ");
		try {
			await speakText(this._hass, this._cfg, content.textContent);
		} catch (error) {
			console.warn(TAG$1, "Could not speak assistant reply", error);
		}
	}
	_pipelineForAgent() {
		return pipelineForAgent(this._cfg, this._agent);
	}
	async _conversationProcess(text, reply, request) {
		const result = await runConversationProcess({
			hass: this._hass,
			text,
			agent: this._agent,
			conversationId: this._conversationId,
			request
		});
		if (!result) return;
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
			onStatus: (status) => {
				reply.status = status;
				this._render();
			},
			onDelta: (delta) => {
				this._appendDelta(reply, delta);
			}
		});
		if (request.cancelled || !result) return;
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
			onDelta: (delta) => this._appendDelta(reply, delta)
		});
		if (!result) return;
		reply.raw = result.raw;
		reply.text = reply.raw;
		reply.explicitThinking = result.explicitThinking;
		reply.thinking = reply.explicitThinking;
		this._splitThinking(reply);
	}
	_showError(message) {
		this._messages.push({
			role: "error",
			text: message
		});
		this._render();
	}
};
//#endregion
//#region src/index.js
var TAG = "conversation-chat-card";
if (!customElements.get(TAG)) {
	customElements.define(TAG, ConversationChatCard);
	window.customCards = window.customCards || [];
	window.customCards.push({
		type: TAG,
		name: "Conversation Chat Card",
		description: "Markdown chat with Home Assistant conversation agents or Chat Completions.",
		preview: true
	});
}
//#endregion
