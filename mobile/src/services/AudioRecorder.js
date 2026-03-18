/**
 * IA-GENOMA - Servicio de grabación de audio
 */

import AudioRecord from 'react-native-audio-record';
import RNFS from 'react-native-fs';

const AUDIO_CONFIG = {
  sampleRate: 16000,
  channels: 1,
  bitsPerSample: 16,
  audioSource: 6, // MIC
  wavFile: 'genoma_command.wav',
};

let isInitialized = false;

export function initAudioRecorder() {
  if (!isInitialized) {
    AudioRecord.init(AUDIO_CONFIG);
    isInitialized = true;
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
  return audioFile;
}

export function onAudioData(callback) {
  AudioRecord.on('data', data => {
    // data es base64 del chunk de audio
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
