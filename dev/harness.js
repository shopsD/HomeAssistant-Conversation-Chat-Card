class HaCardMock extends HTMLElement {}

class HaIconMock extends HTMLElement {
  connectedCallback() {
    this.textContent = this.getAttribute('icon') || '';
  }
}

if (!customElements.get('ha-card')) customElements.define('ha-card', HaCardMock);
if (!customElements.get('ha-icon')) customElements.define('ha-icon', HaIconMock);

const entryModule = new URLSearchParams(window.location.search).has('dist')
  ? '../dist/conversation-chat-card.js'
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
  show_stop_button: true,
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
