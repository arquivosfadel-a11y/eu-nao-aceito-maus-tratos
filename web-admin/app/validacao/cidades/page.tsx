'use client';

import { useState, useEffect } from 'react';
import { Globe, Search, Plus, X, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import Sidebar from '@/components/shared/Sidebar';
import api from '@/lib/api';
import { City } from '@/types';

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

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

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

function ActionBtn({ onClick, children, variant }: { onClick: () => void; children: React.ReactNode; variant: 'edit' | 'red' | 'green' }) {
  const map = {
    edit:  [`${SECONDARY}20`, PRIMARY, `${SECONDARY}35`],
    red:   ['#FEF2F2', '#DC2626', '#FECACA'],
    green: ['#ECFDF5', '#059669', '#A7F3D0'],
  };
  const [bg, color, hbg] = map[variant];
  return (
    <button onClick={onClick}
      style={{ fontSize: 12, fontWeight: 600, backgroundColor: bg, color, padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = hbg)}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = bg)}>
      {children}
    </button>
  );
}

export default function CidadesPage() {
  const [cities,       setCities]       = useState<City[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [editing,      setEditing]      = useState<any | null>(null);
  const [search,       setSearch]       = useState('');
  const [fetchingIbge, setFetchingIbge] = useState(false);
  const [ibgeStatus,   setIbgeStatus]   = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [form, setForm] = useState({
    name: '', state: '', mayor_name: '', contact_email: '', contact_phone: '',
    ibge_code: '', latitude: '', longitude: '', city_type: 'prefeitura',
  });

  useEffect(() => { fetchCities(); }, []);

  const fetchCities = async () => {
    try {
      const res = await api.get('/cities');
      setCities(res.data.cities || []);
    } catch {} finally { setLoading(false); }
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', state: '', mayor_name: '', contact_email: '', contact_phone: '', ibge_code: '', latitude: '', longitude: '', city_type: 'prefeitura' });
    setIbgeStatus(null);
    setShowForm(true);
  };

  const openEdit = (city: any) => {
    setEditing(city);
    setForm({ name: city.name, state: city.state, mayor_name: city.mayor_name || '', contact_email: city.contact_email || '', contact_phone: city.contact_phone || '', ibge_code: city.ibge_code || '', latitude: city.latitude || '', longitude: city.longitude || '', city_type: city.city_type || 'prefeitura' });
    setIbgeStatus(null);
    setShowForm(true);
  };

  const fetchFromIbge = async () => {
    if (!form.ibge_code || form.ibge_code.length < 6) {
      setIbgeStatus({ type: 'error', message: 'Digite um código IBGE válido (7 dígitos)' });
      return;
    }
    setFetchingIbge(true);
    setIbgeStatus(null);
    try {
      const ibgeRes = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${form.ibge_code}`);
      if (!ibgeRes.ok) throw new Error('Código IBGE não encontrado. Verifique e tente novamente.');
      const ibgeData = await ibgeRes.json();
      const cityName: string = ibgeData.nome;
      const uf: string = ibgeData.microrregiao?.mesorregiao?.UF?.sigla || '';
      const osmRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName + ' ' + uf + ' Brasil')}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'CausaAnimal/1.0' } }
      );
      const osmData = await osmRes.json();
      if (!osmData || osmData.length === 0) throw new Error('Coordenadas não encontradas para esta cidade.');
      const lat = parseFloat(osmData[0].lat).toFixed(8);
      const lon = parseFloat(osmData[0].lon).toFixed(8);
      setForm(prev => ({ ...prev, name: cityName, state: uf, latitude: lat, longitude: lon }));
      setIbgeStatus({ type: 'success', message: `${cityName} — ${uf} | Lat: ${lat} | Lon: ${lon}` });
    } catch (error: any) {
      setIbgeStatus({ type: 'error', message: error.message || 'Erro ao buscar dados. Tente novamente.' });
    } finally { setFetchingIbge(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/cities/${editing.id}`, form); alert('Cidade atualizada!'); }
      else { await api.post('/cities', form); alert('Cidade cadastrada!'); }
      setShowForm(false);
      fetchCities();
    } catch { alert('Erro ao salvar cidade'); }
  };

  const handleToggle = async (id: string) => {
    try { await api.put(`/cities/${id}/toggle`); fetchCities(); }
    catch { alert('Erro ao alterar status'); }
  };

  const filtered = cities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.state.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: BG }}>
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">

        <header className="shrink-0 bg-white px-8 py-6 flex items-center justify-between" style={{ boxShadow: `0 1px 0 #D1FAE5` }}>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${PRIMARY}, #2d6a4f)` }}>
              <Globe size={22} style={{ color: ACCENT }} strokeWidth={2} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Cidades</h1>
              <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                {cities.length} cidade{cities.length !== 1 ? 's' : ''} cadastrada{cities.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button onClick={openNew} className="flex items-center gap-2 text-white font-semibold"
            style={{ backgroundColor: PRIMARY, borderRadius: 12, padding: '10px 20px', fontSize: 14, border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2d6a4f')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = PRIMARY)}>
            <Plus size={16} strokeWidth={2.5} /> Nova Cidade
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">

          <div className="bg-white flex items-center gap-3" style={{ borderRadius: 16, boxShadow: SHADOW, padding: '12px 16px' }}>
            <Search size={16} style={{ color: '#9CA3AF', flexShrink: 0 }} />
            <input type="text" placeholder="Buscar por nome ou estado..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-gray-400 text-gray-800" />
          </div>

          {showForm && (
            <div className="bg-white" style={{ borderRadius: 16, boxShadow: SHADOW, borderLeft: `4px solid ${SECONDARY}`, padding: 28 }}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>{editing ? 'Editar Cidade' : 'Nova Cidade'}</h2>
                  <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 3 }}>Preencha os dados da cidade</p>
                </div>
                <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <X size={18} style={{ color: '#9CA3AF' }} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* IBGE */}
                <div style={{ backgroundColor: `${SECONDARY}12`, borderRadius: 12, padding: '16px 18px', border: `1px solid ${SECONDARY}40` }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: PRIMARY, marginBottom: 12 }}>Busca automática pelo código IBGE</p>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label style={LABEL}>Código IBGE</label>
                      <input type="text" value={form.ibge_code}
                        onChange={e => { setForm({ ...form, ibge_code: e.target.value }); setIbgeStatus(null); }}
                        placeholder="Ex: 3554706" maxLength={7} className={INPUT} />
                    </div>
                    <button type="button" onClick={fetchFromIbge} disabled={fetchingIbge}
                      style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: fetchingIbge ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: fetchingIbge ? 0.6 : 1 }}>
                      {fetchingIbge ? 'Buscando...' : 'Buscar dados'}
                    </button>
                  </div>
                  {ibgeStatus && (
                    <div className="flex items-center gap-2 mt-3" style={{ padding: '8px 12px', borderRadius: 8, backgroundColor: ibgeStatus.type === 'success' ? '#ECFDF5' : '#FEF2F2' }}>
                      {ibgeStatus.type === 'success'
                        ? <CheckCircle2 size={14} style={{ color: '#059669', flexShrink: 0 }} />
                        : <AlertCircle size={14} style={{ color: '#DC2626', flexShrink: 0 }} />}
                      <span style={{ fontSize: 12, color: ibgeStatus.type === 'success' ? '#059669' : '#DC2626' }}>{ibgeStatus.message}</span>
                    </div>
                  )}
                  <p style={{ fontSize: 11, color: '#6B7280', marginTop: 8 }}>
                    Digite o código IBGE de 7 dígitos — nome, estado e coordenadas serão preenchidos automaticamente.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={LABEL}>Nome da Cidade *</label>
                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={INPUT} required />
                  </div>
                  <div>
                    <label style={LABEL}>Estado *</label>
                    <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className={INPUT} required>
                      <option value="">Selecione...</option>
                      {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={LABEL}>Tipo de Instituição *</label>
                    <select value={form.city_type} onChange={e => setForm({ ...form, city_type: e.target.value })} className={INPUT} required>
                      <option value="prefeitura">Prefeitura Municipal</option>
                      <option value="camara">Câmara Municipal</option>
                    </select>
                  </div>
                  <div>
                    <label style={LABEL}>Nome do Responsável</label>
                    <input type="text" value={form.mayor_name} onChange={e => setForm({ ...form, mayor_name: e.target.value })} className={INPUT} />
                  </div>
                  <div>
                    <label style={LABEL}>Latitude</label>
                    <input type="text" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })}
                      placeholder="Preenchido automaticamente" className={INPUT} style={{ backgroundColor: BG }} />
                  </div>
                  <div>
                    <label style={LABEL}>Longitude</label>
                    <input type="text" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })}
                      placeholder="Preenchido automaticamente" className={INPUT} style={{ backgroundColor: BG }} />
                  </div>
                  <div>
                    <label style={LABEL}>Email de Contato</label>
                    <input type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} className={INPUT} />
                  </div>
                  <div>
                    <label style={LABEL}>Telefone de Contato</label>
                    <input type="text" value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} className={INPUT} />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    style={{ padding: '10px 20px', borderRadius: 10, fontSize: 14, border: `1.5px solid #D1FAE5`, background: 'transparent', color: '#6B7280', cursor: 'pointer', fontWeight: 500 }}
                    onMouseEnter={e => (e.currentTarget.style.background = BG)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    Cancelar
                  </button>
                  <button type="submit"
                    style={{ padding: '10px 24px', borderRadius: 10, fontSize: 14, backgroundColor: PRIMARY, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2d6a4f')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = PRIMARY)}>
                    {editing ? 'Salvar Alterações' : 'Cadastrar Cidade'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white overflow-hidden" style={{ borderRadius: 16, boxShadow: SHADOW }}>
            <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${BG}` }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${SECONDARY}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Globe size={16} style={{ color: PRIMARY }} />
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Cidades cadastradas</h2>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>{filtered.length} {filtered.length === 1 ? 'cidade' : 'cidades'}</p>
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: BG }}>
                  {['Cidade', 'Estado', 'Tipo', 'IBGE', 'Coordenadas', 'Responsável', 'Email', 'Status', 'Ações'].map(h => (
                    <th key={h} className="text-left px-6 py-3" style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid #D1FAE5` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-16">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <Spinner /><p style={{ fontSize: 13, color: '#9CA3AF' }}>Carregando...</p>
                    </div>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-16">
                    <Globe size={36} style={{ color: '#D1FAE5', margin: '0 auto 12px' }} />
                    <p style={{ fontSize: 13, color: '#9CA3AF' }}>{search ? 'Nenhuma cidade encontrada.' : 'Nenhuma cidade cadastrada ainda.'}</p>
                  </td></tr>
                ) : filtered.map((city, i) => (
                  <tr key={city.id}
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BG}` : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = BG)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td className="px-6 py-4"><p style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{city.name}</p></td>
                    <td className="px-6 py-4"><span style={{ fontSize: 12, fontWeight: 700, color: '#374151', backgroundColor: `${SECONDARY}20`, padding: '3px 8px', borderRadius: 6 }}>{city.state}</span></td>
                    <td className="px-6 py-4">
                      {(city as any).city_type === 'camara'
                        ? <span style={{ fontSize: 11, fontWeight: 600, backgroundColor: '#F5F3FF', color: '#7C3AED', padding: '3px 10px', borderRadius: 99 }}>Câmara</span>
                        : <span style={{ fontSize: 11, fontWeight: 600, backgroundColor: `${SECONDARY}20`, color: PRIMARY, padding: '3px 10px', borderRadius: 99 }}>Prefeitura</span>}
                    </td>
                    <td className="px-6 py-4"><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6B7280' }}>{(city as any).ibge_code || '—'}</span></td>
                    <td className="px-6 py-4">
                      {(city as any).latitude && (city as any).longitude
                        ? <span className="flex items-center gap-1" style={{ fontSize: 12, color: '#059669' }}><CheckCircle2 size={12} />Configurado</span>
                        : <span className="flex items-center gap-1" style={{ fontSize: 12, color: '#DC2626' }}><AlertCircle size={12} />Sem coords</span>}
                    </td>
                    <td className="px-6 py-4"><p style={{ fontSize: 13, color: '#6B7280' }}>{(city as any).mayor_name || '—'}</p></td>
                    <td className="px-6 py-4"><p style={{ fontSize: 13, color: '#6B7280' }}>{(city as any).contact_email || '—'}</p></td>
                    <td className="px-6 py-4"><StatusDot active={city.is_active} /></td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <ActionBtn onClick={() => openEdit(city)} variant="edit">Editar</ActionBtn>
                        <ActionBtn onClick={() => handleToggle(city.id)} variant={city.is_active ? 'red' : 'green'}>
                          {city.is_active ? 'Desativar' : 'Ativar'}
                        </ActionBtn>
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
