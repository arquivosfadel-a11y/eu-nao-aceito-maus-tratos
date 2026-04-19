'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import CityAutocomplete from './CityAutocomplete';
import api from '@/lib/api';

const PRIMARY = '#1B4332';
const BG = '#F0F7F4';
const INPUT =
  'w-full border border-[#D1FAE5] rounded-[10px] px-3 py-2.5 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-[#52B788] focus:border-transparent ' +
  'placeholder:text-gray-400 text-gray-800';
const LABEL = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF',
  textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 6,
};

const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (!d) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const maskCPF = (v: string) =>
  v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

interface Props {
  user: any;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditUserModal({ user, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: formatPhone(user.phone || ''),
    cpf: user.cpf || '',
    role: user.role || 'citizen',
    city_name: user.city_name || user.city?.name || '',
    password: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password && form.password !== form.confirmPassword) {
      setError('As senhas não coincidem.'); return;
    }
    if (form.password && form.password.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.'); return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        city_name: form.city_name || undefined,
      };
      const phoneDigits = form.phone.replace(/\D/g, '');
      if (phoneDigits) payload.phone = phoneDigits;
      if (form.cpf) payload.cpf = form.cpf;
      if (form.password) payload.password = form.password;
      await api.put(`/users/${user.id}`, payload);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#fff', borderRadius: 20, padding: 32,
        width: '100%', maxWidth: 560,
        boxShadow: '0 20px 60px rgba(0,0,0,0.20)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>Editar Usuário</h2>
            <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 3 }}>{user.email}</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={20} style={{ color: '#9CA3AF' }} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={LABEL}>Nome *</label>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className={INPUT} required />
            </div>
            <div>
              <label style={LABEL}>Email *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={INPUT} required />
            </div>
            <div>
              <label style={LABEL}>Telefone</label>
              <input type="text" value={form.phone} onChange={e => set('phone', formatPhone(e.target.value))} placeholder="(11) 99999-9999" className={INPUT} maxLength={15} />
            </div>
            <div>
              <label style={LABEL}>CPF</label>
              <input type="text" value={form.cpf} onChange={e => set('cpf', maskCPF(e.target.value))} placeholder="000.000.000-00" className={INPUT} maxLength={14} />
            </div>
            <div>
              <label style={LABEL}>Role</label>
              <select value={form.role} onChange={e => set('role', e.target.value)} className={INPUT}>
                <option value="citizen">Cidadão</option>
                <option value="protector">Protetor</option>
                <option value="validator">Validador</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label style={LABEL}>Cidade</label>
              <CityAutocomplete value={form.city_name} onChange={v => set('city_name', v)} className={INPUT} />
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${BG}`, paddingTop: 16 }}>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12 }}>
              Deixe em branco para manter a senha atual.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={LABEL}>Nova Senha</label>
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" className={INPUT} />
              </div>
              <div>
                <label style={LABEL}>Confirmar Nova Senha</label>
                <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="••••••••" className={INPUT} />
              </div>
            </div>
          </div>

          {error && (
            <p style={{ fontSize: 13, color: '#DC2626', backgroundColor: '#FEF2F2', padding: '10px 14px', borderRadius: 10 }}>
              ⚠️ {error}
            </p>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose}
              style={{ padding: '10px 20px', borderRadius: 10, fontSize: 14, border: '1.5px solid #D1FAE5', background: 'transparent', color: '#6B7280', cursor: 'pointer', fontWeight: 500 }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              style={{ padding: '10px 24px', borderRadius: 10, fontSize: 14, backgroundColor: saving ? '#9CA3AF' : PRIMARY, color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
