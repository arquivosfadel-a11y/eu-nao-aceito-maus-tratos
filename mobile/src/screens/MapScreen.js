import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MapScreen() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get(`/cities/${user.city_id}/dashboard`);
      if (res.data.success) {
        setStats(res.data.dashboard.stats);
        setComplaints(res.data.dashboard.map_data || []);
      }
    } catch (error) {
      console.log('Erro ao buscar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = {
    pending: '#6B7280',
    validated: '#F59E0B',
    in_progress: '#3B82F6',
    resolved: '#10B981',
    not_resolved: '#EF4444'
  };

  const statusLabel = {
    pending: 'Pendente',
    validated: 'Aguardando',
    in_progress: 'Em Andamento',
    resolved: 'Resolvida',
    not_resolved: 'Não Resolvida'
  };

  const filteredComplaints = filter === 'all'
    ? complaints
    : complaints.filter(c => c.status === filter);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Carregando mapa...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗺️ Mapa da Cidade</Text>
        <Text style={styles.headerSubtitle}>Visualize todas as reclamações</Text>
      </View>

      {/* Stats Cards */}
      {stats && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#F59E0B' }]}>
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Aguardando</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#3B82F6' }]}>
            <Text style={styles.statNumber}>{stats.in_progress}</Text>
            <Text style={styles.statLabel}>Em Andamento</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#10B981' }]}>
            <Text style={styles.statNumber}>{stats.resolved}</Text>
            <Text style={styles.statLabel}>Resolvidas</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#2563EB' }]}>
            <Text style={styles.statNumber}>{stats.resolution_rate}%</Text>
            <Text style={styles.statLabel}>Taxa</Text>
          </View>
        </ScrollView>
      )}

      {/* Filtros */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        {[
          { key: 'all', label: '🔍 Todas' },
          { key: 'validated', label: '🟡 Aguardando' },
          { key: 'in_progress', label: '🔵 Em Andamento' },
          { key: 'resolved', label: '✅ Resolvidas' },
          { key: 'not_resolved', label: '🔴 Não Resolvidas' }
        ].map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Mapa */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: -23.5329,
          longitude: -49.2441,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {filteredComplaints.map(complaint => (
          complaint.latitude && complaint.longitude ? (
            <Marker
              key={complaint.id}
              coordinate={{
                latitude: parseFloat(complaint.latitude),
                longitude: parseFloat(complaint.longitude)
              }}
              pinColor={statusColor[complaint.status]}
            >
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{complaint.title}</Text>
                  <Text style={styles.calloutProtocol}>{complaint.protocol}</Text>
                  <View style={[
                    styles.calloutStatus,
                    { backgroundColor: statusColor[complaint.status] + '20' }
                  ]}>
                    <Text style={[
                      styles.calloutStatusText,
                      { color: statusColor[complaint.status] }
                    ]}>
                      {statusLabel[complaint.status]}
                    </Text>
                  </View>
                </View>
              </Callout>
            </Marker>
          ) : null
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#6B7280' },
  header: {
    backgroundColor: '#2563EB',
    padding: 20,
    paddingTop: 50
  },
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold' },
  headerSubtitle: { color: '#BFDBFE', fontSize: 14, marginTop: 4 },
  statsScroll: { backgroundColor: '#FFFFFF', paddingVertical: 12, paddingHorizontal: 8 },
  statCard: {
    alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 10, padding: 12, marginHorizontal: 6,
    borderTopWidth: 3, borderTopColor: '#2563EB',
    minWidth: 70, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2
  },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  filtersScroll: { backgroundColor: '#FFFFFF', paddingVertical: 8, paddingHorizontal: 8, maxHeight: 50 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#F3F4F6', marginHorizontal: 4,
    borderWidth: 1, borderColor: '#E5E7EB'
  },
  filterChipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  filterText: { fontSize: 12, color: '#6B7280' },
  filterTextActive: { color: '#FFFFFF', fontWeight: '600' },
  map: { flex: 1 },
  callout: { padding: 8, minWidth: 150 },
  calloutTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  calloutProtocol: { fontSize: 10, color: '#9CA3AF', marginBottom: 6 },
  calloutStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  calloutStatusText: { fontSize: 11, fontWeight: '600' }
});