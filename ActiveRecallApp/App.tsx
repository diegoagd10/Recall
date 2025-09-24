import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import NotesListScreen from './src/screens/NotesListScreen';
import PracticeScreen from './src/screens/PracticeScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import { RootStackParamList } from './src/types';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="NotesList"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="NotesList"
          component={NotesListScreen}
          options={{
            title: 'Active Recall Notes',
            headerTitleAlign: 'center',
          }}
        />
        <Stack.Screen
          name="Practice"
          component={PracticeScreen}
          options={{
            title: 'Practice Session',
            headerTitleAlign: 'center',
          }}
        />
        <Stack.Screen
          name="Results"
          component={ResultsScreen}
          options={{
            title: 'Practice Results',
            headerTitleAlign: 'center',
            headerLeft: () => null,
            gestureEnabled: false,
          }}
        />
      </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}