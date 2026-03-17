/**
 * IA-GENOMA - Configuración de API
 * Cambia BACKEND_URL por tu URL de Cloudflare Tunnel o IP local
 */

// Si corres el backend localmente y el celular está en la misma red WiFi:
// export const BACKEND_URL = 'http://192.168.1.X:8000';
//
// Si usas Cloudflare Tunnel (recomendado para acceso desde cualquier red):
// export const BACKEND_URL = 'https://tu-subdominio.trycloudflare.com';

export const BACKEND_URL = 'http://10.0.2.2:8000'; // Emulador Android apunta a localhost

export const API_TOKEN = 'genoma_secret_change_this_2026'; // Debe coincidir con .env del backend

export const API_HEADERS = {
  Authorization: `Bearer ${API_TOKEN}`,
  'Content-Type': 'application/json',
};

// Configuración del agente
export const AGENT_CONFIG = {
  sessionId: 'main_session',
  wakeWord: 'GENOMA', // La palabra que activa el agente (Porcupine)
  language: 'es-CO',
  silenceTimeout: 2000, // ms de silencio antes de enviar el audio
};
