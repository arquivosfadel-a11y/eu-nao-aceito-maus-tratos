import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Modal, FlatList, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
  pending:      { label: 'Pendente',      color: '#6B7280', bg: '#F3F4F6' },
  validated:    { label: 'Aguardando',    color: '#D97706', bg: '#FEF3C7' },
  in_progress:  { label: 'Em Andamento',  color: '#2563EB', bg: '#EFF6FF' },
  resolved:     { label: 'Resolvida',     color: '#059669', bg: '#ECFDF5' },
  not_resolved: { label: 'Não Resolvida', color: '#DC2626', bg: '#FEF2F2' },
  rejected:     { label: 'Rejeitada',     color: '#6B7280', bg: '#F3F4F6' },
  closed:       { label: 'Encerrada',     color: '#6B7280', bg: '#F3F4F6' },
};

const PRIORITY_CONFIG = {
  low:    { label: 'Baixa',   color: '#9CA3AF' },
  medium: { label: 'Média',   color: '#D97706' },
  high:   { label: 'Alta',    color: '#EA580C' },
  urgent: { label: 'Urgente', color: '#DC2626' },
};

const EMOJI_MAP = { 1: '😡', 2: '😞', 3: '😐', 4: '😊', 5: '😍' };
const LABEL_MAP = { 1: 'Péssimo', 2: 'Ruim', 3: 'Regular', 4: 'Bom', 5: 'Excelente' };

