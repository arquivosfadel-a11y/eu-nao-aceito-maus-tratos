import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator, ScrollView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const STATUS_CONFIG = {
  pending:     { label: 'Pendente',     color: '#6B7280', bg: '#F3F4F6' },
  validated:   { label: 'Aguardando',   color: '#D97706', bg: '#FEF3C7' },
  in_progress: { label: 'Em Andamento', color: '#2563EB', bg: '#EFF6FF' },
  resolved:    { label: 'Resolvida',    color: '#059669', bg: '#ECFDF5' },
  rejected:    { label: 'Rejeitada',    color: '#DC2626', bg: '#FEF2F2' },
};

const FILTERS = [
  { key: 'all',         label: 'Todas' },
  { key: 'validated',   label: 'Aguardando' },
  { key: 'in_progress', label: 'Andamento' },
  { key: 'resolved',    label: 'Resolvidas' },
];

// Cor identidade: branco/neutro (card "Todas as Reclamações" da Home)
const IDENTITY = {
  header: '#F8FAFC',
  headerBorder: '#E5E7EB',
  headerTitle: '#1B4332',
  headerSubtitle: '#6B7280',
  filterActive: '#1B4332',
  filterActiveTxt: '#ffffff',
  filterInactive: '#F3F4F6',
  filterInactiveTxt: '#6B7280',
  fab: '#F4A261',
  fabText: '#1B4332',
  bottomBar: '#ffffff',
  bottomBorder: '#E5E7EB',
  bottomActive: '#1B4332',
  bottomInactive: '#9CA3AF',
};

