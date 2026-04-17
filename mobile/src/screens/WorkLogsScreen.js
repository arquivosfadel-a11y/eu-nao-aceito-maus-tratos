import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, Image
} from 'react-native';
import api from '../services/api';

const STATUS_CONFIG = {
  working:  { label: 'Trabalhando', color: '#7C3AED', bg: '#F3E8FF' },
  finished: { label: 'Encerrado',   color: '#6B7280', bg: '#F3F4F6' },
};

export default function WorkLogsScreen({ navigation }) {
  const [workLogs, setWorkLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWorkLogs = useCallback(async () => {
    try {
      const res = await api.get('/work-logs/my');
      setWorkLogs(res.data.workLogs || []);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar os trabalhos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkLogs();
    const unsubscribe = navigation.addListener('focus', fetchWorkLogs);
    return unsubscribe;
  }, [navigation]);

  const handleFinish = (item) => {
    Alert.alert(
      '🔒 Encerrar Trabalho',
      `Deseja encerrar "${item.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.put(`/work-logs/${item.id}/finish`);
              Alert.alert('✅ Encerrado!', 'Trabalho marcado como encerrado no mapa.');
              fetchWorkLogs();
            } catch (e) {
              Alert.alert('Erro', e.response?.data?.message || 'Erro ao encerrar trabalho.');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => {
    const sc = STATUS_CONFIG[item.status];
    const isWorking = item.status === 'working';

    return (
      <View style={[styles.card, { borderLeftColor: sc.color }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.badgeText, { color: sc.color }]}>
              {isWorking ? '🟣' : '⚫'} {sc.label}
            </Text>
          </View>
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleDateString('pt-BR')}
          </Text>
        </View>

        <Text style={styles.title}>{item.title}</Text>

        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        ) : null}

        {item.address ? (
          <Text style={styles.address}>📍 {item.address}</Text>
        ) : null}

        {item.department?.name ? (
          <Text style={styles.dept}>🏛️ {item.department.name}</Text>
        ) : null}

        {item.images?.length > 0 && (
          <View style={styles.imagesRow}>
            {item.images.slice(0, 3).map((img, i) => (
              <Image key={i} source={{ uri: img }} style={styles.thumb} />
            ))}
            {item.images.length > 3 && (
              <View style={styles.moreImages}>
                <Text style={styles.moreImagesText}>+{item.images.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        {isWorking && (
          <TouchableOpacity
            style={styles.btnFinish}
            onPress={() => handleFinish(item)}
            activeOpacity={0.85}
          >
            <Text style={styles.btnFinishText}>🔒 Encerrar Trabalho</Text>
          </TouchableOpacity>
        )}

        {!isWorking && item.finished_at && (
          <Text style={styles.finishedAt}>
            Encerrado em {new Date(item.finished_at).toLocaleDateString('pt-BR')}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🗺️ Meus Trabalhos</Text>
          <Text style={styles.headerSub}>Registros no mapa</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('NewWorkLog')}
        >
          <Text style={styles.addBtnText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      ) : (
        <FlatList
          data={workLogs}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchWorkLogs(); }}
              colors={['#7C3AED']}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🗺️</Text>
              <Text style={styles.emptyTitle}>Nenhum trabalho registrado</Text>
              <Text style={styles.emptyText}>Toque em "+ Novo" para registrar</Text>
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
    backgroundColor: '#7C3AED',
    paddingTop: 52, paddingBottom: 20, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  backText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  addBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 12 },

  card: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: 16, borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  date: { fontSize: 11, color: '#9CA3AF' },
  title: { fontSize: 16, fontWeight: '700', color: '#012235', marginBottom: 6 },
  description: { fontSize: 13, color: '#6B7280', marginBottom: 6, lineHeight: 18 },
  address: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  dept: { fontSize: 12, color: '#6B7280', marginBottom: 10 },

  imagesRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  thumb: { width: 60, height: 60, borderRadius: 8 },
  moreImages: {
    width: 60, height: 60, borderRadius: 8,
    backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center',
  },
  moreImagesText: { fontSize: 14, fontWeight: '700', color: '#6B7280' },

  btnFinish: {
    backgroundColor: '#FEF2F2', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: '#FCA5A5', marginTop: 4,
  },
  btnFinishText: { color: '#DC2626', fontWeight: '700', fontSize: 14 },
  finishedAt: { fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: 4 },

  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
});