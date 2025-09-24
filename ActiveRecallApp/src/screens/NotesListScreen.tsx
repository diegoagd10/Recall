import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Note } from '../types';
import NotesService from '../services/notesService';

type NotesListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'NotesList'>;

export default function NotesListScreen() {
  const navigation = useNavigation<NotesListScreenNavigationProp>();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const notesService = NotesService.getInstance();

  useFocusEffect(
    React.useCallback(() => {
      fetchNotes();
    }, [])
  );

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const fetchedNotes = await notesService.fetchNotes();
      setNotes(fetchedNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      Alert.alert(
        'Error',
        'Failed to load notes. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const fetchedNotes = await notesService.fetchNotes();
      setNotes(fetchedNotes);
    } catch (error) {
      console.error('Error refreshing notes:', error);
      Alert.alert('Error', 'Failed to refresh notes');
    } finally {
      setRefreshing(false);
    }
  };

  const handleNotePress = (note: Note) => {
    setSelectedNote(note);
    setShowPracticeModal(true);
  };

  const handleStartPractice = () => {
    setShowPracticeModal(false);
    if (selectedNote) {
      // Check if the note has questions
      if (!selectedNote.property_preguntas || selectedNote.property_preguntas === 0) {
        Alert.alert(
          'No Questions Available',
          'This note does not have any questions available for practice.',
          [{ text: 'OK' }]
        );
        return;
      }
      navigation.navigate('Practice', { note: selectedNote });
    }
  };

  const handleCancelPractice = () => {
    setShowPracticeModal(false);
    setSelectedNote(null);
  };

  const renderNoteItem = ({ item }: { item: Note }) => (
    <TouchableOpacity style={styles.noteItem} onPress={() => handleNotePress(item)}>
      <View style={styles.noteHeader}>
        <Text style={styles.noteTitle}>{item.name}</Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.property_category.join(', ')}</Text>
        </View>
      </View>
      <Text style={styles.noteAuthor}>by {item.property_author}</Text>
      <View style={styles.noteStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Efficiency</Text>
          <Text style={[styles.statValue, getEfficiencyColor(item.property_efectividad)]}>
            {item.property_efectividad !== null ? (item.property_efectividad * 100).toFixed(0) + '%' : 'N/A'}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Reviews</Text>
          <Text style={styles.statValue}>{item.property_repasos || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Questions</Text>
          <Text style={styles.statValue}>{item.property_preguntas || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Last Review</Text>
          <Text style={styles.statValue}>
            {item.property_days_since_last_review !== null 
              ? `${item.property_days_since_last_review} days ago` 
              : 'Never'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getEfficiencyColor = (efficiency: number | null) => {
    if (efficiency === null) return { color: '#666' };
    if (efficiency >= 0.8) return { color: '#34C759' };
    if (efficiency >= 0.6) return { color: '#FF9500' };
    return { color: '#FF3B30' };
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading notes...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Active Recall Notes</Text>
      <FlatList
        data={notes}
        renderItem={renderNoteItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No notes available</Text>
              <Text style={styles.emptySubtext}>Pull down to refresh</Text>
            </View>
          ) : null
        }
      />
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPracticeModal}
        onRequestClose={handleCancelPractice}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Start Practice Session</Text>
            <Text style={styles.modalText}>
              Would you like to practice "{selectedNote?.name}"?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelPractice}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.startButton} onPress={handleStartPractice}>
                <Text style={styles.startButtonText}>Start Practice</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  noteItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.1)',
    elevation: 5,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  noteStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  startButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  startButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  categoryBadge: {
    backgroundColor: '#E8F4FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    maxWidth: '40%',
  },
  categoryText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    textAlign: 'center',
  },
  noteAuthor: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  statItem: {
    alignItems: 'center',
    minWidth: '22%',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});