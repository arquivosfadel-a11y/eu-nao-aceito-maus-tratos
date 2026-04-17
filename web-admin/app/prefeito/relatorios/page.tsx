'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import { getSession, checkRoutePermission } from '@/lib/auth';
import api from '@/lib/api';
import {
  Printer, FileText, Building2, TrendingUp, Star,
  BarChart2, X, CheckSquare, Square, Clock, CheckCircle2,
  XCircle, AlertTriangle, Calendar,
} from 'lucide-react';

const FONT = "'Inter', system-ui, -apple-system, sans-serif";

/* ─── Period ─────────────────────────────────────────────── */
const PERIODS = [
  { key: '30d',  label: 'Últimos 30 dias' },
  { key: '90d',  label: 'Últimos 3 meses' },
  { key: '180d', label: 'Últimos 6 meses' },
  { key: '1y',   label: 'Último ano'      },
  { key: 'all',  label: 'Geral (todos)'   },
];

function filterByPeriod(items: any[], period: string) {
  if (period === 'all') return items;
  const days = period === '30d' ? 30 : period === '90d' ? 90 : period === '180d' ? 180 : 365;
  const cutoff = Date.now() - days * 86_400_000;
  return items.filter(c => new Date(c.createdAt).getTime() >= cutoff);
}

/* ─── Status helpers ─────────────────────────────────────── */
const STATUS_LABEL: Record<string, string> = {
  validated: 'Aguardando', in_progress: 'Em Andamento',
  resolved: 'Resolvida', closed: 'Encerrada', not_resolved: 'Não Resolvida',
};
const STATUS_DOT: Record<string, string> = {
  validated: '#F59E0B', in_progress: '#3B82F6',
  resolved: '#10B981', closed: '#059669', not_resolved: '#EF4444',
};

/* ─── Report type definitions ────────────────────────────── */
const REPORT_TYPES = [
  {
    key: 'executive',
    label: 'Resumo Executivo',
    desc: 'KPIs, taxa de resolução e visão geral',
    Icon: TrendingUp,
    color: '#6366F1',
  },
  {
    key: 'depts',
    label: 'Desempenho de Secretarias',
    desc: 'Taxa de resolução por secretaria · selecionável',
    Icon: Building2,
    color: '#8B5CF6',
  },
  {
    key: 'complaints',
    label: 'Relatório de Reclamações',
    desc: 'Reclamações por período e status · sem dados pessoais',
    Icon: FileText,
    color: '#3B82F6',
  },
  {
    key: 'resolution',
    label: 'Análise de Resolução',
    desc: 'Tendência mensal de abertura vs resolução',
    Icon: BarChart2,
    color: '#10B981',
  },
  {
    key: 'satisfaction',
    label: 'Satisfação Cidadã',
    desc: 'Índice de avaliações e distribuição por nota',
    Icon: Star,
    color: '#F59E0B',
  },
];

/* ─── PrintModal ─────────────────────────────────────────── */
function PrintModal({ title, subtitle, onClose, children }: {
  title: string; subtitle: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div
      id="rp-modal"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        overflowY: 'auto', padding: '24px 16px',
        fontFamily: FONT,
      }}
    >
      <div style={{
        backgroundColor: '#fff', width: '100%', maxWidth: '860px',
        borderRadius: '16px', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>

        {/* Toolbar — hidden on print */}
        <div className="no-print" style={{
          padding: '14px 24px', borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: '#F8FAFC',
        }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>Prévia de Impressão</p>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
              Clique em "Imprimir" para enviar à impressora ou salvar como PDF
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => window.print()}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 20px', borderRadius: 8, border: 'none',
                backgroundColor: '#012235', color: '#02dcfb',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
              }}
            >
              <Printer size={15} />
              Imprimir / Salvar PDF
            </button>
            <button onClick={onClose} style={{
              width: 36, height: 36, borderRadius: 8, border: '1px solid #E5E7EB',
              backgroundColor: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <X size={16} style={{ color: '#6B7280' }} />
            </button>
          </div>
        </div>

        {/* Print content */}
        <div id="rp-content" style={{ padding: '40px 48px' }}>
          {/* Letterhead */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, paddingBottom: 20, borderBottom: '2px solid #E5E7EB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8,
                background: 'linear-gradient(135deg, #02dcfb, #0ea5e9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Building2 size={20} style={{ color: '#012235' }} />
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0 }}>Participa Cidade</p>
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>Painel do Prefeito</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>{title}</p>
              <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0' }}>{subtitle}</p>
              <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>
                Gerado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          {children}
        </div>
      </div>

      <style>{`
        @media print {
          body > *:not(#rp-modal) { display: none !important; }
          #rp-modal {
            position: fixed !important; inset: 0 !important;
            background: none !important; padding: 0 !important;
            overflow: visible !important;
          }
          #rp-modal > div {
            border-radius: 0 !important; box-shadow: none !important;
            max-width: 100% !important; width: 100% !important;
          }
          .no-print { display: none !important; }
          @page { margin: 1.2cm; size: A4; }
        }
      `}</style>
    </div>
  );
}

