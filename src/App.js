/**
 * IA-GENOMA App v2 - Navegación con 3 tabs
 */

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text} from 'react-native';
import HomeScreen from './screens/HomeScreen';
import RemindersScreen from './screens/RemindersScreen';
import SettingsScreen from './screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: '#9B59F5',
          background: '#080812',
          card: '#0D0D1F',
          text: '#FFFFFF',
          border: '#1A1A30',
          notification: '#9B59F5',
        },
        fonts: {
          regular: {
            fontFamily: 'System',
            fontWeight: '400',
          },
          medium: {
            fontFamily: 'System',
            fontWeight: '500',
          },
          bold: {
            fontFamily: 'System',
            fontWeight: '700',
          },
          heavy: {
            fontFamily: 'System',
            fontWeight: '800',
          },
        },
      }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0D0D1F',
            borderTopColor: '#1A1A30',
            height: 62,
            paddingBottom: 8,
            paddingTop: 4,
          },
          tabBarActiveTintColor: '#9B59F5',
          tabBarInactiveTintColor: '#444',
          tabBarLabelStyle: {fontSize: 11, fontWeight: '700', letterSpacing: 0.5},
        }}>
        <Tab.Screen
          name="Agente"
          component={HomeScreen}
          options={{tabBarIcon: ({color}) => <Text style={{fontSize: 24, color}}>🧬</Text>}}
        />
        <Tab.Screen
          name="Recordatorios"
          component={RemindersScreen}
          options={{tabBarIcon: ({color}) => <Text style={{fontSize: 24, color}}>⏰</Text>}}
        />
        <Tab.Screen
          name="Ajustes"
          component={SettingsScreen}
          options={{tabBarIcon: ({color}) => <Text style={{fontSize: 24, color}}>⚙️</Text>}}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
