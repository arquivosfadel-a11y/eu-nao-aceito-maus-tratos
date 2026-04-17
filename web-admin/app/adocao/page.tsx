'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PawPrint, Heart, Search, Filter, CheckCircle2, XCircle,
  Phone, MapPin, Calendar, RefreshCw, Dog,
} from 'lucide-react';
import Sidebar from '@/components/shared/Sidebar';
import api from '@/lib/api';
import { getSession, checkRoutePermission } from '@/lib/auth';
import { Animal } from '@/types';

const PRIMARY   = '#1B4332';
const SECONDARY = '#52B788';
const ACCENT    = '#F4A261';
const BG        = '#F0F7F4';
const SHADOW    = '0 1px 6px rgba(0,0,0,0.06)';

const SPECIES_ICONS: Record<string, string> = {
  cachorro: '🐕',
  gato:     '🐈',
  ave:      '🦜',
  coelho:   '🐇',
  outros:   '🐾',
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  available: { label: 'Disponível',  bg: '#ECFDF5', color: '#065F46', border: '#10B981' },
  pending:   { label: 'Em análise',  bg: '#FFF7ED', color: '#92400E', border: '#F59E0B' },
  adopted:   { label: 'Adotado',     bg: '#EFF6FF', color: '#1D4ED8', border: '#3B82F6' },
};

