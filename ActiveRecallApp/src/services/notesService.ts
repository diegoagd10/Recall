import { Note, Question } from '../types';
import AuthService from './authService';

const API_BASE_URL = 'https://n8n.srv913906.hstgr.cloud/webhook/api';

class NotesService {
  private static instance: NotesService;
  private authService: AuthService;

  private constructor() {
    this.authService = AuthService.getInstance();
  }

  static getInstance(): NotesService {
    if (!NotesService.instance) {
      NotesService.instance = new NotesService();
    }
    return NotesService.instance;
  }

  async fetchNotes(): Promise<Note[]> {
    return this.makeAuthenticatedRequest(async (token) => {
      const response = await fetch(`${API_BASE_URL}/active-recall/notes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    });
  }

  async fetchQuestions(noteId: string): Promise<Question[]> {
    return this.makeAuthenticatedRequest(async (token) => {
      const response = await fetch(`${API_BASE_URL}/active-recall/questions/${noteId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    });
  }

  async transcribeAudio(uri: string, audioInfo?: { fileExtension: string; mimeType: string }): Promise<string> {
    return this.makeAuthenticatedRequest(async (token) => {
      const formData = new FormData();
      
      // Use provided audio info or fallback to defaults
      const fileExtension = audioInfo?.fileExtension || 'wav';
      const mimeType = audioInfo?.mimeType || 'audio/wav';
      const fileName = `recording.${fileExtension}`;
      
      formData.append('file', {
        uri,
        type: mimeType,
        name: fileName,
      } as any);
      formData.append('model_id', 'scribe_v1');

      const response = await fetch(`${API_BASE_URL}/active-recall/transcribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.text();
    });
  }

  private async makeAuthenticatedRequest<T>(requestFn: (token: string) => Promise<T>): Promise<T> {
    try {
      const token = await this.authService.getValidToken();
      if (!token) {
        throw new Error('Unable to get authentication token');
      }

      return await requestFn(token);
    } catch (error: any) {
      // If it's a 401, try to refresh token and retry once
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        try {
          await this.authService.clearToken();
          const newToken = await this.authService.getValidToken();
          if (newToken) {
            return await requestFn(newToken);
          }
        } catch (retryError) {
          console.error('Error retrying with new token:', retryError);
        }
      }
      throw error;
    }
  }
}

export default NotesService;