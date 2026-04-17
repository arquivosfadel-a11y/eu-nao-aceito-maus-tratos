'use client';

import { useState, useEffect } from 'react';
import { UserCog, Search, Plus, X } from 'lucide-react';
import Sidebar from '@/components/shared/Sidebar';
import api from '@/lib/api';

/* ─── constants ─────────────────────────────────────────────── */
const FONT   = "'Inter', system-ui, -apple-system, sans-serif";
const SHADOW = '0 1px 6px rgba(0,0,0,0.06)';
const INPUT  =
  'w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-[#02dcfb] focus:border-transparent ' +
  'placeholder:text-gray-400 text-gray-800';
const LABEL = { display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 6, fontFamily: FONT };

function Spinner() {
  return <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #E2E8F0', borderTopColor: '#012235', animation: 'spin 0.85s linear infinite' }} />;
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className="flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 600, fontFamily: FONT, color: active ? '#059669' : '#DC2626', backgroundColor: active ? '#ECFDF5' : '#FEF2F2', padding: '4px 10px', borderRadius: 99 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: active ? '#10B981' : '#EF4444', display: 'inline-block' }} />
      {active ? 'Ativo' : 'Inativo'}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function PrefeitosPage() {
  const [users,      setUsers]      = useState<any[]>([]);
  const [cities,     setCities]     = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState<any | null>(null);
  const [search,     setSearch]     = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', whatsapp: '', city_id: '' });

  useEffect(() => { fetchCities(); fetchUsers(); }, []);

  const fetchCities = async () => {
    const res = await api.get('/cities');
    setCities(res.data.cities || []);
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users', { params: { role: 'mayor' } });
      setUsers(res.data.users || []);
    } catch {} finally { setLoading(false); }
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', phone: '', whatsapp: '', city_id: '' });
    setShowForm(true);
  };

  const openEdit = (user: any) => {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: '', phone: user.phone || '', whatsapp: user.whatsapp || '', city_id: user.city_id || '' });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        const payload: any = { ...form, role: 'mayor' };
        if (!payload.password) delete payload.password;
        await api.put(`/users/${editing.id}`, payload);
        alert('Prefeito atualizado!');
      } else {
        await api.post('/users', { ...form, role: 'mayor' });
        alert('Prefeito cadastrado!');
      }
      setShowForm(false);
      fetchUsers();
    } catch (error: any) { alert(error.response?.data?.message || 'Erro ao salvar'); }
  };

  const handleToggle = async (id: string, is_active: boolean) => {
    await api.put(`/users/${id}`, { is_active: !is_active });
    fetchUsers();
  };

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchCity   = filterCity ? u.city_id === filterCity : true;
    return matchSearch && matchCity;
  });

  const FIELDS = [
    { label: 'Nome *',                                                        key: 'name',     type: 'text',     placeholder: 'Nome completo' },
    { label: 'Email *',                                                       key: 'email',    type: 'email',    placeholder: 'email@prefeitura.gov.br' },
    { label: editing ? 'Nova Senha (deixe em branco para manter)' : 'Senha *', key: 'password', type: 'password', placeholder: '••••••••' },
    { label: 'Telefone',                                                       key: 'phone',    type: 'text',     placeholder: '(11) 99999-9999' },
    { label: 'WhatsApp',                                                       key: 'whatsapp', type: 'text',     placeholder: '11999999999' },
  ];

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F1F5F9', fontFamily: FONT }}>
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* HEADER */}
        <header className="shrink-0 bg-white px-8 py-6 flex items-center justify-between" style={{ boxShadow: '0 1px 0 #E2E8F0' }}>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #012235, #023a5c)' }}>
              <UserCog size={22} style={{ color: '#02DCFB' }} strokeWidth={2} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1.2, fontFamily: FONT }}>Prefeitos</h1>
              <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2, fontFamily: FONT }}>
                {users.length} prefeito{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button onClick={openNew} className="flex items-center gap-2 text-white font-semibold"
            style={{ backgroundColor: '#012235', borderRadius: 12, padding: '10px 20px', fontSize: 14, fontFamily: FONT, border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#023a5c')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#012235')}>
            <Plus size={16} strokeWidth={2.5} /> Novo Prefeito
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">

          {/* FILTROS */}
          <div className="bg-white flex items-center gap-3" style={{ borderRadius: 16, boxShadow: SHADOW, padding: '12px 16px' }}>
            <Search size={16} style={{ color: '#9CA3AF', flexShrink: 0 }} />
            <input type="text" placeholder="Buscar por nome ou email..." value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-gray-400 text-gray-800" style={{ fontFamily: FONT }} />
            <select value={filterCity} onChange={e => setFilterCity(e.target.value)}
              style={{ border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '8px 12px', fontSize: 13, fontFamily: FONT, color: '#374151', background: '#fff', outline: 'none', cursor: 'pointer', flexShrink: 0 }}>
              <option value="">Todas as cidades</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name} — {c.state}</option>)}
            </select>
          </div>

          {/* FORMULÁRIO */}
          {showForm && (
            <div className="bg-white" style={{ borderRadius: 16, boxShadow: SHADOW, borderLeft: '4px solid #02dcfb', padding: 28 }}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', fontFamily: FONT }}>{editing ? 'Editar Prefeito' : 'Novo Prefeito'}</h2>
                  <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 3, fontFamily: FONT }}>Preencha os dados de acesso do prefeito</p>
                </div>
                <button onClick={() => { setShowForm(false); setEditing(null); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <X size={18} style={{ color: '#9CA3AF' }} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {FIELDS.map(f => (
                    <div key={f.key}>
                      <label style={LABEL}>{f.label}</label>
                      <input type={f.type} value={(form as any)[f.key]}
                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        placeholder={f.placeholder} className={INPUT}
                        required={f.key !== 'phone' && f.key !== 'whatsapp' && !(editing && f.key === 'password')} />
                    </div>
                  ))}
                  <div>
                    <label style={LABEL}>Cidade *</label>
                    <select value={form.city_id} onChange={e => setForm({ ...form, city_id: e.target.value })} className={INPUT} required style={{ fontFamily: FONT }}>
                      <option value="">Selecione a cidade...</option>
                      {cities.map(c => <option key={c.id} value={c.id}>{c.name} — {c.state}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                    style={{ padding: '10px 20px', borderRadius: 10, fontSize: 14, fontFamily: FONT, border: '1.5px solid #E5E7EB', background: 'transparent', color: '#6B7280', cursor: 'pointer', fontWeight: 500 }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>Cancelar</button>
                  <button type="submit"
                    style={{ padding: '10px 24px', borderRadius: 10, fontSize: 14, fontFamily: FONT, backgroundColor: '#012235', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#023a5c')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#012235')}>
                    {editing ? 'Salvar Alterações' : 'Cadastrar Prefeito'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TABELA */}
          <div className="bg-white overflow-hidden" style={{ borderRadius: 16, boxShadow: SHADOW }}>
            <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCog size={16} style={{ color: '#3B82F6' }} />
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', fontFamily: FONT }}>Prefeitos cadastrados</h2>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1, fontFamily: FONT }}>{filtered.length} {filtered.length === 1 ? 'prefeito' : 'prefeitos'}</p>
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC' }}>
                  {['Nome', 'Email', 'Telefone', 'Cidade', 'Status', 'Ações'].map(h => (
                    <th key={h} className="text-left px-6 py-3" style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: FONT, borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-16">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}><Spinner /><p style={{ fontSize: 13, color: '#9CA3AF', fontFamily: FONT }}>Carregando...</p></div>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-16">
                    <UserCog size={36} style={{ color: '#E2E8F0', margin: '0 auto 12px' }} />
                    <p style={{ fontSize: 13, color: '#9CA3AF', fontFamily: FONT }}>{search ? 'Nenhum prefeito encontrado.' : 'Nenhum prefeito cadastrado ainda.'}</p>
                  </td></tr>
                ) : filtered.map((user, i) => (
                  <tr key={user.id}
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F1F5F9' : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold"
                          style={{ background: 'linear-gradient(135deg, #012235, #023a5c)', color: '#02DCFB', fontSize: 12, fontFamily: FONT }}>
                          {user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', fontFamily: FONT }}>{user.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4"><p style={{ fontSize: 13, color: '#6B7280', fontFamily: FONT }}>{user.email}</p></td>
                    <td className="px-6 py-4"><p style={{ fontSize: 13, color: '#6B7280', fontFamily: FONT }}>{user.phone || '—'}</p></td>
                    <td className="px-6 py-4"><p style={{ fontSize: 13, color: '#374151', fontWeight: 500, fontFamily: FONT }}>{user.city?.name || '—'}</p></td>
                    <td className="px-6 py-4"><StatusDot active={user.is_active} /></td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(user)}
                          style={{ fontSize: 12, fontWeight: 600, fontFamily: FONT, backgroundColor: '#EFF6FF', color: '#3B82F6', padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#DBEAFE')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#EFF6FF')}>Editar</button>
                        <button onClick={() => handleToggle(user.id, user.is_active)}
                          style={{ fontSize: 12, fontWeight: 600, fontFamily: FONT, backgroundColor: user.is_active ? '#FEF2F2' : '#ECFDF5', color: user.is_active ? '#DC2626' : '#059669', padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = user.is_active ? '#FECACA' : '#A7F3D0')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = user.is_active ? '#FEF2F2' : '#ECFDF5')}>
                          {user.is_active ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
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
