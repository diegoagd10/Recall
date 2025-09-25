import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Audio } from "expo-av";
import { RootStackParamList, Question, PracticeSession } from "../types";
import NotesService from "../services/notesService";

type PracticeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Practice"
>;
type PracticeScreenRouteProp = RouteProp<RootStackParamList, "Practice">;

export default function PracticeScreen() {
  const navigation = useNavigation<PracticeScreenNavigationProp>();
  const route = useRoute<PracticeScreenRouteProp>();
  const { note } = route.params;
  const notesService = NotesService.getInstance();

  console.log(
    `📱 PracticeScreen: Screen loaded for note "${note.name}" (ID: ${note.id})`
  );

  const [session, setSession] = useState<PracticeSession>({
    noteId: note.id,
    questions: [],
    currentQuestionIndex: 0,
    userAnswers: [],
  });
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [recordingUri, setRecordingUri] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [transcribing, setTranscribing] = useState(false);
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  const [isAudioSupported, setIsAudioSupported] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const playbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log(
      "🔧 PracticeScreen: Component mounted, setting up audio and fetching questions..."
    );
    setupAudio();
    fetchQuestions();
    return () => {
      console.log(
        "🧹 PracticeScreen: Component unmounting, cleaning up audio..."
      );
      cleanupAudio();
    };
  }, []);

  const setupAudio = async () => {
    try {
      console.log(
        `🎤 PracticeScreen: Setting up audio on platform: ${Platform.OS}`
      );

      // Check if audio recording is supported on this platform
      if (Platform.OS === "web") {
        console.log(
          "⚠️ PracticeScreen: Audio recording not supported on web platform"
        );
        setIsAudioSupported(false);
        return;
      }

      console.log("🔐 PracticeScreen: Requesting audio permissions...");
      const { status } = await Audio.requestPermissionsAsync();
      console.log(`🔐 PracticeScreen: Audio permission status: ${status}`);
      setHasAudioPermission(status === "granted");

      if (status === "granted") {
        console.log(
          "🎵 PracticeScreen: Setting up audio mode for recording..."
        );
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        console.log("✅ PracticeScreen: Audio setup completed successfully");
      } else {
        console.log("❌ PracticeScreen: Audio permission denied");
      }
    } catch (error) {
      console.error("❌ PracticeScreen: Error setting up audio:", error);
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
      console.error("Error during cleanup:", error);
    }
  };

  const fetchQuestions = async () => {
    try {
      console.log(
        `🔄 PracticeScreen: Fetching questions for note ID: ${note.id}`
      );
      setLoading(true);
      const questions = await notesService.fetchQuestions(note.id);
      console.log(
        `✅ PracticeScreen: Successfully fetched ${questions.length} questions:`,
        questions
      );
      setSession((prev) => ({ ...prev, questions }));
    } catch (error) {
      console.error("❌ PracticeScreen: Error fetching questions:", error);
      // For development/testing: Show mock questions when API fails
      const mockQuestions: Question[] = [
        {
          id: "1",
          question: `What are the key concepts from "${note.name}"?`,
          answer: "Sample expected answer for testing purposes",
        },
        {
          id: "2",
          question: `How would you explain the main ideas in "${note.name}" to someone else?`,
          answer: "Another sample expected answer",
        },
        {
          id: "3",
          question: `What practical applications can you derive from "${note.name}"?`,
          answer: "Practical application example",
        },
      ];

      console.log("⚠️ PracticeScreen: Showing fallback test questions alert");
      Alert.alert(
        "Using Test Questions",
        "Could not connect to backend API. Using sample questions for testing the practice flow.",
        [
          {
            text: "Continue with Test Questions",
            onPress: () => {
              console.log(
                "✅ PracticeScreen: User chose to continue with test questions"
              );
              setSession((prev) => ({ ...prev, questions: mockQuestions }));
            },
          },
          {
            text: "Retry API",
            onPress: () => {
              console.log("🔄 PracticeScreen: User chose to retry API");
              fetchQuestions();
            },
          },
          {
            text: "Cancel",
            onPress: () => {
              console.log("❌ PracticeScreen: User cancelled, going back");
              navigation.goBack();
            },
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    console.log(
      `📝 PracticeScreen: User submitted answer: "${currentAnswer.trim()}"`
    );

    if (!currentAnswer.trim()) {
      console.log("❌ PracticeScreen: No answer provided");
      Alert.alert("Error", "Please provide an answer before submitting");
      return;
    }

    // Stop any active recording first
    await stopIfRecording();

    // Clean up audio resources before proceeding
    await cleanupCurrentAudio();

    const currentQ = session.questions[session.currentQuestionIndex];
    const newUserAnswer = {
      questionId: currentQ?.id ?? String(session.currentQuestionIndex),
      userAnswer: currentAnswer.trim(),
    };
    console.log(
      `💾 PracticeScreen: Saving answer for question ${
        session.currentQuestionIndex + 1
      }:`,
      newUserAnswer
    );

    const updatedAnswers = [...session.userAnswers, newUserAnswer];

    if (session.currentQuestionIndex < session.questions.length - 1) {
      // Move to next question
      console.log(
        `➡️ PracticeScreen: Moving to question ${
          session.currentQuestionIndex + 2
        } of ${session.questions.length}`
      );
      setSession((prev) => ({
        ...prev,
        userAnswers: updatedAnswers,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }));
      setCurrentAnswer("");
      setRecordingUri("");
    } else {
      // All questions completed, navigate to results
      console.log(
        `🏁 PracticeScreen: All questions completed, navigating to results`
      );
      finishPracticeSession(updatedAnswers);
    }
  };

  const stopIfRecording = async () => {
    if (isRecording && recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (error) {
        console.error("Error stopping recording during submit:", error);
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
      console.error("Error cleaning up audio:", error);
    }
  };

  const finishPracticeSession = async (answers: typeof session.userAnswers) => {
    try {
      console.log(
        `🎯 PracticeScreen: Starting evaluation of ${answers.length} answers`
      );
      setIsEvaluating(true);

      // Call backend to evaluate answers
      const evaluationResult = await notesService.evaluateAnswers(
        note.id,
        session.questions,
        answers
      );
      console.log(
        `📊 PracticeScreen: Evaluation result received:`,
        evaluationResult
      );

      // Extract score and incorrect answers from backend response
      const score = evaluationResult.correctOnesCount || 0;
      const incorrectAnswers = evaluationResult.incorrectQuestions || [];

      console.log(
        `🏆 PracticeScreen: Final score: ${score}/${session.questions.length} (${evaluationResult.finalScore}%)`
      );
      setIsEvaluating(false);
      navigation.navigate("Results", {
        note,
        score,
        totalQuestions: session.questions.length,
        incorrectAnswers,
      });
    } catch (error) {
      console.error("❌ PracticeScreen: Error evaluating answers:", error);
      setIsEvaluating(false);
      Alert.alert(
        "Evaluation Error",
        "Could not evaluate your answers. Please try again.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    }
  };

  const startRecording = async () => {
    console.log("🎤 PracticeScreen: User tapped start recording");

    if (!isAudioSupported) {
      console.log("❌ PracticeScreen: Audio not supported, showing alert");
      Alert.alert(
        "Audio Not Supported",
        "Audio recording is not available on this platform. Please type your answer instead."
      );
      return;
    }

    if (!hasAudioPermission) {
      console.log(
        "❌ PracticeScreen: No audio permission, showing settings alert"
      );
      Alert.alert(
        "Permission Required",
        "Microphone permission is required for voice recording. Please enable it in settings.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => {
              console.log("⚙️ PracticeScreen: User chose to open settings");
              Linking.openSettings();
            },
          },
        ]
      );
      return;
    }

    try {
      if (recordingRef.current) {
        console.warn("⚠️ PracticeScreen: Recording already in progress");
        return;
      }

      console.log("🎵 PracticeScreen: Creating new recording...");
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = newRecording;
      setIsRecording(true);
      console.log("✅ PracticeScreen: Recording started successfully");
    } catch (error) {
      console.error("❌ PracticeScreen: Error starting recording:", error);
      Alert.alert(
        "Error",
        "Failed to start recording. Please check microphone permissions."
      );
    }
  };

  const stopRecording = async () => {
    console.log("🛑 PracticeScreen: User tapped stop recording");
    try {
      if (!recordingRef.current) {
        console.warn("⚠️ PracticeScreen: No recording to stop");
        return;
      }

      console.log("⏹️ PracticeScreen: Stopping recording...");
      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      console.log(`📁 PracticeScreen: Recording saved to URI: ${uri}`);

      if (uri) {
        console.log("🔄 PracticeScreen: Starting auto-transcription...");
        await transcribeRecording(uri);
        // Clear recording URI after successful transcription
        setRecordingUri("");
      }

      recordingRef.current = null;
      console.log(
        "✅ PracticeScreen: Recording stopped and transcribed successfully"
      );
    } catch (error) {
      console.error("❌ PracticeScreen: Error stopping recording:", error);
      Alert.alert("Error", "Failed to stop recording");
      setIsRecording(false);
      recordingRef.current = null;
      setRecordingUri("");
    }
  };

  const getAudioFileInfo = () => {
    // HIGH_QUALITY preset typically produces M4A (AAC) on both iOS and Android
    // This is more deterministic than parsing URIs which can be unreliable
    return {
      fileExtension: "m4a",
      mimeType: "audio/mp4", // More broadly recognized than audio/m4a
    };
  };

  const transcribeRecording = async (uri: string) => {
    try {
      console.log(
        `🎙️ PracticeScreen: Starting transcription for audio file: ${uri}`
      );
      setTranscribing(true);
      const { fileExtension, mimeType } = getAudioFileInfo();
      console.log(
        `📄 PracticeScreen: Using audio format - extension: ${fileExtension}, mimeType: ${mimeType}`
      );

      const transcribedText = await notesService.transcribeAudio(uri, {
        fileExtension,
        mimeType,
      });
      console.log(
        `✅ PracticeScreen: Transcription successful: "${transcribedText}"`
      );
      setCurrentAnswer(transcribedText.trim());
    } catch (error) {
      console.error("❌ PracticeScreen: Error transcribing audio:", error);
      Alert.alert(
        "Transcription Failed",
        "Could not transcribe audio. You can type your answer instead.",
        [{ text: "OK" }]
      );
    } finally {
      setTranscribing(false);
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
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
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
          Question {session.currentQuestionIndex + 1} of{" "}
          {session.questions.length}
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
              style={[
                styles.recordButton,
                isRecording && styles.recordingButton,
              ]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Text style={styles.recordButtonText}>
                {isRecording ? "Stop Recording" : "Record Answer"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!currentAnswer.trim() || transcribing || isRecording) &&
              styles.disabledButton,
          ]}
          onPress={handleSubmitAnswer}
          disabled={!currentAnswer.trim() || transcribing || isRecording}
        >
          <Text
            style={[
              styles.submitButtonText,
              (!currentAnswer.trim() || transcribing || isRecording) &&
                styles.disabledButtonText,
            ]}
          >
            {isRecording
              ? "Stop Recording First"
              : session.currentQuestionIndex < session.questions.length - 1
              ? "Next Question"
              : "Finish Practice"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Evaluation Loading Modal */}
      <Modal visible={isEvaluating} transparent={true} animationType="fade">
        <View style={styles.evaluationOverlay}>
          <View style={styles.evaluationModal}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.evaluationText}>
              Evaluating your answers...
            </Text>
            <Text style={styles.evaluationSubtext}>
              Please wait while we score your responses
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  noteTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  progressText: {
    fontSize: 14,
    color: "#666",
  },
  questionContainer: {
    padding: 20,
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 8,
    boxShadow: "0px 2px 3.84px rgba(0, 0, 0, 0.1)",
    elevation: 5,
  },
  questionText: {
    fontSize: 18,
    color: "#333",
    lineHeight: 24,
  },
  answerContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: "top",
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  audioControls: {
    alignItems: "center",
  },
  recordButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
  },
  recordingButton: {
    backgroundColor: "#FF3B30",
  },
  recordButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomControls: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 32,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  submitButton: {
    backgroundColor: "#34C759",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  transcribingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  transcribingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#007AFF",
    fontStyle: "italic",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  disabledButtonText: {
    color: "#888",
  },
  audioUnsupportedText: {
    fontSize: 14,
    color: "#FF9500",
    textAlign: "center",
    fontStyle: "italic",
    marginVertical: 12,
  },
  audioPermissionText: {
    fontSize: 14,
    color: "#FF3B30",
    textAlign: "center",
    fontStyle: "italic",
    marginVertical: 12,
  },
  evaluationOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  evaluationModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    minWidth: 280,
    elevation: 10,
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3)",
  },
  evaluationText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  evaluationSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
});
