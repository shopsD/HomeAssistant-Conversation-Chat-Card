import { safe } from '../utils.js';

export async function runChatCompletions({ config, conversation, reminderText, request, onDelta }) {
  const headers = { 'Content-Type': 'application/json', ...(config.headers || {}) };
  if (config.token) {
    headers.Authorization = /^Bearer\s/i.test(config.token) ? config.token : `Bearer ${config.token}`;
  }
  const messages = [];
  if (config.system_prompt){
    messages.push({ role: 'system', content: safe(config.system_prompt) });
  }
  for (const message of conversation) {
    if (message.role === 'user' || (message.role === 'assistant' && !message.pending)) {
      messages.push({
        role: message.role,
        content: reminderText != null && message === conversation.at(-2) && message.reminder ? reminderText : message.text,
      });
    }
  }
  const response = await fetch(config.url, {
    method: 'POST',
    headers,
    signal: request.controller.signal,
    body: JSON.stringify({ model: config.model, messages, stream: config.stream !== false, ...(config.parameters || {}) }),
  });
  if (request.cancelled) {return null;}
  if (!response.ok) {
    throw new Error(`Chat Completions HTTP ${response.status}`);
  }
  const type = response.headers.get('content-type') || '';
  if (config.stream === false || !type.includes('text/event-stream') || !response.body) {
    const data = await response.json();
    const choice = data?.choices?.[0];
    if (choice?.message?.tool_calls?.length) {
      throw new Error('The endpoint requested tool calls, which this card cannot execute');
    }
    return {
      raw: safe(choice?.message?.content || ''),
      explicitThinking: safe(choice?.message?.reasoning_content || choice?.message?.thinking_content || ''),
    };
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let ended = false;
  let sawTools = false;
  try {
    while (!ended) {
      const { value, done } = await reader.read();
      if (done){ break;}
      if (request.cancelled) {return null;}
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      const frames = buffer.split('\n\n');
      buffer = frames.pop();
      for (const frame of frames) {
        const payload = frame.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
        if (!payload){ continue;}
        if (payload.trim() === '[DONE]') { 
          ended = true; 
          break; }
        let data;
        try { data = JSON.parse(payload); } catch { continue; }
        if (data.error) {
          throw new Error(data.error.message || 'Streaming error');
        }
        const choice = data.choices?.[0];
        if (choice?.delta?.tool_calls?.length) {sawTools = true;}
        if (choice?.delta){ onDelta(choice.delta);}
      }
    }
  } finally {
    reader.releaseLock();
  }
  if (sawTools) {
    throw new Error('The endpoint requested tool calls, which this card cannot execute');
  }
  return null;
}
