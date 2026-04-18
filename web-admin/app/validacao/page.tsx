'use client';

import { useState, useEffect } from 'react';
import {
  ClipboardCheck, Clock, CheckCircle2, XCircle, MapPin, User,
  Camera, ChevronRight, X, Heart, Shield, Search,
} from 'lucide-react';
import Sidebar from '@/components/shared/Sidebar';
import api from '@/lib/api';
import { getSession } from '@/lib/auth';
import { Complaint, Protector } from '@/types';

const PRIMARY   = '#1B4332';
const SECONDARY = '#52B788';
const ACCENT    = '#F4A261';
const BG        = '#F0F7F4';
const FONT      = 'var(--font-nunito), system-ui, sans-serif';
const SHADOW    = '0 1px 6px rgba(0,0,0,0.06)';

const INPUT =
  'w-full border border-[#D1FAE5] rounded-[10px] px-3 py-2.5 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-[#52B788] focus:border-transparent ' +
  'placeholder:text-gray-400 text-gray-800 bg-white';

function Spinner() {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      border: '3px solid #D1FAE5', borderTopColor: PRIMARY,
      animation: 'spin 0.85s linear infinite',
    }} />
  );
}

export default function ValidacaoPage() {
  const { user } = getSession();
  const isAdmin = user?.role === 'admin';

  const [availableCities, setAvailableCities] = useState<any[]>([]);
  const [filterCity,      setFilterCity]      = useState('');
  const [complaints,      setComplaints]      = useState<Complaint[]>([]);
  const [stats,           setStats]           = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading,         setLoading]         = useState(true);
  const [selected,        setSelected]        = useState<Complaint | null>(null);
  const [protectors,      setProtectors]      = useState<Protector[]>([]);
  const [selectedProtector, setSelectedProtector] = useState('');
  const [priority,        setPriority]        = useState('medium');
  const [editTitle,       setEditTitle]       = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm,  setShowRejectForm]  = useState(false);
  const [processing,      setProcessing]      = useState(false);
  const [protectorSearch, setProtectorSearch] = useState('');

  useEffect(() => { loadCities(); }, []);
  useEffect(() => { fetchComplaints(); }, [filterCity]);

  const loadCities = async () => {
    if (isAdmin) {
      const res = await api.get('/cities');
      setAvailableCities(res.data.cities || []);
    } else {
      setAvailableCities(user?.validatorCities || []);
    }
  };

  const getCityIds = (): string[] => {
    if (filterCity) return [filterCity];
    if (!isAdmin && user?.validatorCities?.length) return user.validatorCities.map((c: any) => c.id);
    return [];
  };

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const cityIds = getCityIds();
      const params: any = { status: 'pending', limit: 50 };
      if (cityIds.length > 0) params.city_ids = cityIds.join(',');
      const res = await api.get('/complaints', { params });
      setComplaints(res.data.complaints || []);
      fetchStats(cityIds);
    } catch {}
    finally { setLoading(false); }
  };

  const fetchStats = async (cityIds: string[]) => {
    try {
      const base: any = { limit: 1 };
      if (cityIds.length > 0) base.city_ids = cityIds.join(',');
      const [p, a, r] = await Promise.all([
        api.get('/complaints', { params: { ...base, status: 'pending' } }),
        api.get('/complaints', { params: { ...base, status: 'validated' } }),
        api.get('/complaints', { params: { ...base, status: 'rejected' } }),
      ]);
      setStats({ pending: p.data.total || 0, approved: a.data.total || 0, rejected: r.data.total || 0 });
    } catch {}
  };

  const fetchProtectors = async () => {
    try {
      const res = await api.get('/users/protectors');
      setProtectors(res.data.protectors || []);
    } catch {
      setProtectors([]);
    }
  };

  const handleSelect = (complaint: Complaint) => {
    setSelected(complaint);
    setSelectedProtector('');
    setPriority('medium');
    setEditTitle(complaint.title);
    setEditDescription(complaint.description || '');
    setRejectionReason('');
    setShowRejectForm(false);
    setProtectorSearch('');
    fetchProtectors();
  };

  const handleApprove = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      await api.put(`/complaints/${selected.id}/validate`, {
        action:       'approve',
        protector_id: selectedProtector || undefined,
        priority,
        title:        editTitle,
        description:  editDescription,
      });
      setComplaints(complaints.filter(c => c.id !== selected.id));
      setSelected(null);
      setStats(s => ({ ...s, pending: Math.max(0, s.pending - 1), approved: s.approved + 1 }));
      alert('Denúncia aprovada e encaminhada ao protetor!');
    } catch { alert('Erro ao aprovar denúncia'); }
    finally { setProcessing(false); }
  };

  const handleReject = async () => {
    if (!selected || !rejectionReason.trim()) { alert('Informe o motivo da rejeição'); return; }
    setProcessing(true);
    try {
      await api.put(`/complaints/${selected.id}/validate`, {
        action: 'reject', rejection_reason: rejectionReason,
      });
      setComplaints(complaints.filter(c => c.id !== selected.id));
      setSelected(null);
      setStats(s => ({ ...s, pending: Math.max(0, s.pending - 1), rejected: s.rejected + 1 }));
    } catch { alert('Erro ao rejeitar denúncia'); }
    finally { setProcessing(false); }
  };

  const PRIORITY: Record<string, { label: string; bg: string; color: string; activeBg: string; activeColor: string }> = {
    low:    { label: 'Baixa',   bg: '#F3F4F6', color: '#6B7280', activeBg: '#E5E7EB', activeColor: '#374151' },
    medium: { label: 'Média',   bg: '#FFFBEB', color: '#D97706', activeBg: '#FDE68A', activeColor: '#92400E' },
    high:   { label: 'Alta',    bg: '#FFF7ED', color: '#EA580C', activeBg: '#FED7AA', activeColor: '#9A3412' },
    urgent: { label: 'Urgente', bg: '#FEF2F2', color: '#DC2626', activeBg: '#FECACA', activeColor: '#991B1B' },
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: BG, fontFamily: FONT }}>
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* HEADER */}
        <header
          className="shrink-0 bg-white px-8 py-5 flex items-center justify-between"
          style={{ boxShadow: '0 1px 0 #D1FAE5', fontFamily: FONT }}
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${PRIMARY}, #2d6a4f)` }}>
              <Shield size={22} style={{ color: ACCENT }} strokeWidth={2} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Central de Validação
              </h1>
              <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                {isAdmin
                  ? 'Visão geral — todas as cidades'
                  : `Suas cidades: ${user?.validatorCities?.map((c: any) => c.name).join(', ') || '—'}`}
              </p>
            </div>
          </div>

          <select
            value={filterCity}
            onChange={e => { setFilterCity(e.target.value); setSelected(null); }}
            style={{
              border: `1.5px solid #D1FAE5`, borderRadius: 10, padding: '8px 14px',
              fontSize: 13, color: '#374151', background: '#fff',
              minWidth: 200, outline: 'none', cursor: 'pointer', fontFamily: FONT,
            }}
          >
            <option value="">Todas as cidades</option>
            {availableCities.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name} — {c.state}</option>
            ))}
          </select>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">

          {/* KPI CARDS */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'AGUARDANDO VALIDAÇÃO', value: stats.pending,  Icon: Clock,        color: ACCENT,     bg: '#FFF7ED', border: '#FED7AA' },
              { label: 'ENCAMINHADAS',         value: stats.approved, Icon: CheckCircle2, color: SECONDARY,  bg: '#ECFDF5', border: '#A7F3D0' },
              { label: 'REJEITADAS',           value: stats.rejected, Icon: XCircle,      color: '#EF4444',  bg: '#FEF2F2', border: '#FECACA' },
            ].map(({ label, value, Icon, color, bg, border }) => (
              <div key={label} className="bg-white" style={{ borderRadius: 16, boxShadow: SHADOW, padding: '20px 24px', borderBottom: `4px solid ${border}` }}>
                <div className="flex items-center justify-between mb-3">
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {label}
                  </p>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: bg }}>
                    <Icon size={16} style={{ color }} strokeWidth={2} />
                  </div>
                </div>
                <p style={{ fontSize: 44, fontWeight: 900, color: '#111827', lineHeight: 1, letterSpacing: '-0.03em' }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* DOIS PAINÉIS */}
          <div className="flex gap-6 items-start">

            {/* Lista */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center justify-between">
                <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Pendentes
                </p>
                {complaints.length > 0 && (
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: '#92400E',
                    backgroundColor: '#FFF7ED', padding: '3px 10px', borderRadius: 99,
                  }}>
                    {complaints.length} {complaints.length === 1 ? 'denúncia' : 'denúncias'}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Spinner />
                  <p style={{ fontSize: 13, color: '#9CA3AF' }}>Carregando...</p>
                </div>
              ) : complaints.length === 0 ? (
                <div className="bg-white flex flex-col items-center justify-center py-16 gap-3" style={{ borderRadius: 16, boxShadow: SHADOW }}>
                  <CheckCircle2 size={40} style={{ color: '#A7F3D0' }} strokeWidth={1.5} />
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>Nenhuma denúncia pendente</p>
                  <p style={{ fontSize: 13, color: '#9CA3AF' }}>Todas as denúncias foram processadas</p>
                </div>
              ) : complaints.map(complaint => {
                const isSel = selected?.id === complaint.id;
                return (
                  <div
                    key={complaint.id}
                    onClick={() => handleSelect(complaint)}
                    className="bg-white cursor-pointer"
                    style={{
                      borderRadius: 16,
                      boxShadow: isSel ? `0 0 0 2px ${SECONDARY}, 0 4px 16px rgba(82,183,136,0.12)` : SHADOW,
                      padding: '16px 20px',
                      border: isSel ? `1.5px solid ${SECONDARY}` : '1.5px solid transparent',
                      transition: 'box-shadow 0.15s, border 0.15s',
                    }}
                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'; }}
                    onMouseLeave={e => { if (!isSel) e.currentTarget.style.boxShadow = SHADOW; }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#9CA3AF' }}>
                        {complaint.protocol}
                      </span>
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                        {new Date(complaint.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }} className="line-clamp-1">
                      {complaint.title}
                    </p>
                    <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 10 }} className="line-clamp-2">
                      {complaint.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span style={{ fontSize: 11, fontWeight: 600, backgroundColor: '#ECFDF5', color: PRIMARY, padding: '3px 8px', borderRadius: 99 }}>
                        {complaint.city?.name} — {complaint.city?.state}
                      </span>
                      {complaint.address && (
                        <span className="flex items-center gap-1" style={{ fontSize: 11, color: '#9CA3AF' }}>
                          <MapPin size={10} strokeWidth={2} />
                          <span className="truncate max-w-[140px]">{complaint.address}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1" style={{ fontSize: 11, color: '#9CA3AF' }}>
                        <User size={10} strokeWidth={2} />
                        {(complaint as any).citizen?.name || '—'}
                      </span>
                      {(complaint as any).images?.length > 0 && (
                        <span className="flex items-center gap-1" style={{ fontSize: 11, color: '#9CA3AF' }}>
                          <Camera size={10} strokeWidth={2} />
                          {(complaint as any).images.length} foto{(complaint as any).images.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Painel detalhe */}
            <div style={{ width: 440, flexShrink: 0 }}>
              {selected ? (
                <div
                  className="bg-white sticky top-6"
                  style={{
                    borderRadius: 16, boxShadow: SHADOW, padding: 24,
                    maxHeight: 'calc(100vh - 180px)', overflowY: 'auto',
                  }}
                >
                  {/* Header painel */}
                  <div className="flex items-center justify-between mb-5">
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Analisar Denúncia</p>
                    <button
                      onClick={() => setSelected(null)}
                      className="cursor-pointer"
                      style={{ background: 'transparent', border: 'none', padding: 4 }}
                    >
                      <X size={18} style={{ color: '#9CA3AF' }} />
                    </button>
                  </div>

                  {/* Protocolo */}
                  <div style={{ backgroundColor: BG, borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#374151' }}>{selected.protocol}</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(selected.createdAt).toLocaleString('pt-BR')}</span>
                  </div>

                  {/* Fotos */}
                  {(selected as any).images?.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                        Fotos ({(selected as any).images.length})
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {(selected as any).images.map((img: string, i: number) => (
                          <img key={i} src={img} alt={`Foto ${i + 1}`}
                            onClick={() => window.open(img, '_blank')}
                            style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 10, flexShrink: 0, cursor: 'pointer', border: '1px solid #E5E7EB' }} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-2" style={{ marginBottom: 16 }}>
                    <div style={{ backgroundColor: BG, borderRadius: 10, padding: '10px 14px' }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Cidadão</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{(selected as any).citizen?.name || '—'}</p>
                      <p style={{ fontSize: 11, color: '#9CA3AF' }}>{(selected as any).citizen?.phone || ''}</p>
                    </div>
                    <div style={{ backgroundColor: BG, borderRadius: 10, padding: '10px 14px' }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Animal / Ocorrência</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                        {(selected as any).animal_category || selected.category || '—'}
                      </p>
                      {(selected as any).abuse_type && (
                        <p style={{ fontSize: 11, color: '#9CA3AF' }}>{(selected as any).abuse_type}</p>
                      )}
                    </div>
                    <div className="col-span-2" style={{ backgroundColor: BG, borderRadius: 10, padding: '10px 14px' }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                        Localização da Denúncia
                      </p>
                      {selected.address ? (
                        <>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                            {selected.address}{selected.neighborhood ? `, ${selected.neighborhood}` : ''}
                          </p>
                          <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                            {selected.city?.name || (selected as any).city_name || '—'}
                            {selected.city?.state ? ` — ${selected.city.state}` : ''}
                          </p>
                        </>
                      ) : selected.latitude ? (
                        <>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                            {selected.city?.name || (selected as any).city_name || 'Sem endereço'}
                            {selected.city?.state ? ` — ${selected.city.state}` : ''}
                          </p>
                          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                            {selected.latitude?.toFixed(6)}, {selected.longitude?.toFixed(6)}
                          </p>
                        </>
                      ) : (
                        <p style={{ fontSize: 13, color: '#9CA3AF' }}>
                          {selected.city?.name || (selected as any).city_name || 'Localização não informada'}
                          {selected.city?.state ? ` — ${selected.city.state}` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Título editável */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                      Título <span style={{ color: '#D1D5DB', textTransform: 'none', letterSpacing: 'normal', fontWeight: 400, fontSize: 10 }}>editável</span>
                    </label>
                    <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className={INPUT} />
                  </div>

                  {/* Descrição editável */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                      Descrição <span style={{ color: '#D1D5DB', textTransform: 'none', letterSpacing: 'normal', fontWeight: 400, fontSize: 10 }}>editável</span>
                    </label>
                    <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)}
                      rows={3} className={INPUT} style={{ resize: 'none' }} />
                  </div>

                  {/* Selecionar Protetor */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                      Encaminhar para Protetor
                    </label>
                    {protectors.length > 0 && (
                      <input
                        type="text"
                        value={protectorSearch}
                        onChange={e => setProtectorSearch(e.target.value)}
                        placeholder="Buscar por nome ou cidade..."
                        className={INPUT}
                        style={{ marginBottom: 8 }}
                      />
                    )}
                    {protectors.length > 0 ? (() => {
                      const q = protectorSearch.toLowerCase();
                      const filtered = protectors.filter(p =>
                        p.name.toLowerCase().includes(q) ||
                        (p.city_name || '').toLowerCase().includes(q)
                      );
                      return filtered.length > 0 ? (
                        <div className="space-y-2" style={{ maxHeight: 260, overflowY: 'auto' }}>
                          {filtered.map(p => (
                            <label
                              key={p.id}
                              className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
                              style={{
                                border: `1.5px solid ${selectedProtector === p.id ? SECONDARY : '#E5E7EB'}`,
                                backgroundColor: selectedProtector === p.id ? '#ECFDF5' : '#fff',
                              }}
                            >
                              <input
                                type="radio" name="protector" value={p.id}
                                checked={selectedProtector === p.id}
                                onChange={() => setSelectedProtector(p.id)}
                                className="accent-green-600"
                              />
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                                style={{ backgroundColor: `${PRIMARY}20`, color: PRIMARY }}>
                                {p.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{p.name}</p>
                                <p style={{ fontSize: 11, color: '#9CA3AF' }}>
                                  {p.city_name || p.city?.name || 'Cidade não informada'}
                                  {p.phone ? ` · ${p.phone}` : ''}
                                </p>
                              </div>
                              <div style={{
                                fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
                                backgroundColor: (p.in_progress_count || 0) === 0 ? '#ECFDF5' : (p.in_progress_count || 0) <= 2 ? '#FFFBEB' : '#FEF2F2',
                                color: (p.in_progress_count || 0) === 0 ? PRIMARY : (p.in_progress_count || 0) <= 2 ? '#D97706' : '#DC2626',
                                flexShrink: 0,
                              }}>
                                {(p.in_progress_count || 0) === 0 ? 'Livre' : `${p.in_progress_count} em andamento`}
                              </div>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div style={{ backgroundColor: BG, borderRadius: 10, padding: '12px 14px' }}>
                          <p style={{ fontSize: 13, color: '#9CA3AF' }}>Nenhum protetor encontrado para "{protectorSearch}"</p>
                        </div>
                      );
                    })() : (
                      <div style={{ backgroundColor: BG, borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Heart size={16} style={{ color: SECONDARY }} strokeWidth={2} />
                        <p style={{ fontSize: 13, color: '#6B7280' }}>Nenhum protetor cadastrado</p>
                      </div>
                    )}
                  </div>

                  {/* Prioridade */}
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                      Prioridade
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(PRIORITY).map(([key, cfg]) => {
                        const active = priority === key;
                        return (
                          <button key={key} type="button" onClick={() => setPriority(key)}
                            style={{
                              padding: '8px 4px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                              border: active ? `2px solid ${cfg.color}` : '2px solid transparent',
                              backgroundColor: active ? cfg.activeBg : cfg.bg,
                              color: active ? cfg.activeColor : cfg.color,
                              cursor: 'pointer', transition: 'all 0.1s',
                            }}>
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Motivo rejeição */}
                  {showRejectForm && (
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                        Motivo da rejeição *
                      </label>
                      <textarea
                        value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                        placeholder="Descreva o motivo da rejeição..."
                        className={INPUT} rows={3} autoFocus
                        style={{ resize: 'none', borderColor: '#FECACA' }}
                      />
                    </div>
                  )}

                  {/* Botões de ação */}
                  <div className="flex gap-3">
                    {!showRejectForm ? (
                      <>
                        <button onClick={handleApprove} disabled={processing}
                          style={{
                            flex: 1, backgroundColor: processing ? '#9CA3AF' : PRIMARY,
                            color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0',
                            fontSize: 14, fontWeight: 700, cursor: processing ? 'not-allowed' : 'pointer',
                          }}>
                          {processing ? 'Processando...' : 'Encaminhar'}
                        </button>
                        <button onClick={() => setShowRejectForm(true)} disabled={processing}
                          style={{
                            flex: 1, backgroundColor: '#EF4444', color: '#fff', border: 'none',
                            borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                          }}>
                          Rejeitar
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setShowRejectForm(false)}
                          style={{
                            flex: 1, backgroundColor: 'transparent', color: '#6B7280',
                            border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '12px 0',
                            fontSize: 14, fontWeight: 600, cursor: 'pointer',
                          }}>
                          Voltar
                        </button>
                        <button onClick={handleReject}
                          disabled={processing || !rejectionReason.trim()}
                          style={{
                            flex: 1, backgroundColor: processing || !rejectionReason.trim() ? '#9CA3AF' : '#EF4444',
                            color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0',
                            fontSize: 14, fontWeight: 700,
                            cursor: processing || !rejectionReason.trim() ? 'not-allowed' : 'pointer',
                          }}>
                          {processing ? 'Processando...' : 'Confirmar Rejeição'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white flex flex-col items-center justify-center"
                  style={{ borderRadius: 16, boxShadow: SHADOW, padding: 48 }}>
                  <ChevronRight size={40} style={{ color: '#D1FAE5', marginBottom: 12 }} strokeWidth={1.5} />
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>Selecione uma denúncia</p>
                  <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>Clique em uma denúncia para analisar</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
