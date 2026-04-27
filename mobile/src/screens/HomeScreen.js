import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  StyleSheet, ScrollView, StatusBar, Animated
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const CARDS = [
  {
    id: 'new',
    icon: '🐾',
    title: 'Denunciar\nMaus Tratos',
    subtitle: 'Registre uma ocorrência',
    screen: 'NewComplaint',
    bg: '#d8610c',
    circle: '#F4A261',
    badge: { label: 'URGENTE', color: '#EF4444', textColor: '#fff' },
  },
  {
    id: 'mine',
    icon: '📋',
    title: 'Minhas\nDenúncias',
    subtitle: 'Acompanhe seus casos',
    screen: 'MyComplaints',
    bg: '#1B4332',
    circle: '#2D6A4F',
  },
  {
    id: 'all',
    icon: '🔍',
    title: 'Ver\nDenúncias',
    subtitle: 'Veja o que está acontecendo',
    screen: 'AllComplaints',
    bg: '#8ac926',
    circle: '#52B788',
  },
  {
    id: 'adocao',
    icon: '🏠',
    title: 'Adoção de\nAnimais',
    subtitle: 'Encontre um lar para eles',
    screen: 'Adocao',
    bg: '#C62828',
    circle: '#E53935',
    badge: { label: 'NOVO', color: '#1B4332', textColor: '#fff' },
  },
];

const STATS = [
  { icon: '🐕', number: '1.2k', label: 'salvos' },
  { icon: '🏠', number: '340',  label: 'adotados' },
  { icon: '🛡️', number: '80',   label: 'protetores' },
];

function UrgentBadge({ badge }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (badge.label !== 'URGENTE') return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={[styles.badge, { backgroundColor: badge.color, transform: [{ scale: pulse }] }]}>
      <Text style={[styles.badgeText, { color: badge.textColor }]}>{badge.label}</Text>
    </Animated.View>
  );
}

