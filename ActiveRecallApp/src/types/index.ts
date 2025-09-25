export interface Note {
  id: string;
  name: string;
  url: string;
  property_modificado: string;
  property_repasos: number | null;
  property_periodo: string | null;
  property_preguntas: number | null;
  property_creado: string;
  property_extracto: string;
  property_status: string;
  property_type: string;
  property_sub_item: any[];
  property_days_since_last_review: number | null;
  property_final_review_date: {
    start: string;
    end: string | null;
    time_zone: string | null;
  } | null;
  property_source: string;
  property_area: string;
  property_errores: number | null;
  property_category: string[];
  property_author: string;
  property_efectividad: number | null;
  property_parent_item: string[];
  property_topic: string;
}

export interface Question {
  id: string;
  question: string;
  answer: string;
}

export interface PracticeSession {
  noteId: string;
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: Array<{
    questionId: string;
    userAnswer: string;
    isCorrect?: boolean;
  }>;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: string;
}

export type RootStackParamList = {
  Login: undefined;
  NotesList: undefined;
  Practice: { note: Note };
  Results: {
    note: Note;
    score: number;
    totalQuestions: number;
    incorrectAnswers: Array<{
      question: string;
      answer: string;
      studenAnswer: string;
    }>;
  };
};