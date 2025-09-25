
import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import LoginScreen from './src/screens/LoginScreen';
import NotesListScreen from './src/screens/NotesListScreen';
import PracticeScreen from './src/screens/PracticeScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import AuthGuard from './src/components/AuthGuard';
import { RootStackParamList } from './src/types';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          initialRouteName="Login"
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
            name="Login"
            component={LoginScreen}
            options={{
              title: 'Login',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="NotesList"
            options={{
              title: 'Active Recall Notes',
              headerTitleAlign: 'center',
              headerLeft: () => null,
              gestureEnabled: false,
            }}
          >
            {(props) => (
              <AuthGuard>
                <NotesListScreen {...props} />
              </AuthGuard>
            )}
          </Stack.Screen>
          <Stack.Screen
            name="Practice"
            options={{
              title: 'Practice Session',
              headerTitleAlign: 'center',
            }}
          >
            {(props) => (
              <AuthGuard>
                <PracticeScreen {...props} />
              </AuthGuard>
            )}
          </Stack.Screen>
          <Stack.Screen
            name="Results"
            options={{
              title: 'Practice Results',
              headerTitleAlign: 'center',
              headerLeft: () => null,
              gestureEnabled: false,
            }}
          >
            {(props) => (
              <AuthGuard>
                <ResultsScreen {...props} />
              </AuthGuard>
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
