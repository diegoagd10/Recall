
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../types';
import AuthService from '../services/authService';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateInputs = () => {
    if (!username.trim()) {
      Alert.alert('Validation Error', 'Please enter your username');
      return false;
    }
    if (!password.trim()) {
      Alert.alert('Validation Error', 'Please enter your password');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    console.log('🔐 LoginScreen: User attempting to log in');
    
    if (!validateInputs()) {
      return;
    }

    try {
      setLoading(true);
      
      // Authenticate with backend
      console.log('🌐 LoginScreen: Sending authentication request to backend');
      const authService = AuthService.getInstance();
      const success = await authService.authenticate(username.trim(), password);
      
      if (success) {
        console.log('✅ LoginScreen: Authentication successful');
        
        try {
          // Store credentials securely (handle web platform)
          console.log('💾 LoginScreen: Storing credentials securely');
          if (Platform.OS === 'web') {
            // Use AsyncStorage for web platform
            await AsyncStorage.setItem('username', username.trim());
            console.log('✅ LoginScreen: Username stored (web)');
            await AsyncStorage.setItem('password', password);
            console.log('✅ LoginScreen: Password stored (web)');
            await AsyncStorage.setItem('isLoggedIn', 'true');
            console.log('✅ LoginScreen: Login status stored (web)');
          } else {
            // Use SecureStore for native platforms
            await SecureStore.setItemAsync('username', username.trim());
            console.log('✅ LoginScreen: Username stored (native)');
            await SecureStore.setItemAsync('password', password);
            console.log('✅ LoginScreen: Password stored (native)');
            await SecureStore.setItemAsync('isLoggedIn', 'true');
            console.log('✅ LoginScreen: Login status stored (native)');
          }
        } catch (storeError) {
          console.error('❌ LoginScreen: SecureStore error:', storeError);
          throw storeError;
        }
        
        try {
          console.log('🧭 LoginScreen: Navigating to notes screen');
          navigation.reset({
            index: 0,
            routes: [{ name: 'NotesList' }],
          });
          console.log('✅ LoginScreen: Navigation completed');
        } catch (navError) {
          console.error('❌ LoginScreen: Navigation error:', navError);
          throw navError;
        }
      } else {
        console.log('❌ LoginScreen: Authentication failed');
        Alert.alert(
          'Authentication Failed',
          'Invalid credentials. Please check your username and password and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ LoginScreen: Login error:', error);
      Alert.alert(
        'Login Error',
        'Unable to connect to the server. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Text style={styles.appTitle}>Active Recall</Text>
            <Text style={styles.subtitle}>Learn Smarter, Remember Better</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                accessibilityLabel="Username input"
                accessibilityHint="Enter your username to log in"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  accessibilityLabel="Password input"
                  accessibilityHint="Enter your password to log in"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Text style={styles.eyeButtonText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
              accessibilityLabel="Login button"
              accessibilityHint="Tap to log in with your credentials"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Log In</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.1)',
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  eyeButton: {
    padding: 12,
  },
  eyeButtonText: {
    fontSize: 18,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});
