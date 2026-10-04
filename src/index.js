import '/dist/markdown-it.umd.min.js';
import { ConversationChatCard } from './conversation-chat-card.js';

const TAG = 'conversation-chat-card';

if (!customElements.get(TAG)) {
  customElements.define(TAG, ConversationChatCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: TAG,
    name: 'Conversation Chat Card',
    description: 'Markdown chat with Home Assistant conversation agents or Chat Completions.',
    preview: true,
  });
}
