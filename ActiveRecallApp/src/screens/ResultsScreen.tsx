import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

type ResultsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Results'>;
type ResultsScreenRouteProp = RouteProp<RootStackParamList, 'Results'>;

export default function ResultsScreen() {
  const navigation = useNavigation<ResultsScreenNavigationProp>();
  const route = useRoute<ResultsScreenRouteProp>();
  const { note, score, totalQuestions, incorrectAnswers } = route.params;

  const handleReturnToNotes = () => {
    navigation.navigate('NotesList');
  };

  const handleRepeatPractice = () => {
    navigation.navigate('Practice', { note });
  };

  const scorePercentage = Math.round((score / totalQuestions) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Practice Results</Text>
          <Text style={styles.noteTitle}>{note.name}</Text>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>Your Score</Text>
          <Text style={[styles.scoreNumber, scorePercentage >= 70 ? styles.goodScore : styles.poorScore]}>
            {score}/{totalQuestions}
          </Text>
          <Text style={styles.scorePercentage}>({scorePercentage}%)</Text>
        </View>

        {incorrectAnswers.length > 0 && (
          <View style={styles.incorrectSection}>
            <Text style={styles.sectionTitle}>Review Incorrect Answers</Text>
            {incorrectAnswers.map((item, index) => (
              <View key={index} style={styles.incorrectItem}>
                <Text style={styles.questionTitle}>Question:</Text>
                <Text style={styles.questionText}>{item.question.question}</Text>
                
                <Text style={styles.answerTitle}>Your Answer:</Text>
                <Text style={styles.userAnswerText}>{item.userAnswer}</Text>
                
                <Text style={styles.answerTitle}>Correct Answer:</Text>
                <Text style={styles.correctAnswerText}>{item.question.answer}</Text>
              </View>
            ))}
          </View>
        )}

        {score === totalQuestions && (
          <View style={styles.perfectScoreContainer}>
            <Text style={styles.perfectScoreText}>🎉 Perfect Score!</Text>
            <Text style={styles.perfectScoreSubtext}>
              Excellent work! You got all questions correct.
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.repeatButton} onPress={handleRepeatPractice}>
            <Text style={styles.repeatButtonText}>Practice Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.returnButton} onPress={handleReturnToNotes}>
            <Text style={styles.returnButtonText}>Return to Notes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  scoreContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.1)',
    elevation: 5,
  },
  scoreText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  goodScore: {
    color: '#34C759',
  },
  poorScore: {
    color: '#FF3B30',
  },
  scorePercentage: {
    fontSize: 20,
    color: '#666',
  },
  perfectScoreContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  perfectScoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34C759',
    marginBottom: 8,
  },
  perfectScoreSubtext: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  incorrectSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  incorrectItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.1)',
    elevation: 5,
  },
  questionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  questionText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  answerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    marginTop: 8,
  },
  userAnswerText: {
    fontSize: 14,
    color: '#FF3B30',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  correctAnswerText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 12,
  },
  repeatButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  repeatButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  returnButton: {
    backgroundColor: '#666',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  returnButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});