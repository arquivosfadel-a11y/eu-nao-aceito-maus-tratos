'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import { getSession, checkRoutePermission } from '@/lib/auth';
import api from '@/lib/api';
import {
  FileText, Search, Clock, Loader2, CheckCircle2,
  XCircle, Lock, AlertTriangle, X, ClipboardList,
  Image as ImageIcon,
} from 'lucide-react';

const FONT = "'Inter', system-ui, -apple-system, sans-serif";

/* ─── Status config ─────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string; Icon: React.ElementType }> = {
  validated:    { label: 'Aguardando',    dot: '#F59E0B', bg: '#FEF3C7', text: '#92400E', Icon: Clock        },
  in_progress:  { label: 'Em Andamento',  dot: '#3B82F6', bg: '#DBEAFE', text: '#1E40AF', Icon: Loader2      },
  resolved:     { label: 'Resolvida',     dot: '#10B981', bg: '#D1FAE5', text: '#065F46', Icon: CheckCircle2 },
  closed:       { label: 'Encerrada',     dot: '#059669', bg: '#A7F3D0', text: '#064E3B', Icon: Lock         },
  not_resolved: { label: 'Não Resolvida', dot: '#EF4444', bg: '#FEE2E2', text: '#991B1B', Icon: XCircle      },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  low:    { label: 'Baixa',   color: '#6B7280', bg: '#F3F4F6' },
  medium: { label: 'Média',   color: '#D97706', bg: '#FEF3C7' },
  high:   { label: 'Alta',    color: '#EA580C', bg: '#FFF7ED' },
  urgent: { label: 'Urgente', color: '#DC2626', bg: '#FEE2E2' },
};

const VISIBLE_STATUSES = ['validated', 'in_progress', 'resolved', 'closed', 'not_resolved'];

/* ─── Filter pills ───────────────────────────────────────── */
const STATUS_FILTERS = [
  { key: 'all',          label: 'Todos',          Icon: ClipboardList },
  { key: 'validated',    label: 'Aguardando',      Icon: Clock         },
  { key: 'in_progress',  label: 'Em Andamento',    Icon: Loader2       },
  { key: 'resolved',     label: 'Resolvidas',      Icon: CheckCircle2  },
  { key: 'closed',       label: 'Encerradas',      Icon: Lock          },
  { key: 'not_resolved', label: 'Não Resolvidas',  Icon: XCircle       },
];

const STATUS_ACTIVE_COLORS: Record<string, string> = {
  all:          '#374151',
  validated:    '#F59E0B',
  in_progress:  '#3B82F6',
  resolved:     '#10B981',
  closed:       '#059669',
  not_resolved: '#EF4444',
};

const PRIORITY_FILTERS = [
  { key: 'all',    label: 'Qualquer Prioridade' },
  { key: 'urgent', label: 'Urgente' },
  { key: 'high',   label: 'Alta' },
  { key: 'medium', label: 'Média' },
  { key: 'low',    label: 'Baixa' },
];

