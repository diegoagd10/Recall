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
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Try to get token from storage
    const storedToken = await AsyncStorage.getItem('accessToken');
    const storedExpiry = await AsyncStorage.getItem('tokenExpiry');

    if (storedToken && storedExpiry && Date.now() < parseInt(storedExpiry)) {
      this.accessToken = storedToken;
      this.tokenExpiry = parseInt(storedExpiry);
      return this.accessToken;
    }

    // Get new token
    return await this.refreshToken();
  }

  private async refreshToken(): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_name: 'xdeQwgwTSGTxR3fN',
          client_secret: 'pjPEToKJ988iOaHn',
          audience: 'https://recal.test.com/isam',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AuthResponse = await response.json();
      
      this.accessToken = data.accessToken;
      this.tokenExpiry = Date.now() + (parseInt(data.expiresIn) * 1000);

      // Store in AsyncStorage
      await AsyncStorage.setItem('accessToken', data.accessToken);
      await AsyncStorage.setItem('tokenExpiry', this.tokenExpiry.toString());

      return this.accessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
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