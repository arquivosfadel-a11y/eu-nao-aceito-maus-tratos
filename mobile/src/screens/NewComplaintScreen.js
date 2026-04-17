import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, ActivityIndicator,
  Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function NewComplaintScreen({ navigation }) {
  console.log('=== NewComplaintScreen MONTOU ===');
  const { user } = useAuth();

  // ── form fields ──────────────────────────────────────────────
  const [title,          setTitle]          = useState('');
  const [description,    setDescription]    = useState('');
  const [address,        setAddress]        = useState('');
  const [images,         setImages]         = useState([]);
  const [location,       setLocation]       = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [locating,       setLocating]       = useState(false);
  const [animalCategory, setAnimalCategory] = useState('');
  const [abuseType,      setAbuseType]      = useState('');

  // ── city / step state (local — não depende do context) ───────
  const [localCityType,     setLocalCityType]     = useState(null);   // null = ainda carregando
  const [step,              setStep]              = useState('loading');
  const [councilmen,        setCouncilmen]        = useState([]);
  const [selectedCouncilman, setSelectedCouncilman] = useState(null);

  // ── init: busca city_type + vereadores se câmara ─────────────
  useEffect(() => {
    const initScreen = async () => {
      console.log('=== useEffect INICIOU, user:', user?.city_id);
      if (!user?.city_id) {
        console.log('INIT: sem city_id, usando prefeitura');
        setLocalCityType('prefeitura');
        setStep('form');
        return;
      }

      try {
        console.log('INIT: buscando city_type para city_id:', user.city_id);
        const cityRes = await api.get(`/cities/${user.city_id}`);
        const cityType = cityRes.data.city?.city_type || 'prefeitura';
        console.log('CITY TYPE DIRETO:', cityType);

        setLocalCityType(cityType);

        if (cityType === 'camara') {
          console.log('INIT: câmara — buscando vereadores...');
          const councilRes = await api.get(`/cities/${user.city_id}/councilmen`);
          const lista = councilRes.data.councilmen || [];
          console.log('VEREADORES:', lista.length, 'encontrados');
          setCouncilmen(lista);
          setStep('councilman');
        } else {
          setStep('form');
        }
      } catch (e) {
        console.error('INIT erro:', e?.response?.status, e?.message);
        setLocalCityType('prefeitura');
        setStep('form');
      }
    };

    initScreen();
  }, []); // roda uma vez ao montar — sem dependências do context

  // ── helpers ──────────────────────────────────────────────────
  const isCamara = localCityType === 'camara';

  const getLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos da sua localização para registrar a reclamação.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      const geocode = await Location.reverseGeocodeAsync(loc.coords);
      if (geocode.length > 0) {
        const place = geocode[0];
        setAddress(`${place.street || ''} ${place.streetNumber || ''}, ${place.district || ''}`);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível obter a localização');
    } finally {
      setLocating(false);
    }
  };

  const pickImage = async () => {
    if (images.length >= 3) { Alert.alert('Limite', 'Máximo de 3 fotos por reclamação'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8
    });
    if (!result.canceled) setImages([...images, result.assets[0].uri]);
  };

  const takePhoto = async () => {
    if (images.length >= 3) { Alert.alert('Limite', 'Máximo de 3 fotos por reclamação'); return; }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permissão negada', 'Precisamos de acesso à câmera'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
    if (!result.canceled) setImages([...images, result.assets[0].uri]);
  };

  const handleSubmit = async () => {
    if (!title || !description) {
      Alert.alert('Atenção', 'Preencha o título e a descrição');
      return;
    }
    if (!location) {
      Alert.alert(
        'Localização obrigatória',
        'Para que sua reclamação apareça no mapa da cidade e seja atendida corretamente, é necessário informar a localização.\n\nToque em "Obter minha localização" antes de enviar.'
      );
      return;
    }
    if (isCamara && !selectedCouncilman) {
      Alert.alert('Atenção', 'Selecione um vereador para encaminhar sua demanda.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('address', address);
      if (animalCategory) formData.append('animal_category', animalCategory);
      if (abuseType)      formData.append('abuse_type', abuseType);

      const profileRes = await api.get('/auth/profile');
      const city_id = profileRes.data.user?.city_id;
      if (city_id) formData.append('city_id', city_id);

      formData.append('latitude', location.latitude);
      formData.append('longitude', location.longitude);

      if (isCamara && selectedCouncilman) {
        formData.append('councilman_id', selectedCouncilman.id);
      }

      images.forEach((uri, index) => {
        formData.append('images', { uri, name: `photo_${index}.jpg`, type: 'image/jpeg' });
      });

      await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      Alert.alert(
        'Denúncia enviada!',
        isCamara
          ? `Sua demanda foi encaminhada para ${selectedCouncilman.name} e será analisada em breve.`
          : 'Sua denúncia foi registrada e será analisada em breve.',
        [{ text: 'OK', onPress: () => {
          setTitle(''); setDescription(''); setAddress('');
          setImages([]); setLocation(null); setSelectedCouncilman(null);
          setAnimalCategory(''); setAbuseType('');
          navigation.navigate('MyComplaints');
        }}]
      );
    } catch (error) {
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao enviar denúncia');
    } finally {
      setLoading(false);
    }
  };

  // ── RENDER: loading inicial ───────────────────────────────────
  if (step === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#1B4332" size="large" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  // ── RENDER: step seleção de vereador (câmara) ─────────────────
  if (step === 'councilman') {
    console.log('RENDER STEP: councilman | vereadores:', councilmen.length);
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTexts}>
            <Text style={styles.headerTitle}>Nova Demanda</Text>
            <Text style={styles.headerSubtitle}>Câmara Municipal</Text>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.stepTitle}>Para qual vereador deseja enviar?</Text>
          <Text style={styles.stepSubtitle}>Selecione o vereador que representará sua demanda</Text>

          {councilmen.length === 0 ? (
            <View style={styles.emptyCouncilmen}>
              <Text style={styles.emptyCouncilmenText}>Nenhum vereador cadastrado ainda.</Text>
            </View>
          ) : (
            <View style={{ gap: 10, marginTop: 8 }}>
              {councilmen.map((c) => {
                const isSelected = selectedCouncilman?.id === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.councilmanRow, isSelected && styles.councilmanRowSelected]}
                    onPress={() => setSelectedCouncilman(c)}
                    activeOpacity={0.75}
                  >
                    {/* Avatar */}
                    {c.avatar_url ? (
                      <Image source={{ uri: c.avatar_url }} style={styles.councilmanAvatar} />
                    ) : (
                      <View style={[styles.councilmanAvatar, styles.councilmanAvatarPlaceholder]}>
                        <Text style={styles.councilmanAvatarInitial}>
                          {c.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}

                    {/* Info */}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.councilmanName, isSelected && styles.councilmanNameSelected]}
                        numberOfLines={1}
                      >
                        {c.name}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                        {c.party ? <Text style={styles.councilmanTag}>{c.party}</Text> : null}
                        {c.councilman_number ? <Text style={styles.councilmanTag}>Nº {c.councilman_number}</Text> : null}
                      </View>
                    </View>

                    {/* Check */}
                    {isSelected && (
                      <View style={styles.councilmanCheck}>
                        <Text style={styles.councilmanCheckText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, !selectedCouncilman && styles.submitBtnDisabled, { marginTop: 24 }]}
            onPress={() => {
              if (!selectedCouncilman) {
                Alert.alert('Atenção', 'Selecione um vereador para continuar');
                return;
              }
              setStep('form');
            }}
          >
            <Text style={styles.submitBtnText}>Continuar</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    );
  }

  // ── RENDER: formulário principal ──────────────────────────────
  console.log('RENDER STEP: form | isCamara:', isCamara);
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => isCamara ? setStep('councilman') : navigation.goBack()}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTexts}>
          <Text style={styles.headerTitle}>{isCamara ? 'Nova Demanda' : 'Nova Denúncia'}</Text>
          <Text style={styles.headerSubtitle}>
            {isCamara
              ? `Vereador: ${selectedCouncilman?.name}`
              : 'Denuncie um caso de maus tratos'}
          </Text>
        </View>
      </View>

      <View style={styles.form}>

        {/* Título */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            {isCamara ? 'Título da demanda' : 'Título'} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={isCamara ? 'Ex: Solicitar recapeamento da Rua X' : 'Ex: Cão abandonado com sinais de maus tratos'}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Descrição */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Descrição <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={description}
            onChangeText={setDescription}
            placeholder={isCamara ? 'Descreva sua demanda com detalhes...' : 'Descreva o problema com detalhes...'}
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Categoria do Animal */}
        {!isCamara && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Categoria do Animal</Text>
            <View style={styles.chipRow}>
              {['Cão', 'Gato', 'Ave', 'Cavalo', 'Bovino', 'Outros'].map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, animalCategory === cat && styles.chipActive]}
                  onPress={() => setAnimalCategory(animalCategory === cat ? '' : cat)}
                >
                  <Text style={[styles.chipText, animalCategory === cat && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Tipo de Mau Trato */}
        {!isCamara && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Tipo de Mau Trato</Text>
            <View style={styles.chipRow}>
              {['Abandono', 'Violência física', 'Fome/Desnutrição', 'Negligência', 'Outros'].map(tipo => (
                <TouchableOpacity
                  key={tipo}
                  style={[styles.chip, abuseType === tipo && styles.chipActiveRed]}
                  onPress={() => setAbuseType(abuseType === tipo ? '' : tipo)}
                >
                  <Text style={[styles.chipText, abuseType === tipo && styles.chipTextActive]}>{tipo}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Localização */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Localização <Text style={styles.required}>*</Text>
            {'  '}<Text style={styles.requiredHint}>(obrigatório para aparecer no mapa)</Text>
          </Text>
          <TouchableOpacity
            style={[styles.locationBtn, location && styles.locationBtnDone]}
            onPress={getLocation}
            disabled={locating}
          >
            {locating ? (
              <ActivityIndicator color="#1B4332" size="small" />
            ) : (
              <Text style={styles.locationBtnText}>
                {location ? '✅ Localização obtida' : '📍 Obter minha localização'}
              </Text>
            )}
          </TouchableOpacity>

          {!location && (
            <View style={styles.locationWarning}>
              <Text style={styles.locationWarningText}>
                ⚠️ Sem localização sua denúncia não aparecerá no mapa
              </Text>
            </View>
          )}

          {address ? (
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              value={address}
              onChangeText={setAddress}
              placeholder="Endereço"
              placeholderTextColor="#9CA3AF"
            />
          ) : null}
        </View>

        {/* Fotos */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Fotos <Text style={styles.photoCount}>({images.length}/3)</Text></Text>
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
              <Text style={styles.photoBtnIcon}>📷</Text>
              <Text style={styles.photoBtnText}>Câmera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
              <Text style={styles.photoBtnIcon}>🖼️</Text>
              <Text style={styles.photoBtnText}>Galeria</Text>
            </TouchableOpacity>
          </View>

          {images.length > 0 && (
            <View style={styles.imagePreview}>
              {images.map((uri, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setImages(images.filter((_, i) => i !== index))}
                  style={styles.imageWrapper}
                >
                  <Image source={{ uri }} style={styles.previewImage} />
                  <View style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>✕</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Enviar */}
        <TouchableOpacity
          style={[styles.submitBtn, (!location || loading) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>
              {isCamara ? '📢 Enviar Demanda' : '🐾 Enviar Denúncia'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },

  loadingContainer: {
    flex: 1, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  loadingText: { fontSize: 14, color: '#6B7280' },

  header: {
    backgroundColor: '#1B4332',
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 24, color: '#52B788', fontWeight: '800' },
  headerTexts: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  headerSubtitle: { fontSize: 13, color: '#52B788', marginTop: 2 },

  form: { padding: 16 },
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#1B4332', marginBottom: 8 },
  required: { color: '#EF4444' },
  requiredHint: { fontSize: 11, fontWeight: '400', color: '#9CA3AF' },
  photoCount: { color: '#9CA3AF', fontWeight: '500' },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 14,
    color: '#111827',
  },
  textarea: { height: 110, textAlignVertical: 'top' },

  locationBtn: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#52B788',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  locationBtnDone: { backgroundColor: '#e6fff5', borderColor: '#10B981' },
  locationBtnText: { color: '#1B4332', fontWeight: '700', fontSize: 14 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 20, backgroundColor: '#E8F5E9',
    borderWidth: 1.5, borderColor: '#52B788',
  },
  chipActive: { backgroundColor: '#1B4332', borderColor: '#1B4332' },
  chipActiveRed: { backgroundColor: '#1B4332', borderColor: '#1B4332' },
  chipText: { fontSize: 16, fontWeight: '700', color: '#1B4332' },
  chipTextActive: { color: '#fff' },

  locationWarning: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  locationWarningText: { color: '#92400E', fontSize: 12, fontWeight: '500' },

  photoButtons: { flexDirection: 'row', gap: 12 },
  photoBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  photoBtnIcon: { fontSize: 22 },
  photoBtnText: { color: '#1B4332', fontWeight: '600', fontSize: 13 },

  imagePreview: { flexDirection: 'row', gap: 10, marginTop: 12 },
  imageWrapper: { position: 'relative' },
  previewImage: { width: 90, height: 90, borderRadius: 10 },
  removeBtn: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: '#EF4444', borderRadius: 10,
    width: 22, height: 22, alignItems: 'center', justifyContent: 'center',
  },
  removeBtnText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  submitBtn: {
    backgroundColor: '#F4A261',
    borderRadius: 14,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // ── Vereadores ──────────────────────────────────────────────
  stepTitle: { fontSize: 20, fontWeight: '800', color: '#1B4332', marginBottom: 6 },
  stepSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 20, lineHeight: 18 },

  emptyCouncilmen: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  emptyCouncilmenText: { color: '#9CA3AF', fontSize: 13 },

  councilmanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 14,
  },
  councilmanRowSelected: {
    borderColor: '#52B788',
    borderWidth: 2,
    backgroundColor: '#F0F7F4',
  },
  councilmanAvatar: {
    width: 48, height: 48, borderRadius: 24, flexShrink: 0,
  },
  councilmanAvatarPlaceholder: {
    backgroundColor: '#1B4332',
    alignItems: 'center',
    justifyContent: 'center',
  },
  councilmanAvatarInitial: { color: '#52B788', fontSize: 20, fontWeight: '800' },
  councilmanName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  councilmanNameSelected: { color: '#1B4332' },
  councilmanTag: {
    fontSize: 11, fontWeight: '600', color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99,
  },
  councilmanCheck: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#52B788',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  councilmanCheckText: { fontSize: 13, fontWeight: '800', color: '#fff' },
});
