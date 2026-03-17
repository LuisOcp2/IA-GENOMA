/**
 * IA-GENOMA - Pantalla Principal
 * El corazón de la app: botón de activación, visualizador de audio,
 * historial de conversación y estado del agente.
 */

import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Animated,
  ActivityIndicator,
  Alert,
  Vibration,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import {startRecording, stopRecording} from '../services/AudioRecorder';
import {sendVoiceToAgent, sendTextToAgent, healthCheck} from '../services/BackendAPI';
import {playResponseAudio} from '../services/SoundPlayer';

const STATES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SPEAKING: 'speaking',
  ERROR: 'error',
};

export default function HomeScreen() {
  const [agentState, setAgentState] = useState(STATES.IDLE);
  const [messages, setMessages] = useState([
    {role: 'agent', text: '¡Hola! Soy GENOMA, tu agente personal. Presiona y habla para comenzar.'},
  ]);
  const [isBackendOnline, setIsBackendOnline] = useState(null);
  const [isPressed, setIsPressed] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef(null);

  // ─── Animación del botón ───
  useEffect(() => {
    if (agentState === STATES.LISTENING) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {toValue: 1.2, duration: 600, useNativeDriver: true}),
          Animated.timing(pulseAnim, {toValue: 1.0, duration: 600, useNativeDriver: true}),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [agentState, pulseAnim]);

  // ─── Verificar backend al iniciar ───
  useEffect(() => {
    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkBackend = async () => {
    const result = await healthCheck();
    setIsBackendOnline(!!result);
  };

  const addMessage = useCallback((role, text) => {
    setMessages(prev => [...prev, {role, text, time: new Date().toLocaleTimeString('es-CO', {hour: '2-digit', minute: '2-digit'})}]);
    setTimeout(() => scrollRef.current?.scrollToEnd({animated: true}), 100);
  }, []);

  // ─── Flujo Principal ───
  const handlePressIn = async () => {
    if (agentState !== STATES.IDLE) return;
    if (!isBackendOnline) {
      Alert.alert('Backend offline', 'No se puede conectar al servidor. Verifica que el backend esté corriendo.');
      return;
    }

    setIsPressed(true);
    setAgentState(STATES.LISTENING);
    Vibration.vibrate(50);
    startRecording();
  };

  const handlePressOut = async () => {
    if (agentState !== STATES.LISTENING) return;

    setIsPressed(false);
    setAgentState(STATES.PROCESSING);
    Vibration.vibrate(30);

    try {
      const audioFile = await stopRecording();
      const result = await sendVoiceToAgent(audioFile);

      addMessage('user', '🎙️ [Mensaje de voz]');
      addMessage('agent', result.response_text);

      if (result.audio_url) {
        setAgentState(STATES.SPEAKING);
        await playResponseAudio(result.audio_url);
      }

      setAgentState(STATES.IDLE);
    } catch (error) {
      console.error('[HOME] Error:', error);
      addMessage('agent', '❌ Error procesando tu comando. ¿Está el backend activo?');
      setAgentState(STATES.ERROR);
      setTimeout(() => setAgentState(STATES.IDLE), 2000);
    }
  };

  // ─── UI ───
  const getStateLabel = () => ({
    idle: 'Mantén presionado para hablar',
    listening: '🎙️ Escuchando...',
    processing: '🧠 Procesando...',
    speaking: '🔊 Respondiendo...',
    error: '❌ Error - Intentando de nuevo...',
  })[agentState];

  const getButtonColor = () => ({
    idle: ['#6C3FE8', '#9B59F5'],
    listening: ['#E84040', '#F57B7B'],
    processing: ['#E89540', '#F5C77B'],
    speaking: ['#40B8E8', '#7BE0F5'],
    error: ['#888', '#aaa'],
  })[agentState];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🧬 GENOMA</Text>
        <View style={[styles.statusDot, {backgroundColor: isBackendOnline === null ? '#888' : isBackendOnline ? '#4CAF50' : '#F44336'}]} />
      </View>

      {/* Chat */}
      <ScrollView
        ref={scrollRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}>
        {messages.map((msg, i) => (
          <View
            key={i}
            style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.agentBubble]}>
            <Text style={[styles.bubbleText, msg.role === 'user' && styles.userText]}>
              {msg.text}
            </Text>
            {msg.time && <Text style={styles.timeText}>{msg.time}</Text>}
          </View>
        ))}
        {agentState === STATES.PROCESSING && (
          <View style={[styles.bubble, styles.agentBubble]}>
            <ActivityIndicator size="small" color="#9B59F5" />
          </View>
        )}
      </ScrollView>

      {/* Botón Principal */}
      <View style={styles.buttonContainer}>
        <Text style={styles.stateLabel}>{getStateLabel()}</Text>
        <Animated.View style={{transform: [{scale: pulseAnim}]}}>
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.8}
            disabled={agentState === STATES.PROCESSING || agentState === STATES.SPEAKING}>
            <LinearGradient
              colors={getButtonColor()}
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
  container: {flex: 1, backgroundColor: '#0D0D1A'},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E35',
  },
  title: {fontSize: 22, fontWeight: 'bold', color: '#C084FC', letterSpacing: 3},
  statusDot: {width: 10, height: 10, borderRadius: 5},
  chatContainer: {flex: 1},
  chatContent: {padding: 16, paddingBottom: 20},
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  agentBubble: {
    backgroundColor: '#1E1E35',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#6C3FE8',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleText: {color: '#E8E8F0', fontSize: 15, lineHeight: 22},
  userText: {color: '#FFFFFF'},
  timeText: {color: '#666', fontSize: 11, marginTop: 4, textAlign: 'right'},
  buttonContainer: {padding: 30, alignItems: 'center'},
  stateLabel: {color: '#888', fontSize: 14, marginBottom: 20, textAlign: 'center'},
  mainButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#6C3FE8',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  buttonIcon: {fontSize: 36},
});
