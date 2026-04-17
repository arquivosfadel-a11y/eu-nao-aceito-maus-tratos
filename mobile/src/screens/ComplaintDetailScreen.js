import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Modal, FlatList, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert, Vibration
} from 'react-native';
import { Audio } from 'expo-av';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
  pending:      { label: 'Pendente',      color: '#6B7280', bg: '#F3F4F6' },
  validated:    { label: 'Aguardando',    color: '#D97706', bg: '#FEF3C7' },
  in_progress:  { label: 'Em Andamento',  color: '#2563EB', bg: '#EFF6FF' },
  resolved:     { label: 'Resolvida',     color: '#059669', bg: '#ECFDF5' },
  not_resolved: { label: 'Não Resolvida', color: '#DC2626', bg: '#FEF2F2' },
  rejected:     { label: 'Rejeitada',     color: '#DC2626', bg: '#FEF2F2' },
  closed:       { label: 'Encerrada',     color: '#059669', bg: '#ECFDF5' },
};

export default function ComplaintDetailScreen({ route, navigation }) {
  const { complaint: initial } = route.params;
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(initial);
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [confirmModal, setConfirmModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const flatListRef = useRef(null);
  const soundRef = useRef(null);
  const prevMsgCountRef = useRef(0);

  const status = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.pending;
  const isOwner = complaint.citizen_id === user?.id || complaint.user_id === user?.id;
  const canChat = isOwner || user?.role === 'secretary' || user?.role === 'admin';
  const canConfirm = isOwner
    && complaint.status === 'resolved'
    && !complaint.citizen_confirmed
    && (complaint.contest_count || 0) < 3;
  const chatDisabled = complaint.status === 'closed' || complaint.status === 'resolved';

  // Banner de avaliação — aparece após encerramento
  const canRate = isOwner
    && (complaint.status === 'resolved' || complaint.status === 'closed');

  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3' },
          { shouldPlay: false }
        );
        soundRef.current = sound;
      } catch (e) {
        console.log('Som não carregado:', e);
      }
    };
    loadSound();
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  const playNotification = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.replayAsync();
      }
      Vibration.vibrate(200);
    } catch (e) { }
  };

  useEffect(() => {
    fetchComplaint();
    fetchMessages();
    const interval = setInterval(() => {
      fetchMessages();
      fetchComplaint();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchComplaint = async () => {
    try {
      const res = await api.get(`/complaints/${complaint.id}`);
      if (res.data.complaint) setComplaint(res.data.complaint);
    } catch (e) { }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/complaints/${complaint.id}/messages`);
      const newMessages = res.data.messages || [];
      const newUnread = res.data.unread_count || 0;

      if (newMessages.length > prevMsgCountRef.current) {
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg && lastMsg.sender_id !== user?.id) {
          playNotification();
        }
      }
      prevMsgCountRef.current = newMessages.length;

      setMessages(newMessages);

      if (activeTab !== 'chat') {
        setUnreadCount(newUnread);
      } else {
        setUnreadCount(0);
      }
    } catch (e) {
      console.log('Erro ao buscar mensagens:', e);
    } finally {
      setLoadingMsgs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      setUnreadCount(0);
    }
  }, [activeTab]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.post(`/complaints/${complaint.id}/messages`, { content: text.trim() });
      setText('');
      fetchMessages();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
    } finally {
      setSending(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/complaints/${complaint.id}/confirm`, { action: confirmModal });
      setConfirmModal(null);
      await fetchComplaint();
      await fetchMessages();

      if (confirmModal === 'confirm') {
        // Navega para tela de avaliação após confirmar resolução
        Alert.alert(
          '✅ Confirmado!',
          res.data.message,
          [{
            text: 'Avaliar atendimento ⭐',
            onPress: () => navigation.navigate('Rating', {
              complaintId: complaint.id,
              cityId: complaint.city_id,
              protocol: complaint.protocol,
            })
          },
          { text: 'Agora não', style: 'cancel' }]
        );
      } else {
        Alert.alert('⚠️ Contestação registrada', res.data.message);
      }
    } catch (e) {
      setConfirmModal(null);
      Alert.alert('Erro', e.response?.data?.message || 'Erro ao processar sua solicitação.');
    } finally {
      setSubmitting(false);
    }
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

  const daysLeft = complaint.confirmation_deadline
    ? Math.max(0, Math.ceil((new Date(complaint.confirmation_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

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

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'info' && styles.tabActive]}
          onPress={() => setActiveTab('info')}
        >
          <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
            📋 Detalhes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, styles.tabChat, activeTab === 'chat' && styles.tabChatActive]}
          onPress={() => setActiveTab('chat')}
        >
          <View style={styles.tabChatInner}>
            <Text style={styles.tabChatText}>
              💬 Chat {messages.filter(m => !m.is_system).length > 0
                ? `(${messages.filter(m => !m.is_system).length})`
                : ''}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* TAB: DETALHES */}
      {activeTab === 'info' && (
        <ScrollView contentContainerStyle={styles.infoScroll} showsVerticalScrollIndicator={false}>

          {/* Banner aguardando confirmação */}
          {canConfirm && (
            <View style={styles.confirmBanner}>
              <Text style={styles.confirmBannerTitle}>🔔 Serviço concluído!</Text>
              <Text style={styles.confirmBannerText}>
                A secretaria marcou esta reclamação como resolvida.
                {daysLeft !== null && ` Você tem ${daysLeft} dia${daysLeft !== 1 ? 's' : ''} para confirmar ou contestar.`}
                {'\n'}Contestações disponíveis: {3 - (complaint.contest_count || 0)}/3
              </Text>
              <View style={styles.confirmButtons}>
                <TouchableOpacity style={styles.btnContest} onPress={() => setConfirmModal('contest')}>
                  <Text style={styles.btnContestText}>❌ Não foi resolvido</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnConfirm} onPress={() => setConfirmModal('confirm')}>
                  <Text style={styles.btnConfirmText}>✅ Confirmar resolução</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Banner encerrada */}
          {complaint.status === 'closed' && complaint.citizen_confirmed && (
            <View style={styles.closedBanner}>
              <Text style={styles.closedBannerText}>🏆 Problema resolvido e confirmado por você!</Text>
            </View>
          )}

          {/* Banner avaliação — aparece para reclamações resolvidas/encerradas */}
          {canRate && (
            <TouchableOpacity
              style={styles.ratingBanner}
              onPress={() => navigation.navigate('Rating', {
                complaintId: complaint.id,
                cityId: complaint.city_id,
                protocol: complaint.protocol,
              })}
            >
              <Text style={styles.ratingBannerText}>⭐ Avalie o atendimento recebido</Text>
              <Text style={styles.ratingBannerSub}>Sua opinião melhora os serviços públicos</Text>
            </TouchableOpacity>
          )}

          {/* Fotos */}
          {complaint.images?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📷 Fotos</Text>
              <View style={styles.photosRow}>
                <TouchableOpacity style={styles.photoWrapper} onPress={() => setLightboxImg(complaint.images[0])}>
                  <Image source={{ uri: complaint.images[0] }} style={styles.photoImg} />
                  <View style={styles.photoLabel}>
                    <Text style={styles.photoLabelText}>Antes</Text>
                  </View>
                </TouchableOpacity>
                {complaint.resolution_images?.[0] ? (
                  <TouchableOpacity style={styles.photoWrapper} onPress={() => setLightboxImg(complaint.resolution_images[0])}>
                    <Image source={{ uri: complaint.resolution_images[0] }} style={styles.photoImg} />
                    <View style={[styles.photoLabel, styles.photoLabelAfter]}>
                      <Text style={styles.photoLabelText}>Depois</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.photoWrapper, styles.photoEmpty]}>
                    <Text style={styles.photoEmptyIcon}>🕐</Text>
                    <Text style={styles.photoEmptyText}>Foto do depois ainda não disponível</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Informações */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ℹ️ Informações</Text>
            <View style={styles.infoCard}>
              {[
                { label: 'Secretaria',    value: complaint.department?.name,      icon: '🏢' },
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

          {/* Descrição */}
          {complaint.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📝 Descrição</Text>
              <View style={styles.descCard}>
                <Text style={styles.descText}>{complaint.description}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.btnChat} onPress={() => setActiveTab('chat')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.btnChatText}>
                💬 {canChat ? 'Abrir Chat' : 'Ver Conversa'}
              </Text>
              {unreadCount > 0 && (
                <View style={styles.badgeLarge}>
                  <Text style={styles.badgeLargeText}>{unreadCount} nova{unreadCount > 1 ? 's' : ''}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* TAB: CHAT */}
      {activeTab === 'chat' && (
        <View style={styles.chatContainer}>
          {!canChat && (
            <View style={styles.chatObserver}>
              <Text style={styles.chatObserverText}>
                👁️ Você está observando a conversa entre o cidadão e a secretaria
              </Text>
            </View>
          )}

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
                  <Text style={styles.msgEmptyText}>
                    {canChat ? 'Inicie a conversa com a secretaria.' : 'O chat ainda não foi iniciado.'}
                  </Text>
                </View>
              }
            />
          )}

          {canChat && !chatDisabled && (
            <View style={styles.msgInput}>
              <TextInput
                style={styles.msgTextInput}
                value={text}
                onChangeText={setText}
                placeholder="Digite sua mensagem..."
                placeholderTextColor="#5a7a3a"
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
                onPress={sendMessage}
                disabled={!text.trim() || sending}
              >
                {sending
                  ? <ActivityIndicator color="#012235" size="small" />
                  : <Text style={styles.sendBtnText}>➤</Text>
                }
              </TouchableOpacity>
            </View>
          )}

          {chatDisabled && (
            <View style={styles.resolvedBanner}>
              <Text style={styles.resolvedText}>
                {complaint.status === 'closed' ? '🔒 Reclamação encerrada' : '✅ Aguardando confirmação do cidadão'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Modal de confirmação */}
      <Modal visible={!!confirmModal} transparent animationType="fade" onRequestClose={() => setConfirmModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalIcon}>{confirmModal === 'confirm' ? '✅' : '❌'}</Text>
            <Text style={styles.modalTitle}>
              {confirmModal === 'confirm' ? 'Confirmar resolução?' : 'Contestar resolução?'}
            </Text>
            <Text style={styles.modalText}>
              {confirmModal === 'confirm'
                ? 'Ao confirmar, você está validando que o problema foi resolvido. Esta ação não pode ser desfeita.'
                : `Ao contestar, a reclamação voltará para atendimento. Você ainda terá ${3 - (complaint.contest_count || 0) - 1} contestação(ões) disponível(eis).`
              }
            </Text>
            <Text style={styles.modalQuestion}>Você tem certeza?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setConfirmModal(null)} disabled={submitting}>
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnConfirm, confirmModal === 'contest' && styles.modalBtnContest]}
                onPress={handleConfirmAction}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalBtnConfirmText}>
                      {confirmModal === 'confirm' ? 'Sim, confirmar' : 'Sim, contestar'}
                    </Text>
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
    backgroundColor: '#F8FAFC',
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderBottomWidth: 1.5, borderBottomColor: '#E5E7EB',
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 24, color: '#012235', fontWeight: '700' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#012235' },
  headerProtocol: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },

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
  tabChatInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabChatText: { fontSize: 13, fontWeight: '700', color: '#012235' },

  badge: {
    backgroundColor: '#DC2626', borderRadius: 10,
    minWidth: 20, height: 20, justifyContent: 'center',
    alignItems: 'center', paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  badgeLarge: {
    backgroundColor: '#02dcfb', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  badgeLargeText: { color: '#012235', fontSize: 12, fontWeight: '700' },

  infoScroll: { padding: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 },

  confirmBanner: {
    backgroundColor: '#FEF3C7', borderRadius: 16, padding: 16,
    marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#F59E0B',
  },
  confirmBannerTitle: { fontSize: 15, fontWeight: '800', color: '#92400E', marginBottom: 6 },
  confirmBannerText: { fontSize: 13, color: '#78350F', lineHeight: 20, marginBottom: 14 },
  confirmButtons: { flexDirection: 'row', gap: 10 },
  btnContest: {
    flex: 1, backgroundColor: '#FEE2E2', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FCA5A5',
  },
  btnContestText: { color: '#DC2626', fontWeight: '700', fontSize: 13 },
  btnConfirm: {
    flex: 1, backgroundColor: '#012235', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  btnConfirmText: { color: '#cbf93e', fontWeight: '700', fontSize: 13 },

  closedBanner: {
    backgroundColor: '#ECFDF5', borderRadius: 16, padding: 14,
    marginBottom: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#A7F3D0',
  },
  closedBannerText: { color: '#059669', fontWeight: '700', fontSize: 14 },

  // Banner de avaliação
  ratingBanner: {
    backgroundColor: '#FFF7ED', borderRadius: 16, padding: 14,
    marginBottom: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#FED7AA',
    borderLeftWidth: 4, borderLeftColor: '#F59E0B',
  },
  ratingBannerText: { color: '#92400E', fontWeight: '800', fontSize: 14, marginBottom: 2 },
  ratingBannerSub: { color: '#D97706', fontSize: 12 },

  photosRow: { flexDirection: 'row', gap: 10 },
  photoWrapper: { flex: 1, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  photoImg: { width: '100%', height: 130, borderRadius: 12 },
  photoLabel: {
    position: 'absolute', bottom: 8, left: 8,
    backgroundColor: 'rgba(1,34,53,0.75)', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  photoLabelAfter: { backgroundColor: 'rgba(5,150,105,0.75)' },
  photoLabelText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  photoEmpty: {
    backgroundColor: '#F3F4F6', justifyContent: 'center',
    alignItems: 'center', height: 130, borderRadius: 12,
  },
  photoEmptyIcon: { fontSize: 24, marginBottom: 6 },
  photoEmptyText: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 8 },

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
  chatObserver: {
    backgroundColor: '#FEF3C7', paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#FDE68A',
  },
  chatObserverText: { fontSize: 12, color: '#D97706', textAlign: 'center', fontWeight: '500' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  msgList: { padding: 16, flexGrow: 1 },
  msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  msgRowMe: { justifyContent: 'flex-end' },
  msgAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#012235', justifyContent: 'center',
    alignItems: 'center', marginRight: 8,
  },
  msgAvatarText: { color: '#02dcfb', fontWeight: '800', fontSize: 13 },
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
    flex: 1, backgroundColor: '#cbf93e', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, maxHeight: 100, color: '#012235',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#02dcfb', justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#012235', fontSize: 18, fontWeight: '700' },
  resolvedBanner: {
    backgroundColor: '#ECFDF5', padding: 14,
    borderTopWidth: 1, borderTopColor: '#D1FAE5', alignItems: 'center',
  },
  resolvedText: { fontSize: 13, color: '#059669', fontWeight: '700' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalBox: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    width: '100%', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25, shadowRadius: 20, elevation: 10,
  },
  modalIcon: { fontSize: 48, marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#012235', marginBottom: 8, textAlign: 'center' },
  modalText: { fontSize: 14, color: '#6B7280', lineHeight: 22, textAlign: 'center', marginBottom: 12 },
  modalQuestion: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtnCancel: {
    flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 12, paddingVertical: 13, alignItems: 'center',
  },
  modalBtnCancelText: { color: '#6B7280', fontWeight: '600', fontSize: 14 },
  modalBtnConfirm: {
    flex: 1, backgroundColor: '#012235',
    borderRadius: 12, paddingVertical: 13, alignItems: 'center',
  },
  modalBtnContest: { backgroundColor: '#DC2626' },
  modalBtnConfirmText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  lightbox: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.93)',
    justifyContent: 'center', alignItems: 'center',
  },
  lightboxImg: { width: '95%', height: '80%' },
  lightboxHint: { color: '#ffffff50', fontSize: 12, marginTop: 16 },
});