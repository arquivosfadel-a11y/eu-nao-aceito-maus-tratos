'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import { getSession, checkRoutePermission } from '@/lib/auth';
import {
  FileText, Search, Clock, Loader2, CheckCircle2,
  Lock, XCircle, ClipboardList, Image as ImageIcon,
} from 'lucide-react';

const FONT = "'Inter', system-ui, -apple-system, sans-serif";

/* ─── Status config ────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string; Icon: React.ElementType }> = {
  validated:    { label: 'Aguardando',   dot: '#F59E0B', bg: '#FEF3C7', text: '#92400E', Icon: Clock        },
  in_progress:  { label: 'Em Andamento', dot: '#3B82F6', bg: '#DBEAFE', text: '#1E40AF', Icon: Loader2      },
  resolved:     { label: 'Resolvida',    dot: '#10B981', bg: '#D1FAE5', text: '#065F46', Icon: CheckCircle2 },
  closed:       { label: 'Encerrada',    dot: '#059669', bg: '#A7F3D0', text: '#064E3B', Icon: Lock         },
  not_resolved: { label: 'Não Resolvida',dot: '#EF4444', bg: '#FEE2E2', text: '#991B1B', Icon: XCircle      },
  pending:      { label: 'Pendente',     dot: '#6B7280', bg: '#F3F4F6', text: '#374151', Icon: ClipboardList },
};

const STATUS_FILTERS = [
  { key: 'all',         label: 'Todas',         Icon: ClipboardList, color: '#374151' },
  { key: 'validated',   label: 'Aguardando',     Icon: Clock,         color: '#F59E0B' },
  { key: 'in_progress', label: 'Em Andamento',   Icon: Loader2,       color: '#3B82F6' },
  { key: 'resolved',    label: 'Resolvidas',     Icon: CheckCircle2,  color: '#10B981' },
  { key: 'closed',      label: 'Encerradas',     Icon: Lock,          color: '#059669' },
  { key: 'not_resolved',label: 'Não Resolvidas', Icon: XCircle,       color: '#EF4444' },
];

/* ══════════════════════════════════════════════════════════ */
export default function VereadorDemandas() {
  const [authorized,    setAuthorized]   = useState(false);
  const [complaints,    setComplaints]   = useState<any[]>([]);
  const [loading,       setLoading]      = useState(true);
  const [filterStatus,  setFilterStatus] = useState('all');
  const [search,        setSearch]       = useState('');
  const [lightboxImg,   setLightboxImg]  = useState<string | null>(null);

  useEffect(() => {
    const { user, token } = getSession();
    if (!token || !user) { window.location.href = '/login'; return; }
    const redirect = checkRoutePermission(user.role, '/vereador');
    if (redirect) { window.location.href = redirect; return; }
    setAuthorized(true);
    fetchDemandas();
  }, []);

  const fetchDemandas = async () => {
    try {
      const { user, token } = getSession();
      if (!user?.city_id || !token) { setLoading(false); return; }
      const res  = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/cities/${user.city_id}/councilman-dashboard`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      if (data.success) setComplaints(data.dashboard.complaints || []);
    } catch {} finally { setLoading(false); }
  };

  const filtered = complaints.filter(c => {
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    const term = search.toLowerCase();
    const matchSearch = !term
      || c.title?.toLowerCase().includes(term)
      || c.protocol?.toLowerCase().includes(term)
      || c.citizen?.name?.toLowerCase().includes(term);
    return matchStatus && matchSearch;
  });

  if (!authorized) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F1F5F9', fontFamily: FONT }}>
      <Sidebar />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Lightbox */}
        {lightboxImg && (
          <div onClick={() => setLightboxImg(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
            <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
              <img src={lightboxImg} alt="Imagem ampliada" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '12px', objectFit: 'contain', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }} />
              <button onClick={() => setLightboxImg(null)} style={{ position: 'absolute', top: '-16px', right: '-16px', background: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', color: '#111' }}>×</button>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ backgroundColor: '#fff', boxShadow: '0 1px 0 #E2E8F0', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg, #3B82F6, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 21, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>Minhas Demandas</h1>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0, marginTop: 2 }}>
              {filtered.length} de {complaints.length} demanda{complaints.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              type="text"
              placeholder="Buscar por título, protocolo ou cidadão..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9, borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, color: '#111827', outline: 'none', fontFamily: FONT, backgroundColor: '#F9FAFB' }}
            />
          </div>
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 8, padding: '16px 32px 0', flexShrink: 0, overflowX: 'auto' }}>
          {STATUS_FILTERS.map(f => {
            const active = filterStatus === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 999, border: active ? `1.5px solid ${f.color}` : '1.5px solid #E5E7EB', backgroundColor: active ? f.color + '12' : '#fff', color: active ? f.color : '#6B7280', fontSize: 13, fontWeight: active ? 600 : 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', fontFamily: FONT }}
              >
                <f.Icon size={14} strokeWidth={2} />
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Table area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 32px 32px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #E2E8F0', borderTopColor: '#3B82F6', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontSize: 13, color: '#9CA3AF', fontFamily: FONT }}>Carregando demandas...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 10 }}>
              <FileText size={40} style={{ color: '#E2E8F0' }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: '#9CA3AF', fontFamily: FONT }}>Nenhuma demanda encontrada</p>
              <p style={{ fontSize: 13, color: '#CBD5E1', fontFamily: FONT }}>Tente ajustar os filtros</p>
            </div>
          ) : (
            <div style={{ backgroundColor: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB' }}>
                    {['Protocolo', 'Título', 'Cidadão', 'Status', 'Fotos', 'Data'].map(h => (
                      <th key={h} style={{ padding: '13px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid #F3F4F6' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const sc = STATUS_CONFIG[c.status] || { label: c.status, dot: '#6B7280', bg: '#F3F4F6', text: '#374151', Icon: ClipboardList };
                    return (
                      <tr
                        key={c.id}
                        style={{ borderBottom: '1px solid #F9FAFB', transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FAFAFA')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', fontFamily: 'monospace' }}>
                            {c.protocol}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', maxWidth: 260 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</p>
                          {c.description && (
                            <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>{c.description}</p>
                          )}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <p style={{ fontSize: 13, color: '#374151', fontWeight: 500, margin: 0 }}>{c.citizen?.name || '—'}</p>
                          {c.citizen?.email && <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>{c.citizen.email}</p>}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, backgroundColor: sc.bg, color: sc.text }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: sc.dot, flexShrink: 0 }} />
                            {sc.label}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          {c.images?.length > 0 ? (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {c.images.slice(0, 3).map((img: string, i: number) => (
                                <img
                                  key={i}
                                  src={img}
                                  alt={`Foto ${i + 1}`}
                                  onClick={() => setLightboxImg(img)}
                                  style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', cursor: 'zoom-in', border: '1.5px solid #E5E7EB' }}
                                />
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: '#CBD5E1' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                            {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
