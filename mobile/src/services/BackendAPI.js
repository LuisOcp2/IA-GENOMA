/**
 * IA-GENOMA - Servicio de comunicación con el Backend
 */

import axios from 'axios';
import {BACKEND_URL, API_HEADERS, AGENT_CONFIG} from '../config/api';

const client = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000,
  headers: API_HEADERS,
});

/**
 * Envía audio al backend y obtiene respuesta del agente
 * @param {string} audioFilePath - Ruta al archivo de audio grabado
 * @returns {Promise<{response_text, audio_url, actions}>}
 */
export async function sendVoiceToAgent(audioFilePath) {
  const formData = new FormData();
  formData.append('audio', {
    uri: `file://${audioFilePath}`,
    type: 'audio/wav',
    name: 'command.wav',
  });
  formData.append('session_id', AGENT_CONFIG.sessionId);

  const response = await client.post('/voice', formData, {
    headers: {
      ...API_HEADERS,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

/**
 * Envía texto directamente al agente
 * @param {string} text - Texto del comando
 * @returns {Promise<{response_text, audio_url, actions}>}
 */
export async function sendTextToAgent(text) {
  const response = await client.post('/text', {
    text,
    session_id: AGENT_CONFIG.sessionId,
    respond_with_audio: true,
  });
  return response.data;
}

/**
 * Obtiene la URL completa del audio de respuesta
 */
export function getAudioUrl(audioPath) {
  return `${BACKEND_URL}${audioPath}`;
}

/**
 * Limpia la memoria de conversación
 */
export async function clearMemory() {
  await client.delete(`/memory/${AGENT_CONFIG.sessionId}`);
}

/**
 * Verifica que el backend esté disponible
 */
export async function healthCheck() {
  try {
    const response = await client.get('/health');
    return response.data;
  } catch (e) {
    return null;
  }
}
