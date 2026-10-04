import { normalized } from './utils.js';

const DEFAULT_CONFIG = {
  backend: 'home_assistant',
  title: 'Conversation',
  stream: true,
  show_working_bubbles: true,
  show_header: true,
  show_clear_button: true,
  show_remind_button: false,
  show_reset_context_button: false,
  show_stop_button: true,
  allow_local_images: false,
  allow_remote_images: false,
  clear_button_text: 'Clear chat',
  clear_button_icon: 'mdi:delete-outline',
  clear_button_mode: 'text',
  remind_button_text: 'Remind agent',
  remind_button_icon: 'mdi:refresh',
  remind_button_mode: 'text',
  reset_context_button_text: 'Reset context',
  reset_context_button_icon: 'mdi:restart',
  reset_context_button_mode: 'text',
  stop_button_text: 'Stop',
  stop_button_icon: 'mdi:stop',
  stop_button_mode: 'text',
  send_button_text: 'Send',
  send_button_icon: 'mdi:send',
  send_button_mode: 'text',
  working_message: '',
};

export function getStubConfig() {
  return {
    backend: 'home_assistant',
    agent_picker: true,
    show_header: true,
    show_clear_button: true,
    show_stop_button: true,
    show_working_bubbles: true,
    show_thinking: true,
    allow_local_images: false,
    allow_remote_images: false,
    send_button_mode: 'text',
    clear_button_mode: 'text',
    remind_button_mode: 'text',
    reset_context_button_mode: 'text',
    stop_button_mode: 'text',
  };
}

export function getConfigForm() {
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
      group('reset_context_button', 'Reset context button', [toggle('show_reset_context_button'), text('reset_context_button_text'), icon('reset_context_button_icon'), mode('reset_context_button_mode')]),
      group('stop_button', 'Stop waiting button', [toggle('show_stop_button'), text('stop_button_text'), icon('stop_button_icon'), mode('stop_button_mode')]),
      group('storage', 'Conversation storage', [{ name: 'persist_minutes', selector: { number: { min: 0, mode: 'box', step: 'any', unit_of_measurement: 'min' } } }, text('storage_id')]),
      group('images', 'Markdown images', [toggle('allow_local_images'), toggle('allow_remote_images'), { name: 'image_url_allowlist', selector: { text: { multiple: true } } }]),
      group('assist', 'Assist streaming', [{ name: 'pipeline_id', selector: { assist_pipeline: {} } }, { name: 'pipelines', selector: { object: {} } }]),
      group('completions', 'Chat Completions', [text('url'), text('model'), { name: 'token', selector: { text: { type: 'password' } } }, toggle('stream'), multiline('system_prompt'), { name: 'headers', selector: { object: {} } }, { name: 'parameters', selector: { object: {} } }]),
    ],
    computeLabel: field => ({ backend: 'Backend', entity: 'Conversation agent', agent_picker: 'Show agent picker', agents: 'Allowed agents', title: 'Title', placeholder: 'Input placeholder', welcome: 'Welcome message', height: 'Card height', show_header: 'Show header', show_thinking: 'Show thinking', thinking_open: 'Expand thinking by default', working_message: 'Waiting message', show_working_bubbles: 'Show waiting dots', show_clear_button: 'Show Clear chat', show_remind_button: 'Show Remind agent', show_reset_context_button: 'Show Reset context', show_stop_button: 'Show while waiting', clear_button_text: 'Button text', remind_button_text: 'Button text', reset_context_button_text: 'Button text', stop_button_text: 'Button text', send_button_text: 'Button text', clear_button_icon: 'Icon', remind_button_icon: 'Icon', reset_context_button_icon: 'Icon', stop_button_icon: 'Icon', send_button_icon: 'Icon', clear_button_mode: 'Display', remind_button_mode: 'Display', reset_context_button_mode: 'Display', stop_button_mode: 'Display', send_button_mode: 'Display', remind_prompt: 'Reminder instruction', allow_local_images: 'Allow local images', allow_remote_images: 'Allow remote images', image_url_allowlist: 'Remote URL allowlist', persist_minutes: 'Keep chat for (minutes)', storage_id: 'Storage ID', pipeline_id: 'Assist pipeline (same agent)', pipelines: 'Pipeline per agent', url: 'Endpoint URL', model: 'Model', token: 'Bearer token', stream: 'Stream response', system_prompt: 'System prompt', headers: 'Additional headers', parameters: 'Additional request parameters' })[field.name],
    computeHelper: field => ({ entity: 'Pick the initial conversation agent. Leave blank to use the first available.', agents: 'Leave blank to show all agents.', image_url_allowlist: 'Full-URL glob patterns, or regular expressions prefixed with re:. Empty denies remote images.', persist_minutes: '0 disables storage. Existing persist_hours YAML is still accepted.', pipeline_id: 'Choose a pipeline configured for the selected conversation agent.', pipelines: 'Map conversation entity IDs to Assist pipeline IDs (YAML object).', token: 'Stored in the dashboard configuration and sent directly by your browser.', remind_prompt: 'Sent before the transcript when you press Remind agent.' })[field.name],
  };
}

export function normalizeConfig(config) {
  if (!config || (config.backend && !['home_assistant', 'chat_completions'].includes(config.backend))){ 
    throw new Error('backend must be home_assistant or chat_completions');
  }
  if (config.backend === 'chat_completions' && (!config.url || !config.model)) {
    throw new Error('Chat Completions requires url and model');
  }
  const minutes = config.persist_minutes ?? (config.persist_hours == null ? 0 : Number(config.persist_hours) * 60);
  if (!Number.isFinite(Number(minutes)) || Number(minutes) < 0){ 
    throw new Error('persist_minutes must be >= 0');
  }
  for (const name of ['clear_button_mode', 'remind_button_mode', 'reset_context_button_mode', 'stop_button_mode', 'send_button_mode']) {
    if (config[name] != null && !['text', 'icon', 'both'].includes(config[name])) {
      throw new Error(`${name} must be text, icon or both`);
    }
  }
  const imageAllowlist = config.image_url_allowlist == null ? [] : 
  (Array.isArray(config.image_url_allowlist) ? 
    config.image_url_allowlist : [config.image_url_allowlist]).map(normalized).filter(Boolean);
  return { ...DEFAULT_CONFIG, ...config, image_url_allowlist: imageAllowlist, persist_minutes: Number(minutes) };
}
