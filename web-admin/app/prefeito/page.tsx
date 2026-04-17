'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map, Building2,
} from 'lucide-react';
import Sidebar from '@/components/shared/Sidebar';
import { getSession, checkRoutePermission } from '@/lib/auth';

/* ─── constants ──────────────────────────────────────────── */
const FONT = "'Inter', system-ui, -apple-system, sans-serif";

/* ─── types ─────────────────────────────────────────────── */
interface Stats {
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
  resolution_rate: number;
}
interface Department {
  id: number;
  name: string;
  total_complaints: number;
  resolved_complaints: number;
}

/* ─── KPI stat cards (cards 2-6) ─────────────────────────── */
const STAT_CARDS = [
  { key: 'total'           as keyof Stats, label: 'TOTAL',        color: '#3B82F6', suffix: ''  },
  { key: 'pending'         as keyof Stats, label: 'AGUARDANDO',   color: '#F59E0B', suffix: ''  },
  { key: 'in_progress'     as keyof Stats, label: 'EM ANDAMENTO', color: '#8B5CF6', suffix: ''  },
  { key: 'resolved'        as keyof Stats, label: 'RESOLVIDAS',   color: '#10B981', suffix: ''  },
  { key: 'resolution_rate' as keyof Stats, label: 'TAXA',         color: '#02DCFB', suffix: '%' },
];


