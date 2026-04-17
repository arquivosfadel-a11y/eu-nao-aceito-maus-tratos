'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  PawPrint, MessageCircle, CheckCircle, XCircle,
  Clock, TrendingUp, MapPin, User, Image as ImageIcon,
  Send, ChevronLeft,
} from 'lucide-react';
import Sidebar from '@/components/shared/Sidebar';
import api from '@/lib/api';
import { getSession, checkRoutePermission } from '@/lib/auth';
import { Complaint, Message } from '@/types';

const PRIMARY   = '#1B4332';
const SECONDARY = '#52B788';
const ACCENT    = '#F4A261';
const BG        = '#F0F7F4';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  validated:    { label: 'Aguardando',     color: '#92400E', bg: '#FEF3C7', border: '#F59E0B' },
  in_progress:  { label: 'Em Atendimento', color: '#1D4ED8', bg: '#DBEAFE', border: '#3B82F6' },
  resolved:     { label: 'Resolvida',      color: '#065F46', bg: '#D1FAE5', border: '#10B981' },
  not_resolved: { label: 'Não Resolvida',  color: '#991B1B', bg: '#FEE2E2', border: '#EF4444' },
  rejected:     { label: 'Rejeitada',      color: '#374151', bg: '#F3F4F6', border: '#9CA3AF' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low:    { label: 'Baixa',   color: '#6B7280' },
  medium: { label: 'Média',   color: '#D97706' },
  high:   { label: 'Alta',    color: '#EA580C' },
  urgent: { label: 'Urgente', color: '#DC2626' },
};

function KpiCard({ label, value, color, borderColor }: {
  label: string; value: number; color: string; borderColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-4"
      style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)', borderBottom: `4px solid ${borderColor}` }}
    >
      <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        {label}
      </p>
      <p style={{ fontSize: 40, fontWeight: 900, color, lineHeight: 1, letterSpacing: '-0.03em' }}>
        {value}
      </p>
    </motion.div>
  );
}

