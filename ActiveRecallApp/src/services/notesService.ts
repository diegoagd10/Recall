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
    console.log('🌐 NotesService: Starting fetchNotes API call');
    return this.makeAuthenticatedRequest(async (token) => {
      console.log(`🔗 NotesService: Making GET request to ${API_BASE_URL}/active-recall/notes`);
      const response = await fetch(`${API_BASE_URL}/active-recall/notes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`📊 NotesService: fetchNotes response status: ${response.status}`);
      if (!response.ok) {
        console.error(`❌ NotesService: fetchNotes failed with status ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ NotesService: fetchNotes successful, received ${data.length} notes`);
      return data;
    });
  }

  async fetchQuestions(noteId: string): Promise<Question[]> {
    console.log(`🌐 NotesService: Starting fetchQuestions API call for noteId: ${noteId}`);
    return this.makeAuthenticatedRequest(async (token) => {
      const url = `https://n8n.srv913906.hstgr.cloud/webhook/6ee000e1-5ed7-4242-bada-7706ddfdd2ff/api/active-recall/notes/${noteId}`;
      console.log(`🔗 NotesService: Making GET request to ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`📊 NotesService: fetchQuestions response status: ${response.status}`);
      if (!response.ok) {
        console.error(`❌ NotesService: fetchQuestions failed with status ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ NotesService: fetchQuestions successful, received ${data.length} questions`);
      return data;
    });
  }

  async evaluateAnswers(noteId: string, questions: Question[], userAnswers: Array<{ questionId: string; userAnswer: string }>): Promise<any> {
    console.log(`🌐 NotesService: Starting evaluateAnswers API call for noteId: ${noteId}`);
    return this.makeAuthenticatedRequest(async (token) => {
      // Transform to the correct format: array of {question, answer, studenAnswer} objects
      const requestBody = userAnswers.map(userAnswer => {
        const question = questions.find(q => q.id === userAnswer.questionId);
        return {
          question: question?.question || '',
          answer: question?.answer || '',
          studenAnswer: userAnswer.userAnswer
        };
      });

      const url = `https://n8n.srv913906.hstgr.cloud/webhook/6ee000e1-5ed7-4242-bada-7706ddfdd2ff/api/active-recall/notes/${noteId}`;
      console.log(`🔗 NotesService: Making POST request to ${url} with ${requestBody.length} answers`);
      console.log(`📝 NotesService: Request body being sent:`, requestBody);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`📊 NotesService: evaluateAnswers response status: ${response.status}`);
      if (!response.ok) {
        console.error(`❌ NotesService: evaluateAnswers failed with status ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ NotesService: evaluateAnswers successful:`, data);
      return data;
    });
  }

  async transcribeAudio(uri: string, audioInfo?: { fileExtension: string; mimeType: string }): Promise<string> {
    console.log(`🌐 NotesService: Starting transcribeAudio API call for file: ${uri}`);
    return this.makeAuthenticatedRequest(async (token) => {
      const formData = new FormData();
      
      // Use provided audio info or fallback to defaults
      const fileExtension = audioInfo?.fileExtension || 'wav';
      const mimeType = audioInfo?.mimeType || 'audio/wav';
      const fileName = `recording.${fileExtension}`;
      
      console.log(`📁 NotesService: Preparing audio file - name: ${fileName}, type: ${mimeType}`);
      
      formData.append('file', {
        uri,
        type: mimeType,
        name: fileName,
      } as any);
      formData.append('model_id', 'scribe_v1');

      const url = `${API_BASE_URL}/active-recall/transcribe`;
      console.log(`🔗 NotesService: Making POST request to ${url}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log(`📊 NotesService: transcribeAudio response status: ${response.status}`);
      if (!response.ok) {
        console.error(`❌ NotesService: transcribeAudio failed with status ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ NotesService: transcribeAudio successful, raw response:`, data);
      
      // Extract text from the new API format: [{"text": "transcribed_text", "usage": {}}]
      const transcription = Array.isArray(data) && data[0]?.text ? data[0].text : '';
      console.log(`✅ NotesService: Extracted transcription: "${transcription}"`);
      return transcription;
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