/* ══════════════════════════════════════════════════════════ */
export default function PrefeitoReclamacoes() {
  const [authorized, setAuthorized]     = useState(false);
  const [complaints, setComplaints]     = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [search, setSearch]             = useState('');
  const [lightboxImg, setLightboxImg]   = useState<string | null>(null);

  useEffect(() => {
    const { user, token } = getSession();
    if (!token || !user) { window.location.href = '/login'; return; }
    const redirect = checkRoutePermission(user.role, '/prefeito');
    if (redirect) { window.location.href = redirect; return; }
    setAuthorized(true);
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const { user } = getSession();
      const res = await api.get('/complaints', { params: { city_id: user?.city_id, limit: 200 } });
      const visible = (res.data.complaints || []).filter((c: any) => VISIBLE_STATUSES.includes(c.status));
      setComplaints(visible);
    } catch { } finally { setLoading(false); }
  };

  const filtered = complaints.filter(c => {
    const matchStatus   = filterStatus === 'all' || c.status === filterStatus;
    const matchPriority = filterPriority === 'all' || c.priority === filterPriority;
    const q = search.toLowerCase();
    const matchSearch   = search === '' ||
      c.title?.toLowerCase().includes(q) ||
      c.protocol?.toLowerCase().includes(q) ||
      c.neighborhood?.toLowerCase().includes(q) ||
      c.citizen?.name?.toLowerCase().includes(q) ||
      c.department?.name?.toLowerCase().includes(q);
    return matchStatus && matchPriority && matchSearch;
  });

  const hasFilters = filterStatus !== 'all' || filterPriority !== 'all' || search !== '';

  if (!authorized) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F1F5F9', fontFamily: FONT }}>
      <Sidebar />

      {/* Lightbox */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out',
          }}
        >
          <div style={{ position: 'relative' }}>
            <img
              src={lightboxImg}
              alt="Imagem ampliada"
              style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '12px', objectFit: 'contain', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}
            />
            <button
              onClick={() => setLightboxImg(null)}
              style={{
                position: 'absolute', top: '-16px', right: '-16px',
                background: '#fff', border: 'none', borderRadius: '50%',
                width: '32px', height: '32px', fontSize: '18px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)', color: '#111',
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── Header ── */}
        <div style={{
          backgroundColor: '#fff',
          boxShadow: '0 1px 0 #E2E8F0',
          padding: '20px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FileText size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>
              Reclamações
            </h1>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0, marginTop: 2 }}>
              Todas as reclamações da cidade
            </p>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div style={{
          backgroundColor: '#fff',
          borderBottom: '1px solid #E2E8F0',
          padding: '12px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          flexShrink: 0,
        }}>
          {/* Search row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', flex: '0 0 340px' }}>
              <Search
                size={15}
                style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }}
              />
              <input
                type="text"
                placeholder="Buscar por título, protocolo, bairro, cidadão..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px 8px 32px',
                  border: '1.5px solid #E5E7EB', borderRadius: 8,
                  fontSize: 13, color: '#111827', outline: 'none',
                  fontFamily: FONT, boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#3B82F6'}
                onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'}
              />
            </div>

            {/* Priority filter */}
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              style={{
                padding: '8px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8,
                fontSize: 13, color: '#374151', outline: 'none',
                fontFamily: FONT, cursor: 'pointer', backgroundColor: '#fff',
              }}
            >
              {PRIORITY_FILTERS.map(f => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>

            {hasFilters && (
              <button
                onClick={() => { setFilterStatus('all'); setFilterPriority('all'); setSearch(''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '8px 12px', border: '1.5px solid #E5E7EB',
                  borderRadius: 8, backgroundColor: '#fff', color: '#6B7280',
                  fontSize: 13, cursor: 'pointer', fontFamily: FONT,
                }}
              >
                <X size={13} />
                Limpar
              </button>
            )}

            <span style={{ marginLeft: 'auto', fontSize: 13, color: '#9CA3AF' }}>
              {filtered.length} reclamação{filtered.length !== 1 ? 'ões' : ''}
            </span>
          </div>

          {/* Status pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map(f => {
              const active = filterStatus === f.key;
              const color  = STATUS_ACTIVE_COLORS[f.key];
              return (
                <button
                  key={f.key}
                  onClick={() => setFilterStatus(f.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 999,
                    border: active ? `1.5px solid ${color}` : '1.5px solid #E5E7EB',
                    backgroundColor: active ? color + '12' : '#F9FAFB',
                    color: active ? color : '#6B7280',
                    fontSize: 12, fontWeight: active ? 600 : 500,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    transition: 'all 0.15s', fontFamily: FONT,
                  }}
                >
                  <f.Icon size={12} strokeWidth={2} />
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Table area ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 32px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                border: '3px solid #E5E7EB', borderTopColor: '#3B82F6',
                animation: 'spin 0.8s linear infinite',
              }} />
              <p style={{ fontSize: 14, color: '#9CA3AF', fontFamily: FONT }}>Carregando reclamações...</p>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#fff', borderRadius: 16,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
              overflow: 'hidden',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: FONT }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E5E7EB' }}>
                    {['Protocolo', 'Título', 'Secretaria', 'Cidadão', 'Bairro', 'Prioridade', 'Status', 'Fotos', 'Data'].map(h => (
                      <th key={h} style={{
                        textAlign: 'left', padding: '11px 14px',
                        fontSize: 11, fontWeight: 700, color: '#6B7280',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        whiteSpace: 'nowrap',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
                        <ClipboardList size={48} style={{ color: '#E5E7EB', margin: '0 auto 12px' }} />
                        <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Nenhuma reclamação encontrada</p>
                        <p style={{ fontSize: 12, margin: '4px 0 0' }}>
                          {hasFilters ? 'Tente ajustar os filtros aplicados' : 'Nenhuma reclamação no momento'}
                        </p>
                      </td>
                    </tr>
                  ) : filtered.map((c, idx) => {
                    const sc = STATUS_CONFIG[c.status];
                    const pc = PRIORITY_CONFIG[c.priority];
                    return (
                      <tr
                        key={c.id}
                        style={{
                          backgroundColor: idx % 2 === 0 ? '#fff' : '#FAFAFA',
                          borderBottom: '1px solid #F1F5F9',
                          transition: 'background-color 0.1s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F0F9FF')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#fff' : '#FAFAFA')}
                      >
                        <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                          {c.protocol}
                        </td>
                        <td style={{ padding: '11px 14px', maxWidth: '180px' }}>
                          <p style={{ fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.title}
                          </p>
                          {c.description && (
                            <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.description}
                            </p>
                          )}
                        </td>
                        <td style={{ padding: '11px 14px', color: '#6B7280', fontSize: 12, whiteSpace: 'nowrap' }}>
                          {c.department?.name || '—'}
                        </td>
                        <td style={{ padding: '11px 14px', color: '#6B7280', fontSize: 12, whiteSpace: 'nowrap' }}>
                          {c.citizen?.name || '—'}
                        </td>
                        <td style={{ padding: '11px 14px', color: '#6B7280', fontSize: 12 }}>
                          {c.neighborhood || c.address || '—'}
                        </td>
                        <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                          {pc ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              backgroundColor: pc.bg, color: pc.color,
                              fontSize: 11, fontWeight: 600,
                              padding: '2px 8px', borderRadius: 20,
                            }}>
                              {c.priority === 'urgent' && <AlertTriangle size={10} />}
                              {pc.label}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                          {sc ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              backgroundColor: sc.bg, color: sc.text,
                              fontSize: 11, fontWeight: 600,
                              padding: '3px 10px', borderRadius: 20,
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: sc.dot, flexShrink: 0 }} />
                              {sc.label}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          {c.images?.length > 0 ? (
                            <div style={{ display: 'flex', gap: 4 }}>
                              {c.images.slice(0, 3).map((img: string, i: number) => (
                                <img
                                  key={i}
                                  src={img}
                                  alt={`Foto ${i + 1}`}
                                  onClick={() => setLightboxImg(img)}
                                  style={{
                                    width: 36, height: 36, borderRadius: 8,
                                    objectFit: 'cover', cursor: 'zoom-in',
                                    border: '1px solid #E5E7EB', transition: 'opacity 0.15s',
                                  }}
                                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                                />
                              ))}
                              {c.images.length > 3 && (
                                <div style={{
                                  width: 36, height: 36, borderRadius: 8,
                                  backgroundColor: '#F3F4F6', display: 'flex',
                                  alignItems: 'center', justifyContent: 'center',
                                  fontSize: 11, color: '#6B7280', fontWeight: 600,
                                }}>
                                  +{c.images.length - 3}
                                </div>
                              )}
                            </div>
                          ) : (
                            <ImageIcon size={16} style={{ color: '#D1D5DB' }} />
                          )}
                        </td>
                        <td style={{ padding: '11px 14px', color: '#9CA3AF', fontSize: 12, whiteSpace: 'nowrap' }}>
                          {new Date(c.createdAt).toLocaleDateString('pt-BR')}
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
