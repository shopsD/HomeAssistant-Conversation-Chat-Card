const STORAGE_PREFIX = 'conversation-chat-card:v1';

export function createStorageKey(hass, config, agent) {
  if (!hass || !config) return '';
  const user = hass.user?.id || 'unknown-user';
  const identity = config.backend === 'home_assistant' ? agent : `${config.url}|${config.model}`;
  return `${STORAGE_PREFIX}:${user}:${config.storage_id || 'default'}:${config.backend}:${identity}`;
}

export function readStoredConversation(key, persistMinutes) {
  if (!key || persistMinutes <= 0){ return null;}
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    const ttl = persistMinutes * 60000;
    if (!value 
      || !Number.isFinite(value.lastActivity) 
      || Date.now() - value.lastActivity > ttl 
      || value.lastActivity > Date.now() + 60000 
      || !Array.isArray(value.messages)) {
      localStorage.removeItem(key);
      return null;
    }
    return value;
  } catch {
    try { localStorage.removeItem(key); } catch {}
    return null;
  }
}

export function writeStoredConversation(key, conversationId, messages) {
  localStorage.setItem(key, JSON.stringify({
    lastActivity: Date.now(),
    conversationId,
    messages: messages.filter(message => !message.pending && ['user', 'assistant'].includes(message.role)).slice(-100),
  }));
}

export function clearStoredConversation(key) {
  try { localStorage.removeItem(key); } catch {}
}