function Card({ card, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 30 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start()}
      activeOpacity={1}
      style={styles.cardWrapper}
    >
      <Animated.View style={[styles.card, { backgroundColor: card.bg, transform: [{ scale }] }]}>
        <View style={[styles.cardCircleLg, { backgroundColor: card.circle, opacity: 0.45 }]} />
        <View style={[styles.cardCircleSm, { backgroundColor: card.circle, opacity: 0.25 }]} />

        {card.badge && <UrgentBadge badge={card.badge} />}

        <Text style={styles.cardPawDeco}>🐾</Text>

        <View style={styles.cardInner}>
          <Text style={styles.cardIcon}>{card.icon}</Text>
          <Text style={styles.cardTitle}>{card.title}</Text>
          <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'Cidadão';

  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1B4332" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} bounces>

        {/* ── HEADER ──────────────────────────────────────── */}
        <View style={styles.header}>
          {/* Patas decorativas — 5 posições variadas */}
          <Text style={[styles.hPaw, { top: 12,  left: 10,  fontSize: 14 }]}>🐾</Text>
          <Text style={[styles.hPaw, { top: 60,  right: 18, fontSize: 28 }]}>🐾</Text>
          <Text style={[styles.hPaw, { top: 30,  left: 80,  fontSize: 22 }]}>🐾</Text>
          <Text style={[styles.hPaw, { bottom: 18, left: 30, fontSize: 40 }]}>🐾</Text>
          <Text style={[styles.hPaw, { bottom: 30, right: 60, fontSize: 18 }]}>🐾</Text>

          {/* Silhueta cachorro */}
          <Text style={styles.dogSilhouette}>🐕</Text>

          {/* Botão Sair — absolute */}
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>

          <Animated.View style={[styles.headerContent, { opacity: fade, transform: [{ translateY: slide }] }]}>
            {/* Logo + nome do app */}
            <View style={styles.logoRow}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logoImage}
              />
              <View style={styles.logoTexts}>
                <Text style={styles.logoLine1}>EU NÃO ACEITO</Text>
                <Text style={styles.logoLine2}>MAUS TRATOS</Text>
              </View>
            </View>

            <Text style={styles.greeting}>Olá, {firstName}! 👋</Text>
            <Text style={styles.tagline}>Proteja quem não tem voz</Text>

            {user?.city?.name && (
              <View style={styles.cityBadge}>
                <Text style={styles.cityBadgeText}>📍 {user.city.name}</Text>
              </View>
            )}
          </Animated.View>
        </View>

        {/* ── BODY ────────────────────────────────────────── */}
        <View style={styles.body}>

          {/* GRID 2x2 */}
          <View style={styles.grid}>
            <View style={styles.gridRow}>
              <Card card={CARDS[0]} onPress={() => navigation.navigate(CARDS[0].screen)} />
              <Card card={CARDS[1]} onPress={() => navigation.navigate(CARDS[1].screen)} />
            </View>
            <View style={styles.gridRow}>
              <Card card={CARDS[2]} onPress={() => navigation.navigate(CARDS[2].screen)} />
              <Card card={CARDS[3]} onPress={() => navigation.navigate(CARDS[3].screen)} />
            </View>
          </View>

          {/* MOTIVACIONAL */}
          <View style={styles.motiv}>
            {/* Coluna esquerda — fundo verde para logo branco */}
            <View style={styles.motivLogoCol}>
              <Image
                source={require('../../assets/logorafael.png')}
                style={styles.motivLogo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.motivDivider} />

            {/* Coluna direita — pata em gradiente simulado + texto */}
            <View style={styles.motivTexts}>
              {/* Camada de gradiente: verde → laranja via Views sobrepostos */}
              <View style={[styles.motivGradLayer, { backgroundColor: '#1B4332', opacity: 0.08, borderRadius: 10 }]} />
              <View style={[styles.motivGradLayer, { backgroundColor: '#d8610c', opacity: 0.05, borderRadius: 10, top: '40%' }]} />
              {/* Pata grande decorativa */}
              <Text style={styles.motivPaw}>🐾</Text>
              {/* Texto por cima */}
              <Text style={styles.motivTitle}>Você faz a diferença!</Text>
              <Text style={styles.motivText}>
                Cada denúncia salva uma vida.{'\n'}Obrigado por fazer parte da causa.
              </Text>
            </View>
          </View>

          {/* STATS */}
          <View style={styles.statsRow}>
            {STATS.map(s => (
              <View key={s.label} style={styles.statCard}>
                <Text style={styles.statIcon}>{s.icon}</Text>
                <Text style={styles.statNumber}>{s.number}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F7F4' },
  scroll: { flex: 1 },

  /* ── HEADER ── */
  header: {
    backgroundColor: '#1B4332',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    overflow: 'hidden',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 10,
  },

  hPaw: {
    position: 'absolute',
    opacity: 0.07,
    zIndex: 0,
  },
  dogSilhouette: {
    position: 'absolute',
    right: 12,
    top: 50,
    fontSize: 80,
    opacity: 0.06,
    color: '#ffffff',
    zIndex: 0,
  },

  logoutBtn: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    zIndex: 10,
  },
  logoutText: { color: '#ffffffcc', fontSize: 13, fontWeight: '600' },

  headerContent: { zIndex: 1 },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 4,
  },
  logoImage: {
    width: 98,
    height: 98,
    borderRadius: 12,
    resizeMode: 'contain',
    marginRight: 14,
  },
  logoTexts: {},
  logoLine1: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  logoLine2: {
    color: '#d8610c',
    fontSize: 21,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 3,
  },
  tagline: {
    fontSize: 13,
    color: '#52B788',
    fontWeight: '500',
    marginBottom: 12,
  },
  cityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  cityBadgeText: { color: '#A7F3D0', fontSize: 12, fontWeight: '600' },

  /* ── BODY ── */
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
    justifyContent: 'space-between',
  },

  /* ── CARDS ── */
  grid: { gap: 12 },
  gridRow: { flexDirection: 'row', gap: 12 },
  cardWrapper: { flex: 1 },
  card: {
    borderRadius: 18,
    minHeight: 148,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardCircleLg: {
    position: 'absolute',
    width: 120, height: 120, borderRadius: 60,
    bottom: -30, right: -30,
  },
  cardCircleSm: {
    position: 'absolute',
    width: 60, height: 60, borderRadius: 30,
    top: -15, left: -15,
  },
  cardPawDeco: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    fontSize: 48,
    opacity: 0.12,
    zIndex: 0,
  },
  cardInner: {
    flex: 1,
    padding: 14,
    justifyContent: 'flex-end',
    zIndex: 1,
  },
  cardIcon: { fontSize: 34, marginBottom: 7 },
  cardTitle: {
    fontSize: 16, fontWeight: '900', color: '#ffffff',
    lineHeight: 22, marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13, color: '#ffffff', opacity: 0.85, lineHeight: 18,
  },

  badge: {
    position: 'absolute', top: 10, right: 10,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 99, zIndex: 10,
  },
  badgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  /* ── MOTIVACIONAL ── */
  motiv: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 0,
    flexDirection: 'row',
    alignItems: 'stretch',
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  motivLogoCol: {
    backgroundColor: '#1B4332',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  motivLogo: {
    width: 80,
    height: 80,
  },
  motivDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  motivTexts: {
    flex: 1,
    padding: 14,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  motivGradLayer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  motivPaw: {
    position: 'absolute',
    right: -8,
    bottom: -10,
    fontSize: 72,
    opacity: 0.13,
  },
  motivTitle: {
    fontSize: 14, fontWeight: '800', color: '#1B4332',
    marginBottom: 6,
    zIndex: 1,
  },
  motivText: {
    fontSize: 11, color: '#666', lineHeight: 17,
    zIndex: 1,
  },

  /* ── STATS ── */
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1B4332',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  statIcon:   { fontSize: 18, marginBottom: 2 },
  statNumber: { fontSize: 13, fontWeight: '800', color: '#ffffff', marginBottom: 1 },
  statLabel:  { fontSize: 9, color: '#52B788', fontWeight: '600', textAlign: 'center' },
});
