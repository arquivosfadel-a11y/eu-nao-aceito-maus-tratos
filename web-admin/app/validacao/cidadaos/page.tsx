'use client';

import { useState, useEffect } from 'react';
import { Users, Search, X } from 'lucide-react';
import Sidebar from '@/components/shared/Sidebar';
import api from '@/lib/api';

const PRIMARY   = '#1B4332';
const SECONDARY = '#52B788';
const ACCENT    = '#F4A261';
const BG        = '#F0F7F4';
const SHADOW    = '0 1px 6px rgba(0,0,0,0.06)';
const INPUT     =
  'w-full border border-[#D1FAE5] rounded-[10px] px-3 py-2.5 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-[#52B788] focus:border-transparent ' +
  'placeholder:text-gray-400 text-gray-800';
const LABEL = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF',
  textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 6,
};

function Spinner() {
  return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #D1FAE5', borderTopColor: PRIMARY, animation: 'spin 0.85s linear infinite' }} />
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className="flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 600, color: active ? '#059669' : '#DC2626', backgroundColor: active ? '#ECFDF5' : '#FEF2F2', padding: '4px 10px', borderRadius: 99 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: active ? '#10B981' : '#EF4444', display: 'inline-block' }} />
      {active ? 'Ativo' : 'Inativo'}
    </span>
  );
}

export default function CidadaosPage() {
  const [users,      setUsers]      = useState<any[]>([]);
  const [cities,     setCities]     = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [editing,    setEditing]    = useState<any | null>(null);
  const [showForm,   setShowForm]   = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', city_id: '' });

  useEffect(() => { fetchCities(); fetchUsers(); }, []);

  const fetchCities = async () => {
    const res = await api.get('/cities');
    setCities(res.data.cities || []);
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users', { params: { role: 'citizen' } });
      setUsers(res.data.users || []);
    } catch {} finally { setLoading(false); }
  };

  const openEdit = (user: any) => {
    setEditing(user);
    setForm({ name: user.name, email: user.email, phone: user.phone || '', city_id: user.city_id || '' });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/users/${editing.id}`, form);
      alert('Cidadão atualizado!');
      setShowForm(false);
      setEditing(null);
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

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: BG }}>
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">

        <header className="shrink-0 bg-white px-8 py-6 flex items-center justify-between" style={{ boxShadow: `0 1px 0 #D1FAE5` }}>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${PRIMARY}, #2d6a4f)` }}>
              <Users size={22} style={{ color: ACCENT }} strokeWidth={2} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Cidadãos</h1>
              <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                {users.length} cidadão{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">

          <div className="bg-white flex items-center gap-3" style={{ borderRadius: 16, boxShadow: SHADOW, padding: '12px 16px' }}>
            <Search size={16} style={{ color: '#9CA3AF', flexShrink: 0 }} />
            <input type="text" placeholder="Buscar por nome ou email..." value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-gray-400 text-gray-800" />
            <select value={filterCity} onChange={e => setFilterCity(e.target.value)}
              style={{ border: `1.5px solid #D1FAE5`, borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#374151', background: '#fff', outline: 'none', cursor: 'pointer', flexShrink: 0 }}>
              <option value="">Todas as cidades</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name} — {c.state}</option>)}
            </select>
          </div>

          {showForm && editing && (
            <div className="bg-white" style={{ borderRadius: 16, boxShadow: SHADOW, borderLeft: `4px solid ${SECONDARY}`, padding: 28 }}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>Editar Cidadão</h2>
                  <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 3 }}>Atualize os dados do cidadão</p>
                </div>
                <button onClick={() => { setShowForm(false); setEditing(null); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <X size={18} style={{ color: '#9CA3AF' }} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label style={LABEL}>Nome *</label>
                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={INPUT} required />
                  </div>
                  <div>
                    <label style={LABEL}>Email *</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={INPUT} required />
                  </div>
                  <div>
                    <label style={LABEL}>Telefone</label>
                    <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={INPUT} />
                  </div>
                  <div>
                    <label style={LABEL}>Cidade</label>
                    <select value={form.city_id} onChange={e => setForm({ ...form, city_id: e.target.value })} className={INPUT}>
                      <option value="">Selecione...</option>
                      {cities.map(c => <option key={c.id} value={c.id}>{c.name} — {c.state}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                    style={{ padding: '10px 20px', borderRadius: 10, fontSize: 14, border: `1.5px solid #D1FAE5`, background: 'transparent', color: '#6B7280', cursor: 'pointer', fontWeight: 500 }}
                    onMouseEnter={e => (e.currentTarget.style.background = BG)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>Cancelar</button>
                  <button type="submit"
                    style={{ padding: '10px 24px', borderRadius: 10, fontSize: 14, backgroundColor: PRIMARY, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2d6a4f')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = PRIMARY)}>Salvar Alterações</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white overflow-hidden" style={{ borderRadius: 16, boxShadow: SHADOW }}>
            <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${BG}` }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${SECONDARY}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={16} style={{ color: PRIMARY }} />
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Cidadãos cadastrados</h2>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>{filtered.length} {filtered.length === 1 ? 'cidadão' : 'cidadãos'}</p>
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: BG }}>
                  {['Nome', 'Email', 'Telefone', 'Cidade', 'Cadastro', 'Status', 'Ações'].map(h => (
                    <th key={h} className="text-left px-6 py-3" style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid #D1FAE5` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-16">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}><Spinner /><p style={{ fontSize: 13, color: '#9CA3AF' }}>Carregando...</p></div>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-16">
                    <Users size={36} style={{ color: '#D1FAE5', margin: '0 auto 12px' }} />
                    <p style={{ fontSize: 13, color: '#9CA3AF' }}>{search ? 'Nenhum cidadão encontrado.' : 'Nenhum cidadão cadastrado ainda.'}</p>
                  </td></tr>
                ) : filtered.map((user, i) => (
                  <tr key={user.id}
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BG}` : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = BG)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold"
                          style={{ background: `linear-gradient(135deg, ${SECONDARY}, #2d9e6e)`, color: '#fff', fontSize: 12 }}>
                          {user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{user.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4"><p style={{ fontSize: 13, color: '#6B7280' }}>{user.email}</p></td>
                    <td className="px-6 py-4"><p style={{ fontSize: 13, color: '#6B7280' }}>{user.phone || '—'}</p></td>
                    <td className="px-6 py-4"><p style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{user.city?.name || '—'}</p></td>
                    <td className="px-6 py-4"><p style={{ fontSize: 12, color: '#9CA3AF' }}>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</p></td>
                    <td className="px-6 py-4"><StatusDot active={user.is_active} /></td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(user)}
                          style={{ fontSize: 12, fontWeight: 600, backgroundColor: `${SECONDARY}20`, color: PRIMARY, padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = `${SECONDARY}35`)}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = `${SECONDARY}20`)}>Editar</button>
                        <button onClick={() => handleToggle(user.id, user.is_active)}
                          style={{ fontSize: 12, fontWeight: 600, backgroundColor: user.is_active ? '#FEF2F2' : '#ECFDF5', color: user.is_active ? '#DC2626' : '#059669', padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
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
