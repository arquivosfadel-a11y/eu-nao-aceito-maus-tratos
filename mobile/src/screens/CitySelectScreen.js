import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, FlatList, Image
} from 'react-native';
import api from '../services/api';

export default function CitySelectScreen({ navigation }) {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => { loadCities(); }, []);

  const loadCities = async () => {
    try {
      const res = await api.get('/cities/public');
      setCities(res.data.cities || []);
    } catch (e) {
      console.log('Erro ao carregar cidades:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAccess = () => {
    if (!selectedCity) return;
    navigation.navigate('Login', { city: selectedCity });
  };

  return (
    <View style={styles.container}>
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <View style={styles.logoArea}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>Participa Cidade</Text>
        <Text style={styles.tagline}>Sua voz transforma sua cidade</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bem-vindo!</Text>
        <Text style={styles.cardSubtitle}>
          Selecione sua cidade para verificar se ela já faz parte da plataforma.
        </Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#02dcfb" />
            <Text style={styles.loadingText}>Carregando cidades...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.label}>Sua cidade</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setDropdownOpen(true)}
              activeOpacity={0.85}
            >
              <Text style={[styles.dropdownText, !selectedCity && styles.dropdownPlaceholder]}>
                {selectedCity ? `🏙️ ${selectedCity.name} — ${selectedCity.state}` : 'Selecione sua cidade...'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>

            <Text style={styles.hint}>
              Não encontrou sua cidade?{' '}
              <Text style={styles.hintLink}>Ela ainda não participa da plataforma.</Text>
            </Text>

            <TouchableOpacity
              style={[styles.btnPrimary, !selectedCity && styles.btnDisabled]}
              onPress={handleAccess}
              disabled={!selectedCity}
              activeOpacity={0.85}
            >
              <Text style={styles.btnPrimaryText}>
                {selectedCity ? `Acessar ${selectedCity.name} →` : 'Selecione uma cidade'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <Text style={styles.footer}>Transparência e participação cidadã 🇧🇷</Text>

      <Modal visible={dropdownOpen} transparent animationType="slide" onRequestClose={() => setDropdownOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Escolha sua cidade</Text>
            <Text style={styles.modalSubtitle}>{cities.length} cidade{cities.length !== 1 ? 's' : ''} participando</Text>
            <FlatList
              data={cities}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.cityOption, selectedCity?.id === item.id && styles.cityOptionSelected]}
                  onPress={() => { setSelectedCity(item); setDropdownOpen(false); }}
                >
                  <View style={styles.cityOptionLeft}>
                    <View style={[styles.cityAvatar, selectedCity?.id === item.id && styles.cityAvatarSelected]}>
                      <Text style={styles.cityAvatarText}>{item.name.substring(0, 2).toUpperCase()}</Text>
                    </View>
                    <View>
                      <Text style={[styles.cityName, selectedCity?.id === item.id && styles.cityNameSelected]}>{item.name}</Text>
                      <Text style={styles.cityState}>{item.state}</Text>
                    </View>
                  </View>
                  {selectedCity?.id === item.id && <Text style={styles.cityCheck}>✓</Text>}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              showsVerticalScrollIndicator={false}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setDropdownOpen(false)}>
              <Text style={styles.modalCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#012235', justifyContent: 'center', padding: 24 },
  bgCircle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#02dcfb08', top: -80, right: -80 },
  bgCircle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#cbf93e06', bottom: 100, left: -60 },
  logoArea: { alignItems: 'center', marginBottom: 36 },
  logo: { width: 100, height: 100, marginBottom: 16 },
  appName: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  tagline: { fontSize: 14, color: '#02dcfb', marginTop: 6, fontWeight: '500' },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#012235', marginBottom: 8 },
  cardSubtitle: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 24 },
  loadingBox: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  loadingText: { color: '#9CA3AF', fontSize: 13 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12 },
  dropdownText: { fontSize: 15, color: '#111827', flex: 1 },
  dropdownPlaceholder: { color: '#9CA3AF' },
  dropdownArrow: { fontSize: 12, color: '#9CA3AF', marginLeft: 8 },
  hint: { fontSize: 12, color: '#9CA3AF', marginBottom: 24, lineHeight: 18 },
  hintLink: { color: '#02dcfb', fontWeight: '600' },
  btnPrimary: { backgroundColor: '#02dcfb', borderRadius: 14, height: 56, justifyContent: 'center', alignItems: 'center', shadowColor: '#02dcfb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  btnDisabled: { backgroundColor: '#E5E7EB', shadowOpacity: 0, elevation: 0 },
  btnPrimaryText: { fontSize: 16, fontWeight: '800', color: '#012235' },
  footer: { textAlign: 'center', color: '#02dcfb50', fontSize: 12, marginTop: 32 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '75%' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#012235', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#9CA3AF', marginBottom: 16 },
  cityOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  cityOptionSelected: { backgroundColor: '#02dcfb08', borderRadius: 12, paddingHorizontal: 8 },
  cityOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cityAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  cityAvatarSelected: { backgroundColor: '#02dcfb20', borderWidth: 1.5, borderColor: '#02dcfb' },
  cityAvatarText: { fontSize: 14, fontWeight: '700', color: '#374151' },
  cityName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  cityNameSelected: { color: '#012235' },
  cityState: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  cityCheck: { fontSize: 18, color: '#02dcfb', fontWeight: '800' },
  separator: { height: 1, backgroundColor: '#F9FAFB' },
  modalClose: { backgroundColor: '#F3F4F6', borderRadius: 14, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  modalCloseText: { fontSize: 15, fontWeight: '600', color: '#374151' },
});