export default function AllComplaintsScreen({ navigation }) {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadComplaints(1, filter, true);
  }, [filter]);

  const loadComplaints = async (pageNum = 1, status = filter, reset = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      const params = { page: pageNum, limit: 15, is_public: true };
      if (user?.city_id) params.city_id = user.city_id;
      if (status !== 'all') params.status = status;
      const res = await api.get('/complaints', { params });
      const newItems = res.data.complaints || [];
      if (reset || pageNum === 1) setComplaints(newItems);
      else setComplaints(prev => [...prev, ...newItems]);
      setHasMore(newItems.length === 15);
      setPage(pageNum);
    } catch (e) {
      console.log('Erro:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadComplaints(1, filter, true);
  }, [filter]);

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    const days = Math.floor(diff / 86400);
    if (days < 30) return `${days} dias atrás`;
    return d.toLocaleDateString('pt-BR');
  };

  const renderCard = ({ item }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const hasPhoto = item.images?.length > 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ComplaintDetail', { complaint: item })}
        activeOpacity={0.88}
      >
        {/* Borda esquerda colorida pelo status */}
        <View style={[styles.cardBorder, { backgroundColor: status.color }]} />

        <View style={styles.cardBody}>
          {/* Linha superior: badge + protocolo */}
          <View style={styles.cardTop}>
            <View style={[styles.badge, { backgroundColor: status.bg }]}>
              <View style={[styles.badgeDot, { backgroundColor: status.color }]} />
              <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
            </View>
            <Text style={styles.protocol}>{item.protocol}</Text>
          </View>

          {/* Título */}
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

          {/* Tags: categoria + secretaria + localização */}
          <View style={styles.cardTags}>
            {item.category && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>🏷️ {item.category}</Text>
              </View>
            )}
            {item.department?.name && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>🏢 {item.department.name}</Text>
              </View>
            )}
            {item.address && (
              <View style={styles.tag}>
                <Text style={styles.tagText} numberOfLines={1}>📍 {item.address}</Text>
              </View>
            )}
          </View>

          {/* Rodapé: data + foto + visualizações */}
          <View style={styles.cardFooter}>
            <Text style={styles.footerDate}>{formatDate(item.createdAt)}</Text>
            <View style={styles.footerRight}>
              {hasPhoto && (
                <Text style={styles.footerPhoto}>📷 {item.images.length}</Text>
              )}
              <Text style={styles.footerViews}>👁️ {item.views_count || 0}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>

      {/* Header com identidade visual branca/neutra */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🔍 Todas as Denúncias</Text>
          <Text style={styles.headerSubtitle}>Mural de denúncias</Text>
        </View>
        <View style={[styles.countBadge]}>
          <Text style={styles.countText}>{complaints.length}</Text>
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filtersBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista */}
      {loading && page === 1 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#1B4332" />
          <Text style={styles.loadingText}>Carregando reclamações...</Text>
        </View>
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={item => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1B4332" />}
          onEndReached={() => { if (hasMore && !loading) loadComplaints(page + 1, filter); }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🐾</Text>
              <Text style={styles.emptyTitle}>Nenhuma denúncia encontrada</Text>
              <Text style={styles.emptyText}>Tente outro filtro ou volte mais tarde.</Text>
            </View>
          }
          ListFooterComponent={
            hasMore && !loading
              ? <ActivityIndicator color="#1B4332" style={{ marginVertical: 16 }} />
              : null
          }
        />
      )}

      {/* Barra inferior: Início | + FAB | Perfil */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.bottomIcon}>🏠</Text>
          <Text style={styles.bottomLabel}>Início</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('NewComplaint')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.bottomIcon}>👤</Text>
          <Text style={styles.bottomLabel}>Perfil</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },

  // Header neutro/branco
  header: {
    backgroundColor: '#F8FAFC',
    paddingTop: 52, paddingBottom: 14,
    paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1.5, borderBottomColor: '#E5E7EB',
  },
  backBtn: { marginRight: 12, padding: 4 },
  backText: { fontSize: 24, color: '#1B4332', fontWeight: '700' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1B4332' },
  headerSubtitle: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  countBadge: {
    backgroundColor: '#1B4332', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  countText: { color: '#F4A261', fontWeight: '700', fontSize: 13 },

  // Filtros
  filtersBar: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    paddingBottom: 12, paddingTop: 8,
  },
  filtersScroll: { paddingHorizontal: 16, gap: 8 },
  filterBtn: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20, backgroundColor: '#F3F4F6',
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  filterBtnActive: { backgroundColor: '#1B4332', borderColor: '#1B4332' },
  filterText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  filterTextActive: { color: '#ffffff' },

  // Loading / Empty
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#6B7280', fontSize: 14 },
  emptyBox: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151', marginBottom: 8 },
  emptyText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },

  // Lista
  list: { padding: 16, paddingBottom: 100, gap: 10 },

  // Card Modelo 2
  card: {
    backgroundColor: '#fff', borderRadius: 16,
    flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  cardBorder: { width: 4 },
  cardBody: { flex: 1, padding: 14 },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, gap: 4,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  protocol: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 10, lineHeight: 21 },
  cardTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tag: {
    backgroundColor: '#F9FAFB', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  tagText: { fontSize: 11, color: '#6B7280' },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingTop: 8,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  footerDate: { fontSize: 11, color: '#9CA3AF' },
  footerRight: { flexDirection: 'row', gap: 8 },
  footerPhoto: { fontSize: 11, color: '#9CA3AF' },
  footerViews: { fontSize: 11, color: '#9CA3AF' },

  // Barra inferior
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 70, backgroundColor: '#ffffff',
    borderTopWidth: 1.5, borderTopColor: '#E5E7EB',
    flexDirection: 'row', justifyContent: 'space-around',
    alignItems: 'center', paddingBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 10,
  },
  bottomBtn: { alignItems: 'center', gap: 2, flex: 1 },
  bottomIcon: { fontSize: 20 },
  bottomLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  fab: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#F4A261',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#F4A261', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45, shadowRadius: 8, elevation: 8,
    borderWidth: 3, borderColor: '#ffffff',
  },
  fabText: { fontSize: 28, color: '#1B4332', fontWeight: '800', lineHeight: 32 },
});