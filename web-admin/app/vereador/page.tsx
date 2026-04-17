'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map, FileText, BarChart2, Clock, Loader2,
  CheckCircle2, TrendingUp, Landmark,
} from 'lucide-react';
import Sidebar from '@/components/shared/Sidebar';
import { getSession, checkRoutePermission } from '@/lib/auth';

const FONT = "'Inter', system-ui, -apple-system, sans-serif";

/* ─── types ──────────────────────────────────────────────── */
interface Stats {
  total: number; pending: number; in_progress: number;
  resolved: number; resolution_rate: number;
}
interface Complaint {
  id: string; protocol: string; title: string; status: string;
  createdAt: string;
  citizen?: { id: string; name: string; email: string };
}

/* ─── KPI cards ──────────────────────────────────────────── */
const STAT_CARDS = [
  { key: 'total'           as keyof Stats, label: 'TOTAL',        color: '#3B82F6', suffix: '',  Icon: BarChart2    },
  { key: 'pending'         as keyof Stats, label: 'AGUARDANDO',   color: '#F59E0B', suffix: '',  Icon: Clock        },
  { key: 'in_progress'     as keyof Stats, label: 'EM ANDAMENTO', color: '#8B5CF6', suffix: '',  Icon: Loader2      },
  { key: 'resolved'        as keyof Stats, label: 'RESOLVIDAS',   color: '#10B981', suffix: '',  Icon: CheckCircle2 },
  { key: 'resolution_rate' as keyof Stats, label: 'TAXA',         color: '#02DCFB', suffix: '%', Icon: TrendingUp   },
];

/* ─── status helpers ─────────────────────────────────────── */
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente', validated: 'Validada', in_progress: 'Em andamento',
  resolved: 'Resolvida', closed: 'Encerrada', rejected: 'Rejeitada',
};
const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  pending:     { bg: '#FEF3C7', text: '#92400E' },
  validated:   { bg: '#DBEAFE', text: '#1E40AF' },
  in_progress: { bg: '#EDE9FE', text: '#5B21B6' },
  resolved:    { bg: '#D1FAE5', text: '#065F46' },
  closed:      { bg: '#F3F4F6', text: '#374151' },
  rejected:    { bg: '#FEE2E2', text: '#991B1B' },
};

