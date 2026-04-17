'use client';

import { useState, useEffect } from 'react';
import { Building2, Search, Plus, X } from 'lucide-react';
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
      {active ? 'Ativa' : 'Inativa'}
    </span>
  );
}

export default function SecretariasPage() {
  const [departments,  setDepartments]  = useState<any[]>([]);
  const [cities,       setCities]       = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [editing,      setEditing]      = useState<any | null>(null);
  const [selectedCity, setSelectedCity] = useState('');
  const [search,       setSearch]       = useState('');
  const [form, setForm] = useState({
    name: '', description: '',
    responsible_name: '', responsible_email: '', responsible_whatsapp: '', responsible_password: '',
  });

  useEffect(() => { fetchCities(); }, []);
  useEffect(() => { if (selectedCity) fetchDepartments(selectedCity); }, [selectedCity]);

  const fetchCities = async () => {
    try {
      const res = await api.get('/cities');
      setCities(res.data.cities || []);
      if (res.data.cities?.length > 0) setSelectedCity(res.data.cities[0].id);
    } catch {} finally { setLoading(false); }
  };

  const fetchDepartments = async (city_id: string) => {
    try {
      const res = await api.get(`/cities/${city_id}/departments`);
      setDepartments(res.data.departments || []);
    } catch {}
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', description: '', responsible_name: '', responsible_email: '', responsible_whatsapp: '', responsible_password: '' });
    setShowForm(true);
  };

  const openEdit = (dept: any) => {
    setEditing(dept);
    setForm({ name: dept.name, description: dept.description || '', responsible_name: dept.responsible_name || '', responsible_email: dept.responsible_email || '', responsible_whatsapp: dept.responsible_whatsapp || '', responsible_password: '' });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/departments/${editing.id}`, { ...form, city_id: selectedCity });
        alert('Departamento atualizado!');
      } else {
        await api.post('/departments', { ...form, city_id: selectedCity });
        alert('Departamento cadastrado!');
      }
      setShowForm(false);
      fetchDepartments(selectedCity);
    } catch (err: any) { alert(err.response?.data?.message || 'Erro ao salvar'); }
  };

  const filtered = departments.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.responsible_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: BG }}>
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">

        <header className="shrink-0 bg-white px-8 py-6 flex items-center justify-between" style={{ boxShadow: `0 1px 0 #D1FAE5` }}>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${PRIMARY}, #2d6a4f)` }}>
              <Building2 size={22} style={{ color: ACCENT }} strokeWidth={2} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Departamentos</h1>
              <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>Gerencie os departamentos por cidade</p>
            </div>
          </div>
          <button onClick={openNew} className="flex items-center gap-2 text-white font-semibold"
            style={{ backgroundColor: PRIMARY, borderRadius: 12, padding: '10px 20px', fontSize: 14, border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2d6a4f')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = PRIMARY)}>
            <Plus size={16} strokeWidth={2.5} /> Novo Departamento
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">

          <div className="bg-white flex items-center gap-3" style={{ borderRadius: 16, boxShadow: SHADOW, padding: '12px 16px' }}>
            <select value={selectedCity} onChange={e => { setSelectedCity(e.target.value); setSearch(''); }}
              style={{ border: `1.5px solid #D1FAE5`, borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#374151', background: '#fff', outline: 'none', cursor: 'pointer', flexShrink: 0 }}>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name} — {c.state}</option>)}
            </select>
            <Search size={16} style={{ color: '#9CA3AF', flexShrink: 0 }} />
            <input type="text" placeholder="Buscar por nome ou responsável..." value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-gray-400 text-gray-800" />
          </div>

          {showForm && (
            <div className="bg-white" style={{ borderRadius: 16, boxShadow: SHADOW, borderLeft: `4px solid ${SECONDARY}`, padding: 28 }}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>{editing ? 'Editar Departamento' : 'Novo Departamento'}</h2>
                  <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 3 }}>
                    {editing ? 'Deixe a senha em branco para manter a senha atual.' : 'Os dados de acesso serão usados para o responsável fazer login.'}
                  </p>
                </div>
                <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <X size={18} style={{ color: '#9CA3AF' }} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={LABEL}>Nome do Departamento *</label>
                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Ex: Proteção Animal" className={INPUT} required />
                  </div>
                  <div>
                    <label style={LABEL}>Nome do Responsável</label>
                    <input type="text" value={form.responsible_name} onChange={e => setForm({ ...form, responsible_name: e.target.value })}
                      placeholder="Nome completo do responsável" className={INPUT} />
                  </div>
                  <div className="col-span-2">
                    <label style={LABEL}>Descrição</label>
                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Descreva as responsabilidades deste departamento..."
                      className={INPUT} rows={2} style={{ resize: 'none' }} />
                  </div>
                </div>

                <div style={{ borderTop: `1px solid ${BG}`, paddingTop: 20 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 }}>Acesso do Responsável</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label style={LABEL}>Email de Login *</label>
                      <input type="email" value={form.responsible_email} onChange={e => setForm({ ...form, responsible_email: e.target.value })}
                        placeholder="responsavel@causaanimal.com.br" className={INPUT} required={!editing} />
                    </div>
                    <div>
                      <label style={LABEL}>{editing ? 'Nova Senha (opcional)' : 'Senha *'}</label>
                      <input type="password" value={form.responsible_password} onChange={e => setForm({ ...form, responsible_password: e.target.value })}
                        placeholder={editing ? 'Deixe em branco para manter' : 'Mínimo 6 caracteres'} className={INPUT} required={!editing} />
                    </div>
                    <div>
                      <label style={LABEL}>WhatsApp</label>
                      <input type="text" value={form.responsible_whatsapp} onChange={e => setForm({ ...form, responsible_whatsapp: e.target.value })}
                        placeholder="11999999999" className={INPUT} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    style={{ padding: '10px 20px', borderRadius: 10, fontSize: 14, border: `1.5px solid #D1FAE5`, background: 'transparent', color: '#6B7280', cursor: 'pointer', fontWeight: 500 }}
                    onMouseEnter={e => (e.currentTarget.style.background = BG)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>Cancelar</button>
                  <button type="submit"
                    style={{ padding: '10px 24px', borderRadius: 10, fontSize: 14, backgroundColor: PRIMARY, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2d6a4f')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = PRIMARY)}>
                    {editing ? 'Salvar Alterações' : 'Cadastrar Departamento'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white overflow-hidden" style={{ borderRadius: 16, boxShadow: SHADOW }}>
            <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${BG}` }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${SECONDARY}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={16} style={{ color: PRIMARY }} />
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Departamentos cadastrados</h2>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>{filtered.length} {filtered.length === 1 ? 'departamento' : 'departamentos'}</p>
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: BG }}>
                  {['Departamento', 'Responsável', 'Email / WhatsApp', 'Denúncias', 'Resolvidas', 'Ações'].map(h => (
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
                    <Building2 size={36} style={{ color: '#D1FAE5', margin: '0 auto 12px' }} />
                    <p style={{ fontSize: 13, color: '#9CA3AF' }}>{search ? 'Nenhum departamento encontrado.' : 'Nenhum departamento cadastrado ainda.'}</p>
                  </td></tr>
                ) : filtered.map((dept, i) => (
                  <tr key={dept.id}
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BG}` : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = BG)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td className="px-6 py-4">
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{dept.name}</p>
                      {dept.description && <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{dept.description}</p>}
                    </td>
                    <td className="px-6 py-4"><p style={{ fontSize: 13, color: '#374151' }}>{dept.responsible_name || '—'}</p></td>
                    <td className="px-6 py-4">
                      <p style={{ fontSize: 13, color: '#6B7280' }}>{dept.responsible_email || '—'}</p>
                      <p style={{ fontSize: 11, color: '#9CA3AF' }}>{dept.responsible_whatsapp || ''}</p>
                    </td>
                    <td className="px-6 py-4 text-center"><p style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{dept.total_complaints ?? '—'}</p></td>
                    <td className="px-6 py-4 text-center"><p style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{dept.resolved_complaints ?? '—'}</p></td>
                    <td className="px-6 py-4">
                      <button onClick={() => openEdit(dept)}
                        style={{ fontSize: 12, fontWeight: 600, backgroundColor: `${SECONDARY}20`, color: PRIMARY, padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = `${SECONDARY}35`)}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = `${SECONDARY}20`)}>Editar</button>
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
