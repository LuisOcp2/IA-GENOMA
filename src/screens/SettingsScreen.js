/**
 * IA-GENOMA - Pantalla de Configuración
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {clearMemory, healthCheck} from '../services/BackendAPI';

export default function SettingsScreen() {
  const [backendUrl, setBackendUrl] = useState('http://10.0.2.2:8000');
  const [apiToken, setApiToken] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [backendStatus, setBackendStatus] = useState('Verificando...');

  useEffect(() => {
    loadSettings();
    testBackend();
  }, []);

  const loadSettings = async () => {
    const url = await AsyncStorage.getItem('BACKEND_URL');
    const token = await AsyncStorage.getItem('API_TOKEN');
    const voice = await AsyncStorage.getItem('VOICE_ENABLED');
    if (url) setBackendUrl(url);
    if (token) setApiToken(token);
    if (voice !== null) setVoiceEnabled(voice === 'true');
  };

  const saveSettings = async () => {
    await AsyncStorage.setItem('BACKEND_URL', backendUrl);
    await AsyncStorage.setItem('API_TOKEN', apiToken);
    await AsyncStorage.setItem('VOICE_ENABLED', String(voiceEnabled));
    Alert.alert('✅ Guardado', 'Configuración guardada. Reinicia la app para aplicar cambios.');
  };

  const testBackend = async () => {
    setBackendStatus('Verificando...');
    const result = await healthCheck();
    setBackendStatus(result ? `✅ Online - ${result.agent}` : '❌ Offline');
  };

  const handleClearMemory = async () => {
    Alert.alert(
      'Limpiar memoria',
      '¿Seguro que quieres limpiar el historial de conversación?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {text: 'Limpiar', style: 'destructive', onPress: async () => {
          await clearMemory();
          Alert.alert('✅', 'Memoria limpiada');
        }},
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll}>
        <Text style={styles.title}>⚙️ Configuración</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌐 Backend</Text>
          <Text style={styles.label}>URL del servidor</Text>
          <TextInput
            style={styles.input}
            value={backendUrl}
            onChangeText={setBackendUrl}
            placeholder="http://192.168.1.X:8000"
            placeholderTextColor="#444"
            autoCapitalize="none"
          />
          <Text style={styles.status}>Estado: {backendStatus}</Text>
          <TouchableOpacity style={styles.btn} onPress={testBackend}>
            <Text style={styles.btnText}>🔄 Verificar conexión</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔑 Seguridad</Text>
          <Text style={styles.label}>Token de API</Text>
          <TextInput
            style={styles.input}
            value={apiToken}
            onChangeText={setApiToken}
            placeholder="genoma_secret_..."
            placeholderTextColor="#444"
            secureTextEntry
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔊 Audio</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Respuesta por voz</Text>
            <Switch
              value={voiceEnabled}
              onValueChange={setVoiceEnabled}
              thumbColor={voiceEnabled ? '#9B59F5' : '#555'}
              trackColor={{false: '#333', true: '#4B2090'}}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧠 Memoria</Text>
          <TouchableOpacity style={[styles.btn, styles.dangerBtn]} onPress={handleClearMemory}>
            <Text style={styles.btnText}>🗑️ Limpiar historial de conversación</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={saveSettings}>
          <Text style={styles.btnText}>💾 Guardar configuración</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0D0D1A'},
  scroll: {padding: 20},
  title: {fontSize: 24, fontWeight: 'bold', color: '#C084FC', marginBottom: 24, letterSpacing: 2},
  section: {backgroundColor: '#1A1A2E', borderRadius: 12, padding: 16, marginBottom: 16},
  sectionTitle: {color: '#9B59F5', fontSize: 16, fontWeight: 'bold', marginBottom: 12},
  label: {color: '#AAA', fontSize: 13, marginBottom: 6},
  input: {
    backgroundColor: '#0D0D1A',
    color: '#EEE',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 10,
    fontSize: 14,
  },
  status: {color: '#888', fontSize: 13, marginBottom: 8},
  row: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  btn: {
    backgroundColor: '#6C3FE8',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtn: {backgroundColor: '#2E7D32', marginTop: 8},
  dangerBtn: {backgroundColor: '#C62828'},
  btnText: {color: '#FFF', fontWeight: 'bold', fontSize: 14},
});
