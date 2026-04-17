'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Search, Plus, X, Check } from 'lucide-react';
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
  return <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #D1FAE5', borderTopColor: PRIMARY, animation: 'spin 0.85s linear infinite' }} />;
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className="flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 600, color: active ? '#059669' : '#DC2626', backgroundColor: active ? '#ECFDF5' : '#FEF2F2', padding: '4px 10px', borderRadius: 99 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: active ? '#10B981' : '#EF4444', display: 'inline-block' }} />
      {active ? 'Ativo' : 'Inativo'}
    </span>
  );
}

export default function ValidadoresPage() {
  const [users,           setUsers]           = useState<any[]>([]);
  const [cities,          setCities]          = useState<any[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [showForm,        setShowForm]        = useState(false);
  const [editing,         setEditing]         = useState<any | null>(null);
  const [search,          setSearch]          = useState('');
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', whatsapp: '' });

  useEffect(() => { fetchUsers(); fetchCities(); }, []);

  const fetchCities = async () => {
    const res = await api.get('/cities');
    setCities(res.data.cities || []);
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users', { params: { role: 'validator' } });
      setUsers(res.data.users || []);
    } catch {} finally { setLoading(false); }
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', phone: '', whatsapp: '' });
    setSelectedCityIds([]);
    setShowForm(true);
  };

  const openEdit = (user: any) => {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: '', phone: user.phone || '', whatsapp: user.whatsapp || '' });
    setSelectedCityIds(user.validatorCities?.map((c: any) => c.id) || []);
    setShowForm(true);
  };

  const toggleCity = (cityId: string) => {
    setSelectedCityIds(prev => prev.includes(cityId) ? prev.filter(id => id !== cityId) : [...prev, cityId]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { ...form, role: 'validator', city_ids: selectedCityIds };
      if (!payload.password) delete payload.password;
      if (editing) {
        await api.put(`/users/${editing.id}`, payload);
        alert('Validador atualizado!');
      } else {
        await api.post('/users', payload);
        alert('Validador cadastrado!');
      }
      setShowForm(false);
      setEditing(null);
      fetchUsers();
    } catch (error: any) { alert(error.response?.data?.message || 'Erro ao salvar'); }
  };

  const handleToggle = async (id: string, is_active: boolean) => {
    await api.put(`/users/${id}`, { is_active: !is_active });
    fetchUsers();
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const FIELDS = [
    { label: 'Nome *',                                                          key: 'name',     type: 'text',     placeholder: 'Nome completo' },
    { label: 'Email *',                                                         key: 'email',    type: 'email',    placeholder: 'email@causaanimal.com.br' },
    { label: editing ? 'Nova Senha (deixe em branco para manter)' : 'Senha *',  key: 'password', type: 'password', placeholder: '••••••••' },
    { label: 'Telefone',                                                         key: 'phone',    type: 'text',     placeholder: '(11) 99999-9999' },
    { label: 'WhatsApp',                                                         key: 'whatsapp', type: 'text',     placeholder: '11999999999' },
  ];

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: BG }}>
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">

        <header className="shrink-0 bg-white px-8 py-6 flex items-center justify-between" style={{ boxShadow: `0 1px 0 #D1FAE5` }}>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${PRIMARY}, #2d6a4f)` }}>
              <ShieldCheck size={22} style={{ color: ACCENT }} strokeWidth={2} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Validadores</h1>
              <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                {users.length} validador{users.length !== 1 ? 'es' : ''} cadastrado{users.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button onClick={openNew} className="flex items-center gap-2 text-white font-semibold"
            style={{ backgroundColor: PRIMARY, borderRadius: 12, padding: '10px 20px', fontSize: 14, border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2d6a4f')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = PRIMARY)}>
            <Plus size={16} strokeWidth={2.5} /> Novo Validador
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">

          <div className="bg-white flex items-center gap-3" style={{ borderRadius: 16, boxShadow: SHADOW, padding: '12px 16px' }}>
            <Search size={16} style={{ color: '#9CA3AF', flexShrink: 0 }} />
            <input type="text" placeholder="Buscar por nome ou email..." value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-gray-400 text-gray-800" />
          </div>

          {showForm && (
            <div className="bg-white" style={{ borderRadius: 16, boxShadow: SHADOW, borderLeft: `4px solid ${SECONDARY}`, padding: 28 }}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>{editing ? 'Editar Validador' : 'Novo Validador'}</h2>
                  <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 3 }}>Preencha os dados de acesso do validador</p>
                </div>
                <button onClick={() => { setShowForm(false); setEditing(null); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <X size={18} style={{ color: '#9CA3AF' }} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  {FIELDS.map(f => (
                    <div key={f.key}>
                      <label style={LABEL}>{f.label}</label>
                      <input type={f.type} value={(form as any)[f.key]}
                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        placeholder={f.placeholder} className={INPUT}
                        required={f.key !== 'phone' && f.key !== 'whatsapp' && !(editing && f.key === 'password')} />
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: `1px solid ${BG}`, paddingTop: 20 }}>
                  <div className="flex items-center gap-2 mb-3">
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Cidades que este validador pode operar</p>
                    <span style={{ fontSize: 11, fontWeight: 600, backgroundColor: selectedCityIds.length > 0 ? `${SECONDARY}20` : '#F3F4F6', color: selectedCityIds.length > 0 ? PRIMARY : '#9CA3AF', padding: '2px 8px', borderRadius: 99 }}>
                      {selectedCityIds.length} selecionada{selectedCityIds.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={{ border: `1.5px solid #D1FAE5`, borderRadius: 12, padding: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxHeight: 192, overflowY: 'auto' }}>
                    {cities.map(city => {
                      const sel = selectedCityIds.includes(city.id);
                      return (
                        <button key={city.id} type="button" onClick={() => toggleCity(city.id)}
                          className="flex items-center gap-2 text-left truncate"
                          style={{
                            padding: '8px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none',
                            backgroundColor: sel ? PRIMARY : BG,
                            color: sel ? '#fff' : '#6B7280',
                            transition: 'all 0.1s',
                          }}
                          onMouseEnter={e => { if (!sel) e.currentTarget.style.backgroundColor = '#D1FAE5'; }}
                          onMouseLeave={e => { if (!sel) e.currentTarget.style.backgroundColor = BG; }}>
                          {sel
                            ? <Check size={12} strokeWidth={3} style={{ flexShrink: 0 }} />
                            : <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid #D1FAE5', display: 'inline-block', flexShrink: 0 }} />}
                          <span className="truncate">{city.name} — {city.state}</span>
                        </button>
                      );
                    })}
                  </div>
                  {selectedCityIds.length === 0 && (
                    <p style={{ fontSize: 11, color: '#D97706', marginTop: 6 }}>Selecione ao menos uma cidade</p>
                  )}
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                    style={{ padding: '10px 20px', borderRadius: 10, fontSize: 14, border: `1.5px solid #D1FAE5`, background: 'transparent', color: '#6B7280', cursor: 'pointer', fontWeight: 500 }}
                    onMouseEnter={e => (e.currentTarget.style.background = BG)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>Cancelar</button>
                  <button type="submit"
                    style={{ padding: '10px 24px', borderRadius: 10, fontSize: 14, backgroundColor: PRIMARY, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2d6a4f')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = PRIMARY)}>
                    {editing ? 'Salvar Alterações' : 'Cadastrar Validador'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white overflow-hidden" style={{ borderRadius: 16, boxShadow: SHADOW }}>
            <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${BG}` }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${SECONDARY}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={16} style={{ color: PRIMARY }} />
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Validadores cadastrados</h2>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>{filtered.length} {filtered.length === 1 ? 'validador' : 'validadores'}</p>
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: BG }}>
                  {['Nome', 'Email', 'Telefone', 'Cidades', 'Status', 'Ações'].map(h => (
                    <th key={h} className="text-left px-6 py-3" style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid #D1FAE5` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-16">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}><Spinner /><p style={{ fontSize: 13, color: '#9CA3AF' }}>Carregando...</p></div>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-16">
                    <ShieldCheck size={36} style={{ color: '#D1FAE5', margin: '0 auto 12px' }} />
                    <p style={{ fontSize: 13, color: '#9CA3AF' }}>{search ? 'Nenhum validador encontrado.' : 'Nenhum validador cadastrado ainda.'}</p>
                  </td></tr>
                ) : filtered.map((user, i) => (
                  <tr key={user.id}
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BG}` : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = BG)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold"
                          style={{ background: `linear-gradient(135deg, ${PRIMARY}, #2d6a4f)`, color: ACCENT, fontSize: 12 }}>
                          {user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{user.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4"><p style={{ fontSize: 13, color: '#6B7280' }}>{user.email}</p></td>
                    <td className="px-6 py-4"><p style={{ fontSize: 13, color: '#6B7280' }}>{user.phone || '—'}</p></td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.validatorCities?.length > 0
                          ? user.validatorCities.map((c: any) => (
                            <span key={c.id} style={{ fontSize: 11, fontWeight: 600, backgroundColor: `${SECONDARY}20`, color: PRIMARY, padding: '3px 8px', borderRadius: 99 }}>
                              {c.name}
                            </span>
                          ))
                          : <span style={{ fontSize: 13, color: '#9CA3AF' }}>—</span>}
                      </div>
                    </td>
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