/* ─── animated bar ───────────────────────────────────────── */
function Bar({
  pct, gradient, track, delay,
}: {
  pct: number; gradient: string; track: string; delay: number;
}) {
  return (
    <div style={{ height: 10, borderRadius: 99, backgroundColor: track, overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, delay, ease: 'easeOut' }}
        style={{ height: '100%', borderRadius: 99, background: gradient, minWidth: pct > 0 ? 6 : 0 }}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function PrefeitoDashboard() {
  const router = useRouter();
  const [authorized,  setAuthorized]  = useState(false);
  const [stats,       setStats]       = useState<Stats | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading,     setLoading]     = useState(true);
  const { user } = getSession();

  useEffect(() => {
    const { user, token } = getSession();
    if (!token || !user) { window.location.href = '/login'; return; }
    const redirect = checkRoutePermission(user.role, '/prefeito');
    if (redirect) { window.location.href = redirect; return; }
    setAuthorized(true);
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { user, token } = getSession();
      const res  = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/cities/${user?.city_id}/dashboard`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      if (data.success) {
        setStats(data.dashboard.stats);
        const sorted = (data.dashboard.departments || []).sort((a: Department, b: Department) => {
          const ra = a.total_complaints > 0 ? a.resolved_complaints / a.total_complaints : 0;
          const rb = b.total_complaints > 0 ? b.resolved_complaints / b.total_complaints : 0;
          return rb !== ra ? rb - ra : b.total_complaints - a.total_complaints;
        });
        setDepartments(sorted);
      }
    } catch {}
    finally { setLoading(false); }
  };

  if (!authorized) return null;

  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: '#F1F5F9', fontFamily: FONT }}
    >
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* ══ HEADER ══════════════════════════════════════════ */}
        <header
          className="shrink-0 bg-white px-8 py-5 flex items-center justify-between"
          style={{ boxShadow: '0 1px 0 #E2E8F0', fontFamily: FONT }}
        >
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Painel do Prefeito
            </h1>
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 3, fontFamily: FONT }}>
              Bem-vindo, <span style={{ color: '#374151', fontWeight: 600 }}>{user?.name}</span> — {user?.city?.name}
            </p>
          </div>
        </header>

        {/* ══ CONTENT ═════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-72 gap-4"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.85, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    border: '3px solid #E2E8F0', borderTopColor: '#012235',
                  }}
                />
                <p style={{ fontSize: 13, color: '#9CA3AF', fontFamily: FONT }}>Carregando dados...</p>
              </motion.div>
            ) : (
              <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                {/* ══ KPI ROW — 6 cards ══════════════════════ */}
                {stats && (
                  <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>

                    {/* Card 1 — Mapa (clicável) */}
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.38, delay: 0, ease: 'easeOut' }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => router.push('/prefeito/mapa')}
                      className="rounded-2xl p-5 text-left cursor-pointer relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(145deg, #012235 0%, #013d5a 55%, #02657a 100%)',
                        minHeight: 130,
                        boxShadow: '0 2px 8px rgba(1,34,53,0.3)',
                        border: 'none',
                        fontFamily: FONT,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 6px 20px rgba(1,34,53,0.45)')}
                      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(1,34,53,0.3)')}
                    >
                      {/* Glow */}
                      <div style={{
                        position: 'absolute', bottom: -20, right: -20,
                        width: 100, height: 100, borderRadius: '50%',
                        background: 'rgba(2,220,251,0.18)', filter: 'blur(24px)',
                        pointerEvents: 'none',
                      }} />
                      {/* Ciano ring accent */}
                      <div style={{
                        position: 'absolute', top: 0, right: 0, bottom: 0,
                        width: 4, borderRadius: '0 16px 16px 0',
                        background: '#02DCFB',
                      }} />

                      <div
                        className="flex items-center justify-center rounded-xl mb-3"
                        style={{ width: 48, height: 48, background: 'rgba(2,220,251,0.15)' }}
                      >
                        <Map size={26} style={{ color: '#02DCFB' }} strokeWidth={2} />
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: FONT }}>
                        Mapa da Cidade
                      </p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2, fontFamily: FONT }}>
                        Ver no mapa
                      </p>
                    </motion.button>

                    {/* Cards 2-6 — stats */}
                    {STAT_CARDS.map((card, i) => {
                      const raw   = stats[card.key] ?? 0;
                      const value = `${raw}${card.suffix}`;

                      return (
                        <motion.div
                          key={card.key}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.38, delay: (i + 1) * 0.07, ease: 'easeOut' }}
                          className="bg-white rounded-2xl p-5"
                          style={{
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
                            borderBottom: `4px solid ${card.color}`,
                            fontFamily: FONT,
                          }}
                        >
                          {/* Label */}
                          <p style={{
                            fontSize: 13, fontWeight: 700, color: '#374151',
                            textTransform: 'uppercase', letterSpacing: '0.1em',
                            marginBottom: 8, fontFamily: FONT,
                          }}>
                            {card.label}
                          </p>

                          {/* Number */}
                          <p style={{
                            fontSize: 52, fontWeight: 900, color: '#111827',
                            lineHeight: 1, letterSpacing: '-0.03em', fontFamily: FONT,
                          }}>
                            {value}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* ══ DEPARTMENTS ══════════════════════════════ */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5, ease: 'easeOut' }}
                  className="bg-white rounded-2xl overflow-hidden"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)', fontFamily: FONT }}
                >
                  {/* Section header */}
                  <div
                    className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    style={{ borderBottom: '1px solid #F1F5F9' }}
                  >
                    <div className="flex items-center gap-3">
                      <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Building2 size={18} style={{ color: '#3B82F6' }} />
                      </div>
                      <div>
                        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', fontFamily: FONT }}>
                          Desempenho por Secretaria
                        </h2>
                        <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2, fontFamily: FONT }}>
                          Taxa de resolução · ordenado por desempenho
                        </p>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-5">
                      {[
                        { color: '#10B981', label: '≥ 70% Ótimo'    },
                        { color: '#F59E0B', label: '≥ 40% Regular'  },
                        { color: '#EF4444', label: '< 40% Crítico'  },
                      ].map((l) => (
                        <div key={l.label} className="flex items-center gap-1.5" style={{ fontSize: 11, color: '#6B7280', fontFamily: FONT }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: l.color, display: 'inline-block' }} />
                          {l.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grid */}
                  <div className="p-6">
                    {departments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Building2 size={36} style={{ color: '#E2E8F0' }} />
                        <p style={{ fontSize: 13, color: '#9CA3AF', fontFamily: FONT }}>Nenhuma secretaria cadastrada</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
                        {departments.map((dept, i) => {
                          const hasData        = dept.total_complaints > 0;
                          const rate           = hasData ? Math.round((dept.resolved_complaints / dept.total_complaints) * 100) : 0;
                          const notResolved    = dept.total_complaints - dept.resolved_complaints;
                          const pctNotResolved = hasData ? Math.round((notResolved / dept.total_complaints) * 100) : 0;
                          return (
                            <motion.div
                              key={dept.id}
                              initial={{ opacity: 0, y: 16 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35, delay: 0.55 + i * 0.05, ease: 'easeOut' }}
                              className="rounded-xl p-5 cursor-default"
                              style={{
                                backgroundColor: '#fff',
                                border: '1px solid #E5E7EB',
                                borderLeft: `3px solid ${hasData && i < 3 ? '#F59E0B' : '#D1D5DB'}`,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                fontFamily: FONT,
                                opacity: hasData ? 1 : 0.5,
                              }}
                              whileHover={hasData ? {
                                y: -2,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                                transition: { duration: 0.15 },
                              } : {}}
                            >
                              {/* ── Row 1: nome + % grande ── */}
                              <div className="flex items-start justify-between gap-2" style={{ marginBottom: 10 }}>
                                {/* Nome */}
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <p
                                    className="truncate"
                                    style={{ fontSize: 14, fontWeight: 700, color: '#111827', fontFamily: FONT, lineHeight: 1.3 }}
                                  >
                                    {dept.name}
                                  </p>
                                </div>

                                {/* % em destaque grande */}
                                <span style={{
                                  fontSize: 28, fontWeight: 900, lineHeight: 1,
                                  color: hasData ? '#3B82F6' : '#9CA3AF',
                                  fontFamily: FONT, flexShrink: 0,
                                }}>
                                  {hasData ? `${rate}%` : '—'}
                                </span>
                              </div>

                              {/* ── Row 2: badge de reclamações ── */}
                              <div style={{ marginBottom: 14 }}>
                                <span
                                  translate="no"
                                  style={{
                                    display: 'inline-block',
                                    fontSize: 12, fontWeight: 600, color: '#374151',
                                    backgroundColor: '#F3F4F6',
                                    padding: '3px 10px', borderRadius: 99,
                                    fontFamily: FONT,
                                  }}
                                >
                                  {dept.total_complaints === 0
                                    ? 'Sem reclamações'
                                    : dept.total_complaints === 1
                                    ? '1 reclamação'
                                    : `${dept.total_complaints} reclamações`}
                                </span>
                              </div>

                              {/* ── Barras (só se tiver dados) ── */}
                              {hasData && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                  {/* Bar 1 — Resolvidas */}
                                  <div>
                                    <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                                      <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', fontFamily: FONT }}>
                                        ✓ Resolvidas
                                      </span>
                                      <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', fontFamily: FONT }}>
                                        {dept.resolved_complaints}
                                      </span>
                                    </div>
                                    <Bar
                                      pct={rate}
                                      gradient="linear-gradient(90deg, #3B82F6, #60A5FA)"
                                      track="#DBEAFE"
                                      delay={0.6 + i * 0.04}
                                    />
                                  </div>

                                  {/* Bar 2 — Em aberto */}
                                  <div>
                                    <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                                      <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', fontFamily: FONT }}>
                                        ○ Em aberto
                                      </span>
                                      <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', fontFamily: FONT }}>
                                        {notResolved}
                                      </span>
                                    </div>
                                    <Bar
                                      pct={pctNotResolved}
                                      gradient="linear-gradient(90deg, #93C5FD, #BFDBFE)"
                                      track="#EFF6FF"
                                      delay={0.65 + i * 0.04}
                                    />
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
