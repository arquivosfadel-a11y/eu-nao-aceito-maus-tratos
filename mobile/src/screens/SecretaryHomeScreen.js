import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

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

const FILTER_TABS = [
  { key: 'all',          label: 'Todas' },
  { key: 'validated',    label: 'Aguardando' },
  { key: 'in_progress',  label: 'Andamento' },
  { key: 'resolved',     label: 'Resolvidas' },
  { key: 'not_resolved', label: 'Não Resolvidas' },
];

const BORDER_COLOR = {
  validated:    '#F59E0B',
  in_progress:  '#3B82F6',
  resolved:     '#10B981',
  not_resolved: '#EF4444',
  pending:      '#9CA3AF',
  rejected:     '#9CA3AF',
  closed:       '#9CA3AF',
};

export default function SecretaryHomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  const fetchComplaints = useCallback(async () => {
    try {
      const res = await api.get('/complaints/my/complaints', {
        params: { limit: 100 }
      });
      setComplaints(res.data.complaints || []);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar as reclamações.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
    const interval = setInterval(fetchComplaints, 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = complaints.filter(c => {
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchSearch = search === '' ||
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.protocol?.toLowerCase().includes(search.toLowerCase()) ||
      c.neighborhood?.toLowerCase().includes(search.toLowerCase()) ||
      c.citizen?.name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = {
    all:          complaints.length,
    validated:    complaints.filter(c => c.status === 'validated').length,
    in_progress:  complaints.filter(c => c.status === 'in_progress').length,
    resolved:     complaints.filter(c => c.status === 'resolved').length,
    not_resolved: complaints.filter(c => c.status === 'not_resolved').length,
  };

  const renderComplaint = ({ item }) => {
    const sc = STATUS_CONFIG[item.status];
    const pc = PRIORITY_CONFIG[item.priority];
    const borderColor = BORDER_COLOR[item.status] || '#9CA3AF';

    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: borderColor }]}
        onPress={() => navigation.navigate('SecretaryComplaintDetail', { complaint: item })}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.protocol}>{item.protocol}</Text>
          <View style={[styles.statusBadge, { backgroundColor: sc?.bg }]}>
            <Text style={[styles.statusText, { color: sc?.color }]}>{sc?.label}</Text>
          </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

        <View style={styles.cardMeta}>
          <Text style={styles.metaText}>👤 {item.citizen?.name || '—'}</Text>
          {item.neighborhood && <Text style={styles.metaText}>📍 {item.neighborhood}</Text>}
        </View>

        <View style={styles.cardFooter}>
          {item.priority && (
            <Text style={[styles.priority, { color: pc?.color }]}>● {pc?.label}</Text>
          )}
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleDateString('pt-BR')}
          </Text>
          {item.images?.length > 0 && (
            <Text style={styles.photoCount}>📷 {item.images.length}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>🏛️ Secretaria</Text>
            <Text style={styles.headerSub} numberOfLines={1}>{user?.name}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{counts.validated}</Text>
            <Text style={styles.statLabel}>Aguardando</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{counts.in_progress}</Text>
            <Text style={styles.statLabel}>Andamento</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{counts.resolved}</Text>
            <Text style={styles.statLabel}>Resolvidas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, counts.not_resolved > 0 && { color: '#EF4444' }]}>
              {counts.not_resolved}
            </Text>
            <Text style={styles.statLabel}>Não Res.</Text>
          </View>
        </View>

        {/* Botão meus trabalhos no mapa */}
        <TouchableOpacity
          style={styles.workLogBtn}
          onPress={() => navigation.navigate('WorkLogs')}
          activeOpacity={0.85}
        >
          <Text style={styles.workLogBtnText}>🗺️ Meus Trabalhos no Mapa</Text>
        </TouchableOpacity>
      </View>

      {/* Busca */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="🔍 Buscar por título, protocolo, cidadão..."
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Filtros */}
      <View style={styles.filterScroll}>
        {FILTER_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, filterStatus === tab.key && styles.filterTabActive]}
            onPress={() => setFilterStatus(tab.key)}
          >
            <Text style={[styles.filterText, filterStatus === tab.key && styles.filterTextActive]}>
              {tab.label}
              {counts[tab.key] > 0 && ` (${counts[tab.key]})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#02dcfb" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderComplaint}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchComplaints(); }}
              colors={['#02dcfb']}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>Nenhuma reclamação</Text>
              <Text style={styles.emptyText}>
                {filterStatus !== 'all' ? 'Tente outro filtro' : 'Sem reclamações atribuídas'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },

  header: {
    backgroundColor: '#012235',
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: '#02dcfb', marginTop: 2 },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  logoutText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  statsRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 12, marginBottom: 12,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800', color: '#cbf93e' },
  statLabel: { fontSize: 10, color: '#ffffff80', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 4 },

  workLogBtn: {
    backgroundColor: '#7C3AED', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#9333EA',
  },
  workLogBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  searchBox: { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  searchInput: {
    backgroundColor: '#F3F4F6', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: '#111827',
  },

  filterScroll: {
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, backgroundColor: '#F3F4F6',
  },
  filterTabActive: { backgroundColor: '#012235' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterTextActive: { color: '#cbf93e' },

  list: { padding: 12, gap: 10 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  card: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: 14, borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  protocol: { fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#012235', marginBottom: 8, lineHeight: 20 },
  cardMeta: { gap: 3, marginBottom: 8 },
  metaText: { fontSize: 12, color: '#6B7280' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priority: { fontSize: 12, fontWeight: '600' },
  date: { fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' },
  photoCount: { fontSize: 11, color: '#9CA3AF' },

  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
});