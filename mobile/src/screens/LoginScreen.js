import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert, Animated, Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

// Zigzag na base do topo verde — triângulos alternados apontando para baixo
function WaveBottom() {
  const count = 13;
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push(
      <View key={i} style={i % 2 === 0 ? styles.triDown : styles.triUp} />
    );
  }
  return <View style={styles.waveRow}>{items}</View>;
}

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const topOpacity  = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardY       = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.timing(topOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(cardY,       { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 300);
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
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Topo verde ── */}
        <Animated.View style={[styles.top, { opacity: topOpacity }]}>
          {/* Decorações de fundo */}
          <Text style={[styles.deco, { top: 22,  right: 22, fontSize: 48 }]}>🐾</Text>
          <Text style={[styles.deco, { top: 65,  left: 15,  fontSize: 40 }]}>🐕</Text>
          <Text style={[styles.deco, { bottom: 72, right: 32, fontSize: 36 }]}>🐈</Text>
          <Text style={[styles.deco, { bottom: 58, left: 26,  fontSize: 32 }]}>🦴</Text>

          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.titleLine1}>Eu Não Aceito</Text>
          <Text style={styles.titleLine2}>Maus Tratos</Text>
          <Text style={styles.tagline}>Proteja quem não tem voz 🐾</Text>
        </Animated.View>

        {/* Zigzag separador */}
        <WaveBottom />

        {/* ── Corpo claro ── */}
        <View style={styles.body}>
          <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ translateY: cardY }] }]}>
            <Text style={styles.cardTitle}>Bem-vindo de volta!</Text>
            <Text style={styles.cardSubtitle}>Entre para continuar ajudando</Text>

            {/* Email */}
            <View style={styles.inputRow}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                placeholder="E-mail"
                placeholderTextColor="#AAA"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Senha */}
            <View style={styles.inputRow}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor="#AAA"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)}>
                <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {/* Entrar */}
            <TouchableOpacity
              style={[styles.btnPrimary, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnPrimaryText}>ENTRAR</Text>
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
              style={styles.btnSecondary}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.85}
            >
              <Text style={styles.btnSecondaryText}>Criar nova conta</Text>
            </TouchableOpacity>

            {/* Esqueci senha */}
            <TouchableOpacity style={styles.forgotRow}>
              <Text style={styles.forgotText}>Esqueci minha senha</Text>
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.version}>v1.0 — VETech Systems</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const ORANGE = '#E8682A';
const GREEN  = '#1B4332';
const BG     = '#F0F7F4';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  scroll: { flexGrow: 1 },

  /* Topo verde — sem border radius, zigzag faz a separação */
  top: {
    backgroundColor: GREEN,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },

  /* Decorações animais no fundo do topo */
  deco: {
    position: 'absolute',
    opacity: 0.08,
  },

  logo: {
    width: 156,
    height: 156,
    marginBottom: 14,
  },

  titleLine1: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  titleLine2: {
    fontSize: 26,
    fontWeight: '900',
    color: ORANGE,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '400',
  },

  /* Zigzag */
  waveRow: {
    flexDirection: 'row',
    backgroundColor: GREEN,
  },
  triDown: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderTopWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: GREEN,
  },
  triUp: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: GREEN,
  },

  /* Corpo */
  body: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 32,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: GREEN,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 20,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8F5E9',
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 12,
  },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#1A1A2E' },
  eyeIcon: { fontSize: 17, paddingLeft: 8 },

  btnPrimary: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  dividerText: { fontSize: 13, color: '#AAA' },

  btnSecondary: {
    backgroundColor: GREEN,
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  forgotRow: { alignSelf: 'center', marginTop: 16 },
  forgotText: { fontSize: 13, color: '#52B788', fontWeight: '500' },

  version: {
    textAlign: 'center',
    color: '#CCC',
    fontSize: 11,
    marginTop: 20,
  },
});
