/**
 * IA-GENOMA - Reproductor de audio para respuestas TTS
 */

import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';
import axios from 'axios';
import {BACKEND_URL, API_HEADERS} from '../config/api';

Sound.setCategory('Playback');

/**
 * Descarga y reproduce el audio de respuesta del backend
 * @param {string} audioUrl - URL relativa del audio (ej: /audio/uuid.mp3)
 * @returns {Promise<void>}
 */
export async function playResponseAudio(audioUrl) {
  try {
    const fullUrl = `${BACKEND_URL}${audioUrl}`;
    const localPath = `${RNFS.CachesDirectoryPath}/genoma_response.mp3`;

    // Descargar audio
    await RNFS.downloadFile({
      fromUrl: fullUrl,
      toFile: localPath,
      headers: API_HEADERS,
    }).promise;

    // Reproducir
    return new Promise((resolve, reject) => {
      const sound = new Sound(localPath, '', error => {
        if (error) {
          console.error('[SOUND] Error cargando audio:', error);
          reject(error);
          return;
        }
        sound.play(success => {
          sound.release();
          if (success) {
            resolve();
          } else {
            reject(new Error('Reproducción fallida'));
          }
        });
      });
    });
  } catch (e) {
    console.error('[SOUND] Error:', e);
  }
}