export default function AdocaoPage() {
  const [authorized, setAuthorized]   = useState(false);
  const [animals, setAnimals]         = useState<Animal[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filterSpecies, setFilterSpecies] = useState('');
  const [filterStatus,  setFilterStatus]  = useState('');
  const [filterCity,    setFilterCity]    = useState('');
  const [search,        setSearch]        = useState('');
  const [processing,    setProcessing]    = useState<string | null>(null);
  const [cities,        setCities]        = useState<string[]>([]);

  useEffect(() => {
    const { user, token } = getSession();
    if (!token || !user) { window.location.href = '/login'; return; }
    const redirect = checkRoutePermission(user.role, '/adocao');
    if (redirect) { window.location.href = redirect; return; }
    setAuthorized(true);
    fetchAnimals();
  }, []);

  const fetchAnimals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/animals');
      const data: Animal[] = res.data.animals || res.data || [];
      setAnimals(data);
      const uniqueCities = [...new Set(data.map(a => a.city_name).filter(Boolean))] as string[];
      setCities(uniqueCities);
    } catch (err) {
      console.error('Erro ao buscar animais:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'adopted') => {
    setProcessing(id);
    try {
      const statusMap = { approve: 'available', reject: 'rejected', adopted: 'adopted' };
      await api.put(`/animals/${id}`, { status: statusMap[action] });
      await fetchAnimals();
    } catch {
      alert('Erro ao atualizar status do animal');
    } finally {
      setProcessing(null);
    }
  };

  const filtered = animals.filter(a => {
    const matchSpecies = !filterSpecies || (a.species || '').toLowerCase().includes(filterSpecies.toLowerCase());
    const matchStatus  = !filterStatus  || a.status === filterStatus;
    const matchCity    = !filterCity    || a.city_name === filterCity;
    const matchSearch  = !search        ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.breed || '').toLowerCase().includes(search.toLowerCase());
    return matchSpecies && matchStatus && matchCity && matchSearch;
  });

  const stats = {
    total:     animals.length,
    available: animals.filter(a => a.status === 'available').length,
    pending:   animals.filter(a => a.status === 'pending').length,
    adopted:   animals.filter(a => a.status === 'adopted').length,
  };

  if (!authorized) return null;

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: BG }}>
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className="shrink-0 px-6 py-5 flex items-center gap-3"
          style={{ backgroundColor: PRIMARY, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${ACCENT}22`, border: `1px solid ${ACCENT}55` }}
          >
            <PawPrint size={22} style={{ color: ACCENT }} strokeWidth={2} />
          </div>
          <div>
            <h1 className="font-extrabold text-white" style={{ fontSize: 20, letterSpacing: '-0.01em' }}>
              Gestão de Adoção
            </h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>
              Animais cadastrados para adoção
            </p>
          </div>
          <button
            onClick={fetchAnimals}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
            style={{ backgroundColor: `${ACCENT}22`, color: ACCENT, border: `1px solid ${ACCENT}44` }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = `${ACCENT}33`}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = `${ACCENT}22`}
          >
            <RefreshCw size={15} />
            Atualizar
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total', value: stats.total,     color: PRIMARY,    border: SECONDARY },
              { label: 'Disponíveis', value: stats.available, color: '#065F46', border: '#10B981' },
              { label: 'Em Análise',  value: stats.pending,   color: '#92400E', border: ACCENT },
              { label: 'Adotados',    value: stats.adopted,   color: '#1D4ED8', border: '#3B82F6' },
            ].map(({ label, value, color, border }) => (
              <div key={label} className="bg-white rounded-2xl p-4"
                style={{ boxShadow: SHADOW, borderBottom: `4px solid ${border}` }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  {label}
                </p>
                <p style={{ fontSize: 38, fontWeight: 900, color, lineHeight: 1, letterSpacing: '-0.03em' }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-2xl p-4 flex flex-wrap gap-3 items-center" style={{ boxShadow: SHADOW }}>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text" placeholder="Buscar por nome ou raça..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none w-52"
              />
            </div>
            <select
              value={filterSpecies} onChange={e => setFilterSpecies(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none cursor-pointer"
            >
              <option value="">Todas as espécies</option>
              <option value="cachorro">Cachorro</option>
              <option value="gato">Gato</option>
              <option value="ave">Ave</option>
              <option value="coelho">Coelho</option>
              <option value="outros">Outros</option>
            </select>
            <select
              value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none cursor-pointer"
            >
              <option value="">Todos os status</option>
              <option value="available">Disponível</option>
              <option value="pending">Em análise</option>
              <option value="adopted">Adotado</option>
            </select>
            {cities.length > 0 && (
              <select
                value={filterCity} onChange={e => setFilterCity(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none cursor-pointer"
              >
                <option value="">Todas as cidades</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {(filterSpecies || filterStatus || filterCity || search) && (
              <button
                onClick={() => { setFilterSpecies(''); setFilterStatus(''); setFilterCity(''); setSearch(''); }}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                Limpar filtros
              </button>
            )}
            <span className="ml-auto text-sm text-gray-400">
              {filtered.length} {filtered.length === 1 ? 'animal' : 'animais'}
            </span>
          </div>

          {/* Grid de animais */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 rounded-full" style={{ borderWidth: 3, borderColor: '#D1FAE5', borderTopColor: PRIMARY, borderStyle: 'solid', animation: 'spin 0.85s linear infinite' }} />
              <p className="text-sm text-gray-400">Carregando animais...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl" style={{ boxShadow: SHADOW }}>
              <PawPrint size={48} strokeWidth={1} style={{ color: SECONDARY, marginBottom: 12 }} />
              <p className="text-lg font-bold text-gray-500">Nenhum animal encontrado</p>
              <p className="text-sm text-gray-400 mt-1">Tente ajustar os filtros</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence>
                {filtered.map((animal, i) => {
                  const sc = STATUS_CONFIG[animal.status] || STATUS_CONFIG.available;
                  const speciesKey = (animal.species || '').toLowerCase();
                  const icon = SPECIES_ICONS[speciesKey] || SPECIES_ICONS.outros;
                  const isProcessing = processing === animal.id;

                  return (
                    <motion.div
                      key={animal.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      className="bg-white rounded-2xl overflow-hidden flex flex-col"
                      style={{ boxShadow: SHADOW }}
                    >
                      {/* Foto */}
                      <div className="relative h-44 shrink-0" style={{ backgroundColor: `${SECONDARY}20` }}>
                        {animal.images?.[0] ? (
                          <img
                            src={animal.images[0]} alt={animal.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span style={{ fontSize: 48 }}>{icon}</span>
                          </div>
                        )}
                        {/* Status badge */}
                        <span
                          className="absolute top-2 right-2 text-xs px-2.5 py-1 rounded-full font-bold"
                          style={{ backgroundColor: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
                        >
                          {sc.label}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-extrabold text-gray-800 text-base truncate">{animal.name}</h3>
                          <span className="text-lg ml-1 shrink-0">{icon}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2 capitalize">
                          {animal.species}{animal.breed ? ` · ${animal.breed}` : ''}
                          {animal.age ? ` · ${animal.age}` : ''}
                          {animal.gender ? ` · ${animal.gender}` : ''}
                        </p>

                        {animal.city_name && (
                          <p className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                            <MapPin size={10} strokeWidth={2} />
                            {animal.city_name}
                          </p>
                        )}
                        {animal.contact_name && (
                          <p className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                            <Phone size={10} strokeWidth={2} />
                            {animal.contact_name}
                          </p>
                        )}
                        <p className="flex items-center gap-1 text-xs text-gray-300 mt-auto pt-2">
                          <Calendar size={10} strokeWidth={2} />
                          {new Date(animal.createdAt).toLocaleDateString('pt-BR')}
                        </p>

                        {/* Actions */}
                        <div className="flex gap-2 mt-3">
                          {animal.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleAction(animal.id, 'approve')}
                                disabled={isProcessing}
                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-50 cursor-pointer"
                                style={{ backgroundColor: PRIMARY }}
                                onMouseEnter={e => !isProcessing && (e.currentTarget.style.backgroundColor = '#2d6a4f')}
                                onMouseLeave={e => !isProcessing && (e.currentTarget.style.backgroundColor = PRIMARY)}
                              >
                                <CheckCircle2 size={13} />
                                Aprovar
                              </button>
                              <button
                                onClick={() => handleAction(animal.id, 'reject')}
                                disabled={isProcessing}
                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                <XCircle size={13} />
                                Rejeitar
                              </button>
                            </>
                          )}
                          {animal.status === 'available' && (
                            <button
                              onClick={() => handleAction(animal.id, 'adopted')}
                              disabled={isProcessing}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                              style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}
                              onMouseEnter={e => !isProcessing && (e.currentTarget.style.backgroundColor = '#DBEAFE')}
                              onMouseLeave={e => !isProcessing && (e.currentTarget.style.backgroundColor = '#EFF6FF')}
                            >
                              <Heart size={13} />
                              Marcar Adotado
                            </button>
                          )}
                          {animal.status === 'adopted' && (
                            <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold"
                              style={{ backgroundColor: '#EFF6FF', color: '#93C5FD' }}>
                              <Heart size={12} fill="currentColor" />
                              Adotado com amor
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
