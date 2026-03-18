/**
 * IA-GENOMA - Servicio de Wake Word
 *
 * Implementación usando detección por energía de audio como alternativa
 * gratuita mientras se configura Picovoice Porcupine.
 *
 * Para activar Porcupine (recomendado):
 * 1. Ve a https://console.picovoice.ai/ y crea cuenta gratuita
 * 2. Descarga tu modelo para la palabra "Genoma" o cualquier custom word
 * 3. npm install @picovoice/porcupine-react-native
 * 4. Descomenta el código de Porcupine abajo
 */

import {NativeModules, NativeEventEmitter} from 'react-native';

// ─────────────────────────────────────────────
// MODO 1: Botón de activación (sin wake word)
// Más simple, sin Porcupine, funciona ya mismo
// ─────────────────────────────────────────────
export const ACTIVATION_MODE = {
  BUTTON: 'button',      // Mantén presionado el botón
  WAKE_WORD: 'wake_word', // Di "Genoma" para activar
};

let currentMode = ACTIVATION_MODE.BUTTON;

export function setActivationMode(mode) {
  currentMode = mode;
}

export function getActivationMode() {
  return currentMode;
}

// ─────────────────────────────────────────────
// MODO 2: Porcupine Wake Word (descomentar cuando tengas la API key de Picovoice)
// ─────────────────────────────────────────────
/*
import {
  Porcupine,
  BuiltInKeywords,
} from '@picovoice/porcupine-react-native';

const PICOVOICE_ACCESS_KEY = 'TU_ACCESS_KEY_DE_PICOVOICE';

let porcupine = null;
let wakeWordCallback = null;

export async function startWakeWordDetection(onWakeWord) {
  wakeWordCallback = onWakeWord;
  try {
    porcupine = await Porcupine.fromBuiltInKeywords(
      PICOVOICE_ACCESS_KEY,
      [BuiltInKeywords.COMPUTER], // Cambia por tu keyword custom
    );
    await porcupine.start();
    console.log('[WAKE WORD] Porcupine activo, escuchando...');
  } catch (e) {
    console.error('[WAKE WORD] Error:', e);
  }
}

export async function stopWakeWordDetection() {
  if (porcupine) {
    await porcupine.stop();
    await porcupine.delete();
    porcupine = null;
  }
}
*/
