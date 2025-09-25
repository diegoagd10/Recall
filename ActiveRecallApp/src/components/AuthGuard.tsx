
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import AuthService from '../services/authService';

type AuthGuardNavigationProp = StackNavigationProp<RootStackParamList>;

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const navigation = useNavigation<AuthGuardNavigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 AuthGuard: Checking authentication status...');
      const authService = AuthService.getInstance();
      const loggedIn = await authService.isLoggedIn();
      
      console.log(`🔍 AuthGuard: Authentication status: ${loggedIn ? 'authenticated' : 'not authenticated'}`);
      setIsAuthenticated(loggedIn);
      
      if (!loggedIn) {
        console.log('🧭 AuthGuard: User not authenticated, navigating to login');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    } catch (error) {
      console.error('❌ AuthGuard: Error checking auth status:', error);
      setIsAuthenticated(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
