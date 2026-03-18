/**
 * IA-GENOMA - Pantalla Principal v2
 * Con servidor local Android, historial persistente y mejor UX
 */

import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, Animated, ActivityIndicator, Alert, Vibration, Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {startRecording, stopRecording, initAudioRecorder} from '../services/AudioRecorder';
import {sendVoiceToAgent, sendTextToAgent, healthCheck} from '../services/BackendAPI';
import {playResponseAudio} from '../services/SoundPlayer';
import {startLocalServer} from '../services/AndroidLocalServer';
import {requestAllPermissions} from '../services/PermissionsManager';

const STATES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SPEAKING: 'speaking',
  ERROR: 'error',
};

const MAX_MESSAGES = 50;

export default function HomeScreen() {
  const [agentState, setAgentState] = useState(STATES.IDLE);
  const [messages, setMessages] = useState([
    {role: 'agent', text: '🧬 GENOMA activo. Presiona el botón y habla.', time: ''},
  ]);
  const [isBackendOnline, setIsBackendOnline] = useState(null);
  const [lastAction, setLastAction] = useState(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef(null);
  const isRecording = useRef(false);

  // ─── Inicialización ───
  useEffect(() => {
    bootstrap();
  }, []);

  const bootstrap = async () => {
    // 1. Pedir permisos
    await requestAllPermissions();

    // 2. Inicializar grabador de audio
    initAudioRecorder();

    // 3. Cargar historial guardado
    await loadHistory();

    // 4. Iniciar servidor local para recibir comandos del backend
    startLocalServer((action, params, result) => {
      setLastAction({action, params, result, time: new Date().toLocaleTimeString('es-CO')});
      addMessage('system', `📲 Ejecutado: ${action}`);
    });

    // 5. Verificar backend
    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  };

  // ─── Historial persistente ───
  const loadHistory = async () => {
    try {
      const saved = await AsyncStorage.getItem('GENOMA_HISTORY');
      if (saved) {
        const parsed = JSON.parse(saved);
        setMessages(parsed.slice(-20)); // últimos 20 mensajes
      }
    } catch (e) {}
  };

  const saveHistory = async newMessages => {
    try {
      await AsyncStorage.setItem('GENOMA_HISTORY', JSON.stringify(newMessages.slice(-MAX_MESSAGES)));
    } catch (e) {}
  };

  // ─── Animación ───
  useEffect(() => {
    if (agentState === STATES.LISTENING) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {toValue: 1.25, duration: 500, useNativeDriver: true}),
          Animated.timing(pulseAnim, {toValue: 1.0, duration: 500, useNativeDriver: true}),
        ])
      ).start();
    } else if (agentState === STATES.SPEAKING) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {toValue: 1.1, duration: 300, useNativeDriver: true}),
          Animated.timing(pulseAnim, {toValue: 0.95, duration: 300, useNativeDriver: true}),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      Animated.timing(pulseAnim, {toValue: 1.0, duration: 200, useNativeDriver: true}).start();
    }
  }, [agentState, pulseAnim]);

  const checkBackend = async () => {
    const result = await healthCheck();
    setIsBackendOnline(!!result);
  };

  const addMessage = useCallback((role, text) => {
    const time = new Date().toLocaleTimeString('es-CO', {hour: '2-digit', minute: '2-digit'});
    setMessages(prev => {
      const updated = [...prev, {role, text, time}];
      saveHistory(updated);
      return updated;
    });
    setTimeout(() => scrollRef.current?.scrollToEnd({animated: true}), 120);
  }, []);

  // ─── Flujo de voz ───
  const handlePressIn = async () => {
    if (agentState !== STATES.IDLE || isRecording.current) return;
    if (!isBackendOnline) {
      Alert.alert('🔴 Backend offline',
        'El servidor GENOMA no responde.\n\nVerifica que uvicorn esté corriendo en tu PC.',
        [{text: 'OK'}]);
      return;
    }
    isRecording.current = true;
    setAgentState(STATES.LISTENING);
    Vibration.vibrate(60);
    startRecording();
  };

  const handlePressOut = async () => {
    if (!isRecording.current) return;
    isRecording.current = false;
    setAgentState(STATES.PROCESSING);
    Vibration.vibrate(30);

    try {
      const audioFile = await stopRecording();
      addMessage('user', '🎙️ Comando de voz');

      const result = await sendVoiceToAgent(audioFile);

      addMessage('agent', result.response_text);

      if (result.audio_url) {
        setAgentState(STATES.SPEAKING);
        await playResponseAudio(result.audio_url);
      }
      setAgentState(STATES.IDLE);
    } catch (error) {
      console.error('[HOME]', error);
      addMessage('agent', '❌ Error procesando tu comando. ¿Está el backend activo?');
      setAgentState(STATES.ERROR);
      setTimeout(() => setAgentState(STATES.IDLE), 2500);
    }
  };

  // ─── Render ───
  const stateConfig = {
    idle:       {label: 'Mantén presionado para hablar', colors: ['#6C3FE8', '#9B59F5']},
    listening:  {label: '🎙️ Escuchando... suelta para enviar', colors: ['#C0392B', '#E74C3C']},
    processing: {label: '🧠 Procesando tu comando...', colors: ['#D35400', '#E67E22']},
    speaking:   {label: '🔊 GENOMA respondiendo...', colors: ['#1A7A4A', '#27AE60']},
    error:      {label: '⚠️ Error, intenta de nuevo', colors: ['#555', '#777']},
  };

  const cfg = stateConfig[agentState];

  const getBubbleStyle = role => {
    if (role === 'user') return [styles.bubble, styles.userBubble];
    if (role === 'system') return [styles.bubble, styles.systemBubble];
    return [styles.bubble, styles.agentBubble];
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080812" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🧬 GENOMA</Text>
          <Text style={styles.subtitle}>Agente Personal IA</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot,
            {backgroundColor: isBackendOnline === null ? '#888' : isBackendOnline ? '#2ECC71' : '#E74C3C'}
          ]} />
          <Text style={styles.statusText}>
            {isBackendOnline === null ? 'conectando...' : isBackendOnline ? 'online' : 'offline'}
          </Text>
        </View>
      </View>

      {/* Chat */}
      <ScrollView
        ref={scrollRef}
        style={styles.chat}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}>
        {messages.map((msg, i) => (
          <View key={i} style={getBubbleStyle(msg.role)}>
            <Text style={[
              styles.bubbleText,
              msg.role === 'user' && styles.userText,
              msg.role === 'system' && styles.systemText,
            ]}>
              {msg.text}
            </Text>
            {msg.time ? <Text style={styles.timeText}>{msg.time}</Text> : null}
          </View>
        ))}
        {agentState === STATES.PROCESSING && (
          <View style={[styles.bubble, styles.agentBubble, {flexDirection: 'row', gap: 8}]}>
            <ActivityIndicator size="small" color="#9B59F5" />
            <Text style={styles.bubbleText}>pensando...</Text>
          </View>
        )}
      </ScrollView>

      {/* Último comando ejecutado */}
      {lastAction && (
        <View style={styles.actionBar}>
          <Text style={styles.actionText}>📲 {lastAction.action} · {lastAction.time}</Text>
        </View>
      )}

      {/* Botón principal */}
      <View style={styles.buttonContainer}>
        <Text style={styles.stateLabel}>{cfg.label}</Text>
        <Animated.View style={{transform: [{scale: pulseAnim}]}}>
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.85}
            disabled={agentState === STATES.PROCESSING || agentState === STATES.SPEAKING}>
            <LinearGradient
              colors={cfg.colors}
              style={styles.mainButton}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}>
              <Text style={styles.buttonIcon}>
                {agentState === STATES.LISTENING ? '⏹' :
                 agentState === STATES.PROCESSING ? '⏳' :
                 agentState === STATES.SPEAKING ? '🔊' : '🎙️'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#080812'},
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1A1A30',
    backgroundColor: '#0D0D1F',
  },
  title: {fontSize: 20, fontWeight: '800', color: '#B57BFF', letterSpacing: 2},
  subtitle: {fontSize: 11, color: '#555', letterSpacing: 1, marginTop: 2},
  statusContainer: {flexDirection: 'row', alignItems: 'center', gap: 6},
  statusDot: {width: 8, height: 8, borderRadius: 4},
  statusText: {color: '#666', fontSize: 12},
  chat: {flex: 1},
  chatContent: {padding: 16, paddingBottom: 8, gap: 8},
  bubble: {maxWidth: '82%', padding: 12, borderRadius: 18},
  agentBubble: {backgroundColor: '#141428', alignSelf: 'flex-start', borderBottomLeftRadius: 4},
  userBubble: {backgroundColor: '#3D1F99', alignSelf: 'flex-end', borderBottomRightRadius: 4},
  systemBubble: {backgroundColor: '#0D2218', alignSelf: 'center', borderRadius: 10, paddingVertical: 6},
  bubbleText: {color: '#DDD', fontSize: 15, lineHeight: 22},
  userText: {color: '#EEE'},
  systemText: {color: '#4CAF50', fontSize: 12},
  timeText: {color: '#444', fontSize: 10, marginTop: 4, textAlign: 'right'},
  actionBar: {
    backgroundColor: '#0D1F14', paddingHorizontal: 16, paddingVertical: 6,
    borderTopWidth: 1, borderTopColor: '#1A3020',
  },
  actionText: {color: '#4CAF50', fontSize: 12},
  buttonContainer: {padding: 28, alignItems: 'center', gap: 16},
  stateLabel: {color: '#666', fontSize: 13, textAlign: 'center', letterSpacing: 0.5},
  mainButton: {
    width: 88, height: 88, borderRadius: 44,
    justifyContent: 'center', alignItems: 'center',
    elevation: 16,
    shadowColor: '#7B3FFF',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  buttonIcon: {fontSize: 38},
});
