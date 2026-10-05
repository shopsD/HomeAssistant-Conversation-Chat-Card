class HaCardMock extends HTMLElement {}

class HaIconMock extends HTMLElement {
  connectedCallback() {
    this.title = this.getAttribute('icon') || '';
    this.textContent = '◆';
  }
}

if (!customElements.get('ha-card')) customElements.define('ha-card', HaCardMock);
if (!customElements.get('ha-icon')) customElements.define('ha-icon', HaIconMock);

window.Audio = class AudioMock extends EventTarget {
  constructor(source) {
    super();
    this.src = source;
  }

  pause() {}

  async play() {
    window.__lastAudioSource = this.src;
  }
};

Object.defineProperty(navigator, 'clipboard', {
  configurable: true,
  value: {
    async writeText(text) {
      window.__lastCopiedText = text;
      document.documentElement.dataset.lastCopiedText = text;
    },
  },
});

const entryModule = new URLSearchParams(window.location.search).has('dist')
  ? `../dist/conversation-chat-card.js${window.location.search}`
  : '../src/index.js';
await import(/* @vite-ignore */ entryModule);
await customElements.whenDefined('conversation-chat-card');

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const card = document.querySelector('conversation-chat-card');

card.setConfig({
  type: 'custom:conversation-chat-card',
  entity: 'conversation.home_assistant',
  title: 'Development Assistant',
  placeholder: 'Test the card…',
  welcome: 'This card is running from the local npm development server.',
  show_thinking: true,
  show_clear_button: true,
  show_remind_button: true,
  show_stop_button: true,
  tts_auto: true,
  tts_entity: 'tts.mock_voice',
  tts_media_player: 'media_player.mock_speaker',
  tts_voice: 'mock-voice-name',
  tts_current_browser: true,
  show_speak_buttons: true,
  speak_button_size: 'tiny',
  show_speak_last_button: true,
  show_message_copy_button: true,
  show_response_copy_button: true,
  show_copy_conversation_button: true,
});

card.hass = {
  language: 'en',
  user: { id: 'local-developer' },
  states: {
    'conversation.home_assistant': {
      attributes: { friendly_name: 'Home Assistant (mock)' },
    },
    'conversation.demo_agent': {
      attributes: { friendly_name: 'Demo agent' },
    },
    'tts.mock_voice': {
      attributes: { friendly_name: 'Mock voice' },
    },
    'media_player.mock_speaker': {
      attributes: { friendly_name: 'Mock speaker' },
    },
  },
  async callService(domain, service, data, target) {
    const call = { domain, service, data, target };
    window.__lastServiceCall = call;
    document.documentElement.dataset.lastServiceCall = JSON.stringify(call);
  },
  async callApi(method, path, data) {
    window.__lastApiCall = { method, path, data };
    return { path: '/api/tts_proxy/mock-audio' };
  },
  hassUrl(path) {
    return new URL(path, window.location.origin).href;
  },
  connection: {
    async sendMessagePromise(message) {
      await delay(350);
      return {
        conversation_id: 'local-development-conversation',
        response: {
          response_type: 'action_done',
          speech: {
            plain: {
              speech: `Mock reply to **${message.text}** from \`${message.agent_id}\`.`,
            },
          },
        },
      };
    },
    async subscribeMessage() {
      return () => {};
    },
  },
};
