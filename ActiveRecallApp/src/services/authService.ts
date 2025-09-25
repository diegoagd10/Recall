import AsyncStorage from '@react-native-async-storage/async-storage';
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

  async getValidToken(): Promise<string | null> {
    console.log('🔍 AuthService: Checking for valid token...');
    
    // Check if we have a valid token
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

    console.log('🔄 AuthService: No valid stored token, refreshing...');
    // Get new token
    return await this.refreshToken();
  }

  private async refreshToken(): Promise<string | null> {
    try {
      console.log('🔐 AuthService: Refreshing token...');
      console.log(`🔗 AuthService: Making POST request to ${API_BASE_URL}/tokens`);
      const response = await fetch(`${API_BASE_URL}/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_name: process.env.BACKEND_API_CLIENT_ID,
          client_secret: process.env.BACKEND_API_CLIENT_SECRET,
          audience: 'https://recal.test.com/isam',
        }),
      });

      console.log(`📊 AuthService: Token refresh response status: ${response.status}`);
      if (!response.ok) {
        console.error(`❌ AuthService: Token refresh failed with status ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AuthResponse = await response.json();
      
      this.accessToken = data.accessToken;
      this.tokenExpiry = Date.now() + (parseInt(data.expiresIn) * 1000);

      console.log(`💾 AuthService: Storing token in AsyncStorage, expires: ${new Date(this.tokenExpiry)}`);
      // Store in AsyncStorage
      await AsyncStorage.setItem('accessToken', data.accessToken);
      await AsyncStorage.setItem('tokenExpiry', this.tokenExpiry.toString());

      console.log('✅ AuthService: Token refresh successful');
      return this.accessToken;
    } catch (error) {
      console.error('❌ AuthService: Error refreshing token:', error);
      return null;
    }
  }

  async clearToken(): Promise<void> {
    this.accessToken = null;
    this.tokenExpiry = null;
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('tokenExpiry');
  }
}

export default AuthService;