/* ══════════════════════════════════════════════════════════ */
export default function VereadorDashboard() {
  const router = useRouter();
  const [authorized,  setAuthorized]  = useState(false);
  const [stats,       setStats]       = useState<Stats | null>(null);
  const [complaints,  setComplaints]  = useState<Complaint[]>([]);
  const [loading,     setLoading]     = useState(true);
  const { user } = getSession();

  useEffect(() => {
    const { user, token } = getSession();
    if (!token || !user) { window.location.href = '/login'; return; }
    const redirect = checkRoutePermission(user.role, '/vereador');
    if (redirect) { window.location.href = redirect; return; }
    setAuthorized(true);
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { user, token } = getSession();
      const res  = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/cities/${user?.city_id}/councilman-dashboard`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      if (data.success) {
        setStats(data.dashboard.stats);
        setComplaints(data.dashboard.complaints || []);
      }
    } catch {}
    finally { setLoading(false); }
  };

  if (!authorized) return null;

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F1F5F9', fontFamily: FONT }}>
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <header
          className="shrink-0 bg-white px-8 py-5 flex items-center justify-between"
          style={{ boxShadow: '0 1px 0 #E2E8F0', fontFamily: FONT }}
        >
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Painel do Vereador
            </h1>
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 3, fontFamily: FONT }}>
              Bem-vindo, <span style={{ color: '#374151', fontWeight: 600 }}>{user?.name}</span> — {user?.city?.name}
            </p>
          </div>
        </header>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-72 gap-4"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.85, repeat: Infinity, ease: 'linear' }}
                  style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #E2E8F0', borderTopColor: '#012235' }}
                />
                <p style={{ fontSize: 13, color: '#9CA3AF', fontFamily: FONT }}>Carregando dados...</p>
              </motion.div>
            ) : (
              <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                {/* ── KPI row ── */}
                {stats && (
                  <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>

                    {/* Card mapa */}
                    <motion.button
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.38, delay: 0, ease: 'easeOut' }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => router.push('/vereador/mapa')}
                      className="rounded-2xl p-5 text-left cursor-pointer relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(145deg, #012235 0%, #013d5a 55%, #02657a 100%)',
                        minHeight: 130, boxShadow: '0 2px 8px rgba(1,34,53,0.3)',
                        border: 'none', fontFamily: FONT,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 20px rgba(1,34,53,0.45)')}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(1,34,53,0.3)')}
                    >
                      <div style={{ position: 'absolute', bottom: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(2,220,251,0.18)', filter: 'blur(24px)', pointerEvents: 'none' }} />
                      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 4, borderRadius: '0 16px 16px 0', background: '#02DCFB' }} />
                      <div className="flex items-center justify-center rounded-xl mb-3" style={{ width: 48, height: 48, background: 'rgba(2,220,251,0.15)' }}>
                        <Map size={26} style={{ color: '#02DCFB' }} strokeWidth={2} />
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: FONT }}>Mapa de Demandas</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2, fontFamily: FONT }}>Ver no mapa</p>
                    </motion.button>

                    {/* KPI stats */}
                    {STAT_CARDS.map((card, i) => {
                      const raw   = stats[card.key] ?? 0;
                      const value = `${raw}${card.suffix}`;
                      return (
                        <motion.div
                          key={card.key}
                          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.38, delay: (i + 1) * 0.07, ease: 'easeOut' }}
                          className="bg-white rounded-2xl p-5"
                          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)', borderBottom: `4px solid ${card.color}`, fontFamily: FONT }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <card.Icon size={14} style={{ color: card.color }} />
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: FONT }}>
                              {card.label}
                            </p>
                          </div>
                          <p style={{ fontSize: 52, fontWeight: 900, color: '#111827', lineHeight: 1, letterSpacing: '-0.03em', fontFamily: FONT }}>
                            {value}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* ── Minhas Demandas ── */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5, ease: 'easeOut' }}
                  className="bg-white rounded-2xl overflow-hidden"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)', fontFamily: FONT }}
                >
                  {/* Section header */}
                  <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <div className="flex items-center gap-3">
                      <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={18} style={{ color: '#3B82F6' }} />
                      </div>
                      <div>
                        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', fontFamily: FONT }}>Minhas Demandas</h2>
                        <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2, fontFamily: FONT }}>
                          {complaints.length} demanda{complaints.length !== 1 ? 's' : ''} registrada{complaints.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push('/vereador/demandas')}
                      style={{
                        fontSize: 13, fontWeight: 600, color: '#3B82F6',
                        background: '#EFF6FF', border: 'none', borderRadius: 8,
                        padding: '7px 16px', cursor: 'pointer', fontFamily: FONT,
                      }}
                    >
                      Ver todas
                    </button>
                  </div>

                  {/* Table */}
                  {complaints.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <Landmark size={36} style={{ color: '#E2E8F0' }} />
                      <p style={{ fontSize: 13, color: '#9CA3AF', fontFamily: FONT }}>Nenhuma demanda registrada ainda</p>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT }}>
                        <thead>
                          <tr style={{ backgroundColor: '#F9FAFB' }}>
                            {['Protocolo', 'Título', 'Cidadão', 'Status', 'Data'].map(h => (
                              <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid #F3F4F6' }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {complaints.slice(0, 10).map((c, i) => {
                            const sc = STATUS_COLOR[c.status] || { bg: '#F3F4F6', text: '#374151' };
                            return (
                              <tr
                                key={c.id}
                                style={{ borderBottom: '1px solid #F9FAFB', cursor: 'default' }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FAFAFA')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                              >
                                <td style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#6B7280', fontFamily: 'monospace' }}>
                                  {c.protocol}
                                </td>
                                <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 600, color: '#111827', maxWidth: 240 }}>
                                  <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {c.title}
                                  </span>
                                </td>
                                <td style={{ padding: '14px 20px', fontSize: 13, color: '#6B7280' }}>
                                  {c.citizen?.name || '—'}
                                </td>
                                <td style={{ padding: '14px 20px' }}>
                                  <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, backgroundColor: sc.bg, color: sc.text }}>
                                    {STATUS_LABEL[c.status] || c.status}
                                  </span>
                                </td>
                                <td style={{ padding: '14px 20px', fontSize: 12, color: '#9CA3AF' }}>
                                  {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
