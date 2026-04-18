import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert, Image
} from 'react-native';
import CityAutocomplete from '../components/CityAutocomplete';
import api from '../services/api';

const PRIMARY   = '#1B4332';
const SECONDARY = '#52B788';
const ACCENT    = '#E8682A';
const ACCENT_L  = '#F4A261';
const BG        = '#F0F7F4';

const formatPhone = (text) => {
  const digits = text.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2)  return `(${digits}`;
  if (digits.length <= 7)  return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
};

const maskCPF = (value) => {
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  return cleaned
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

const isValidCPF = (cpf) => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cleaned[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cleaned[10])) return false;
  return true;
};

export default function RegisterScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [cpfError, setCpfError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    cpf: '',
    city_name: '',
  });

  const setField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleNext = () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      Alert.alert('Atenção', 'Preencha nome, e-mail e senha.');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setStep(2);
  };

  const handleRegister = async () => {
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      Alert.alert('Atenção', 'Informe um telefone válido com DDD (ex: (11) 99999-9999).');
      return;
    }
    if (!form.cpf.trim()) {
      setCpfError('CPF é obrigatório.');
      return;
    }
    if (!isValidCPF(form.cpf)) {
      setCpfError('CPF inválido. Verifique o número digitado.');
      return;
    }

    setLoading(true);
    try {
      const phoneClean = form.phone.replace(/\D/g, '');
      const res = await api.post('/auth/register', {
        name:      form.name.trim(),
        email:     form.email.trim(),
        password:  form.password,
        phone:     phoneClean,
        cpf:       form.cpf.trim(),
        city_name: form.city_name.trim() || undefined,
        role:      'citizen',
      });
      if (res.data.success) {
        Alert.alert(
          '✅ Cadastro realizado!',
          'Você já pode entrar com sua conta.',
          [{ text: 'Entrar', onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (error) {
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao cadastrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.bgTop} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => step === 2 ? setStep(1) : navigation.goBack()}
          >
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>

          <View style={styles.logoCircle}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>Criar Conta</Text>
          <Text style={styles.tagline}>
            {step === 1
              ? 'Etapa 1 de 2 — Dados de acesso'
              : 'Etapa 2 de 2 — Dados pessoais'}
          </Text>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
          </View>
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>

          {/* ── ETAPA 1 ── */}
          {step === 1 && (
            <>
              <Text style={styles.cardTitle}>Seus dados de acesso</Text>

              <Field label="Nome completo" icon="👤">
                <TextInput
                  style={styles.input}
                  placeholder="Seu nome completo"
                  placeholderTextColor="#9CA3AF"
                  value={form.name}
                  onChangeText={v => setField('name', v)}
                />
              </Field>

              <Field label="E-mail" icon="✉️">
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  placeholderTextColor="#9CA3AF"
                  value={form.email}
                  onChangeText={v => setField('email', v)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </Field>

              <Field label="Senha" icon="🔒"
                right={
                  <TouchableOpacity onPress={() => setShowPass(v => !v)}>
                    <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                }
              >
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#9CA3AF"
                  value={form.password}
                  onChangeText={v => setField('password', v)}
                  secureTextEntry={!showPass}
                />
              </Field>

              <TouchableOpacity style={styles.btnPrimary} onPress={handleNext} activeOpacity={0.85}>
                <Text style={styles.btnPrimaryText}>Continuar →</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── ETAPA 2 ── */}
          {step === 2 && (
            <>
              <Text style={styles.cardTitle}>Dados pessoais</Text>

              <Field label="Telefone / WhatsApp" icon="📱">
                <TextInput
                  style={styles.input}
                  placeholder="(11) 99999-9999"
                  placeholderTextColor="#9CA3AF"
                  value={form.phone}
                  onChangeText={v => setField('phone', formatPhone(v))}
                  keyboardType="phone-pad"
                  maxLength={15}
                />
              </Field>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  CPF <Text style={styles.required}>*</Text>
                </Text>
                <View style={[styles.inputWrapper, cpfError && styles.inputWrapperError]}>
                  <Text style={styles.inputIconTxt}>🪪</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="000.000.000-00"
                    placeholderTextColor="#9CA3AF"
                    value={form.cpf}
                    onChangeText={v => { setField('cpf', maskCPF(v)); setCpfError(''); }}
                    keyboardType="numeric"
                    maxLength={14}
                  />
                  {form.cpf.length === 14 && isValidCPF(form.cpf) && (
                    <Text style={{ fontSize: 16 }}>✅</Text>
                  )}
                </View>
                {cpfError
                  ? <Text style={styles.errorText}>⚠️ {cpfError}</Text>
                  : <Text style={styles.hintText}>Necessário para evitar cadastros duplicados</Text>
                }
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Sua cidade</Text>
                <CityAutocomplete
                  value={form.city_name}
                  onChange={v => setField('city_name', v)}
                  placeholder="Digite sua cidade..."
                />
                <Text style={styles.hintText}>Ex: São Paulo — SP</Text>
              </View>

              <TouchableOpacity
                style={[styles.btnPrimary, loading && { opacity: 0.7 }]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnPrimaryText}>Criar minha conta ✓</Text>
                }
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.btnSecondaryText}>
              Já tem conta?{' '}
              <Text style={styles.btnSecondaryHighlight}>Entrar</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Proteção animal — VETech Systems</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, icon, right, children }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Text style={styles.inputIconTxt}>{icon}</Text>
        {children}
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bgTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0d1f18',
  },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 52, paddingBottom: 40 },

  /* Header */
  header: { alignItems: 'center', marginBottom: 28 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 16 },
  backText: { color: SECONDARY, fontSize: 15, fontWeight: '600' },
  logoCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: ACCENT,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    shadowColor: ACCENT, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  logoImage: { width: 50, height: 50 },
  appName: { fontSize: 24, fontWeight: '800', color: '#ffffff' },
  tagline: { fontSize: 13, color: SECONDARY, marginTop: 4, fontWeight: '500' },
  progressBar: {
    width: '100%', height: 4, backgroundColor: `${SECONDARY}30`,
    borderRadius: 2, marginTop: 16, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: SECONDARY, borderRadius: 2 },

  /* Card */
  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 16, elevation: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 20 },

  /* Form */
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  required: { color: '#DC2626', fontWeight: '800' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    paddingHorizontal: 14, height: 52,
  },
  inputWrapperError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  inputIconTxt: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#111827' },
  eyeIcon: { fontSize: 18, paddingLeft: 8 },

  errorText: { fontSize: 12, color: '#DC2626', marginTop: 5, fontWeight: '500' },
  hintText: { fontSize: 11, color: '#9CA3AF', marginTop: 5 },

  /* Buttons */
  btnPrimary: {
    backgroundColor: ACCENT, borderRadius: 14, height: 54,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
    shadowColor: ACCENT, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  btnPrimaryText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  btnSecondary: { marginTop: 16, alignItems: 'center' },
  btnSecondaryText: { fontSize: 14, color: '#6B7280' },
  btnSecondaryHighlight: { color: PRIMARY, fontWeight: '700' },

  footer: { textAlign: 'center', color: '#ffffff40', fontSize: 12, marginTop: 28 },
});
