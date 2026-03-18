/**
 * IA-GENOMA - Gestor de Permisos Android
 * Solicita todos los permisos necesarios al iniciar la app
 */

import {PermissionsAndroid, Platform, Alert, Linking} from 'react-native';

export async function requestAllPermissions() {
  if (Platform.OS !== 'android') return true;

  const permissions = [
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
  ];

  // Android 13+
  if (Platform.Version >= 33) {
    permissions.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }

  try {
    const results = await PermissionsAndroid.requestMultiple(permissions);
    const allGranted = Object.values(results).every(
      r => r === PermissionsAndroid.RESULTS.GRANTED
    );

    if (!allGranted) {
      Alert.alert(
        '⚠️ Permisos necesarios',
        'GENOMA necesita acceso al micrófono para funcionar. Por favor otorga los permisos en Ajustes.',
        [
          {text: 'Cancelar', style: 'cancel'},
          {text: 'Abrir Ajustes', onPress: () => Linking.openSettings()},
        ]
      );
    }
    return allGranted;
  } catch (e) {
    console.warn('[PERMISSIONS]', e);
    return false;
  }
}

export async function checkMicPermission() {
  const granted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
  );
  return granted;
}
