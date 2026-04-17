import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
  Image, ScrollView
} from 'react-native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ChatScreen({ route }) {
  const { complaint } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/complaints/${complaint.id}/messages`);
      setMessages(res.data.messages || []);
    } catch (error) {
      console.log('Erro ao buscar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.post(`/complaints/${complaint.id}/messages`, { content: text });
      setText('');
      fetchMessages();
    } catch (error) {
      console.log('Erro ao enviar mensagem:', error);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender_id === user.id;
    return (
      <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
        {!isMe && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.sender?.name?.[0] || '?'}
            </Text>
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          {!isMe && (
            <Text style={styles.senderName}>{item.sender?.name}</Text>
          )}
          <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>
            {new Date(item.createdAt).toLocaleTimeString('pt-BR', {
              hour: '2-digit', minute: '2-digit'
            })}
          </Text>
        </View>
      </View>
    );
  };

  const statusLabel = {
    pending: 'Pendente',
    validated: 'Aguardando',
    in_progress: 'Em Andamento',
    resolved: 'Resolvida'
  };

  const statusColor = {
    pending: '#6B7280',
    validated: '#F59E0B',
    in_progress: '#3B82F6',
    resolved: '#10B981'
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Info da reclamação */}
      <View style={styles.complaintInfo}>
        <Text style={styles.complaintTitle}>{complaint.title}</Text>
        <View style={styles.complaintMeta}>
          <Text style={styles.protocol}>{complaint.protocol}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: statusColor[complaint.status] + '20' }
          ]}>
            <Text style={[styles.statusText, { color: statusColor[complaint.status] }]}>
              {statusLabel[complaint.status]}
            </Text>
          </View>
        </View>
        {complaint.images?.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {complaint.images.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                style={{ width: 80, height: 80, borderRadius: 8, marginRight: 8 }}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Mensagens */}
      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>Nenhuma mensagem ainda</Text>
            </View>
          }
        />
      )}

      {/* Input */}
      {complaint.status !== 'resolved' && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Digite sua mensagem..."
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, (!text.trim() || sending) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.sendButtonText}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  complaintInfo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  complaintTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
  complaintMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  protocol: { fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600' },
  messagesList: { padding: 16, flexGrow: 1 },
  messageRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  messageRowMe: { justifyContent: 'flex-end' },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#2563EB', justifyContent: 'center',
    alignItems: 'center', marginRight: 8
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  bubble: {
    maxWidth: '75%', padding: 12, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
  },
  bubbleThem: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4
  },
  bubbleMe: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4
  },
  senderName: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
  messageText: { fontSize: 15, color: '#111827' },
  messageTextMe: { color: '#FFFFFF' },
  messageTime: { fontSize: 10, color: '#9CA3AF', marginTop: 4, textAlign: 'right' },
  messageTimeMe: { color: '#BFDBFE' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { color: '#9CA3AF', fontSize: 14 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: 12, backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 8
  },
  input: {
    flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, maxHeight: 100
  },
  sendButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center'
  },
  sendButtonDisabled: { opacity: 0.4 },
  sendButtonText: { color: '#FFF', fontSize: 18 }
});