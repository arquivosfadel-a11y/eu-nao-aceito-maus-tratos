import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function PhoneVerificationScreen({ navigation, route }) {
  const { loginWithToken } = useAuth();
  const { token, phone } = route.params;

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRef = useRef(null);

  // Envia o código automaticamente ao entrar na tela
  useEffect(() => {
    sendCode();
  }, []);

  // Countdown para reenvio
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const sendCode = async () => {
    setSending(true);
    try {
      await api.post('/auth/send-verification', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCountdown(60);
      setTimeout(() => inputRef.current?.focus(), 500);
    } catch (error) {
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao enviar SMS.');
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('Atenção', 'Digite o código de 6 dígitos.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/verify-phone', { code }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('✅ Verificado!', 'Telefone verificado com sucesso!', [
        {
          text: 'Continuar',
          onPress: () => loginWithToken(token)
        }
      ]);
    } catch (error) {
      Alert.alert('Erro', error.response?.data?.message || 'Código incorreto.');
    } finally {
      setLoading(false);
    }
  };

  const maskedPhone = phone
    ? phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3').replace(/\d(?=\d{4})/g, '*')
    : '****';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>📱</Text>
          </View>
          <Text style={styles.title}>Verificar Telefone</Text>
          <Text style={styles.subtitle}>
            Enviamos um código SMS para{'\n'}
            <Text style={styles.phone}>{maskedPhone}</Text>
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Digite o código de 6 dígitos</Text>

          <TextInput
            ref={inputRef}
            style={styles.codeInput}
            value={code}
            onChangeText={v => setCode(v.replace(/\D/g, '').slice(0, 6))}
            keyboardType="numeric"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor="#D1D5DB"
            textAlign="center"
          />

          <Text style={styles.hint}>⏱️ O código expira em 10 minutos</Text>

          <TouchableOpacity
            style={[styles.btnPrimary, (loading || code.length !== 6) && styles.btnDisabled]}
            onPress={handleVerify}
            disabled={loading || code.length !== 6}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#012235" />
              : <Text style={styles.btnPrimaryText}>✅ Verificar</Text>
            }
          </TouchableOpacity>

          {/* Reenviar código */}
          <TouchableOpacity
            style={[styles.btnResend, (sending || countdown > 0) && styles.btnDisabled]}
            onPress={sendCode}
            disabled={sending || countdown > 0}
          >
            {sending ? (
              <ActivityIndicator color="#012235" size="small" />
            ) : (
              <Text style={styles.btnResendText}>
                {countdown > 0
                  ? `Reenviar código em ${countdown}s`
                  : '🔄 Reenviar código'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Certifique-se que o número {phone} está correto.{'\n'}
          Se necessário, atualize no seu perfil.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#012235' },
  inner: { flex: 1, padding: 24, paddingTop: 64, justifyContent: 'center' },

  header: { alignItems: 'center', marginBottom: 32 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#02dcfb20', borderWidth: 2, borderColor: '#02dcfb',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  icon: { fontSize: 36 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#ffffff80', textAlign: 'center', lineHeight: 22 },
  phone: { color: '#02dcfb', fontWeight: '700' },

  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 16, textAlign: 'center' },

  codeInput: {
    backgroundColor: '#F9FAFB', borderRadius: 16,
    borderWidth: 2, borderColor: '#02dcfb',
    height: 72, fontSize: 36, fontWeight: '800',
    color: '#012235', letterSpacing: 12, marginBottom: 8,
  },

  hint: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginBottom: 20 },

  btnPrimary: {
    backgroundColor: '#02dcfb', borderRadius: 14, height: 54,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#02dcfb', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
    marginBottom: 12,
  },
  btnDisabled: { opacity: 0.5 },
  btnPrimaryText: { fontSize: 16, fontWeight: '800', color: '#012235' },

  btnResend: {
    height: 44, justifyContent: 'center', alignItems: 'center',
    borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  btnResendText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },

  footer: { fontSize: 11, color: '#ffffff40', textAlign: 'center', marginTop: 24, lineHeight: 18 },
});