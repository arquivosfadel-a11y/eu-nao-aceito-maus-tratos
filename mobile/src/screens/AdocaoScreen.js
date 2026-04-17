import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator,
  ScrollView, Image, Linking, Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const PRIMARY   = '#1B4332';
const SECONDARY = '#52B788';
const ACCENT    = '#F4A261';
const BG        = '#F0F7F4';

const SPECIES_FILTERS = [
  { key: 'all',     label: 'Todos' },
  { key: 'cachorro', label: 'Cão' },
  { key: 'gato',    label: 'Gato' },
  { key: 'passaro', label: 'Ave' },
  { key: 'coelho',  label: 'Coelho' },
  { key: 'outros',  label: 'Outros' },
];

const SPECIES_ICON = {
  cachorro: '🐕',
  gato:     '🐈',
  passaro:  '🦜',
  coelho:   '🐇',
  outros:   '🐾',
};

export default function AdocaoScreen({ navigation }) {
  const { user } = useAuth();
  const [animals, setAnimals]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [species, setSpecies]     = useState('all');
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(true);

  useEffect(() => {
    loadAnimals(1, species, true);
  }, [species]);

  const loadAnimals = async (pageNum = 1, speciesFilter = species, reset = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      const params = { page: pageNum, limit: 15, status: 'available' };
      if (speciesFilter !== 'all') params.species = speciesFilter;
      if (user?.city_id) params.city_id = user.city_id;
      const res = await api.get('/animals', { params });
      const newItems = res.data.animals || [];
      if (reset || pageNum === 1) setAnimals(newItems);
      else setAnimals(prev => [...prev, ...newItems]);
      setHasMore(newItems.length === 15);
      setPage(pageNum);
    } catch (e) {
      console.log('Erro ao buscar animais:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAnimals(1, species, true);
  }, [species]);

  const handleInteresse = (animal) => {
    const phone = animal.contact_whatsapp || animal.contact_phone;
    if (!phone) {
      Alert.alert('Contato indisponível', 'O responsável não informou um número de contato.');
      return;
    }
    const numero = phone.replace(/\D/g, '');
    const texto = encodeURIComponent(
      `Olá! Vi o anúncio de adoção de ${animal.name} (${animal.species}) no app "Eu Não Aceito Maus Tratos" e tenho interesse. Pode me dar mais informações?`
    );
    const url = `whatsapp://send?phone=55${numero}&text=${texto}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) Linking.openURL(url);
        else Alert.alert('WhatsApp não encontrado', `Entre em contato pelo telefone: ${phone}`);
      })
      .catch(() => Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.'));
  };

  const renderCard = ({ item }) => {
    const icon = SPECIES_ICON[item.species?.toLowerCase()] || '🐾';
    const firstImage = item.images?.[0];

    return (
      <View style={styles.card}>
        {firstImage ? (
          <Image source={{ uri: firstImage }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Text style={styles.cardImageIcon}>{icon}</Text>
          </View>
        )}

        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={styles.cardName}>{item.name}</Text>
            <View style={styles.speciesBadge}>
              <Text style={styles.speciesBadgeText}>{icon} {item.species}</Text>
            </View>
          </View>

          {item.breed ? (
            <Text style={styles.cardBreed}>{item.breed}</Text>
          ) : null}

          <View style={styles.cardMeta}>
            {item.age ? (
              <Text style={styles.metaText}>🗓 {item.age}</Text>
            ) : null}
            {item.gender ? (
              <Text style={styles.metaText}>{item.gender === 'macho' ? '♂' : '♀'} {item.gender}</Text>
            ) : null}
            {item.city_name ? (
              <Text style={styles.metaText}>📍 {item.city_name}</Text>
            ) : null}
          </View>

          {item.description ? (
            <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.interestBtn}
            onPress={() => handleInteresse(item)}
            activeOpacity={0.85}
          >
            <Text style={styles.interestBtnText}>💚 Tenho Interesse</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🏠 Adoção de Animais</Text>
          <Text style={styles.headerSubtitle}>Encontre um novo amigo</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{animals.length}</Text>
        </View>
      </View>

      {/* Filtros por espécie */}
      <View style={styles.filtersBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {SPECIES_FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterBtn, species === f.key && styles.filterBtnActive]}
              onPress={() => setSpecies(f.key)}
            >
              <Text style={[styles.filterText, species === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista */}
      {loading && page === 1 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Carregando animais...</Text>
        </View>
      ) : (
        <FlatList
          data={animals}
          keyExtractor={item => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} />}
          onEndReached={() => { if (hasMore && !loading) loadAnimals(page + 1, species); }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🐾</Text>
              <Text style={styles.emptyTitle}>Nenhum animal disponível</Text>
              <Text style={styles.emptyText}>Tente outro filtro ou volte mais tarde.</Text>
            </View>
          }
          ListFooterComponent={
            hasMore && !loading
              ? <ActivityIndicator color={PRIMARY} style={{ marginVertical: 16 }} />
              : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    backgroundColor: PRIMARY,
    paddingTop: 52, paddingBottom: 14,
    paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 24, color: SECONDARY, fontWeight: '700' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#ffffff' },
  headerSubtitle: { fontSize: 11, color: SECONDARY, marginTop: 2 },
  countBadge: {
    backgroundColor: ACCENT, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  countText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  filtersBar: {
    backgroundColor: PRIMARY,
    paddingBottom: 14, paddingTop: 4,
    borderBottomWidth: 1, borderBottomColor: `${SECONDARY}30`,
  },
  filtersScroll: { paddingHorizontal: 16, gap: 8 },
  filterBtn: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20, backgroundColor: '#ffffff15',
    borderWidth: 1.5, borderColor: '#ffffff20',
  },
  filterBtnActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  filterText: { fontSize: 13, color: '#ffffff80', fontWeight: '600' },
  filterTextActive: { color: '#fff' },

  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#6B7280', fontSize: 14 },

  list: { padding: 16, paddingBottom: 40, gap: 14 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardImage: { width: '100%', height: 180 },
  cardImagePlaceholder: {
    width: '100%', height: 120,
    backgroundColor: `${SECONDARY}20`,
    justifyContent: 'center', alignItems: 'center',
  },
  cardImageIcon: { fontSize: 52 },

  cardBody: { padding: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardName: { fontSize: 18, fontWeight: '800', color: '#111827', flex: 1 },
  speciesBadge: {
    backgroundColor: `${SECONDARY}20`, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  speciesBadgeText: { fontSize: 12, color: PRIMARY, fontWeight: '700' },
  cardBreed: { fontSize: 13, color: '#6B7280', marginBottom: 8 },

  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  metaText: { fontSize: 12, color: '#374151', backgroundColor: BG, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },

  cardDescription: { fontSize: 13, color: '#6B7280', lineHeight: 19, marginBottom: 12 },

  interestBtn: {
    backgroundColor: PRIMARY, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  interestBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  emptyBox: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151', marginBottom: 8 },
  emptyText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
});