/* ─── PeriodPills ────────────────────────────────────────── */
function PeriodPills({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <Calendar size={14} style={{ color: '#9CA3AF' }} />
      {PERIODS.map(p => (
        <button key={p.key} onClick={() => onChange(p.key)} style={{
          padding: '5px 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
          fontSize: 12, fontWeight: value === p.key ? 700 : 500, fontFamily: FONT,
          backgroundColor: value === p.key ? '#111827' : '#F3F4F6',
          color: value === p.key ? '#fff' : '#6B7280',
          transition: 'all 0.15s',
        }}>
          {p.label}
        </button>
      ))}
    </div>
  );
}

/* ─── DeptCheckList ──────────────────────────────────────── */
function DeptCheckList({ departments, selected, onChange }: {
  departments: any[]; selected: Set<string>; onChange: (s: Set<string>) => void;
}) {
  const all = selected.size === departments.length;
  const toggle = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    onChange(s);
  };
  const toggleAll = () => onChange(all ? new Set() : new Set(departments.map(d => String(d.id))));

  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
      <button
        onClick={toggleAll}
        style={{
          width: '100%', padding: '9px 14px',
          display: 'flex', alignItems: 'center', gap: 8,
          border: 'none', borderBottom: '1px solid #E5E7EB',
          backgroundColor: '#F8FAFC', cursor: 'pointer', fontFamily: FONT,
        }}
      >
        {all
          ? <CheckSquare size={15} style={{ color: '#3B82F6' }} />
          : <Square size={15} style={{ color: '#9CA3AF' }} />}
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
          {all ? 'Desmarcar todas' : 'Selecionar todas'}
        </span>
      </button>
      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
        {departments.map(d => {
          const id = String(d.id);
          const checked = selected.has(id);
          return (
            <button key={id} onClick={() => toggle(id)} style={{
              width: '100%', padding: '8px 14px',
              display: 'flex', alignItems: 'center', gap: 8,
              border: 'none', borderBottom: '1px solid #F1F5F9',
              backgroundColor: checked ? '#EFF6FF' : '#fff',
              cursor: 'pointer', textAlign: 'left', fontFamily: FONT,
            }}>
              {checked
                ? <CheckSquare size={14} style={{ color: '#3B82F6', flexShrink: 0 }} />
                : <Square size={14} style={{ color: '#D1D5DB', flexShrink: 0 }} />}
              <span style={{ fontSize: 13, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {d.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function PrefeitoRelatorios() {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [activeReport, setActiveReport] = useState('executive');
  const [period, setPeriod]         = useState('all');
  const [printOpen, setPrintOpen]   = useState(false);

  /* data */
  const [stats, setStats]           = useState<any>(null);
  const [departments, setDepts]     = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [satisfaction, setSatisfaction] = useState<any>(null);
  const [cityName, setCityName]     = useState('');

  /* dept selector */
  const [selectedDepts, setSelectedDepts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const { user, token } = getSession();
    if (!token || !user) { window.location.href = '/login'; return; }
    const redirect = checkRoutePermission(user.role, '/prefeito');
    if (redirect) { window.location.href = redirect; return; }
    setAuthorized(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { user } = getSession();
      const [dashRes, deptRes, complaintsRes, analyticsRes] = await Promise.all([
        api.get(`/cities/${user?.city_id}/dashboard`),
        api.get(`/cities/${user?.city_id}/departments`),
        api.get('/complaints', { params: { city_id: user?.city_id, limit: 500 } }),
        api.get(`/cities/${user?.city_id}/analytics`),
      ]);

      if (dashRes.data.success) {
        setStats(dashRes.data.dashboard.stats);
        setCityName(dashRes.data.dashboard.city?.name || '');
      }

      const depts = deptRes.data.departments || [];
      setDepts(depts);
      setSelectedDepts(new Set(depts.map((d: any) => String(d.id))));

      const visible = (complaintsRes.data.complaints || []).filter((c: any) =>
        !['pending', 'rejected'].includes(c.status)
      );
      setComplaints(visible);

      setSatisfaction(analyticsRes.data?.analytics?.satisfaction || null);
    } catch { } finally { setLoading(false); }
  };

  /* derived */
  const periodLabel  = PERIODS.find(p => p.key === period)?.label || '';
  const inPeriod     = filterByPeriod(complaints, period);
  const resolved     = inPeriod.filter(c => ['resolved', 'closed'].includes(c.status));
  const notResolved  = inPeriod.filter(c => c.status === 'not_resolved');
  const inProgress   = inPeriod.filter(c => c.status === 'in_progress');
  const waiting      = inPeriod.filter(c => c.status === 'validated');
  const resRate      = inPeriod.length > 0 ? Math.round((resolved.length / inPeriod.length) * 100) : 0;

  /* dept stats computed from filtered complaints */
  const deptStats = departments
    .filter(d => selectedDepts.has(String(d.id)))
    .map(d => {
      const dc = inPeriod.filter(c =>
        String(c.department_id) === String(d.id) || String(c.department?.id) === String(d.id)
      );
      const res = dc.filter(c => ['resolved', 'closed'].includes(c.status)).length;
      const rate = dc.length > 0 ? Math.round((res / dc.length) * 100) : 0;
      return { ...d, total: dc.length, resolved: res, in_progress: dc.filter(c => c.status === 'in_progress').length, waiting: dc.filter(c => c.status === 'validated').length, rate };
    })
    .sort((a, b) => b.rate - a.rate);

  /* monthly trend from complaints */
  const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const monthlyData = (() => {
    const year = new Date().getFullYear();
    const map: Record<string, { total: number; resolved: number }> = {};
    for (let m = 0; m < 12; m++) map[m] = { total: 0, resolved: 0 };
    complaints.forEach(c => {
      const d = new Date(c.createdAt);
      if (d.getFullYear() !== year) return;
      const m = d.getMonth();
      map[m].total++;
      if (['resolved', 'closed'].includes(c.status)) map[m].resolved++;
    });
    return Array.from({ length: 12 }, (_, i) => ({ label: MONTHS[i], ...map[i] }));
  })();

  /* satisfaction */
  const avgRating = satisfaction?.average ? parseFloat(String(satisfaction.average)) : null;
  const totalRatings = satisfaction?.total || 0;
  const ratingBars = [
    { label: '5', count: satisfaction?.five_stars  || 0, color: '#10B981' },
    { label: '4', count: satisfaction?.four_stars  || 0, color: '#84CC16' },
    { label: '3', count: satisfaction?.three_stars || 0, color: '#F59E0B' },
    { label: '2', count: satisfaction?.two_stars   || 0, color: '#F97316' },
    { label: '1', count: satisfaction?.one_star    || 0, color: '#EF4444' },
  ];
  const maxRating = Math.max(...ratingBars.map(r => r.count), 1);

  /* current report config */
  const currentReport = REPORT_TYPES.find(r => r.key === activeReport)!;
  const printSubtitle = `${cityName} · ${periodLabel}`;

  if (!authorized) return null;

  /* ─── Print content per report type ───────────────────── */
  const renderPrintContent = () => {
    if (activeReport === 'executive') return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total de Reclamações', value: inPeriod.length,    color: '#3B82F6' },
            { label: 'Resolvidas',           value: resolved.length,    color: '#10B981' },
            { label: 'Não Resolvidas',       value: notResolved.length, color: '#EF4444' },
            { label: 'Taxa de Resolução',    value: `${resRate}%`,      color: '#6366F1' },
          ].map((k, i) => (
            <div key={i} style={{ borderRadius: 10, border: '1px solid #E5E7EB', padding: '16px', borderTop: `4px solid ${k.color}` }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>{k.label}</p>
              <p style={{ fontSize: 32, fontWeight: 900, color: '#111827', margin: 0 }}>{k.value}</p>
            </div>
          ))}
        </div>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Top Secretarias por Resolução</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC' }}>
              {['Secretaria', 'Total', 'Resolvidas', 'Em Andamento', 'Taxa'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#6B7280', borderBottom: '1px solid #E5E7EB', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deptStats.slice(0, 8).map((d, i) => (
              <tr key={d.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: '#111827' }}>{d.name}</td>
                <td style={{ padding: '8px 12px', color: '#6B7280' }}>{d.total}</td>
                <td style={{ padding: '8px 12px', color: '#10B981', fontWeight: 600 }}>{d.resolved}</td>
                <td style={{ padding: '8px 12px', color: '#3B82F6' }}>{d.in_progress}</td>
                <td style={{ padding: '8px 12px', fontWeight: 700, color: d.rate >= 70 ? '#10B981' : d.rate >= 40 ? '#F59E0B' : '#EF4444' }}>{d.rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        {avgRating && (
          <div style={{ marginTop: 28, padding: '16px 20px', border: '1px solid #E5E7EB', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>Índice de Satisfação Cidadã</p>
              <p style={{ fontSize: 28, fontWeight: 900, color: '#F59E0B', margin: 0 }}>{avgRating.toFixed(1)} / 5.0</p>
            </div>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>Baseado em {totalRatings} avaliação{totalRatings !== 1 ? 'ões' : ''}</p>
          </div>
        )}
      </>
    );

    if (activeReport === 'depts') return (
      <>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC' }}>
              {['#', 'Secretaria', 'Total', 'Aguardando', 'Em Andamento', 'Resolvidas', 'Não Resol.', 'Taxa'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '9px 12px', fontSize: 11, fontWeight: 700, color: '#6B7280', borderBottom: '2px solid #E5E7EB', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deptStats.map((d, i) => (
              <tr key={d.id} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                <td style={{ padding: '9px 12px', color: '#9CA3AF', fontSize: 12 }}>{i + 1}</td>
                <td style={{ padding: '9px 12px', fontWeight: 600, color: '#111827' }}>{d.name}</td>
                <td style={{ padding: '9px 12px', color: '#374151' }}>{d.total}</td>
                <td style={{ padding: '9px 12px', color: '#D97706' }}>{d.waiting}</td>
                <td style={{ padding: '9px 12px', color: '#3B82F6' }}>{d.in_progress}</td>
                <td style={{ padding: '9px 12px', color: '#10B981', fontWeight: 600 }}>{d.resolved}</td>
                <td style={{ padding: '9px 12px', color: '#EF4444' }}>{inPeriod.filter(c => (String(c.department_id) === String(d.id) || String(c.department?.id) === String(d.id)) && c.status === 'not_resolved').length}</td>
                <td style={{ padding: '9px 12px', fontWeight: 700, color: d.rate >= 70 ? '#10B981' : d.rate >= 40 ? '#F59E0B' : '#EF4444' }}>{d.rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 16, textAlign: 'center' }}>
          Relatório gerado automaticamente · {deptStats.length} secretaria{deptStats.length !== 1 ? 's' : ''} · {periodLabel}
        </p>
      </>
    );

    if (activeReport === 'complaints') return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total no período', value: inPeriod.length,    color: '#3B82F6' },
            { label: 'Resolvidas',       value: resolved.length,    color: '#10B981' },
            { label: 'Em Andamento',     value: inProgress.length,  color: '#3B82F6' },
            { label: 'Não Resolvidas',   value: notResolved.length, color: '#EF4444' },
          ].map((k, i) => (
            <div key={i} style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid #E5E7EB', borderLeft: `3px solid ${k.color}` }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', margin: '0 0 4px' }}>{k.label}</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>{k.value}</p>
            </div>
          ))}
        </div>
        <div style={{ padding: '10px 14px', backgroundColor: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: 8, marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: '#92400E', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={13} style={{ flexShrink: 0 }} />
            <strong>Conformidade LGPD:</strong> Este relatório não exibe dados pessoais de cidadãos (nome, telefone, endereço residencial).
          </p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC' }}>
              {['Protocolo', 'Título', 'Secretaria', 'Bairro', 'Status', 'Data'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 10, fontWeight: 700, color: '#6B7280', borderBottom: '2px solid #E5E7EB', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inPeriod.slice(0, 80).map((c, i) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 10, color: '#9CA3AF' }}>{c.protocol}</td>
                <td style={{ padding: '7px 10px', color: '#111827', fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</td>
                <td style={{ padding: '7px 10px', color: '#6B7280' }}>{c.department?.name || '—'}</td>
                <td style={{ padding: '7px 10px', color: '#6B7280' }}>{c.neighborhood || c.address || '—'}</td>
                <td style={{ padding: '7px 10px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: STATUS_DOT[c.status] || '#6B7280' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: STATUS_DOT[c.status] || '#6B7280', flexShrink: 0, display: 'inline-block' }} />
                    {STATUS_LABEL[c.status] || c.status}
                  </span>
                </td>
                <td style={{ padding: '7px 10px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>{new Date(c.createdAt).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {inPeriod.length > 80 && (
          <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 12 }}>
            Exibindo 80 de {inPeriod.length} registros. Refine o período para ver todos.
          </p>
        )}
      </>
    );

    if (activeReport === 'resolution') return (
      <>
        <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 20px' }}>
          Evolução mensal de reclamações abertas versus resolvidas — ano {new Date().getFullYear()}.
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC' }}>
              {['Mês', 'Total Aberto', 'Resolvidas', 'Taxa', 'Evolução'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '9px 12px', fontSize: 11, fontWeight: 700, color: '#6B7280', borderBottom: '2px solid #E5E7EB', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthlyData.map((m, i) => {
              const rate = m.total > 0 ? Math.round((m.resolved / m.total) * 100) : 0;
              return (
                <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                  <td style={{ padding: '9px 12px', fontWeight: 600, color: '#111827' }}>{m.label}</td>
                  <td style={{ padding: '9px 12px', color: '#374151' }}>{m.total}</td>
                  <td style={{ padding: '9px 12px', color: '#10B981', fontWeight: 600 }}>{m.resolved}</td>
                  <td style={{ padding: '9px 12px', fontWeight: 700, color: rate >= 70 ? '#10B981' : rate >= 40 ? '#F59E0B' : '#EF4444' }}>{m.total > 0 ? `${rate}%` : '—'}</td>
                  <td style={{ padding: '9px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 6, backgroundColor: '#F3F4F6', borderRadius: 999, overflow: 'hidden', maxWidth: 120 }}>
                        <div style={{ height: '100%', width: `${rate}%`, backgroundColor: '#3B82F6', borderRadius: 999 }} />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[
            { label: 'Total no ano',    value: complaints.filter(c => new Date(c.createdAt).getFullYear() === new Date().getFullYear()).length, color: '#3B82F6' },
            { label: 'Resolvidas no ano',value: complaints.filter(c => new Date(c.createdAt).getFullYear() === new Date().getFullYear() && ['resolved','closed'].includes(c.status)).length, color: '#10B981' },
            { label: 'Taxa anual',      value: (() => { const yr = complaints.filter(c => new Date(c.createdAt).getFullYear() === new Date().getFullYear()); const res = yr.filter(c => ['resolved','closed'].includes(c.status)); return yr.length > 0 ? `${Math.round((res.length/yr.length)*100)}%` : '—'; })(), color: '#6366F1' },
          ].map((k, i) => (
            <div key={i} style={{ padding: '14px', borderRadius: 8, border: '1px solid #E5E7EB', borderTop: `3px solid ${k.color}` }}>
              <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 4px', textTransform: 'uppercase', fontWeight: 700 }}>{k.label}</p>
              <p style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0 }}>{k.value}</p>
            </div>
          ))}
        </div>
      </>
    );

    if (activeReport === 'satisfaction') return (
      <>
        {!totalRatings ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
            <Star size={40} style={{ color: '#E5E7EB', marginBottom: 12 }} />
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Nenhuma avaliação registrada ainda</p>
            <p style={{ fontSize: 12, margin: '6px 0 0' }}>Os cidadãos avaliam após cada resolução de reclamação.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 28, marginBottom: 28 }}>
              <div style={{ textAlign: 'center', padding: '24px', border: '1px solid #E5E7EB', borderRadius: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', margin: '0 0 12px' }}>Média Geral</p>
                <p style={{ fontSize: 52, fontWeight: 900, color: '#F59E0B', margin: '0 0 4px' }}>{avgRating?.toFixed(1)}</p>
                <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>de 5.0 pontos</p>
                <p style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>{totalRatings} avaliação{totalRatings !== 1 ? 'ões' : ''}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
                {ratingBars.map((bar, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, width: 28, flexShrink: 0 }}>
                      <Star size={11} style={{ color: '#F59E0B' }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>{bar.label}</span>
                    </div>
                    <div style={{ flex: 1, height: 10, backgroundColor: '#F3F4F6', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(bar.count / maxRating) * 100}%`, backgroundColor: bar.color, borderRadius: 999 }} />
                    </div>
                    <span style={{ fontSize: 12, color: '#9CA3AF', width: 28, textAlign: 'right', flexShrink: 0 }}>{bar.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '12px 16px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8 }}>
              <p style={{ fontSize: 12, color: '#065F46', margin: 0 }}>
                Índice de satisfação: <strong>{avgRating && avgRating >= 4 ? 'Satisfatório' : avgRating && avgRating >= 3 ? 'Regular' : 'Precisa de atenção'}</strong> — baseado em avaliações voluntárias dos cidadãos após resolução de cada reclamação. Conformidade LGPD: avaliações são anônimas.
              </p>
            </div>
          </>
        )}
      </>
    );

    return null;
  };

  /* ─── RENDER ─────────────────────────────────────────────── */
  if (!authorized) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F1F5F9', fontFamily: FONT }}>
      <Sidebar />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── Header ── */}
        <div style={{
          backgroundColor: '#fff', boxShadow: '0 1px 0 #E2E8F0',
          padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #012235, #0ea5e9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Printer size={20} color="#02dcfb" strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>
              Relatórios
            </h1>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0, marginTop: 2 }}>
              Gere, visualize e imprima relatórios ou salve como PDF
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: '#012235', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 14, color: '#9CA3AF' }}>Carregando dados...</p>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

            {/* ── Left panel — report selector ── */}
            <div style={{
              width: 280, flexShrink: 0, overflowY: 'auto',
              padding: '20px 16px', borderRight: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px 4px' }}>
                Tipo de Relatório
              </p>
              {REPORT_TYPES.map(r => {
                const active = activeReport === r.key;
                return (
                  <button
                    key={r.key}
                    onClick={() => setActiveReport(r.key)}
                    style={{
                      width: '100%', padding: '12px 14px', textAlign: 'left',
                      borderRadius: 10, cursor: 'pointer', fontFamily: FONT,
                      border: active ? `1.5px solid ${r.color}` : '1.5px solid transparent',
                      backgroundColor: active ? '#fff' : 'transparent',
                      boxShadow: active ? `0 2px 8px ${r.color}20` : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        backgroundColor: active ? r.color : '#E5E7EB',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background-color 0.15s',
                      }}>
                        <r.Icon size={16} color={active ? '#fff' : '#9CA3AF'} strokeWidth={2} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>{r.label}</p>
                        <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0, lineHeight: 1.4, marginTop: 1 }}>{r.desc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ── Right panel — config + preview ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* Config bar */}
              <div style={{
                padding: '14px 24px', backgroundColor: '#fff',
                borderBottom: '1px solid #E2E8F0', flexShrink: 0,
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
                flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <PeriodPills value={period} onChange={setPeriod} />
                  {activeReport === 'depts' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: 0 }}>Secretarias:</p>
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>{selectedDepts.size} de {departments.length} selecionadas</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setPrintOpen(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '10px 22px', borderRadius: 8, border: 'none',
                    backgroundColor: '#012235', color: '#02dcfb',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}
                >
                  <Printer size={15} />
                  Gerar Relatório
                </button>
              </div>

              {/* Preview area */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                <div style={{
                  backgroundColor: '#fff', borderRadius: 16, padding: '28px 32px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
                }}>
                  {/* Preview header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      backgroundColor: currentReport.color + '15',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <currentReport.Icon size={18} style={{ color: currentReport.color }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0 }}>{currentReport.label}</p>
                      <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>{cityName} · {periodLabel}</p>
                    </div>
                  </div>

                  {/* Dept selector (only for depts report) */}
                  {activeReport === 'depts' && (
                    <div style={{ marginBottom: 20 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>Selecionar secretarias para o relatório:</p>
                      <DeptCheckList departments={departments} selected={selectedDepts} onChange={setSelectedDepts} />
                    </div>
                  )}

                  {/* Preview content (same as print) */}
                  {renderPrintContent()}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Print modal */}
      {printOpen && (
        <PrintModal
          title={currentReport.label}
          subtitle={printSubtitle}
          onClose={() => setPrintOpen(false)}
        >
          {renderPrintContent()}
        </PrintModal>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
