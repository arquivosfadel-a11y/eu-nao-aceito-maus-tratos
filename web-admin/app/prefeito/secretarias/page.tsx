'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import { getSession, checkRoutePermission } from '@/lib/auth';
import api from '@/lib/api';
import {
  Building2, ClipboardList, X, Trophy, Medal,
  Image as ImageIcon, User,
} from 'lucide-react';

const FONT = "'Inter', system-ui, -apple-system, sans-serif";

const VISIBLE_STATUSES = ['validated', 'in_progress', 'resolved', 'closed', 'not_resolved'];

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  validated:    { label: 'Aguardando',    dot: '#F59E0B', bg: '#FEF3C7', text: '#92400E' },
  in_progress:  { label: 'Em Andamento',  dot: '#3B82F6', bg: '#DBEAFE', text: '#1E40AF' },
  resolved:     { label: 'Resolvida',     dot: '#10B981', bg: '#D1FAE5', text: '#065F46' },
  closed:       { label: 'Encerrada',     dot: '#059669', bg: '#A7F3D0', text: '#064E3B' },
  not_resolved: { label: 'Não Resolvida', dot: '#EF4444', bg: '#FEE2E2', text: '#991B1B' },
};

export default function PrefeitoSecretarias() {
  const [authorized, setAuthorized] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  useEffect(() => {
    const { user, token } = getSession();
    if (!token || !user) { window.location.href = '/login'; return; }
    const redirect = checkRoutePermission(user.role, '/prefeito');
    if (redirect) { window.location.href = redirect; return; }
    setAuthorized(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { user } = getSession();
      const [deptsRes, complaintsRes] = await Promise.all([
        api.get(`/cities/${user?.city_id}/departments`),
        api.get('/complaints', { params: { city_id: user?.city_id, limit: 500 } }),
      ]);
      setDepartments(deptsRes.data.departments || []);
      const visible = (complaintsRes.data.complaints || []).filter((c: any) => VISIBLE_STATUSES.includes(c.status));
      setComplaints(visible);
    } catch { } finally { setLoading(false); }
  };

  const getDeptStats = (deptId: string) => {
    const dc = complaints.filter(c =>
      String(c.department_id) === String(deptId) || String(c.department?.id) === String(deptId)
    );
    return {
      total:        dc.length,
      waiting:      dc.filter(c => c.status === 'validated').length,
      in_progress:  dc.filter(c => c.status === 'in_progress').length,
      resolved:     dc.filter(c => c.status === 'resolved' || c.status === 'closed').length,
      not_resolved: dc.filter(c => c.status === 'not_resolved').length,
    };
  };

  const filteredComplaints = selectedDept === 'all'
    ? complaints
    : complaints.filter(c =>
        String(c.department_id) === String(selectedDept) ||
        String(c.department?.id) === String(selectedDept)
      );

  const selectedName = selectedDept === 'all'
    ? 'Todas as Secretarias'
    : departments.find(d => String(d.id) === String(selectedDept))?.name || 'Secretaria';

  const sortedDepts = [...departments]
    .map(dept => {
      const stats = getDeptStats(dept.id);
      const rate  = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;
      return { dept, stats, rate };
    })
    .sort((a, b) => b.rate - a.rate);

  const allStats = {
    total:       complaints.length,
    waiting:     complaints.filter(c => c.status === 'validated').length,
    in_progress: complaints.filter(c => c.status === 'in_progress').length,
    resolved:    complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length,
  };
  const allRate = allStats.total > 0 ? Math.round((allStats.resolved / allStats.total) * 100) : 0;

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
          <img
            src={lightboxImg}
            alt="Imagem ampliada"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '12px', objectFit: 'contain' }}
          />
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
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Building2 size={20} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <h1 style={{ fontSize: 21, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>
                Secretarias
              </h1>
              <p style={{ fontSize: 13, color: '#6B7280', margin: 0, marginTop: 2 }}>
                {departments.length} secretarias &bull; {complaints.length} reclamações no total
              </p>
            </div>
          </div>

          {/* Mini KPI strip */}
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { label: 'Total',        value: allStats.total,       border: '#3B82F6' },
              { label: 'Aguardando',   value: allStats.waiting,     border: '#F59E0B' },
              { label: 'Em Andamento', value: allStats.in_progress, border: '#8B5CF6' },
              { label: 'Resolvidas',   value: allStats.resolved,    border: '#10B981' },
            ].map((s, i) => (
              <div key={i} style={{
                textAlign: 'center',
                padding: '8px 16px',
                backgroundColor: '#F8FAFC',
                borderRadius: 10,
                borderBottom: `3px solid ${s.border}`,
                minWidth: 72,
              }}>
                <p style={{ fontWeight: 800, fontSize: '20px', color: '#111827', margin: 0 }}>{s.value}</p>
                <p style={{ fontSize: '10px', fontWeight: 600, color: '#9CA3AF', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: '3px solid #E5E7EB', borderTopColor: '#8B5CF6',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ fontSize: 14, color: '#9CA3AF' }}>Carregando...</p>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

            {/* ── Left panel ── */}
            <div style={{
              width: '420px', flexShrink: 0,
              overflowY: 'auto',
              padding: '16px',
              borderRight: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              display: 'flex', flexDirection: 'column', gap: '8px',
            }}>

              {/* Card "Todas" */}
              <div
                onClick={() => setSelectedDept('all')}
                style={{
                  backgroundColor: selectedDept === 'all' ? '#012235' : '#fff',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  border: selectedDept === 'all' ? '2px solid #02dcfb' : '2px solid transparent',
                  boxShadow: selectedDept === 'all'
                    ? '0 4px 20px rgba(1,34,53,0.3)'
                    : '0 1px 4px rgba(0,0,0,0.06)',
                  transition: 'all 0.2s',
                  marginBottom: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      backgroundColor: selectedDept === 'all' ? 'rgba(2,220,251,0.2)' : '#EFF6FF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Building2 size={18} style={{ color: selectedDept === 'all' ? '#02dcfb' : '#3B82F6' }} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '13px', color: selectedDept === 'all' ? '#fff' : '#111827', margin: 0 }}>
                        Todas as Secretarias
                      </p>
                      <p style={{ fontSize: '11px', color: selectedDept === 'all' ? 'rgba(255,255,255,0.5)' : '#9CA3AF', margin: 0 }}>
                        Visão geral da cidade
                      </p>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '20px', fontWeight: 800,
                    color: selectedDept === 'all' ? '#02dcfb'
                      : allRate >= 70 ? '#10B981'
                      : allRate >= 40 ? '#F59E0B' : '#EF4444',
                  }}>
                    {allRate}%
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {[
                    { v: allStats.total,       l: 'Total',    c: selectedDept === 'all' ? 'rgba(255,255,255,0.1)' : '#F3F4F6', tc: selectedDept === 'all' ? '#fff' : '#374151' },
                    { v: allStats.waiting,     l: 'Aguard.',  c: '#FEF3C7', tc: '#92400E' },
                    { v: allStats.in_progress, l: 'Andamento',c: '#DBEAFE', tc: '#1E40AF' },
                    { v: allStats.resolved,    l: 'Resolv.',  c: '#D1FAE5', tc: '#065F46' },
                  ].map((item, i) => (
                    <div key={i} style={{ backgroundColor: item.c, borderRadius: '8px', padding: '6px', textAlign: 'center' }}>
                      <p style={{ fontWeight: 700, fontSize: '15px', color: item.tc, margin: 0 }}>{item.v}</p>
                      <p style={{ fontSize: '9px', color: item.tc, margin: 0, opacity: 0.8 }}>{item.l}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Separator */}
              <p style={{
                fontSize: '10px', fontWeight: 700, color: '#94A3B8',
                textTransform: 'uppercase', letterSpacing: '1px', margin: '4px 0 0 4px',
              }}>
                Por Secretaria
              </p>

              {/* Dept cards */}
              {sortedDepts.map(({ dept, stats, rate }, idx) => {
                const isSelected  = String(selectedDept) === String(dept.id);
                const rateColor = rate >= 70 ? '#10B981' : rate >= 40 ? '#F59E0B' : '#EF4444';
                const hasData   = stats.total > 0;

                return (
                  <div
                    key={dept.id}
                    onClick={() => setSelectedDept(String(dept.id))}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #02dcfb' : '1px solid #E5E7EB',
                      boxShadow: isSelected ? '0 4px 16px rgba(2,220,251,0.15)' : 'none',
                      transition: 'all 0.15s',
                      opacity: hasData ? 1 : 0.5,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontWeight: 700, fontSize: '13px', color: '#111827', margin: 0,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {dept.name}
                        </p>
                        {dept.responsible_name && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <User size={10} style={{ color: '#9CA3AF' }} />
                            <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>{dept.responsible_name}</p>
                          </div>
                        )}
                      </div>
                      <span style={{
                        fontSize: '14px', fontWeight: 800, color: rateColor,
                        marginLeft: '8px', flexShrink: 0,
                      }}>
                        {rate}%
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: '4px', backgroundColor: '#F1F5F9', borderRadius: '2px', marginBottom: '8px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${rate}%`, borderRadius: '2px',
                        backgroundColor: rateColor, transition: 'width 0.6s ease',
                      }} />
                    </div>

                    {/* Mini stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                      {[
                        { v: stats.total,       l: 'Total',    c: '#F8FAFC', tc: '#374151' },
                        { v: stats.waiting,     l: 'Aguard.',  c: '#FEF3C7', tc: '#92400E' },
                        { v: stats.in_progress, l: 'Andamento',c: '#DBEAFE', tc: '#1E40AF' },
                        { v: stats.resolved,    l: 'Resolv.',  c: '#D1FAE5', tc: '#065F46' },
                      ].map((item, i) => (
                        <div key={i} style={{ backgroundColor: item.c, borderRadius: '6px', padding: '4px', textAlign: 'center' }}>
                          <p style={{ fontWeight: 700, fontSize: '13px', color: item.tc, margin: 0 }}>{item.v}</p>
                          <p style={{ fontSize: '9px', color: item.tc, margin: 0, opacity: 0.7 }}>{item.l}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Right panel ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* Right panel header */}
              <div style={{
                padding: '14px 20px',
                borderBottom: '1px solid #E2E8F0',
                backgroundColor: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ClipboardList size={16} style={{ color: '#6B7280' }} />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '15px', color: '#111827', margin: 0 }}>{selectedName}</p>
                    <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                      {filteredComplaints.length} reclamação{filteredComplaints.length !== 1 ? 'ões' : ''}
                    </p>
                  </div>
                </div>
                {selectedDept !== 'all' && (
                  <button
                    onClick={() => setSelectedDept('all')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: '12px', color: '#6B7280', backgroundColor: '#F3F4F6',
                      border: 'none', borderRadius: '8px', padding: '6px 12px',
                      cursor: 'pointer', fontFamily: FONT,
                    }}
                  >
                    <X size={12} />
                    Limpar filtro
                  </button>
                )}
              </div>

              {/* Table */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {filteredComplaints.length === 0 ? (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', height: '100%', color: '#9CA3AF', gap: 8,
                  }}>
                    <ClipboardList size={48} style={{ color: '#E5E7EB' }} />
                    <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Nenhuma reclamação encontrada</p>
                    <p style={{ fontSize: '12px', margin: 0 }}>Esta secretaria não possui reclamações no momento</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: FONT }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr style={{ backgroundColor: '#F8FAFC' }}>
                        {['Protocolo', 'Título', 'Secretaria', 'Cidadão', 'Status', 'Fotos', 'Data'].map(h => (
                          <th key={h} style={{
                            textAlign: 'left', padding: '10px 14px', fontSize: '11px',
                            fontWeight: 700, color: '#6B7280', borderBottom: '1px solid #E2E8F0',
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredComplaints.map((c, idx) => {
                        const sc = STATUS_CONFIG[c.status];
                        return (
                          <tr
                            key={c.id}
                            style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#FAFAFA', borderBottom: '1px solid #F1F5F9' }}
                          >
                            <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '11px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                              {c.protocol}
                            </td>
                            <td style={{ padding: '10px 14px', maxWidth: '200px' }}>
                              <p style={{ fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {c.title}
                              </p>
                              {c.description && (
                                <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {c.description}
                                </p>
                              )}
                            </td>
                            <td style={{ padding: '10px 14px', color: '#6B7280', fontSize: '12px', whiteSpace: 'nowrap' }}>
                              {c.department?.name || '—'}
                            </td>
                            <td style={{ padding: '10px 14px', color: '#6B7280', fontSize: '12px', whiteSpace: 'nowrap' }}>
                              {c.citizen?.name || '—'}
                            </td>
                            <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                              {sc ? (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                                  backgroundColor: sc.bg, color: sc.text,
                                  fontSize: '11px', fontWeight: 600,
                                  padding: '3px 10px', borderRadius: '20px',
                                }}>
                                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: sc.dot, flexShrink: 0 }} />
                                  {sc.label}
                                </span>
                              ) : '—'}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              {c.images?.length > 0 ? (
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  {c.images.slice(0, 3).map((img: string, i: number) => (
                                    <img
                                      key={i}
                                      src={img}
                                      alt={`Foto ${i + 1}`}
                                      onClick={() => setLightboxImg(img)}
                                      style={{
                                        width: '36px', height: '36px', borderRadius: '8px',
                                        objectFit: 'cover', cursor: 'zoom-in', border: '1px solid #E5E7EB',
                                      }}
                                    />
                                  ))}
                                  {c.images.length > 3 && (
                                    <div style={{
                                      width: '36px', height: '36px', borderRadius: '8px',
                                      backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center',
                                      justifyContent: 'center', fontSize: '11px', color: '#6B7280', fontWeight: 600,
                                    }}>
                                      +{c.images.length - 3}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <ImageIcon size={16} style={{ color: '#D1D5DB' }} />
                              )}
                            </td>
                            <td style={{ padding: '10px 14px', color: '#9CA3AF', fontSize: '12px', whiteSpace: 'nowrap' }}>
                              {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>
        )}
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
