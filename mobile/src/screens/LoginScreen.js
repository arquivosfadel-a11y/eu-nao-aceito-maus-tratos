import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert, Animated, Image
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const PRIMARY   = '#1B4332';
const SECONDARY = '#52B788';
const ACCENT    = '#E8682A';
const ACCENT_L  = '#F4A261';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Paw float animations
  const floatA = useRef(new Animated.Value(0)).current;
  const floatB = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    // Floating paw A
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatA, { toValue: -12, duration: 2200, useNativeDriver: true }),
        Animated.timing(floatA, { toValue: 0,   duration: 2200, useNativeDriver: true }),
      ])
    ).start();
    // Floating paw B (offset phase)
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatB, { toValue: -10, duration: 2600, useNativeDriver: true }),
          Animated.timing(floatB, { toValue: 0,   duration: 2600, useNativeDriver: true }),
        ])
      ).start();
    }, 800);
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Preencha e-mail e senha para continuar.');
      return;
    }
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);

    if (!result?.success) {
      Alert.alert('Erro ao entrar', result?.message || 'Verifique seus dados e tente novamente.');
      return;
    }
    if (result?.phone_verification_required) {
      navigation.navigate('PhoneVerification', {
        token: result.token,
        phone: result.user?.phone,
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Dark-to-green background ── */}
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      {/* ── Decorative floating elements ── */}
      <Animated.Text style={[styles.deco, { top: 80,  left: 24,  fontSize: 40, transform: [{ translateY: floatA }] }]}>🐾</Animated.Text>
      <Animated.Text style={[styles.deco, { top: 140, right: 20, fontSize: 28, transform: [{ translateY: floatB }] }]}>🦴</Animated.Text>
      <Animated.Text style={[styles.deco, { top: 220, left: 60,  fontSize: 22, transform: [{ translateY: floatB }] }]}>❤️</Animated.Text>
      <Text style={[styles.deco, { top: 60, right: 60, fontSize: 20 }]}>🐾</Text>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Section ── */}
        <View style={styles.hero}>
          <Animated.View
            style={[
              styles.logoCircle,
              { transform: [{ scale: logoScale }], opacity: logoOpacity },
            ]}
          >
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>

          <Text style={styles.titleLine1}>EU NÃO ACEITO</Text>
          <Text style={styles.titleLine2}>MAUS TRATOS</Text>
          <Text style={styles.tagline}>Seja a voz de quem não pode falar</Text>

          <View style={styles.campaignBadge}>
            <Text style={styles.campaignText}>Abril Laranja 🧡</Text>
          </View>
        </View>

        {/* ── Login Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Entrar na sua conta</Text>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Senha */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Sua senha"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.eyeBtn}>
                <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot password */}
          <TouchableOpacity style={styles.forgotRow}>
            <Text style={styles.forgotText}>Esqueci minha senha</Text>
          </TouchableOpacity>

          {/* Entrar */}
          <TouchableOpacity
            style={[styles.btnPrimary, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnPrimaryText}>🐾 Entrar</Text>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Criar conta */}
          <TouchableOpacity
            style={styles.btnOutline}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnOutlineText}>Criar conta gratuita</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            Proteção animal — VETech Systems
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  /* Split background: dark top, green bottom */
  bgTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0d1f18',
  },
  bgBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: '55%',
    backgroundColor: PRIMARY,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    opacity: 0.15,
  },

  /* Deco */
  deco: { position: 'absolute', opacity: 0.08, zIndex: 0 },

  scroll: { flexGrow: 1, justifyContent: 'flex-end' },

  /* Hero */
  hero: {
    alignItems: 'center',
    paddingTop: 72,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  logoCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: ACCENT,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  logoImage: { width: 80, height: 80 },

  titleLine1: {
    fontSize: 28, fontWeight: '900', color: '#fff',
    letterSpacing: 1.5,
  },
  titleLine2: {
    fontSize: 28, fontWeight: '900', color: ACCENT_L,
    letterSpacing: 1.5, marginBottom: 10,
  },
  tagline: {
    fontSize: 14, color: SECONDARY, fontWeight: '500',
    letterSpacing: 0.3, marginBottom: 16,
  },
  campaignBadge: {
    backgroundColor: `${ACCENT}30`,
    borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: `${ACCENT_L}60`,
  },
  campaignText: { color: ACCENT_L, fontSize: 13, fontWeight: '700' },

  /* Card */
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    paddingBottom: Platform.OS === 'ios' ? 42 : 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 22 },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12, borderWidth: 1.5, borderColor: '#D1FAE5',
    paddingHorizontal: 14, height: 52,
  },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#111827' },
  eyeBtn: { paddingLeft: 8 },
  eyeIcon: { fontSize: 18 },

  forgotRow: { alignSelf: 'flex-end', marginBottom: 20, marginTop: -4 },
  forgotText: { fontSize: 13, color: SECONDARY, fontWeight: '600' },

  btnPrimary: {
    backgroundColor: ACCENT,
    borderRadius: 14, height: 54,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  btnPrimaryText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },

  divider: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 18, gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { fontSize: 13, color: '#9CA3AF' },

  btnOutline: {
    borderRadius: 14, height: 54,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: PRIMARY,
  },
  btnOutlineText: { fontSize: 15, fontWeight: '700', color: PRIMARY },

  footer: {
    textAlign: 'center', color: '#9CA3AF',
    fontSize: 12, marginTop: 20,
  },
});
