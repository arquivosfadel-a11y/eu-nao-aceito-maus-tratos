import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator, ScrollView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const STATUS_CONFIG = {
  pending:      { label: 'Aguardando',      color: '#D97706', bg: '#FEF3C7' },
  validated:    { label: 'Encaminhada',     color: '#2563EB', bg: '#EFF6FF' },
  in_progress:  { label: 'Em Atendimento',  color: '#1B4332', bg: '#D1FAE5' },
  resolved:     { label: 'Resolvida',       color: '#059669', bg: '#ECFDF5' },
  closed:       { label: 'Encerrada',       color: '#059669', bg: '#D1FAE5' },
  not_resolved: { label: 'Não Resolvida',   color: '#DC2626', bg: '#FEF2F2' },
  rejected:     { label: 'Rejeitada',       color: '#DC2626', bg: '#FEF2F2' },
};

const FILTERS = [
  { key: 'all',         label: 'Todas' },
  { key: 'validated',   label: 'Aguardando' },
  { key: 'in_progress', label: 'Andamento' },
  { key: 'resolved',    label: 'Resolvidas' },
  { key: 'closed',      label: 'Encerradas' },
];

export default function MyComplaintsScreen({ navigation }) {
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
      const params = { page: pageNum, limit: 15 };
      if (status !== 'all') params.status = status;
      const res = await api.get('/complaints/my/complaints', { params });
      const newItems = res.data.complaints || [];
      if (reset || pageNum === 1) setComplaints(newItems);
      else setComplaints(prev => [...prev, ...newItems]);
      setHasMore(newItems.length === 15);
      setPage(pageNum);
    } catch (e) {
      console.log('Erro ao buscar minhas reclamações:', e);
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
        <View style={[styles.cardBorder, { backgroundColor: status.color }]} />
        <View style={styles.cardBody}>

          <View style={styles.cardTop}>
            <View style={[styles.badge, { backgroundColor: status.bg }]}>
              <View style={[styles.badgeDot, { backgroundColor: status.color }]} />
              <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
            </View>
            <Text style={styles.protocol}>{item.protocol}</Text>
          </View>

          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

          <View style={styles.cardTags}>
            {item.department?.name && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>🏢 {item.department.name}</Text>
              </View>
            )}
            {item.status === 'closed' && (
              <View style={[styles.tag, { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0' }]}>
                <Text style={[styles.tagText, { color: '#059669' }]}>✅ Confirmada por você</Text>
              </View>
            )}
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.footerDate}>{formatDate(item.createdAt)}</Text>
            <View style={styles.footerRight}>
              {hasPhoto && <Text style={styles.footerExtra}>📷 {item.images.length}</Text>}
              <Text style={styles.footerExtra}>💬 Ver chat</Text>
            </View>
          </View>

        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>📋 Minhas Denúncias</Text>
          <Text style={styles.headerSubtitle}>
            Olá, {user?.name?.split(' ')[0]} — {complaints.length} registro{complaints.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => navigation.navigate('NewComplaint')}
        >
          <Text style={styles.newBtnText}>+ Nova</Text>
        </TouchableOpacity>
      </View>

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

      {loading && page === 1 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#52B788" />
          <Text style={styles.loadingText}>Carregando suas reclamações...</Text>
        </View>
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={item => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#52B788" />}
          onEndReached={() => { if (hasMore && !loading) loadComplaints(page + 1, filter); }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>Você ainda não fez nenhuma denúncia</Text>
              <Text style={styles.emptyText}>Toque em "+ Nova" para denunciar um caso de maus tratos.</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('NewComplaint')}
              >
                <Text style={styles.emptyBtnText}>🐾 Fazer primeira denúncia</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={
            hasMore && !loading
              ? <ActivityIndicator color="#52B788" style={{ marginVertical: 16 }} />
              : null
          }
        />
      )}

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

  header: {
    backgroundColor: '#1B4332',
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 24, color: '#52B788', fontWeight: '700' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#ffffff' },
  headerSubtitle: { fontSize: 11, color: '#52B788', marginTop: 2 },
  newBtn: {
    backgroundColor: '#F4A261', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  newBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  filtersBar: {
    backgroundColor: '#1B4332',
    paddingBottom: 14, paddingTop: 4,
    borderBottomWidth: 1, borderBottomColor: '#52B78820',
  },
  filtersScroll: { paddingHorizontal: 16, gap: 8 },
  filterBtn: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20, backgroundColor: '#ffffff15',
    borderWidth: 1.5, borderColor: '#ffffff20',
  },
  filterBtnActive: { backgroundColor: '#52B788', borderColor: '#52B788' },
  filterText: { fontSize: 13, color: '#ffffff80', fontWeight: '600' },
  filterTextActive: { color: '#1B4332' },

  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#6B7280', fontSize: 14 },

  list: { padding: 16, paddingBottom: 100, gap: 10 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, flexDirection: 'row',
    overflow: 'hidden', shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07,
    shadowRadius: 6, elevation: 2,
  },
  cardBorder: { width: 4 },
  cardBody: { flex: 1, padding: 14 },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, gap: 4,
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
  footerExtra: { fontSize: 11, color: '#9CA3AF' },

  emptyBox: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 8, textAlign: 'center' },
  emptyText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  emptyBtn: {
    backgroundColor: '#1B4332', borderRadius: 14,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  emptyBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },

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
    backgroundColor: '#F4A261', justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#F4A261', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45, shadowRadius: 8, elevation: 8,
    borderWidth: 3, borderColor: '#ffffff',
  },
  fabText: { fontSize: 28, color: '#fff', fontWeight: '800', lineHeight: 32 },
});