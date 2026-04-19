'use client';

import { useRouter, usePathname } from 'next/navigation';
import { logout, getSession } from '@/lib/auth';
import {
  ClipboardList, LayoutDashboard, Map, BarChart2,
  FileText, LogOut, Users, CheckSquare,
  Globe, UserCog, ShieldCheck, Printer, Landmark,
  PawPrint, Heart, Shield, Home,
} from 'lucide-react';

const PRIMARY   = '#1B4332';
const ACCENT    = '#F4A261';
const SECONDARY = '#52B788';

interface MenuItem { label: string; path: string; Icon: React.ElementType }

const menuByRole: Record<string, MenuItem[]> = {
  validator: [
    { label: 'Validação',    path: '/validacao',             Icon: ShieldCheck },
  ],
  admin: [
    { label: 'Validação',    path: '/validacao',             Icon: ShieldCheck },
    { label: 'Protetores',   path: '/validacao/protetores',  Icon: Heart },
    { label: 'Cidadãos',     path: '/validacao/cidadaos',    Icon: Users },
    { label: 'Validadores',  path: '/validacao/validadores', Icon: UserCog },
    { label: 'Adoção',       path: '/adocao',                Icon: PawPrint },
  ],
  protector: [
    { label: 'Denúncias',    path: '/protetor',              Icon: ClipboardList },
  ],
  secretary: [
    { label: 'Denúncias',    path: '/protetor',              Icon: ClipboardList },
  ],
  mayor: [
    { label: 'Dashboard',    path: '/prefeito',              Icon: LayoutDashboard },
    { label: 'Mapa',         path: '/prefeito/mapa',         Icon: Map },
    { label: 'Analítico',    path: '/prefeito/analitico',    Icon: BarChart2 },
    { label: 'Relatórios',   path: '/prefeito/relatorios',   Icon: Printer },
  ],
  councilman: [
    { label: 'Painel',    path: '/vereador',          Icon: LayoutDashboard },
    { label: 'Mapa',      path: '/vereador/mapa',     Icon: Map },
    { label: 'Demandas',  path: '/vereador/demandas', Icon: FileText },
  ],
  chamber_president: [
    { label: 'Painel',    path: '/vereador',          Icon: LayoutDashboard },
    { label: 'Mapa',      path: '/vereador/mapa',     Icon: Map },
    { label: 'Demandas',  path: '/vereador/demandas', Icon: FileText },
  ],
};

const roleLabel: Record<string, string> = {
  admin:             'Administrador',
  validator:         'Validador',
  protector:         'Protetor',
  secretary:         'Protetor',
  mayor:             'Prefeito',
  citizen:           'Cidadão',
  councilman:        'Vereador',
  chamber_president: 'Presidente da Câmara',
};

export default function Sidebar() {
  const router   = useRouter();
  const pathname = usePathname();
  const { user } = getSession();

  if (!user) return null;

  const items   = menuByRole[user.role] || [];
  const initials = user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <aside
      className="w-64 flex flex-col shrink-0"
      style={{ backgroundColor: PRIMARY, minHeight: '100vh' }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Eu Não Aceito Maus Tratos"
            className="w-10 h-10 rounded-xl object-contain"
            style={{ background: 'rgba(255,255,255,0.12)', padding: 2 }}
          />
          <div>
            <p className="font-extrabold text-white leading-tight" style={{ fontSize: 12.5 }}>
              Eu Não Aceito
            </p>
            <p className="font-extrabold text-white leading-tight" style={{ fontSize: 12.5 }}>
              Maus Tratos
            </p>
            <p style={{ fontSize: 10.5, color: `${ACCENT}CC`, marginTop: 2 }}>
              {roleLabel[user.role] || 'Painel'}
            </p>
          </div>
        </div>
      </div>

      {/* User pill */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, #e07b3a)`, color: PRIMARY }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold truncate" style={{ fontSize: 13 }}>{user.name}</p>
            <p className="truncate" style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', marginTop: 1 }}>{user.email}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p
          className="px-3 mb-2 uppercase font-bold"
          style={{ fontSize: 10, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.28)' }}
        >
          Menu
        </p>

        {items.map((item) => {
          const active = pathname === item.path || (item.path !== '/validacao' && pathname.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="w-full flex items-center gap-3.5 rounded-xl transition-all duration-150 cursor-pointer"
              style={{
                padding: '11px 14px',
                backgroundColor: active ? ACCENT : 'transparent',
                color:           active ? PRIMARY : 'rgba(255,255,255,0.68)',
                fontWeight:      active ? 700 : 500,
                fontSize: 14.5,
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.09)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.68)';
                }
              }}
            >
              <item.Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3.5 rounded-xl transition-all duration-150 cursor-pointer"
          style={{ padding: '11px 14px', color: 'rgba(255,255,255,0.45)', fontSize: 14.5, fontWeight: 500 }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.12)';
            e.currentTarget.style.color = '#f87171';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
          }}
        >
          <LogOut size={20} strokeWidth={2} />
          <span>Sair</span>
        </button>

        {/* VETech footer */}
        <div className="flex items-center justify-center mt-4 gap-2 opacity-30">
          <img src="/logovetech.png" alt="VETech" className="h-5 object-contain" />
          <span style={{ fontSize: 10, color: '#fff' }}>VETech Systems</span>
        </div>
      </div>
    </aside>
  );
}
