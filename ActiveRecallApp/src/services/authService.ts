
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { AuthResponse } from '../types';

const API_BASE_URL = 'https://n8n.srv913906.hstgr.cloud/webhook/api';

class AuthService {
  private static instance: AuthService;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Platform-specific storage helpers
  private async getSecureItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(key);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error(`❌ AuthService: Error getting secure item ${key}:`, error);
      return null;
    }
  }

  private async setSecureItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error(`❌ AuthService: Error setting secure item ${key}:`, error);
      throw error;
    }
  }

  private async deleteSecureItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error(`❌ AuthService: Error deleting secure item ${key}:`, error);
    }
  }

  async authenticate(username: string, password: string): Promise<boolean> {
    try {
      console.log('🔐 AuthService: Authenticating user with backend...');
      const response = await fetch(`${API_BASE_URL}/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_name: username,
          client_secret: password,
          audience: "https://recal.test.com/isam"
        }),
      });

      console.log(`📊 AuthService: Authentication response status: ${response.status}`);
      
      if (response.ok) {
        const data: AuthResponse = await response.json();
        
        this.accessToken = data.accessToken;
        this.tokenExpiry = Date.now() + (parseInt(data.expiresIn) * 1000);

        // Store token in AsyncStorage
        await AsyncStorage.setItem('accessToken', data.accessToken);
        await AsyncStorage.setItem('tokenExpiry', this.tokenExpiry.toString());

        console.log('✅ AuthService: Authentication successful, token stored');
        return true;
      } else {
        console.log('❌ AuthService: Authentication failed');
        return false;
      }
    } catch (error) {
      console.error('❌ AuthService: Authentication error:', error);
      return false;
    }
  }

  async getValidToken(): Promise<string | null> {
    console.log('🔍 AuthService: Checking for valid token...');
    
    // Check if we have a valid token in memory
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      console.log('✅ AuthService: Using existing valid token');
      return this.accessToken;
    }

    console.log('🔄 AuthService: Token expired or missing, checking storage...');
    // Try to get token from storage
    const storedToken = await AsyncStorage.getItem('accessToken');
    const storedExpiry = await AsyncStorage.getItem('tokenExpiry');

    if (storedToken && storedExpiry && Date.now() < parseInt(storedExpiry)) {
      console.log('✅ AuthService: Using stored valid token');
      this.accessToken = storedToken;
      this.tokenExpiry = parseInt(storedExpiry);
      return this.accessToken;
    }

    console.log('🔄 AuthService: No valid stored token, checking for stored credentials...');
    // Try to refresh token using stored credentials
    return await this.refreshTokenWithStoredCredentials();
  }

  private async refreshTokenWithStoredCredentials(): Promise<string | null> {
    try {
      const username = await this.getSecureItem('username');
      const password = await this.getSecureItem('password');

      if (!username || !password) {
        console.log('❌ AuthService: No stored credentials found');
        return null;
      }

      console.log('🔄 AuthService: Refreshing token with stored credentials...');
      const success = await this.authenticate(username, password);
      
      if (success) {
        return this.accessToken;
      } else {
        console.log('❌ AuthService: Failed to refresh token with stored credentials');
        await this.logout();
        return null;
      }
    } catch (error) {
      console.error('❌ AuthService: Error refreshing token with stored credentials:', error);
      return null;
    }
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      const isLoggedIn = await this.getSecureItem('isLoggedIn');
      const token = await this.getValidToken();
      return isLoggedIn === 'true' && token !== null;
    } catch (error) {
      console.error('❌ AuthService: Error checking login status:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    console.log('🚪 AuthService: Logging out user...');
    
    // Clear memory
    this.accessToken = null;
    this.tokenExpiry = null;

    // Clear AsyncStorage
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('tokenExpiry');

    // Clear SecureStore
    await this.deleteSecureItem('username');
    await this.deleteSecureItem('password');
    await this.deleteSecureItem('isLoggedIn');

    console.log('✅ AuthService: Logout completed, all credentials cleared');
  }

  async clearToken(): Promise<void> {
    this.accessToken = null;
    this.tokenExpiry = null;
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('tokenExpiry');
  }
}

export default AuthService;
