import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
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
    bg: '#E8682A',
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
    bg: '#52B788',
    circle: '#40916C',
  },
  {
    id: 'adocao',
    icon: '🏠',
    title: 'Adoção de\nAnimais',
    subtitle: 'Encontre um lar para eles',
    screen: 'Adocao',
    bg: '#FF6B6B',
    circle: '#FF8E53',
    badge: { label: 'NOVO', color: '#1B4332', textColor: '#fff' },
  },
];

function UrgentBadge({ badge }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (badge.label !== 'URGENTE') return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.badge,
        { backgroundColor: badge.color, transform: [{ scale: pulse }] },
      ]}
    >
      <Text style={[styles.badgeText, { color: badge.textColor }]}>{badge.label}</Text>
    </Animated.View>
  );
}

function Card({ card, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
      style={styles.cardWrapper}
    >
      <Animated.View style={[styles.card, { backgroundColor: card.bg, transform: [{ scale }] }]}>
        {/* Decorative circle simulating gradient */}
        <View style={[styles.cardCircleLg, { backgroundColor: card.circle }]} />
        <View style={[styles.cardCircleSm, { backgroundColor: card.circle }]} />

        {card.badge && <UrgentBadge badge={card.badge} />}

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

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(headerSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1B4332" />

      {/* Decorative background elements */}
      <Text style={[styles.bgDeco, { top: 160, left: -10 }]}>🐾</Text>
      <Text style={[styles.bgDeco, { top: 300, right: -8 }]}>🦴</Text>
      <Text style={[styles.bgDeco, { top: 500, left: 20 }]}>❤️</Text>
      <Text style={[styles.bgDeco, { top: 680, right: 10 }]}>🐾</Text>
      <Text style={[styles.bgDeco, { bottom: 120, left: 30 }]}>🦴</Text>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* ── HEADER ─────────────────────────────────────────── */}
        <View style={styles.header}>
          {/* Floating paw decorations */}
          <Text style={[styles.headerDeco, { top: 14, left: 18 }]}>🐾</Text>
          <Text style={[styles.headerDeco, { top: 10, right: 22, fontSize: 28 }]}>🐾</Text>
          <Text style={[styles.headerDeco, { bottom: 16, left: 40, fontSize: 22 }]}>🐾</Text>
          <Text style={[styles.headerDeco, { bottom: 10, right: 14, fontSize: 18 }]}>🐾</Text>

          {/* Header inner content */}
          <Animated.View
            style={[
              styles.headerContent,
              { opacity: headerFade, transform: [{ translateY: headerSlide }] },
            ]}
          >
            {/* Logout button top-right */}
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Text style={styles.logoutText}>Sair</Text>
            </TouchableOpacity>

            {/* Logo / main icon */}
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🐾</Text>
            </View>

            <Text style={styles.appName}>Eu Não Aceito{'\n'}Maus Tratos</Text>
            <Text style={styles.greeting}>Olá, {firstName}! 👋</Text>
            <Text style={styles.tagline}>Proteja quem não tem voz</Text>

            {/* City badge */}
            {user?.city?.name && (
              <View style={styles.cityBadge}>
                <Text style={styles.cityBadgeText}>📍 {user.city.name}</Text>
              </View>
            )}
          </Animated.View>
        </View>

        {/* ── CARDS GRID ────────────────────────────────────── */}
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            <Card card={CARDS[0]} onPress={() => navigation.navigate(CARDS[0].screen)} />
            <Card card={CARDS[1]} onPress={() => navigation.navigate(CARDS[1].screen)} />
          </View>
          <View style={styles.gridRow}>
            <Card card={CARDS[2]} onPress={() => navigation.navigate(CARDS[2].screen)} />
            <Card card={CARDS[3]} onPress={() => navigation.navigate(CARDS[3].screen)} />
          </View>
        </View>

        {/* ── MOTIVATIONAL STRIP ───────────────────────────── */}
        <View style={styles.motiv}>
          {/* Subtle paw pattern */}
          <Text style={styles.motivDecoL}>🐾</Text>
          <Text style={styles.motivDecoR}>🐾</Text>

          <Text style={styles.motivIcon}>💚</Text>
          <Text style={styles.motivTitle}>Você faz a diferença!</Text>
          <Text style={styles.motivText}>
            Cada denúncia salva uma vida.{'\n'}Obrigado por fazer parte da causa.
          </Text>

          <View style={styles.motivStats}>
            <View style={styles.motivStat}>
              <Text style={styles.motivStatIcon}>🛡️</Text>
              <Text style={styles.motivStatLabel}>Denúncias{'\n'}protegidas</Text>
            </View>
            <View style={styles.motivDivider} />
            <View style={styles.motivStat}>
              <Text style={styles.motivStatIcon}>🔔</Text>
              <Text style={styles.motivStatLabel}>Notificações{'\n'}em tempo real</Text>
            </View>
            <View style={styles.motivDivider} />
            <View style={styles.motivStat}>
              <Text style={styles.motivStatIcon}>💬</Text>
              <Text style={styles.motivStatLabel}>Chat com{'\n'}o protetor</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F7F4' },

  /* Background decorative emojis */
  bgDeco: {
    position: 'absolute', fontSize: 38, opacity: 0.06,
    zIndex: 0, pointerEvents: 'none',
  },

  scroll: { flexGrow: 1 },

  /* ── HEADER ── */
  header: {
    backgroundColor: '#1B4332',
    paddingBottom: 32,
    overflow: 'hidden',
    /* Top rounded bottom corners */
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    /* Shadow */
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  headerDeco: {
    position: 'absolute', fontSize: 36, opacity: 0.15, zIndex: 0,
  },
  headerContent: {
    paddingTop: 52,
    paddingHorizontal: 24,
    alignItems: 'center',
    zIndex: 1,
  },
  logoutBtn: {
    alignSelf: 'flex-end',
    backgroundColor: '#ffffff18',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ffffff25',
    marginBottom: 16,
  },
  logoutText: { color: '#ffffff70', fontSize: 13, fontWeight: '600' },

  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#2D6A4F',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
    borderWidth: 3, borderColor: '#52B78840',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
  },
  logoEmoji: { fontSize: 40 },

  appName: {
    fontSize: 22, fontWeight: '900', color: '#ffffff',
    textAlign: 'center', letterSpacing: 0.2, lineHeight: 28,
    marginBottom: 12,
  },
  greeting: {
    fontSize: 18, fontWeight: '700', color: '#ffffff',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14, color: '#52B788', fontWeight: '500',
    letterSpacing: 0.3, marginBottom: 14,
  },
  cityBadge: {
    backgroundColor: '#ffffff18',
    borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: '#ffffff20',
  },
  cityBadgeText: { color: '#A7F3D0', fontSize: 13, fontWeight: '600' },

  /* ── CARDS ── */
  gridContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
    zIndex: 1,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardWrapper: { flex: 1 },
  card: {
    borderRadius: 20,
    minHeight: 148,
    overflow: 'hidden',
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },
  /* pseudo-gradient circles */
  cardCircleLg: {
    position: 'absolute',
    width: 120, height: 120, borderRadius: 60,
    bottom: -30, right: -30,
    opacity: 0.55,
  },
  cardCircleSm: {
    position: 'absolute',
    width: 60, height: 60, borderRadius: 30,
    top: -15, left: -15,
    opacity: 0.3,
  },
  cardInner: {
    flex: 1, padding: 16,
    justifyContent: 'flex-end',
  },
  cardIcon: { fontSize: 40, marginBottom: 8 },
  cardTitle: {
    fontSize: 15, fontWeight: '900', color: '#ffffff',
    lineHeight: 20, marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 11, color: '#ffffff', opacity: 0.82,
    lineHeight: 15,
  },

  /* Badge (URGENTE / NOVO) */
  badge: {
    position: 'absolute', top: 10, right: 10,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 99,
    zIndex: 10,
  },
  badgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  /* ── MOTIVATIONAL ── */
  motiv: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  motivDecoL: {
    position: 'absolute', left: 10, top: 12,
    fontSize: 32, opacity: 0.06,
  },
  motivDecoR: {
    position: 'absolute', right: 10, bottom: 12,
    fontSize: 32, opacity: 0.06,
  },
  motivIcon: { fontSize: 36, marginBottom: 10 },
  motivTitle: {
    fontSize: 18, fontWeight: '800', color: '#1B4332',
    marginBottom: 6, textAlign: 'center',
  },
  motivText: {
    fontSize: 13, color: '#6B7280', textAlign: 'center',
    lineHeight: 20, marginBottom: 20,
  },
  motivStats: {
    flexDirection: 'row', width: '100%',
    backgroundColor: '#F0F7F4', borderRadius: 14, padding: 16,
  },
  motivStat: { flex: 1, alignItems: 'center', gap: 6 },
  motivStatIcon: { fontSize: 22 },
  motivStatLabel: {
    fontSize: 11, color: '#6B7280', textAlign: 'center', lineHeight: 15,
  },
  motivDivider: {
    width: 1, backgroundColor: '#D1FAE5', marginHorizontal: 8,
  },
});
