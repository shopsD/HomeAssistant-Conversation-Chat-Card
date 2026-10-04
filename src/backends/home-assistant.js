import { safe } from '../utils.js';

export function pipelineForAgent(config, agent) {
  const mapping = config.pipelines;
  return (mapping && typeof mapping === 'object' && mapping[agent]) || (agent === config.entity ? config.pipeline_id : null);
}

export async function runConversationProcess({ hass, text, agent, conversationId, request }) {
  const result = await hass.connection.sendMessagePromise({
    type: 'conversation/process',
    text,
    agent_id: agent,
    language: hass.language,
    ...(conversationId ? { conversation_id: conversationId } : {}),
  });
  if (request.cancelled) {return null;}
  const response = result?.response;
  if (response?.response_type === 'error'){
    throw new Error(response.speech?.plain?.speech || response.data?.code || 'Conversation error');
  }
  return {
    conversationId: result?.conversation_id || conversationId,
    raw: safe(response?.speech?.plain?.speech || ''),
  };
}

export function runAssistPipeline({ hass, text, pipeline, conversationId, request, onStatus, onDelta }) {
  return new Promise((resolve, reject) => {
    let unsubscribe = null;
    let done = false;
    let nextConversationId = conversationId;
    let raw = '';
    const finish = error => {
      if (done) return;
      done = true;
      if (unsubscribe) { try { unsubscribe(); } catch {} }
      if (error) {
        reject(error); 
      }else {
        resolve({ conversationId: nextConversationId, raw });
      }
    };
    request.cancelTransport = () => finish();
    hass.connection.subscribeMessage(event => {
      if (done || request.cancelled) {return;}
      const data = event?.data || {};
      if (event.type === 'run-start') {onStatus('Processing');}
      if (event.type === 'intent-start') {onStatus('Agent is responding');}
      if (event.type === 'intent-progress') {onDelta(data.chat_log_delta || {});}
      if (event.type === 'intent-end') {
        const output = data.intent_output || {};
        if (output.conversation_id) {nextConversationId = output.conversation_id;}
        if (output.response?.response_type === 'error'){
          return finish(new Error(output.response.speech?.plain?.speech || output.response.data?.code || 'Conversation error'));
        }
        const final = output.response?.speech?.plain?.speech;
        if (typeof final === 'string' && final) {raw = final;}
        finish();
      }
      if (event.type === 'error') {finish(new Error(data.message || 'Assist pipeline error'));}
      if (event.type === 'run-end' && !done) {finish();}
    }, {
      type: 'assist_pipeline/run',
      start_stage: 'intent',
      end_stage: 'intent',
      input: { text },
      pipeline,
      ...(conversationId ? { conversation_id: conversationId } : {})
    }).then(callback => {
      unsubscribe = callback;
      if (done) { 
        try { callback(); } catch {}
      }
    }).catch(finish);
  });
}
