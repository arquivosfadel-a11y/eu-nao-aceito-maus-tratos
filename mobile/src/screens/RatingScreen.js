import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const EMOJIS = [
  { value: 1, emoji: '😡', label: 'Péssimo' },
  { value: 2, emoji: '😞', label: 'Ruim' },
  { value: 3, emoji: '😐', label: 'Regular' },
  { value: 4, emoji: '😊', label: 'Bom' },
  { value: 5, emoji: '😍', label: 'Ótimo' },
];

export default function RatingScreen({ route, navigation }) {
  const { complaintId, cityId, protocol } = route.params;
  const { user } = useAuth();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!rating) {
      Alert.alert('Avaliação necessária', 'Por favor, selecione uma nota antes de enviar.');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/cities/${cityId}/rate`, {
        complaint_id: complaintId,
        rating,
        comment: comment.trim() || undefined,
      });

      Alert.alert(
        '✅ Avaliação enviada!',
        'Obrigado pelo seu feedback. Sua opinião ajuda a melhorar os serviços municipais.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      const msg = error?.response?.data?.message || 'Não foi possível enviar a avaliação.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  const selectedEmoji = EMOJIS.find(e => e.value === rating);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>⭐</Text>
        <Text style={styles.headerTitle}>Como foi o atendimento?</Text>
        <Text style={styles.headerSubtitle}>Protocolo #{protocol}</Text>
        <Text style={styles.headerDescription}>
          Sua avaliação é importante para melhorar os serviços públicos da cidade
        </Text>
      </View>

      {/* Emojis de nota */}
      <View style={styles.emojiContainer}>
        {EMOJIS.map((item) => (
          <TouchableOpacity
            key={item.value}
            onPress={() => setRating(item.value)}
            style={[styles.emojiButton, rating === item.value && styles.emojiSelected]}
            activeOpacity={0.7}
          >
            <Text style={[styles.emoji, rating === item.value && styles.emojiActive]}>
              {item.emoji}
            </Text>
            <Text style={[styles.emojiLabel, rating === item.value && styles.emojiLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Feedback da nota selecionada */}
      {selectedEmoji && (
        <View style={[styles.selectedBadge, { backgroundColor: ratingColor(rating) + '20', borderColor: ratingColor(rating) + '50' }]}>
          <Text style={[styles.selectedBadgeText, { color: ratingColor(rating) }]}>
            {selectedEmoji.emoji} {selectedEmoji.label}
          </Text>
        </View>
      )}

      {/* Comentário opcional */}
      <View style={styles.commentSection}>
        <Text style={styles.commentLabel}>Comentário (opcional)</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="Conte como foi sua experiência..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          value={comment}
          onChangeText={setComment}
          maxLength={500}
        />
        <Text style={styles.charCount}>{comment.length}/500</Text>
      </View>

      {/* Botão enviar */}
      <TouchableOpacity
        style={[styles.submitButton, !rating && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={loading || !rating}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>✅ Enviar Avaliação</Text>
        )}
      </TouchableOpacity>

      {/* Pular */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>Pular por agora</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

function ratingColor(rating) {
  if (rating <= 2) return '#EF4444';
  if (rating === 3) return '#F59E0B';
  return '#10B981';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 24, paddingBottom: 40 },

  header: {
    alignItems: 'center',
    backgroundColor: '#012235',
    borderRadius: 20,
    padding: 28,
    marginBottom: 24,
  },
  headerEmoji: { fontSize: 40, marginBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 6 },
  headerSubtitle: { fontSize: 13, color: '#02dcfb', fontWeight: '600', marginBottom: 8 },
  headerDescription: { fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 18 },

  emojiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  emojiButton: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  emojiSelected: {
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  emoji: { fontSize: 30, marginBottom: 4, opacity: 0.5 },
  emojiActive: { opacity: 1, transform: [{ scale: 1.15 }] },
  emojiLabel: { fontSize: 9, color: '#9CA3AF', fontWeight: '500', textAlign: 'center' },
  emojiLabelActive: { color: '#059669', fontWeight: '700' },

  selectedBadge: {
    alignSelf: 'center',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  selectedBadgeText: { fontSize: 14, fontWeight: '700' },

  commentSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  commentLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 },
  commentInput: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10,
    padding: 12, fontSize: 14, color: '#111827',
    textAlignVertical: 'top', minHeight: 100,
  },
  charCount: { fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: 6 },

  submitButton: {
    backgroundColor: '#012235',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitDisabled: { backgroundColor: '#9CA3AF' },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  skipButton: { alignItems: 'center', paddingVertical: 10 },
  skipText: { fontSize: 13, color: '#9CA3AF', textDecorationLine: 'underline' },
});