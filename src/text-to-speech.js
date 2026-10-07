import { normalized } from './utils.js';

export function canSpeak(hass, config) {
  if (!normalized(config.tts_entity)) {
    return false;
  }
  if (config.tts_current_browser === true) {
    return typeof hass?.callApi === 'function';
  }
  return typeof hass?.callService === 'function' && Boolean(normalized(config.tts_media_player));
}

export async function speakText(hass, config, message, playBrowserAudio) {
  const text = normalized(message);
  const ttsEntity = normalized(config.tts_entity);
  const mediaPlayer = normalized(config.tts_media_player);

  if (!text || !canSpeak(hass, config)) {
    return false;
  }

  const data = {
    message: text,
    cache: config.tts_cache !== false,
  };
  const language = normalized(config.tts_language);
  if (language) {
    data.language = language;
  }
  const voice = normalized(config.tts_voice);
  if (voice) {
    data.options = { voice };
  }

  if (config.tts_current_browser === true) {
    const result = await hass.callApi('POST', 'tts_get_url', {
      engine_id: ttsEntity,
      ...data,
    });
    const source = result.path && hass.hassUrl ? hass.hassUrl(result.path) : result.url;
    if (!source || typeof playBrowserAudio !== 'function') {
      throw new Error('Home Assistant did not return a playable TTS URL');
    }
    await playBrowserAudio(source);
    return true;
  }

  data.media_player_entity_id = mediaPlayer;
  await hass.callService('tts', 'speak', data, { entity_id: ttsEntity });
  return true;
}