export default function ProtetorPage() {
  const [authorized, setAuthorized]         = useState(false);
  const [complaints, setComplaints]         = useState<Complaint[]>([]);
  const [selected, setSelected]             = useState<Complaint | null>(null);
  const [messages, setMessages]             = useState<Message[]>([]);
  const [newMessage, setNewMessage]         = useState('');
  const [loading, setLoading]               = useState(true);
  const [sending, setSending]               = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [filterStatus, setFilterStatus]     = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [search, setSearch]                 = useState('');
  const [activeTab, setActiveTab]           = useState<'details' | 'chat'>('details');
  const [resolutionDesc, setResolutionDesc] = useState('');
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { user, token } = getSession();
    if (!token || !user) { window.location.href = '/login'; return; }
    const redirect = checkRoutePermission(user.role, '/protetor');
    if (redirect) { window.location.href = redirect; return; }
    setAuthorized(true);
    fetchComplaints();
  }, []);

  useEffect(() => {
    if (selected) { fetchMessages(selected.id); setActiveTab('details'); }
  }, [selected]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints/my/complaints');
      setComplaints(res.data.complaints || []);
    } catch (err) {
      console.error('Erro ao buscar denúncias:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (complaint_id: string) => {
    try {
      const res = await api.get(`/complaints/${complaint_id}/messages`);
      setMessages(res.data.messages || []);
    } catch {}
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selected) return;
    setSending(true);
    try {
      const res = await api.post(`/complaints/${selected.id}/messages`, { content: newMessage });
      setMessages([...messages, res.data.message]);
      setNewMessage('');
    } catch {
      alert('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selected) return;
    setUpdatingStatus(true);
    try {
      const payload: any = { status };
      if (status === 'resolved' && resolutionDesc.trim()) {
        payload.resolution_description = resolutionDesc;
      }
      await api.put(`/complaints/${selected.id}/status`, payload);
      const updated = { ...selected, status: status as any };
      setComplaints(complaints.map(c => c.id === selected.id ? updated : c));
      setSelected(updated);
      setShowResolutionForm(false);
      setResolutionDesc('');
    } catch {
      alert('Erro ao atualizar status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const stats = {
    total:       complaints.length,
    waiting:     complaints.filter(c => c.status === 'validated').length,
    inProgress:  complaints.filter(c => c.status === 'in_progress').length,
    resolved:    complaints.filter(c => c.status === 'resolved').length,
    rate: complaints.length > 0
      ? Math.round((complaints.filter(c => c.status === 'resolved').length / complaints.length) * 100)
      : 0,
  };

  const filtered = complaints.filter(c => {
    const matchStatus   = filterStatus === 'all' || c.status === filterStatus;
    const matchPriority = filterPriority === 'all' || c.priority === filterPriority;
    const matchSearch   = search === '' ||
      (c.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.neighborhood || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.address || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchPriority && matchSearch;
  });

  const isProtectorMessage = (msg: Message) =>
    msg.sender?.role === 'secretary' || msg.sender?.role === 'protector' ||
    msg.sender_role === 'secretary' || msg.sender_role === 'protector';

  if (!authorized) return null;

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: BG }}>
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className="shrink-0 px-6 py-4 flex items-center gap-3"
          style={{ backgroundColor: PRIMARY, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${ACCENT}22`, border: `1px solid ${ACCENT}55` }}
          >
            <PawPrint size={20} style={{ color: ACCENT }} strokeWidth={2} />
          </div>
          <div>
            <h1 className="font-extrabold text-white" style={{ fontSize: 18, letterSpacing: '-0.01em' }}>
              Portal do Protetor
            </h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>
              Gerencie as denúncias atribuídas a você
            </p>
          </div>
        </header>

        {/* KPI Grid 2 colunas */}
        <div className="grid grid-cols-2 gap-4 px-6 pt-6 pb-4 shrink-0">
          <KpiCard label="Total de Denúncias" value={stats.total}      color={PRIMARY}  borderColor={SECONDARY} />
          <KpiCard label="Em Atendimento"      value={stats.inProgress} color="#1D4ED8"  borderColor="#3B82F6"  />
          <KpiCard label="Resolvidas"          value={stats.resolved}   color="#065F46"  borderColor="#10B981"  />
          <div
            className="bg-white rounded-2xl p-4"
            style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)', borderBottom: `4px solid ${ACCENT}` }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Taxa de Resolução
            </p>
            <p style={{ fontSize: 40, fontWeight: 900, color: ACCENT, lineHeight: 1, letterSpacing: '-0.03em' }}>
              {stats.rate}%
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 px-6 py-3 bg-white border-b border-gray-100" style={{ boxShadow: '0 1px 0 #E2E8F0' }}>
          <select
            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none cursor-pointer"
            style={{ focusRingColor: SECONDARY } as any}
          >
            <option value="all">Todos os status</option>
            <option value="validated">Aguardando</option>
            <option value="in_progress">Em Atendimento</option>
            <option value="resolved">Resolvidas</option>
            <option value="not_resolved">Não Resolvidas</option>
          </select>
          <select
            value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none cursor-pointer"
          >
            <option value="all">Todas as prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>
          <input
            type="text" placeholder="Buscar por título, bairro..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 max-w-xs border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
          />
          {(filterStatus !== 'all' || filterPriority !== 'all' || search) && (
            <button
              onClick={() => { setFilterStatus('all'); setFilterPriority('all'); setSearch(''); }}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              Limpar
            </button>
          )}
          <span className="ml-auto text-sm text-gray-400 flex items-center">
            {filtered.length} {filtered.length === 1 ? 'denúncia' : 'denúncias'}
          </span>
        </div>

        {/* Painel principal */}
        <div className="flex flex-1 overflow-hidden">
          {/* Lista */}
          <div className="w-96 bg-white border-r border-gray-200 overflow-y-auto shrink-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-7 h-7 rounded-full border-3 border-gray-200 border-t-[#1B4332] animate-spin" style={{ borderWidth: 3, borderTopColor: PRIMARY }} />
                <p className="text-sm text-gray-400">Carregando denúncias...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <PawPrint size={40} strokeWidth={1.5} style={{ color: SECONDARY, marginBottom: 10 }} />
                <p className="text-sm font-medium text-gray-500">Nenhuma denúncia encontrada</p>
              </div>
            ) : filtered.map(complaint => {
              const sc = STATUS_CONFIG[complaint.status];
              const pc = PRIORITY_CONFIG[complaint.priority];
              const isSel = selected?.id === complaint.id;
              return (
                <div
                  key={complaint.id}
                  onClick={() => setSelected(complaint)}
                  className="p-4 border-b border-gray-100 cursor-pointer transition-colors"
                  style={{
                    borderLeft: `4px solid ${sc?.border || '#E5E7EB'}`,
                    backgroundColor: isSel ? `${SECONDARY}18` : undefined,
                  }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.backgroundColor = '#F9FAFB'; }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono text-xs text-gray-400">{complaint.protocol}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold`}
                      style={{ backgroundColor: sc?.bg, color: sc?.color }}>
                      {sc?.label || complaint.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-sm truncate mb-1">{complaint.title}</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate">{(complaint as any).citizen?.name || '—'}</p>
                    <span className="text-xs font-semibold" style={{ color: pc?.color }}>{pc?.label}</span>
                  </div>
                  {(complaint.neighborhood || complaint.address) && (
                    <p className="text-xs text-gray-400 mt-1 truncate flex items-center gap-1">
                      <MapPin size={10} />
                      {complaint.neighborhood || complaint.address}
                    </p>
                  )}
                  <p className="text-xs text-gray-300 mt-1">
                    {new Date(complaint.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Painel direito */}
          {selected ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header do painel */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs text-gray-400">{selected.protocol}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ backgroundColor: STATUS_CONFIG[selected.status]?.bg, color: STATUS_CONFIG[selected.status]?.color }}>
                        {STATUS_CONFIG[selected.status]?.label}
                      </span>
                      <span className="text-xs font-semibold" style={{ color: PRIORITY_CONFIG[selected.priority]?.color }}>
                        • {PRIORITY_CONFIG[selected.priority]?.label}
                      </span>
                    </div>
                    <h2 className="font-extrabold text-gray-800 truncate">{selected.title}</h2>
                    <p className="text-sm text-gray-500">{(selected as any).citizen?.name}</p>
                  </div>

                  <div className="flex gap-2 ml-4 shrink-0">
                    {selected.status === 'validated' && (
                      <button
                        onClick={() => handleUpdateStatus('in_progress')}
                        disabled={updatingStatus}
                        className="text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                        style={{ backgroundColor: PRIMARY }}
                        onMouseEnter={e => !updatingStatus && (e.currentTarget.style.backgroundColor = '#2d6a4f')}
                        onMouseLeave={e => !updatingStatus && (e.currentTarget.style.backgroundColor = PRIMARY)}
                      >
                        Iniciar Atendimento
                      </button>
                    )}
                    {selected.status === 'in_progress' && !showResolutionForm && (
                      <button
                        onClick={() => setShowResolutionForm(true)}
                        className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        Marcar como Resolvida
                      </button>
                    )}
                  </div>
                </div>

                {showResolutionForm && (
                  <div className="mt-3 p-3 rounded-lg border" style={{ backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }}>
                    <p className="text-sm font-semibold text-green-800 mb-2">Descrição da resolução:</p>
                    <textarea
                      value={resolutionDesc} onChange={e => setResolutionDesc(e.target.value)}
                      placeholder="Descreva como a denúncia foi resolvida..."
                      className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => setShowResolutionForm(false)}
                        className="flex-1 border border-gray-300 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                        Cancelar
                      </button>
                      <button onClick={() => handleUpdateStatus('resolved')} disabled={updatingStatus}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2 rounded-lg disabled:opacity-50 cursor-pointer">
                        {updatingStatus ? 'Salvando...' : 'Confirmar Resolução'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-1 mt-3">
                  <button
                    onClick={() => setActiveTab('details')}
                    className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                    style={{
                      backgroundColor: activeTab === 'details' ? PRIMARY : 'transparent',
                      color: activeTab === 'details' ? '#fff' : '#6B7280',
                    }}
                  >
                    Detalhes
                  </button>
                  <button
                    onClick={() => { setActiveTab('chat'); fetchMessages(selected.id); }}
                    className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                    style={{
                      backgroundColor: activeTab === 'chat' ? ACCENT : 'transparent',
                      color: activeTab === 'chat' ? PRIMARY : '#6B7280',
                    }}
                  >
                    Chat {messages.length > 0 && `(${messages.length})`}
                  </button>
                </div>
              </div>

              {/* Tab: Detalhes */}
              {activeTab === 'details' && (
                <div className="flex-1 overflow-y-auto p-6">
                  {(selected as any).images?.length > 0 && (
                    <div className="mb-5">
                      <p className="text-sm font-bold text-gray-600 mb-2 flex items-center gap-1.5">
                        <ImageIcon size={14} /> Fotos ({(selected as any).images.length})
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {(selected as any).images.map((img: string, i: number) => (
                          <img key={i} src={img} alt={`Foto ${i + 1}`}
                            className="w-32 h-32 object-cover rounded-xl shrink-0 cursor-pointer hover:opacity-90 border border-gray-100"
                            onClick={() => window.open(img, '_blank')} />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="rounded-xl p-3" style={{ backgroundColor: BG }}>
                      <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><User size={10} /> Cidadão</p>
                      <p className="text-sm font-semibold text-gray-800">{(selected as any).citizen?.name || '—'}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ backgroundColor: BG }}>
                      <p className="text-xs text-gray-400 mb-1">Registrada em</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {new Date(selected.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {selected.address && (
                      <div className="col-span-2 rounded-xl p-3" style={{ backgroundColor: BG }}>
                        <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><MapPin size={10} /> Endereço</p>
                        <p className="text-sm font-semibold text-gray-800">{selected.address}</p>
                      </div>
                    )}
                    <div className="rounded-xl p-3" style={{ backgroundColor: BG }}>
                      <p className="text-xs text-gray-400 mb-1">Categoria</p>
                      <p className="text-sm font-semibold text-gray-800">{selected.category}</p>
                    </div>
                    {selected.neighborhood && (
                      <div className="rounded-xl p-3" style={{ backgroundColor: BG }}>
                        <p className="text-xs text-gray-400 mb-1">Bairro</p>
                        <p className="text-sm font-semibold text-gray-800">{selected.neighborhood}</p>
                      </div>
                    )}
                  </div>

                  <div className="mb-5">
                    <p className="text-sm font-bold text-gray-600 mb-2">Descrição</p>
                    <p className="text-sm text-gray-700 p-4 rounded-xl leading-relaxed" style={{ backgroundColor: BG }}>
                      {selected.description}
                    </p>
                  </div>

                  {selected.resolution_description && (
                    <div className="mb-5">
                      <p className="text-sm font-bold text-green-700 mb-2 flex items-center gap-1">
                        <CheckCircle size={13} /> Resolução
                      </p>
                      <p className="text-sm text-gray-700 bg-green-50 p-4 rounded-xl leading-relaxed border border-green-200">
                        {selected.resolution_description}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Chat */}
              {activeTab === 'chat' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <MessageCircle size={36} strokeWidth={1.5} style={{ color: SECONDARY, marginBottom: 10 }} />
                        <p className="text-sm font-medium text-gray-500">Nenhuma mensagem ainda</p>
                        <p className="text-xs mt-1 text-gray-400">Inicie o atendimento enviando uma mensagem</p>
                      </div>
                    ) : messages.map(msg => {
                      const isMe = isProtectorMessage(msg);
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className="max-w-sm px-4 py-3 rounded-2xl"
                            style={isMe ? {
                              backgroundColor: PRIMARY, color: '#fff', borderBottomRightRadius: 4,
                            } : {
                              backgroundColor: '#fff', color: '#1F2937', borderBottomLeftRadius: 4,
                              boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6',
                            }}
                          >
                            <p className="text-xs font-semibold mb-1" style={{ opacity: 0.65 }}>
                              {msg.sender?.name || (isMe ? 'Você' : 'Cidadão')}
                            </p>
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-xs mt-1" style={{ opacity: 0.5 }}>
                              {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {selected.status !== 'resolved' && (
                    <div className="bg-white border-t border-gray-200 p-4 flex gap-3">
                      <input
                        type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={sending || !newMessage.trim()}
                        className="flex items-center justify-center w-12 h-12 rounded-xl text-white transition-colors disabled:opacity-50 cursor-pointer"
                        style={{ backgroundColor: PRIMARY }}
                        onMouseEnter={e => !sending && (e.currentTarget.style.backgroundColor = '#2d6a4f')}
                        onMouseLeave={e => !sending && (e.currentTarget.style.backgroundColor = PRIMARY)}
                      >
                        <Send size={18} strokeWidth={2} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <PawPrint size={48} strokeWidth={1} style={{ color: SECONDARY, margin: '0 auto 12px' }} />
                <p className="text-lg font-bold text-gray-500">Selecione uma denúncia</p>
                <p className="text-sm text-gray-400">para ver detalhes e conversar com o cidadão</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
