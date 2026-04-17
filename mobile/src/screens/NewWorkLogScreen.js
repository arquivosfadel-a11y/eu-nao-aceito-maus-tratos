import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Image
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';

export default function NewWorkLogScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => { getLocation(); }, []);

  const getLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Ative a localização para registrar o trabalho.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });

      const geo = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      });
      if (geo.length > 0) {
        const g = geo[0];
        setAddress([g.street, g.streetNumber, g.district, g.city].filter(Boolean).join(', '));
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível obter a localização.');
    } finally {
      setLocating(false);
    }
  };

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Limite', 'Máximo de 5 fotos.');
      return;
    }
    Alert.alert('Adicionar foto', 'Escolha uma opção:', [
      {
        text: 'Câmera', onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') return;
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7
          });
          if (!result.canceled) setImages(prev => [...prev, result.assets[0]]);
        }
      },
      {
        text: 'Galeria', onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7
          });
          if (!result.canceled) setImages(prev => [...prev, result.assets[0]]);
        }
      },
      { text: 'Cancelar', style: 'cancel' }
    ]);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Atenção', 'Informe o título do trabalho.');
      return;
    }
    if (!location) {
      Alert.alert('Atenção', 'Localização obrigatória. Aguarde ou tente novamente.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('latitude', location.latitude.toString());
      formData.append('longitude', location.longitude.toString());
      formData.append('address', address);

      images.forEach((img, index) => {
        formData.append('images', {
          uri: img.uri,
          type: 'image/jpeg',
          name: `work_${index}.jpg`
        });
      });

      await api.post('/work-logs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      Alert.alert('✅ Registrado!', 'Trabalho registrado no mapa com sucesso.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao registrar trabalho.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🗺️ Registrar Trabalho</Text>
          <Text style={styles.headerSub}>Marcar equipe no mapa</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Localização */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Localização <Text style={styles.required}>*</Text></Text>
          {locating ? (
            <View style={styles.locatingBox}>
              <ActivityIndicator color="#7C3AED" size="small" />
              <Text style={styles.locatingText}>Obtendo localização...</Text>
            </View>
          ) : location ? (
            <View style={styles.locationBox}>
              <Text style={styles.locationIcon}>✅</Text>
              <View style={styles.locationTexts}>
                <Text style={styles.locationAddress}>{address || 'Localização obtida'}</Text>
                <Text style={styles.locationCoords}>
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </Text>
              </View>
              <TouchableOpacity onPress={getLocation} style={styles.refreshBtn}>
                <Text style={styles.refreshText}>🔄</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.locationError} onPress={getLocation}>
              <Text style={styles.locationErrorText}>⚠️ Toque para tentar novamente</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Título */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Título <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Tapa-buraco Rua das Flores"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Descrição */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📄 Descrição</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Descreva o trabalho sendo realizado..."
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </View>

        {/* Fotos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📷 Fotos</Text>
          <View style={styles.photosRow}>
            {images.map((img, index) => (
              <View key={index} style={styles.photoThumb}>
                <Image source={{ uri: img.uri }} style={styles.thumbImg} />
                <TouchableOpacity
                  style={styles.removePhoto}
                  onPress={() => setImages(prev => prev.filter((_, i) => i !== index))}
                >
                  <Text style={styles.removePhotoText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity style={styles.addPhoto} onPress={pickImage}>
                <Text style={styles.addPhotoIcon}>📷</Text>
                <Text style={styles.addPhotoText}>Adicionar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Botão */}
        <TouchableOpacity
          style={[styles.btnSubmit, (loading || !location) && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading || !location}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnSubmitText}>🗺️ Registrar no Mapa</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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

  scroll: { padding: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 },
  required: { color: '#DC2626' },

  locatingBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14,
  },
  locatingText: { fontSize: 14, color: '#6B7280' },

  locationBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0FDF4', borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: '#86EFAC', gap: 10,
  },
  locationIcon: { fontSize: 20 },
  locationTexts: { flex: 1 },
  locationAddress: { fontSize: 13, fontWeight: '600', color: '#166534' },
  locationCoords: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  refreshBtn: { padding: 4 },
  refreshText: { fontSize: 18 },

  locationError: {
    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: '#FCA5A5', alignItems: 'center',
  },
  locationErrorText: { fontSize: 13, color: '#DC2626', fontWeight: '600' },

  input: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#111827',
  },
  inputMultiline: { height: 100, textAlignVertical: 'top' },

  photosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoThumb: { width: 80, height: 80, borderRadius: 10, position: 'relative' },
  thumbImg: { width: 80, height: 80, borderRadius: 10 },
  removePhoto: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: '#DC2626', borderRadius: 10,
    width: 20, height: 20, justifyContent: 'center', alignItems: 'center',
  },
  removePhotoText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  addPhoto: {
    width: 80, height: 80, borderRadius: 10,
    backgroundColor: '#F3F4F6', borderWidth: 2,
    borderColor: '#E5E7EB', borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', gap: 4,
  },
  addPhotoIcon: { fontSize: 22 },
  addPhotoText: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },

  btnSubmit: {
    backgroundColor: '#7C3AED', borderRadius: 14, height: 54,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.5 },
  btnSubmitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});