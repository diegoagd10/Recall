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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Note } from '../types';

type NotesListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'NotesList'>;

export default function NotesListScreen() {
  const navigation = useNavigation<NotesListScreenNavigationProp>();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showPracticeModal, setShowPracticeModal] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      // TODO: Implement API call to fetch notes
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setLoading(false);
    }
  };

  const handleNotePress = (note: Note) => {
    setSelectedNote(note);
    setShowPracticeModal(true);
  };

  const handleStartPractice = () => {
    setShowPracticeModal(false);
    if (selectedNote) {
      navigation.navigate('Practice', { note: selectedNote });
    }
  };

  const handleCancelPractice = () => {
    setShowPracticeModal(false);
    setSelectedNote(null);
  };

  const renderNoteItem = ({ item }: { item: Note }) => (
    <TouchableOpacity style={styles.noteItem} onPress={() => handleNotePress(item)}>
      <Text style={styles.noteTitle}>{item.name}</Text>
      <View style={styles.noteStats}>
        <Text style={styles.statText}>
          Efficiency: {item.property_efectividad ? (item.property_efectividad * 100).toFixed(0) : 'N/A'}%
        </Text>
        <Text style={styles.statText}>
          Reviews: {item.property_repasos || 0}
        </Text>
        <Text style={styles.statText}>
          Last Review: {item.property_days_since_last_review ? `${item.property_days_since_last_review} days ago` : 'Never'}
        </Text>
      </View>
    </TouchableOpacity>
  );

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
});