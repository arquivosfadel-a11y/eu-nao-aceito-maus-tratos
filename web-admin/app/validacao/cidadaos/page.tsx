'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Pencil, Trash2 } from 'lucide-react';
import Sidebar from '@/components/shared/Sidebar';
import EditUserModal from '@/components/ui/EditUserModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import api from '@/lib/api';

const PRIMARY   = '#1B4332';
const SECONDARY = '#52B788';
const ACCENT    = '#F4A261';
const BG        = '#F0F7F4';
const SHADOW    = '0 1px 6px rgba(0,0,0,0.06)';

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

export default function CidadaosPage() {
  const [users,       setUsers]       = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [filterCity,  setFilterCity]  = useState('');
  const [editTarget,  setEditTarget]  = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting,    setDeleting]    = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users', { params: { role: 'citizen' } });
      setUsers(res.data.users || []);
    } catch {} finally { setLoading(false); }
  };

  const handleToggle = async (id: string, is_active: boolean) => {
    await api.put(`/users/${id}`, { is_active: !is_active });
    fetchUsers();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao remover usuário.');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const cityName = (u.city_name || u.city?.name || '').toLowerCase();
    const matchCity = filterCity ? cityName.includes(filterCity.toLowerCase()) : true;
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
            <input
              type="text"
              placeholder="Filtrar por cidade..."
              value={filterCity}
              onChange={e => setFilterCity(e.target.value)}
              style={{ border: '1.5px solid #D1FAE5', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#374151', background: '#fff', outline: 'none', flexShrink: 0, width: 180 }}
            />
          </div>

          <div className="bg-white" style={{ borderRadius: 16, boxShadow: SHADOW, overflow: 'hidden' }}>
            <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${BG}` }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${SECONDARY}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={16} style={{ color: PRIMARY }} />
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Cidadãos cadastrados</h2>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>{filtered.length} {filtered.length === 1 ? 'cidadão' : 'cidadãos'}</p>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
            <table className="w-full" style={{ minWidth: 760 }}>
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
                    <p style={{ fontSize: 13, color: '#9CA3AF' }}>{search || filterCity ? 'Nenhum cidadão encontrado.' : 'Nenhum cidadão cadastrado ainda.'}</p>
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
                    <td className="px-6 py-4"><p style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{user.city_name || user.city?.name || '—'}</p></td>
                    <td className="px-6 py-4"><p style={{ fontSize: 12, color: '#9CA3AF' }}>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</p></td>
                    <td className="px-6 py-4"><StatusDot active={user.is_active} /></td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setEditTarget(user)}
                          title="Editar"
                          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, backgroundColor: `${SECONDARY}20`, color: PRIMARY, padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = `${SECONDARY}35`)}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = `${SECONDARY}20`)}>
                          <Pencil size={13} strokeWidth={2} /> Editar
                        </button>
                        <button
                          onClick={() => handleToggle(user.id, user.is_active)}
                          style={{ fontSize: 12, fontWeight: 600, backgroundColor: user.is_active ? '#FEF2F2' : '#ECFDF5', color: user.is_active ? '#DC2626' : '#059669', padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = user.is_active ? '#FECACA' : '#A7F3D0')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = user.is_active ? '#FEF2F2' : '#ECFDF5')}>
                          {user.is_active ? 'Desativar' : 'Ativar'}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(user)}
                          title="Remover"
                          style={{ display: 'flex', alignItems: 'center', padding: '5px 8px', borderRadius: 8, border: 'none', cursor: 'pointer', backgroundColor: '#FEF2F2', color: '#DC2626' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FECACA')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#FEF2F2')}>
                          <Trash2 size={13} strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </main>

      {editTarget && (
        <EditUserModal user={editTarget} onClose={() => setEditTarget(null)} onSaved={fetchUsers} />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Remover cidadão"
          message={`Tem certeza que deseja remover "${deleteTarget.name}"? Esta ação não pode ser desfeita.`}
          confirmLabel="Remover"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
