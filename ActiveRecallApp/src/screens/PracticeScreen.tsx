import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Question, PracticeSession } from '../types';

type PracticeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Practice'>;
type PracticeScreenRouteProp = RouteProp<RootStackParamList, 'Practice'>;

export default function PracticeScreen() {
  const navigation = useNavigation<PracticeScreenNavigationProp>();
  const route = useRoute<PracticeScreenRouteProp>();
  const { note } = route.params;

  const [session, setSession] = useState<PracticeSession>({
    noteId: note.id,
    questions: [],
    currentQuestionIndex: 0,
    userAnswers: [],
  });
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string>('');

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      // TODO: Implement API call to fetch questions for the note
      const mockQuestions: Question[] = [
        { id: '1', question: 'What is a transformer?', answer: 'A neural network architecture...' },
        { id: '2', question: 'How does attention work?', answer: 'Attention mechanisms allow...' },
      ];
      setSession(prev => ({ ...prev, questions: mockQuestions }));
    } catch (error) {
      console.error('Error fetching questions:', error);
      Alert.alert('Error', 'Failed to load questions');
    }
  };

  const handleSubmitAnswer = () => {
    if (!currentAnswer.trim()) {
      Alert.alert('Error', 'Please provide an answer before submitting');
      return;
    }

    const newUserAnswer = {
      questionId: session.questions[session.currentQuestionIndex].id,
      userAnswer: currentAnswer.trim(),
    };

    const updatedAnswers = [...session.userAnswers, newUserAnswer];
    
    if (session.currentQuestionIndex < session.questions.length - 1) {
      // Move to next question
      setSession(prev => ({
        ...prev,
        userAnswers: updatedAnswers,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }));
      setCurrentAnswer('');
      setRecordingUri('');
    } else {
      // All questions completed, navigate to results
      finishPracticeSession(updatedAnswers);
    }
  };

  const finishPracticeSession = (answers: typeof session.userAnswers) => {
    // TODO: Evaluate answers and calculate score
    const score = Math.floor(Math.random() * answers.length) + 1; // Mock score
    const incorrectAnswers = answers.slice(0, Math.max(0, answers.length - score)).map(answer => ({
      question: session.questions.find(q => q.id === answer.questionId)!,
      userAnswer: answer.userAnswer,
    }));

    navigation.navigate('Results', {
      note,
      score,
      totalQuestions: session.questions.length,
      incorrectAnswers,
    });
  };

  const startRecording = async () => {
    try {
      // TODO: Implement audio recording
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      // TODO: Implement stop recording and transcription
      setIsRecording(false);
      setCurrentAnswer('Transcribed audio answer would appear here');
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const playRecording = () => {
    // TODO: Implement audio playback
    Alert.alert('Info', 'Audio playback will be implemented');
  };

  const deleteRecording = () => {
    setRecordingUri('');
    setCurrentAnswer('');
  };

  const currentQuestion = session.questions[session.currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text>Loading questions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.noteTitle}>{note.name}</Text>
        <Text style={styles.progressText}>
          Question {session.currentQuestionIndex + 1} of {session.questions.length}
        </Text>
      </View>

      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
      </View>

      <View style={styles.answerContainer}>
        <Text style={styles.sectionTitle}>Your Answer:</Text>
        
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={4}
          placeholder="Type your answer here..."
          value={currentAnswer}
          onChangeText={setCurrentAnswer}
        />

        <View style={styles.audioControls}>
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordingButton]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Text style={styles.recordButtonText}>
              {isRecording ? 'Stop Recording' : 'Record Answer'}
            </Text>
          </TouchableOpacity>

          {recordingUri && (
            <View style={styles.audioActions}>
              <TouchableOpacity style={styles.playButton} onPress={playRecording}>
                <Text style={styles.playButtonText}>Play</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={deleteRecording}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmitAnswer}>
          <Text style={styles.submitButtonText}>
            {session.currentQuestionIndex < session.questions.length - 1 ? 'Next Question' : 'Finish Practice'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  noteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  questionContainer: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.1)',
    elevation: 5,
  },
  questionText: {
    fontSize: 18,
    color: '#333',
    lineHeight: 24,
  },
  answerContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  audioControls: {
    alignItems: 'center',
  },
  recordButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
  },
  recordingButton: {
    backgroundColor: '#FF3B30',
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  audioActions: {
    flexDirection: 'row',
    gap: 12,
  },
  playButton: {
    backgroundColor: '#34C759',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomControls: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#34C759',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});