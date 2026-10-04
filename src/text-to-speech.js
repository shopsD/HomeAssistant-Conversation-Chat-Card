import { normalized } from './utils.js';

export async function speakText(hass, config, message) {
  const text = normalized(message);
  const ttsEntity = normalized(config.tts_entity);
  const mediaPlayer = normalized(config.tts_media_player);

  if (config.tts_auto !== true || !text || !ttsEntity || !mediaPlayer) {
    return false;
  }

  const data = {
    message: text,
    media_player_entity_id: mediaPlayer,
    cache: config.tts_cache !== false,
  };
  const language = normalized(config.tts_language);
  if (language) {
    data.language = language;
  }

  await hass.callService('tts', 'speak', data, { entity_id: ttsEntity });
  return true;
}
