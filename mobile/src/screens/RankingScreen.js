import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Image
} from 'react-native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function RankingScreen({ navigation }) {
  const { user, cityType } = useAuth();
  const isCamara = cityType === 'camara';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadRanking(); }, [cityType]);

  const loadRanking = async () => {
    try {
      if (isCamara && user?.city_id) {
        const res = await api.get(`/cities/${user.city_id}/councilmen/ranking`);
        setItems(res.data.ranking || []);
      } else {
        const res = await api.get('/cities/ranking');
        setItems(res.data.ranking || []);
      }
    } catch (e) {
      console.log('Erro ao carregar ranking:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getRateColor = (rate) => {
    if (rate >= 70) return '#059669';
    if (rate >= 40) return '#D97706';
    return '#DC2626';
  };

  /* ── Card para cidades (fluxo original) ── */
  const renderCityItem = ({ item, index }) => {
    const rate = item.total_complaints > 0
      ? Math.round((item.resolved_complaints / item.total_complaints) * 100)
      : 0;
    const isTop3 = index < 3;

    return (
      <View style={[styles.card, isTop3 && styles.cardTop]}>
        <View style={styles.cardLeft}>
          <Text style={styles.medal}>{MEDALS[index] || `${index + 1}º`}</Text>
          <View style={[styles.cityAvatar, isTop3 && styles.cityAvatarTop]}>
            <Text style={styles.cityAvatarText}>{item.name.substring(0, 2).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.cityName}>{item.name}</Text>
            <Text style={styles.cityState}>{item.state}</Text>
          </View>
        </View>

        <View style={styles.cardRight}>
          <Text style={[styles.rateText, { color: getRateColor(rate) }]}>{rate}%</Text>
          <View style={styles.rateBarBg}>
            <View style={[styles.rateBarFill, {
              width: `${rate}%`,
              backgroundColor: getRateColor(rate)
            }]} />
          </View>
          <Text style={styles.rateDetail}>
            {item.resolved_complaints}/{item.total_complaints}
          </Text>
        </View>
      </View>
    );
  };

  /* ── Card para vereadores ── */
  const renderCouncilmanItem = ({ item, index }) => {
    const rate = item.resolution_rate ?? 0;
    const isTop3 = index < 3;

    return (
      <View style={[styles.card, isTop3 && styles.cardTopCamara]}>
        <View style={styles.cardLeft}>
          <Text style={styles.medal}>{MEDALS[index] || `${index + 1}º`}</Text>

          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.councilmanAvatar} />
          ) : (
            <View style={[styles.councilmanAvatar, styles.councilmanAvatarPlaceholder, isTop3 && styles.councilmanAvatarTop]}>
              <Text style={styles.councilmanAvatarInitial}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Text style={styles.cityName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.cityState}>
              {item.total_complaints} demanda{item.total_complaints !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.cardRight}>
          <Text style={[styles.rateText, { color: getRateColor(rate) }]}>{rate}%</Text>
          <View style={styles.rateBarBg}>
            <View style={[styles.rateBarFill, {
              width: `${rate}%`,
              backgroundColor: getRateColor(rate)
            }]} />
          </View>
          <Text style={styles.rateDetail}>
            {item.resolved_complaints}/{item.total_complaints}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isCamara && styles.headerCamara]}>
        <View style={styles.bgCircle} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, isCamara && styles.backTextCamara]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, isCamara && styles.headerTitleCamara]}>
            {isCamara ? '🏛️ Ranking de Vereadores' : '🏆 Ranking das Cidades'}
          </Text>
          <Text style={[styles.headerSubtitle, isCamara && styles.headerSubtitleCamara]}>
            {isCamara ? 'Quem mais resolve as demandas dos cidadãos' : 'Quem mais resolve para o cidadão'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#012235" />
          <Text style={styles.loadingText}>Carregando ranking...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={isCamara ? renderCouncilmanItem : renderCityItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadRanking(); }}
              tintColor="#012235"
            />
          }
          ListHeaderComponent={
            <View style={styles.legendRow}>
              <Text style={styles.legendText}>
                {isCamara ? 'Taxa de resolução das demandas por vereador' : 'Taxa de resolução das demandas'}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>{isCamara ? '🏛️' : '🏆'}</Text>
              <Text style={styles.emptyTitle}>Ranking ainda vazio</Text>
              <Text style={styles.emptyText}>
                {isCamara
                  ? 'Os vereadores aparecerão aqui conforme as demandas forem resolvidas.'
                  : 'As cidades aparecerão aqui conforme resolverem as demandas.'}
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
    backgroundColor: '#cbf93e',
    paddingTop: 52,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  headerCamara: {
    backgroundColor: '#012235',
  },
  bgCircle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#b8e03240',
    right: -40,
    top: -40,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#01223520',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: { color: '#012235', fontSize: 22, fontWeight: '700' },
  backTextCamara: { color: '#02dcfb' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#012235', textAlign: 'center' },
  headerTitleCamara: { color: '#fff' },
  headerSubtitle: { fontSize: 12, color: '#012235', opacity: 0.6, marginTop: 2, textAlign: 'center' },
  headerSubtitleCamara: { color: '#02dcfb', opacity: 0.9 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#6B7280', fontSize: 14 },

  list: { padding: 16, paddingBottom: 40, gap: 10 },
  legendRow: { marginBottom: 8 },
  legendText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: { borderWidth: 1.5, borderColor: '#cbf93e80', backgroundColor: '#fafff0' },
  cardTopCamara: { borderWidth: 1.5, borderColor: '#02dcfb50', backgroundColor: '#F0FDFF' },

  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  medal: { fontSize: 22, width: 32 },

  // Cidades
  cityAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },
  cityAvatarTop: { backgroundColor: '#cbf93e30', borderWidth: 1.5, borderColor: '#cbf93e' },
  cityAvatarText: { fontSize: 13, fontWeight: '700', color: '#012235' },
  cityName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  cityState: { fontSize: 11, color: '#9CA3AF' },

  // Vereadores
  councilmanAvatar: {
    width: 44, height: 44, borderRadius: 22,
  },
  councilmanAvatarPlaceholder: {
    backgroundColor: '#012235',
    justifyContent: 'center', alignItems: 'center',
  },
  councilmanAvatarTop: {
    borderWidth: 2, borderColor: '#02dcfb',
  },
  councilmanAvatarInitial: {
    color: '#02dcfb', fontSize: 18, fontWeight: '800',
  },

  cardRight: { alignItems: 'flex-end', minWidth: 80 },
  rateText: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  rateBarBg: { width: 80, height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
  rateBarFill: { height: '100%', borderRadius: 3 },
  rateDetail: { fontSize: 10, color: '#9CA3AF', marginTop: 3 },

  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
});
