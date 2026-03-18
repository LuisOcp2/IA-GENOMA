/**
 * IA-GENOMA - Servicio de grabación de audio
 */

import AudioRecord from 'react-native-audio-record';
import RNFS from 'react-native-fs';

const AUDIO_CONFIG = {
  sampleRate: 16000,
  channels: 1,
  bitsPerSample: 16,
  audioSource: 1, // 1 = MIC (default, compatible con todos los Android)
               // 6 = VOICE_RECOGNITION (puede fallar en algunos dispositivos)
  wavFile: 'genoma_command.wav',
};

let isInitialized = false;

export function initAudioRecorder() {
  if (!isInitialized) {
    AudioRecord.init(AUDIO_CONFIG);
    isInitialized = true;
    console.log('[AUDIO] Grabador inicializado con MIC source 1');
  }
}

export function startRecording() {
  initAudioRecorder();
  AudioRecord.start();
  console.log('[AUDIO] Grabación iniciada');
}

export async function stopRecording() {
  const audioFile = await AudioRecord.stop();
  console.log('[AUDIO] Grabación detenida:', audioFile);

  // Verificar que el archivo no esté vacío
  try {
    const stat = await RNFS.stat(audioFile);
    console.log('[AUDIO] Tamaño del archivo:', stat.size, 'bytes');
    if (stat.size < 1000) {
      console.warn('[AUDIO] ⚠️ Archivo muy pequeño, puede fallar STT');
    }
  } catch (e) {
    console.warn('[AUDIO] No se pudo verificar el archivo:', e);
  }

  return audioFile;
}

export function onAudioData(callback) {
  AudioRecord.on('data', data => {
    callback(data);
  });
}

export async function deleteRecording(filePath) {
  try {
    const exists = await RNFS.exists(filePath);
    if (exists) {
      await RNFS.unlink(filePath);
    }
  } catch (e) {
    console.warn('[AUDIO] No se pudo borrar:', e);
  }
}
