/**
 * IA-GENOMA App - Punto de entrada principal
 */

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text} from 'react-native';
import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: '#9B59F5',
          background: '#0D0D1A',
          card: '#1A1A2E',
          text: '#FFFFFF',
          border: '#333',
          notification: '#9B59F5',
        },
      }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#1A1A2E',
            borderTopColor: '#2A2A4A',
            height: 60,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: '#9B59F5',
          tabBarInactiveTintColor: '#555',
          tabBarLabelStyle: {fontSize: 12, fontWeight: '600'},
        }}>
        <Tab.Screen
          name="Agente"
          component={HomeScreen}
          options={{
            tabBarIcon: ({color}) => <Text style={{fontSize: 22, color}}>🧬</Text>,
          }}
        />
        <Tab.Screen
          name="Ajustes"
          component={SettingsScreen}
          options={{
            tabBarIcon: ({color}) => <Text style={{fontSize: 22, color}}>⚙️</Text>,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
