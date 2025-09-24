import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Audio } from 'expo-av';
import { RootStackParamList, Question, PracticeSession } from '../types';
import NotesService from '../services/notesService';

type PracticeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Practice'>;
type PracticeScreenRouteProp = RouteProp<RootStackParamList, 'Practice'>;

export default function PracticeScreen() {
  const navigation = useNavigation<PracticeScreenNavigationProp>();
  const route = useRoute<PracticeScreenRouteProp>();
  const { note } = route.params;
  const notesService = NotesService.getInstance();

  const [session, setSession] = useState<PracticeSession>({
    noteId: note.id,
    questions: [],
    currentQuestionIndex: 0,
    userAnswers: [],
  });
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [recordingUri, setRecordingUri] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [transcribing, setTranscribing] = useState(false);
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  const [isAudioSupported, setIsAudioSupported] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const playbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setupAudio();
    fetchQuestions();
    return () => {
      cleanupAudio();
    };
  }, []);

  const setupAudio = async () => {
    try {
      // Check if audio recording is supported on this platform
      if (Platform.OS === 'web') {
        setIsAudioSupported(false);
        return;
      }

      const { status } = await Audio.requestPermissionsAsync();
      setHasAudioPermission(status === 'granted');
      
      if (status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      }
    } catch (error) {
      console.error('Error setting up audio:', error);
      setIsAudioSupported(false);
    }
  };

  const cleanupAudio = async () => {
    try {
      // Clear any pending timeout
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
        playbackTimeoutRef.current = null;
      }
      
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
      if (soundRef.current) {
        // Clear status listener before unloading
        soundRef.current.setOnPlaybackStatusUpdate(null);
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const questions = await notesService.fetchQuestions(note.id);
      setSession(prev => ({ ...prev, questions }));
    } catch (error) {
      console.error('Error fetching questions:', error);
      Alert.alert(
        'Error',
        'Failed to load questions. Please check your connection and try again.',
        [
          { text: 'Retry', onPress: fetchQuestions },
          { text: 'Cancel', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) {
      Alert.alert('Error', 'Please provide an answer before submitting');
      return;
    }

    // Stop any active recording first
    await stopIfRecording();
    
    // Clean up audio resources before proceeding
    await cleanupCurrentAudio();

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

  const stopIfRecording = async () => {
    if (isRecording && recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (error) {
        console.error('Error stopping recording during submit:', error);
      } finally {
        setIsRecording(false);
        recordingRef.current = null;
      }
    }
  };

  const cleanupCurrentAudio = async () => {
    try {
      // Clear any active timeout
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
        playbackTimeoutRef.current = null;
      }
      
      if (soundRef.current) {
        // Clear status listener before unloading
        soundRef.current.setOnPlaybackStatusUpdate(null);
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.error('Error cleaning up audio:', error);
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
    if (!isAudioSupported) {
      Alert.alert('Audio Not Supported', 'Audio recording is not available on this platform. Please type your answer instead.');
      return;
    }

    if (!hasAudioPermission) {
      Alert.alert(
        'Permission Required', 
        'Microphone permission is required for voice recording. Please enable it in settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
      return;
    }

    try {
      if (recordingRef.current) {
        console.warn('Recording already in progress');
        return;
      }

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = newRecording;
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) {
        console.warn('No recording to stop');
        return;
      }

      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      if (uri) {
        setRecordingUri(uri);
        await transcribeRecording(uri);
      }
      
      recordingRef.current = null;
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
      setIsRecording(false);
      recordingRef.current = null;
      setRecordingUri('');
    }
  };

  const getAudioFileInfo = () => {
    // HIGH_QUALITY preset typically produces M4A (AAC) on both iOS and Android
    // This is more deterministic than parsing URIs which can be unreliable
    return {
      fileExtension: 'm4a',
      mimeType: 'audio/mp4', // More broadly recognized than audio/m4a
    };
  };

  const transcribeRecording = async (uri: string) => {
    try {
      setTranscribing(true);
      const { fileExtension, mimeType } = getAudioFileInfo();
      
      const transcribedText = await notesService.transcribeAudio(uri, {
        fileExtension,
        mimeType,
      });
      setCurrentAnswer(transcribedText.trim());
    } catch (error) {
      console.error('Error transcribing audio:', error);
      Alert.alert(
        'Transcription Failed',
        'Could not transcribe audio. You can type your answer instead.',
        [{ text: 'OK' }]
      );
    } finally {
      setTranscribing(false);
    }
  };

  const playRecording = async () => {
    if (!recordingUri) {
      Alert.alert('Error', 'No recording to play');
      return;
    }

    let newSound: Audio.Sound | null = null;
    
    try {
      // Clear any existing timeout
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
        playbackTimeoutRef.current = null;
      }
      
      if (soundRef.current) {
        soundRef.current.setOnPlaybackStatusUpdate(null);
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: false }
      );
      newSound = sound;
      soundRef.current = newSound;
      
      // Set up timeout protection (1 minute max)
      const timeout = setTimeout(() => {
        if (soundRef.current) {
          soundRef.current.setOnPlaybackStatusUpdate(null);
          soundRef.current.unloadAsync().catch(console.error);
          soundRef.current = null;
        }
        playbackTimeoutRef.current = null;
      }, 60000);
      playbackTimeoutRef.current = timeout;
      
      // Set up playback status listener to clean up when finished
      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          if (playbackTimeoutRef.current) {
            clearTimeout(playbackTimeoutRef.current);
            playbackTimeoutRef.current = null;
          }
          if (soundRef.current) {
            soundRef.current.setOnPlaybackStatusUpdate(null);
            soundRef.current.unloadAsync().catch(console.error);
            soundRef.current = null;
          }
        }
      });
      
      await newSound.playAsync();
    } catch (error) {
      console.error('Error playing recording:', error);
      Alert.alert('Error', 'Failed to play recording. The audio file may be corrupted.');
      
      // Clean up on error
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
        playbackTimeoutRef.current = null;
      }
      if (newSound) {
        newSound.setOnPlaybackStatusUpdate(null);
        newSound.unloadAsync().catch(console.error);
        soundRef.current = null;
      }
    }
  };

  const deleteRecording = async () => {
    try {
      // Clear any active timeout
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
        playbackTimeoutRef.current = null;
      }
      
      if (soundRef.current) {
        soundRef.current.setOnPlaybackStatusUpdate(null);
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setRecordingUri('');
      setCurrentAnswer('');
    } catch (error) {
      console.error('Error deleting recording:', error);
    }
  };

  const currentQuestion = session.questions[session.currentQuestionIndex];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>No questions available</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
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
          placeholder="Type your answer here or record audio..."
          value={currentAnswer}
          onChangeText={setCurrentAnswer}
          editable={!transcribing}
        />

        {transcribing && (
          <View style={styles.transcribingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.transcribingText}>Transcribing audio...</Text>
          </View>
        )}

        <View style={styles.audioControls}>
          {!isAudioSupported ? (
            <Text style={styles.audioUnsupportedText}>
              Voice recording is not available on this platform
            </Text>
          ) : !hasAudioPermission ? (
            <Text style={styles.audioPermissionText}>
              Microphone permission required for voice recording
            </Text>
          ) : (
            <TouchableOpacity
              style={[styles.recordButton, isRecording && styles.recordingButton]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Text style={styles.recordButtonText}>
                {isRecording ? 'Stop Recording' : 'Record Answer'}
              </Text>
            </TouchableOpacity>
          )}

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
        <TouchableOpacity 
          style={[styles.submitButton, (!currentAnswer.trim() || transcribing || isRecording) && styles.disabledButton]} 
          onPress={handleSubmitAnswer}
          disabled={!currentAnswer.trim() || transcribing || isRecording}
        >
          <Text style={[styles.submitButtonText, (!currentAnswer.trim() || transcribing || isRecording) && styles.disabledButtonText]}>
            {isRecording ? 'Stop Recording First' : session.currentQuestionIndex < session.questions.length - 1 ? 'Next Question' : 'Finish Practice'}
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  transcribingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  transcribingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  disabledButtonText: {
    color: '#888',
  },
  audioUnsupportedText: {
    fontSize: 14,
    color: '#FF9500',
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 12,
  },
  audioPermissionText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 12,
  },
});