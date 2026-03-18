/**
 * IA-GENOMA - Pantalla de Recordatorios
 */

import React, {useState, useEffect} from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {sendTextToAgent} from '../services/BackendAPI';

export default function RemindersScreen() {
  const [reminders, setReminders] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    setLoading(true);
    try {
      const result = await sendTextToAgent('lista mis recordatorios pendientes');
      // Parsear texto de respuesta
      const lines = result.response_text.split('\n').filter(l => l.trim());
      setReminders(lines.map((l, i) => ({id: i, text: l})));
    } catch (e) {
      console.warn(e);
    }
    setLoading(false);
  };

  const addReminder = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      await sendTextToAgent(`crea un recordatorio: ${input}`);
      setInput('');
      await loadReminders();
    } catch (e) {
      Alert.alert('Error', 'No se pudo crear el recordatorio');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>⏰ Recordatorios</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ej: reunión mañana a las 3pm"
          placeholderTextColor="#444"
          onSubmitEditing={addReminder}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addReminder}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.refreshBtn} onPress={loadReminders}>
        <Text style={styles.refreshText}>🔄 Actualizar</Text>
      </TouchableOpacity>

      <FlatList
        data={reminders}
        keyExtractor={item => String(item.id)}
        renderItem={({item}) => (
          <View style={styles.item}>
            <Text style={styles.itemText}>{item.text}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {loading ? 'Cargando...' : 'No hay recordatorios pendientes'}
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#080812', padding: 16},
  title: {fontSize: 22, fontWeight: 'bold', color: '#B57BFF', marginBottom: 16, letterSpacing: 2},
  inputRow: {flexDirection: 'row', gap: 10, marginBottom: 10},
  input: {
    flex: 1, backgroundColor: '#141428', color: '#EEE',
    borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#2A2A50', fontSize: 14,
  },
  addBtn: {
    backgroundColor: '#6C3FE8', borderRadius: 10,
    width: 48, justifyContent: 'center', alignItems: 'center',
  },
  addBtnText: {color: '#FFF', fontSize: 24, fontWeight: 'bold'},
  refreshBtn: {alignSelf: 'flex-start', marginBottom: 12},
  refreshText: {color: '#6C3FE8', fontSize: 13},
  item: {
    backgroundColor: '#141428', borderRadius: 10, padding: 14,
    marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#6C3FE8',
  },
  itemText: {color: '#CCC', fontSize: 14},
  empty: {color: '#444', textAlign: 'center', marginTop: 40, fontSize: 14},
});