export default function SecretaryComplaintDetailScreen({ route, navigation }) {
  const { complaint: initial } = route.params;
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(initial);
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionDesc, setResolutionDesc] = useState('');
  const [resolutionImages, setResolutionImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(null); // avaliação do cidadão
  const flatListRef = useRef(null);

  const status = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.pending;
  const priority = PRIORITY_CONFIG[complaint.priority];
  const canStart = complaint.status === 'validated';
  const canResolve = complaint.status === 'in_progress';
  const isClosed = complaint.status === 'resolved' || complaint.status === 'closed';

  useEffect(() => {
    fetchComplaint();
    fetchMessages();
    const interval = setInterval(() => {
      fetchMessages();
      fetchComplaint();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Busca avaliação quando reclamação estiver resolvida/encerrada
  useEffect(() => {
    if (isClosed) fetchRating();
  }, [complaint.status]);

  const fetchComplaint = async () => {
    try {
      const res = await api.get(`/complaints/${complaint.id}`);
      if (res.data.complaint) setComplaint(res.data.complaint);
    } catch (e) { }
  };

  const fetchRating = async () => {
    try {
      const res = await api.get(`/cities/${complaint.city_id}/rating/${complaint.id}`);
      if (res.data.success && res.data.rating) setRating(res.data.rating);
    } catch (e) { }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/complaints/${complaint.id}/messages`);
      setMessages(res.data.messages || []);
    } catch (e) { }
    finally { setLoadingMsgs(false); }
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.post(`/complaints/${complaint.id}/messages`, { content: text.trim() });
      setText('');
      fetchMessages();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
    } finally { setSending(false); }
  };

  const handleStartService = () => {
    Alert.alert(
      '🔄 Iniciar Atendimento',
      'Confirma que vai iniciar o atendimento desta reclamação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, iniciar', onPress: async () => {
            try {
              await api.put(`/complaints/${complaint.id}/status`, { status: 'in_progress' });
              await fetchComplaint();
            } catch (e) {
              Alert.alert('Erro', 'Não foi possível atualizar o status.');
            }
          }
        }
      ]
    );
  };

  const pickResolutionImage = async () => {
    if (resolutionImages.length >= 3) { Alert.alert('Limite', 'Máximo de 3 fotos'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, quality: 0.8
    });
    if (!result.canceled) setResolutionImages([...resolutionImages, result.assets[0].uri]);
  };

  const takeResolutionPhoto = async () => {
    if (resolutionImages.length >= 3) { Alert.alert('Limite', 'Máximo de 3 fotos'); return; }
    const { status: permStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (permStatus !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à câmera');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
    if (!result.canceled) setResolutionImages([...resolutionImages, result.assets[0].uri]);
  };

  const handleResolve = async () => {
    if (resolutionImages.length === 0) {
      Alert.alert('⚠️ Foto obrigatória', 'É necessário enviar pelo menos uma foto do serviço realizado.');
      return;
    }
    if (!resolutionDesc.trim()) {
      Alert.alert('⚠️ Descrição obrigatória', 'Descreva como o problema foi resolvido.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('status', 'resolved');
      formData.append('resolution_description', resolutionDesc.trim());
      resolutionImages.forEach((uri, index) => {
        formData.append('resolution_images', {
          uri, name: `resolution_${index}.jpg`, type: 'image/jpeg'
        });
      });
      await api.put(`/complaints/${complaint.id}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowResolveModal(false);
      setResolutionDesc('');
      setResolutionImages([]);
      await fetchComplaint();
      await fetchMessages();
      Alert.alert('✅ Resolvida!', 'O cidadão será notificado e terá 5 dias para confirmar.');
    } catch (e) {
      Alert.alert('Erro', e.response?.data?.message || 'Erro ao marcar como resolvida.');
    } finally { setSubmitting(false); }
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const formatTime = (date) => new Date(date).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit'
  });

  const renderMessage = ({ item }) => {
    const isMe = item.sender_id === user?.id;
    const isSystem = item.is_system;

    if (isSystem) {
      return (
        <View style={styles.systemMsg}>
          <Text style={styles.systemMsgText}>{item.content}</Text>
          <Text style={styles.systemMsgTime}>{formatTime(item.createdAt)}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        {!isMe && (
          <View style={styles.msgAvatar}>
            <Text style={styles.msgAvatarText}>{item.sender?.name?.[0] || '?'}</Text>
          </View>
        )}
        <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleThem]}>
          {!isMe && <Text style={styles.msgSender}>{item.sender?.name}</Text>}
          <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.content}</Text>
          <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>{formatTime(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  // Renderiza as estrelas de avaliação
  const renderStars = (value) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map(i => (
          <Text key={i} style={[styles.star, i <= value && styles.starFilled]}>★</Text>
        ))}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{complaint.title}</Text>
          <Text style={styles.headerProtocol}>{complaint.protocol}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      {/* Botões de ação */}
      {(canStart || canResolve) && (
        <View style={styles.actionBar}>
          {canStart && (
            <TouchableOpacity style={styles.btnStart} onPress={handleStartService}>
              <Text style={styles.btnStartText}>🔄 Iniciar Atendimento</Text>
            </TouchableOpacity>
          )}
          {canResolve && (
            <TouchableOpacity style={styles.btnResolve} onPress={() => setShowResolveModal(true)}>
              <Text style={styles.btnResolveText}>✅ Marcar como Resolvida</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'info' && styles.tabActive]}
          onPress={() => setActiveTab('info')}
        >
          <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>📋 Detalhes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, styles.tabChat, activeTab === 'chat' && styles.tabChatActive]}
          onPress={() => setActiveTab('chat')}
        >
          <Text style={styles.tabChatText}>
            💬 Chat {messages.length > 0 ? `(${messages.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB: DETALHES */}
      {activeTab === 'info' && (
        <ScrollView contentContainerStyle={styles.infoScroll} showsVerticalScrollIndicator={false}>

          {complaint.images?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📷 Fotos do Problema</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {complaint.images.map((img, i) => (
                  <TouchableOpacity key={i} onPress={() => setLightboxImg(img)}>
                    <Image source={{ uri: img }} style={styles.photoThumb} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {complaint.resolution_images?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✅ Fotos da Resolução</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {complaint.resolution_images.map((img, i) => (
                  <TouchableOpacity key={i} onPress={() => setLightboxImg(img)}>
                    <Image source={{ uri: img }} style={styles.photoThumb} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ⭐ AVALIAÇÃO DO CIDADÃO */}
          {isClosed && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⭐ Avaliação do Cidadão</Text>
              {rating ? (
                <View style={styles.ratingCard}>
                  <View style={styles.ratingTop}>
                    <Text style={styles.ratingEmoji}>{EMOJI_MAP[rating.rating]}</Text>
                    <View style={styles.ratingInfo}>
                      <Text style={styles.ratingLabel}>{LABEL_MAP[rating.rating]}</Text>
                      {renderStars(rating.rating)}
                      <Text style={styles.ratingDate}>
                        {new Date(rating.createdAt).toLocaleDateString('pt-BR')}
                      </Text>
                    </View>
                  </View>
                  {rating.comment ? (
                    <View style={styles.ratingComment}>
                      <Text style={styles.ratingCommentLabel}>Comentário do cidadão:</Text>
                      <Text style={styles.ratingCommentText}>"{rating.comment}"</Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <View style={styles.ratingPending}>
                  <Text style={styles.ratingPendingIcon}>⏳</Text>
                  <Text style={styles.ratingPendingText}>Cidadão ainda não avaliou</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ℹ️ Informações</Text>
            <View style={styles.infoCard}>
              {[
                { label: 'Cidadão',       value: complaint.citizen?.name,         icon: '👤' },
                { label: 'Prioridade',    value: priority?.label,                 icon: '🎯' },
                { label: 'Bairro',        value: complaint.neighborhood,          icon: '📍' },
                { label: 'Endereço',      value: complaint.address,               icon: '🗺️' },
                { label: 'Registrada em', value: formatDate(complaint.createdAt), icon: '📅' },
                complaint.resolution_description ? { label: 'Resolução', value: complaint.resolution_description, icon: '✅' } : null,
              ].filter(Boolean).map((item, index, arr) => (
                <View key={item.label} style={[styles.infoRow, index < arr.length - 1 && styles.infoRowBorder]}>
                  <Text style={styles.infoIcon}>{item.icon}</Text>
                  <View style={styles.infoTexts}>
                    <Text style={styles.infoLabel}>{item.label}</Text>
                    <Text style={styles.infoValue}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {complaint.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📝 Descrição</Text>
              <View style={styles.descCard}>
                <Text style={styles.descText}>{complaint.description}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.btnChat} onPress={() => setActiveTab('chat')}>
            <Text style={styles.btnChatText}>💬 Abrir Chat com Cidadão</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* TAB: CHAT */}
      {activeTab === 'chat' && (
        <View style={styles.chatContainer}>
          {loadingMsgs ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#012235" />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={item => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.msgList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              ListEmptyComponent={
                <View style={styles.msgEmpty}>
                  <Text style={styles.msgEmptyIcon}>💬</Text>
                  <Text style={styles.msgEmptyTitle}>Nenhuma mensagem ainda</Text>
                  <Text style={styles.msgEmptyText}>Inicie a conversa com o cidadão.</Text>
                </View>
              }
            />
          )}

          {!isClosed && (
            <View style={styles.msgInput}>
              <TextInput
                style={styles.msgTextInput}
                value={text}
                onChangeText={setText}
                placeholder="Digite sua mensagem..."
                placeholderTextColor="#9CA3AF"
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
                onPress={sendMessage}
                disabled={!text.trim() || sending}
              >
                {sending
                  ? <ActivityIndicator color="#02dcfb" size="small" />
                  : <Text style={styles.sendBtnText}>➤</Text>
                }
              </TouchableOpacity>
            </View>
          )}

          {isClosed && (
            <View style={styles.closedBanner}>
              <Text style={styles.closedText}>
                {complaint.status === 'closed' ? '🔒 Reclamação encerrada' : '✅ Aguardando confirmação do cidadão'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Modal: Marcar como Resolvida */}
      <Modal visible={showResolveModal} animationType="slide" transparent onRequestClose={() => setShowResolveModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>✅ Marcar como Resolvida</Text>

            <Text style={styles.modalLabel}>📷 Foto do serviço realizado <Text style={styles.required}>*</Text></Text>
            <View style={styles.photoButtons}>
              <TouchableOpacity style={styles.photoBtn} onPress={takeResolutionPhoto}>
                <Text style={styles.photoBtnIcon}>📷</Text>
                <Text style={styles.photoBtnText}>Câmera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoBtn} onPress={pickResolutionImage}>
                <Text style={styles.photoBtnIcon}>🖼️</Text>
                <Text style={styles.photoBtnText}>Galeria</Text>
              </TouchableOpacity>
            </View>

            {resolutionImages.length === 0 && (
              <View style={styles.photoWarning}>
                <Text style={styles.photoWarningText}>⚠️ Pelo menos 1 foto é obrigatória</Text>
              </View>
            )}

            {resolutionImages.length > 0 && (
              <ScrollView horizontal style={{ marginBottom: 12 }}>
                {resolutionImages.map((uri, i) => (
                  <TouchableOpacity key={i} onPress={() => setResolutionImages(resolutionImages.filter((_, idx) => idx !== i))}>
                    <Image source={{ uri }} style={styles.previewImg} />
                    <View style={styles.removeBtn}>
                      <Text style={styles.removeBtnText}>✕</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <Text style={styles.modalLabel}>📝 Descrição da resolução <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.modalTextarea}
              value={resolutionDesc}
              onChangeText={setResolutionDesc}
              placeholder="Descreva como o problema foi resolvido..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              blurOnSubmit={true}
              returnKeyType="done"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => { setShowResolveModal(false); setResolutionDesc(''); setResolutionImages([]); }}
                disabled={submitting}
              >
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnConfirm, (resolutionImages.length === 0 || !resolutionDesc.trim()) && styles.modalBtnDisabled]}
                onPress={handleResolve}
                disabled={submitting || resolutionImages.length === 0 || !resolutionDesc.trim()}
              >
                {submitting
                  ? <ActivityIndicator color="#012235" size="small" />
                  : <Text style={styles.modalBtnConfirmText}>Confirmar Resolução</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Lightbox */}
      {lightboxImg && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setLightboxImg(null)}>
          <TouchableOpacity style={styles.lightbox} onPress={() => setLightboxImg(null)}>
            <Image source={{ uri: lightboxImg }} style={styles.lightboxImg} resizeMode="contain" />
            <Text style={styles.lightboxHint}>Toque para fechar</Text>
          </TouchableOpacity>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },

  header: {
    backgroundColor: '#012235',
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 24, color: '#02dcfb', fontWeight: '700' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  headerProtocol: { fontSize: 10, color: '#02dcfb80', marginTop: 2 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },

  actionBar: {
    backgroundColor: '#fff', padding: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  btnStart: {
    backgroundColor: '#EFF6FF', borderRadius: 12,
    padding: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#BFDBFE',
  },
  btnStartText: { color: '#2563EB', fontWeight: '700', fontSize: 15 },
  btnResolve: {
    backgroundColor: '#012235', borderRadius: 12,
    padding: 14, alignItems: 'center',
  },
  btnResolveText: { color: '#cbf93e', fontWeight: '700', fontSize: 15 },

  tabs: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#012235' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  tabTextActive: { color: '#012235' },
  tabChat: { backgroundColor: '#cbf93e', borderBottomWidth: 2, borderBottomColor: '#cbf93e' },
  tabChatActive: { borderBottomColor: '#012235' },
  tabChatText: { fontSize: 13, fontWeight: '700', color: '#012235' },

  infoScroll: { padding: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 },
  photoThumb: { width: 100, height: 100, borderRadius: 10, marginRight: 8, backgroundColor: '#F3F4F6' },

  // ⭐ Avaliação
  ratingCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    borderLeftWidth: 4, borderLeftColor: '#F59E0B',
  },
  ratingTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  ratingEmoji: { fontSize: 42 },
  ratingInfo: { flex: 1 },
  ratingLabel: { fontSize: 16, fontWeight: '800', color: '#012235', marginBottom: 4 },
  starsRow: { flexDirection: 'row', gap: 2, marginBottom: 4 },
  star: { fontSize: 20, color: '#D1D5DB' },
  starFilled: { color: '#F59E0B' },
  ratingDate: { fontSize: 11, color: '#9CA3AF' },
  ratingComment: {
    backgroundColor: '#FFF7ED', borderRadius: 10, padding: 12,
    borderLeftWidth: 3, borderLeftColor: '#F59E0B',
  },
  ratingCommentLabel: { fontSize: 11, fontWeight: '700', color: '#92400E', marginBottom: 4 },
  ratingCommentText: { fontSize: 13, color: '#78350F', lineHeight: 20, fontStyle: 'italic' },
  ratingPending: {
    backgroundColor: '#F9FAFB', borderRadius: 16, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  ratingPendingIcon: { fontSize: 28, marginBottom: 6 },
  ratingPendingText: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },

  infoCard: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoIcon: { fontSize: 18, marginTop: 1 },
  infoTexts: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '500' },

  descCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  descText: { fontSize: 14, color: '#374151', lineHeight: 22 },

  btnChat: {
    backgroundColor: '#012235', borderRadius: 14, height: 52,
    justifyContent: 'center', alignItems: 'center', marginTop: 4,
  },
  btnChatText: { color: '#02dcfb', fontWeight: '700', fontSize: 15 },

  chatContainer: { flex: 1 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  msgList: { padding: 16, flexGrow: 1 },
  msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  msgRowMe: { justifyContent: 'flex-end' },
  msgAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F3F4F6', justifyContent: 'center',
    alignItems: 'center', marginRight: 8,
  },
  msgAvatarText: { color: '#012235', fontWeight: '800', fontSize: 13 },
  msgBubble: {
    maxWidth: '75%', padding: 12, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  msgBubbleThem: { backgroundColor: '#fff', borderBottomLeftRadius: 4 },
  msgBubbleMe: { backgroundColor: '#012235', borderBottomRightRadius: 4 },
  msgSender: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
  msgText: { fontSize: 14, color: '#111827', lineHeight: 20 },
  msgTextMe: { color: '#ffffff' },
  msgTime: { fontSize: 10, color: '#9CA3AF', marginTop: 4, textAlign: 'right' },
  msgTimeMe: { color: '#02dcfb80' },

  systemMsg: {
    alignSelf: 'center', backgroundColor: '#F3F4F6',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
    marginBottom: 12, maxWidth: '85%',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  systemMsgText: { fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 18 },
  systemMsgTime: { fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 4 },

  msgEmpty: { alignItems: 'center', paddingTop: 60 },
  msgEmptyIcon: { fontSize: 40, marginBottom: 8 },
  msgEmptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 4 },
  msgEmptyText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },

  msgInput: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: 12, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 8,
  },
  msgTextInput: {
    flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, maxHeight: 100, color: '#012235',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#012235', justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#02dcfb', fontSize: 18, fontWeight: '700' },
  closedBanner: {
    backgroundColor: '#ECFDF5', padding: 14,
    borderTopWidth: 1, borderTopColor: '#D1FAE5', alignItems: 'center',
  },
  closedText: { fontSize: 13, color: '#059669', fontWeight: '700' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '90%',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#012235', marginBottom: 20, textAlign: 'center' },
  modalLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  required: { color: '#EF4444' },
  photoButtons: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  photoBtn: {
    flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12,
    padding: 14, alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  photoBtnIcon: { fontSize: 22 },
  photoBtnText: { fontSize: 13, fontWeight: '600', color: '#012235' },
  photoWarning: {
    backgroundColor: '#FEF3C7', borderRadius: 10, padding: 10,
    marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#F59E0B',
  },
  photoWarningText: { color: '#92400E', fontSize: 12, fontWeight: '500' },
  previewImg: { width: 80, height: 80, borderRadius: 10, marginRight: 8 },
  removeBtn: {
    position: 'absolute', top: -6, right: 2,
    backgroundColor: '#EF4444', borderRadius: 10,
    width: 20, height: 20, alignItems: 'center', justifyContent: 'center',
  },
  removeBtnText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  modalTextarea: {
    backgroundColor: '#F3F4F6', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, height: 100, color: '#111827',
    marginBottom: 20, textAlignVertical: 'top',
  },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalBtnCancel: {
    flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  modalBtnCancelText: { color: '#6B7280', fontWeight: '600' },
  modalBtnConfirm: {
    flex: 1, backgroundColor: '#012235',
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  modalBtnDisabled: { opacity: 0.4 },
  modalBtnConfirmText: { color: '#cbf93e', fontWeight: '700' },

  lightbox: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.93)',
    justifyContent: 'center', alignItems: 'center',
  },
  lightboxImg: { width: '95%', height: '80%' },
  lightboxHint: { color: '#ffffff50', fontSize: 12, marginTop: 16 },
});