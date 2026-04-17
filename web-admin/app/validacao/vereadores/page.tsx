'use client';

import { useState, useEffect } from 'react';
import {
  Building2, Search, Landmark, User, Mail, Lock,
  Phone, MapPin, Flag, Hash, Plus, X,
} from 'lucide-react';
import Sidebar from '@/components/shared/Sidebar';
import api from '@/lib/api';

/* ─── constants ─────────────────────────────────────────────── */
const FONT = "'Inter', system-ui, -apple-system, sans-serif";

const INPUT =
  'w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-[#02dcfb] focus:border-transparent ' +
  'placeholder:text-gray-400 text-gray-800';

const LABEL = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5';

/* ─── helper: section title ─────────────────────────────────── */
function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: 'rgba(2,220,251,0.12)' }}
      >
        <Icon size={14} style={{ color: '#02DCFB' }} strokeWidth={2.5} />
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: FONT }}>{label}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function VereadoresPage() {
  const [councilmen, setCouncilmen] = useState<any[]>([]);
  const [cities, setCities]         = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [editing, setEditing]       = useState<any | null>(null);

  const blankForm = () => ({
    name: '', email: '', password: '', whatsapp: '',
    city_id: cities[0]?.id || '',
    party: '', councilman_number: '',
  });

  const [form, setForm] = useState({
    name: '', email: '', password: '', whatsapp: '',
    city_id: '',
    party: '', councilman_number: '',
  });

  useEffect(() => { fetchCities(); fetchCouncilmen(); }, []);

  const fetchCities = async () => {
    try {
      const res = await api.get('/cities');
      const camara = (res.data.cities || []).filter((c: any) => c.city_type === 'camara');
      setCities(camara);
      if (camara.length > 0)
        setForm(f => ({ ...f, city_id: camara[0].id }));
    } catch {}
  };

  const fetchCouncilmen = async () => {
    try {
      const res = await api.get('/users?role=councilman');
      setCouncilmen(res.data.users || []);
    } catch {}
    finally { setLoading(false); }
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', whatsapp: '', city_id: cities[0]?.id || '', party: '', councilman_number: '' });
    setShowForm(true);
    setTimeout(() => document.getElementById('field-name')?.focus(), 80);
  };

  const openEdit = (u: any) => {
    setEditing(u);
    setForm({
      name: u.name,
      email: u.email,
      password: '',
      whatsapp: u.whatsapp || '',
      city_id: u.city_id || cities[0]?.id || '',
      party: u.party || '',
      councilman_number: u.councilman_number || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const payload: any = {
          name: form.name,
          whatsapp: form.whatsapp,
          city_id: form.city_id,
          party: form.party,
          councilman_number: form.councilman_number,
        };
        if (form.password) payload.password = form.password;
        await api.put(`/users/${editing.id}`, payload);
        alert('✅ Vereador atualizado!');
      } else {
        await api.post('/users', {
          name: form.name,
          email: form.email,
          password: form.password,
          whatsapp: form.whatsapp,
          phone: form.whatsapp || '00000000000',
          role: 'councilman',
          city_id: form.city_id,
          party: form.party,
          councilman_number: form.councilman_number,
        });
        alert('✅ Vereador cadastrado com sucesso!');
      }
      setShowForm(false);
      setEditing(null);
      fetchCouncilmen();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao salvar vereador');
    } finally {
      setSaving(false);
    }
  };

  const filtered = councilmen.filter(u => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.party || '').toLowerCase().includes(search.toLowerCase());
    const matchCity = filterCity === '' || u.city_id === filterCity || u.city?.id === filterCity;
    return matchSearch && matchCity;
  });

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F1F5F9', fontFamily: FONT }}>
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* ══ HEADER ══════════════════════════════════════════════ */}
        <header
          className="shrink-0 bg-white px-8 py-6 flex items-center justify-between"
          style={{ boxShadow: '0 1px 0 #E2E8F0', fontFamily: FONT }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #012235, #023a5c)' }}
            >
              <Landmark size={22} style={{ color: '#02DCFB' }} strokeWidth={2} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1.2, fontFamily: FONT }}>
                Vereadores
              </h1>
              <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2, fontFamily: FONT }}>
                Cadastro de vereadores por cidade
              </p>
            </div>
          </div>

          <button
            onClick={openNew}
            className="flex items-center gap-2 text-white font-semibold transition-all"
            style={{
              backgroundColor: '#012235',
              borderRadius: 12,
              padding: '10px 20px',
              fontSize: 14,
              fontFamily: FONT,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(1,34,53,0.25)',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#023a5c')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#012235')}
          >
            <Plus size={16} strokeWidth={2.5} />
            Novo Vereador
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">

          {/* ══ BUSCA ═══════════════════════════════════════════ */}
          <div
            className="bg-white flex items-center gap-3 px-4"
            style={{ borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)', padding: '12px 16px' }}
          >
            <Search size={16} style={{ color: '#9CA3AF', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Buscar por nome, email ou partido..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-gray-400 text-gray-800"
              style={{ fontFamily: FONT }}
            />
          </div>

          {/* ══ FORMULÁRIO ══════════════════════════════════════ */}
          {showForm && (
            <div
              className="bg-white"
              style={{
                borderRadius: 16,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
                borderLeft: '4px solid #02dcfb',
                padding: 28,
                fontFamily: FONT,
              }}
            >
              {/* Form header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', fontFamily: FONT }}>
                    {editing ? 'Editar Vereador' : 'Novo Vereador'}
                  </h2>
                  <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 3, fontFamily: FONT }}>
                    {editing
                      ? 'Deixe a senha em branco para manter a atual.'
                      : 'Preencha os dados para criar o acesso do vereador.'}
                  </p>
                </div>
                <button
                  onClick={() => { setShowForm(false); setEditing(null); }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}
                >
                  <X size={18} style={{ color: '#9CA3AF' }} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* — Dados pessoais — */}
                <div>
                  <SectionTitle icon={User} label="Dados Pessoais" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL}>Nome completo *</label>
                      <input
                        id="field-name"
                        type="text"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="Nome completo do vereador"
                        className={INPUT}
                        required
                      />
                    </div>
                    <div>
                      <label className={LABEL}>WhatsApp</label>
                      <input
                        type="text"
                        value={form.whatsapp}
                        onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                        placeholder="11999999999"
                        className={INPUT}
                      />
                    </div>
                  </div>
                </div>

                {/* — Acesso — */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 20 }}>
                  <SectionTitle icon={Lock} label="Acesso ao Sistema" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL}>Email *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        placeholder="vereador@camara.gov.br"
                        className={INPUT}
                        required={!editing}
                        disabled={!!editing}
                        style={editing ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                      />
                    </div>
                    <div>
                      <label className={LABEL}>{editing ? 'Nova Senha (opcional)' : 'Senha *'}</label>
                      <input
                        type="password"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        placeholder={editing ? 'Deixe em branco para manter' : 'Mínimo 6 caracteres'}
                        className={INPUT}
                        required={!editing}
                      />
                    </div>
                  </div>
                </div>

                {/* — Dados políticos — */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 20 }}>
                  <SectionTitle icon={Flag} label="Dados Políticos" />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={LABEL}>Cidade (câmara) *</label>
                      <select
                        value={form.city_id}
                        onChange={e => setForm({ ...form, city_id: e.target.value })}
                        className={INPUT}
                        required
                        style={{ fontFamily: FONT }}
                      >
                        {cities.length === 0 && (
                          <option value="">Nenhuma cidade com câmara</option>
                        )}
                        {cities.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} — {c.state}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={LABEL}>Partido político</label>
                      <input
                        type="text"
                        value={form.party}
                        onChange={e => setForm({ ...form, party: e.target.value })}
                        placeholder="Ex: PT, PSD, MDB"
                        className={INPUT}
                      />
                    </div>
                    <div>
                      <label className={LABEL}>Número eleitoral</label>
                      <input
                        type="text"
                        value={form.councilman_number}
                        onChange={e => setForm({ ...form, councilman_number: e.target.value })}
                        placeholder="Ex: 15, 20"
                        className={INPUT}
                      />
                    </div>
                  </div>
                </div>

                {/* — Botões — */}
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditing(null); }}
                    style={{
                      padding: '10px 20px', borderRadius: 10, fontSize: 14, fontFamily: FONT,
                      border: '1.5px solid #E5E7EB', background: 'transparent',
                      color: '#6B7280', cursor: 'pointer', fontWeight: 500,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: '10px 24px', borderRadius: 10, fontSize: 14, fontFamily: FONT,
                      backgroundColor: saving ? '#6B7280' : '#012235',
                      color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                    }}
                    onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = '#023a5c'; }}
                    onMouseLeave={e => { if (!saving) e.currentTarget.style.backgroundColor = '#012235'; }}
                  >
                    {saving ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Cadastrar Vereador'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ══ FILTRO CIDADE ═══════════════════════════════════ */}
          <div className="bg-white flex items-center gap-4" style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: '12px 16px' }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: FONT, whiteSpace: 'nowrap', flexShrink: 0 }}>
              Filtrar por cidade
            </label>
            <select
              value={filterCity}
              onChange={e => setFilterCity(e.target.value)}
              style={{ border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '8px 12px', fontSize: 13, fontFamily: FONT, color: '#374151', background: '#fff', outline: 'none', cursor: 'pointer', minWidth: 220 }}
            >
              <option value="">Todas as cidades</option>
              {cities.map(c => (
                <option key={c.id} value={c.id}>{c.name} — {c.state}</option>
              ))}
            </select>
          </div>

          {/* ══ TABELA ══════════════════════════════════════════ */}
          <div
            className="bg-white overflow-hidden"
            style={{
              borderRadius: 16,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
              fontFamily: FONT,
            }}
          >
            {/* Table header */}
            <div
              className="px-6 py-4 flex items-center gap-3"
              style={{ borderBottom: '1px solid #F1F5F9' }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Landmark size={16} style={{ color: '#3B82F6' }} />
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', fontFamily: FONT }}>
                  Vereadores cadastrados
                </h2>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1, fontFamily: FONT }}>
                  {filtered.length} {filtered.length === 1 ? 'vereador' : 'vereadores'}
                </p>
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC' }}>
                  {['Nome', 'Email', 'WhatsApp', 'Cidade', 'Partido', 'Nº', 'Status', 'Ações'].map(h => (
                    <th
                      key={h}
                      className="text-left px-6 py-3"
                      style={{
                        fontSize: 11, fontWeight: 700, color: '#6B7280',
                        textTransform: 'uppercase', letterSpacing: '0.07em',
                        fontFamily: FONT, borderBottom: '1px solid #E5E7EB',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          border: '3px solid #E2E8F0', borderTopColor: '#012235',
                          animation: 'spin 0.85s linear infinite',
                        }} />
                        <p style={{ fontSize: 13, color: '#9CA3AF', fontFamily: FONT }}>Carregando...</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <Landmark size={36} style={{ color: '#E2E8F0', margin: '0 auto 12px' }} />
                      <p style={{ fontSize: 13, color: '#9CA3AF', fontFamily: FONT }}>
                        {search ? 'Nenhum vereador encontrado para esta busca.' : 'Nenhum vereador cadastrado ainda.'}
                      </p>
                    </td>
                  </tr>
                ) : filtered.map((u, i) => (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: i < filtered.length - 1 ? '1px solid #F1F5F9' : 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Nome */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold"
                          style={{ background: 'linear-gradient(135deg, #012235, #023a5c)', color: '#02DCFB', fontSize: 12, fontFamily: FONT }}
                        >
                          {u.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', fontFamily: FONT }}>{u.name}</p>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4">
                      <p style={{ fontSize: 13, color: '#6B7280', fontFamily: FONT }}>{u.email}</p>
                    </td>

                    {/* WhatsApp */}
                    <td className="px-6 py-4">
                      <p style={{ fontSize: 13, color: '#6B7280', fontFamily: FONT }}>{u.whatsapp || '—'}</p>
                    </td>

                    {/* Cidade */}
                    <td className="px-6 py-4">
                      <p style={{ fontSize: 13, color: '#374151', fontFamily: FONT, fontWeight: 500 }}>
                        {u.city?.name || '—'}
                      </p>
                    </td>

                    {/* Partido */}
                    <td className="px-6 py-4">
                      {u.party ? (
                        <span style={{
                          fontSize: 12, fontWeight: 700, color: '#374151',
                          backgroundColor: '#F3F4F6', padding: '3px 10px',
                          borderRadius: 99, fontFamily: FONT,
                        }}>
                          {u.party}
                        </span>
                      ) : (
                        <span style={{ color: '#D1D5DB', fontSize: 13 }}>—</span>
                      )}
                    </td>

                    {/* Número */}
                    <td className="px-6 py-4">
                      <p style={{ fontSize: 13, color: '#6B7280', fontFamily: FONT }}>{u.councilman_number || '—'}</p>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className="flex items-center gap-1.5 w-fit"
                        style={{
                          fontSize: 12, fontWeight: 600,
                          color: u.is_active ? '#059669' : '#DC2626',
                          backgroundColor: u.is_active ? '#ECFDF5' : '#FEF2F2',
                          padding: '4px 10px', borderRadius: 99, fontFamily: FONT,
                        }}
                      >
                        <span
                          style={{
                            width: 6, height: 6, borderRadius: '50%',
                            backgroundColor: u.is_active ? '#10B981' : '#EF4444',
                            display: 'inline-block',
                          }}
                        />
                        {u.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openEdit(u)}
                        style={{
                          fontSize: 12, fontWeight: 600, fontFamily: FONT,
                          backgroundColor: '#EFF6FF', color: '#3B82F6',
                          padding: '5px 12px', borderRadius: 8,
                          border: 'none', cursor: 'pointer',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#DBEAFE')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#EFF6FF')}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
