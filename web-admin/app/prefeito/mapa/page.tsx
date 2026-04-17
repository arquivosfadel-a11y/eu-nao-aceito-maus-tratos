'use client';

import { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, OverlayView, InfoWindow } from '@react-google-maps/api';
import { getSession } from '@/lib/auth';
import Sidebar from '@/components/shared/Sidebar';
import {
  Map, Search, Clock, Loader2, CheckCircle2, XCircle,
  Wrench, Building2, MapPin, Image as ImageIcon,
} from 'lucide-react';

const FONT = "'Inter', system-ui, -apple-system, sans-serif";

const statusColor: Record<string, string> = {
  pending:      '#6B7280',
  validated:    '#F59E0B',
  in_progress:  '#3B82F6',
  resolved:     '#10B981',
  closed:       '#10B981',
  not_resolved: '#EF4444',
};

const statusLabel: Record<string, string> = {
  pending:      'Pendente',
  validated:    'Aguardando',
  in_progress:  'Em Andamento',
  resolved:     'Resolvida',
  closed:       'Encerrada',
  not_resolved: 'Não Resolvida',
};

const workLogColor: Record<string, string> = {
  working:  '#7C3AED',
  finished: '#6B7280',
};

const workLogLabel: Record<string, string> = {
  working:  'Trabalhando',
  finished: 'Encerrado',
};

const getDepartmentInitials = (name: string): string => {
  if (!name) return '??';
  const words = name.trim().split(' ').filter(w => w.length > 2);
  if (words.length === 0) return name.substring(0, 2).toUpperCase();
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const mapStyles = [
  { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ visibility: 'on' }, { color: '#e5f5e0' }] },
  { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
];

interface Complaint {
  id: string;
  title: string;
  description: string;
  protocol: string;
  status: string;
  latitude: string;
  longitude: string;
  images: string[];
  createdAt: string;
  department?: { id: string; name: string };
}

interface WorkLog {
  id: string;
  title: string;
  description: string;
  status: string;
  latitude: string;
  longitude: string;
  address: string;
  images: string[];
  createdAt: string;
  finished_at: string | null;
  department?: { id: string; name: string };
  secretary?: { id: string; name: string };
}

type SelectedItem = (Complaint & { _type: 'complaint' }) | (WorkLog & { _type: 'worklog' });

/* ─── FILTER PILLS CONFIG ─────────────────────────────────── */
const MAIN_FILTERS = [
  { key: 'all',          label: 'Todas',          Icon: Search,       activeColor: '#3B82F6' },
  { key: 'validated',    label: 'Aguardando',      Icon: Clock,        activeColor: '#F59E0B' },
  { key: 'in_progress',  label: 'Em Andamento',    Icon: Loader2,      activeColor: '#3B82F6' },
  { key: 'resolved',     label: 'Resolvidas',      Icon: CheckCircle2, activeColor: '#10B981' },
  { key: 'not_resolved', label: 'Não Resolvidas',  Icon: XCircle,      activeColor: '#EF4444' },
  { key: 'services',     label: 'Serviços',        Icon: Wrench,       activeColor: '#7C3AED' },
];

const SERVICE_SUB_FILTERS = [
  { key: 'all',      label: 'Todos' },
  { key: 'working',  label: 'Trabalhando' },
  { key: 'finished', label: 'Encerrado' },
];

/* ─── LEGEND ITEMS ────────────────────────────────────────── */
const COMPLAINT_LEGEND = [
  { color: '#F59E0B', label: 'Aguardando' },
  { color: '#3B82F6', label: 'Em Andamento' },
  { color: '#10B981', label: 'Resolvida / Encerrada' },
  { color: '#EF4444', label: 'Não Resolvida' },
  { color: '#7C3AED', label: 'Serviço em campo' },
];

const SERVICE_LEGEND = [
  { color: '#7C3AED', label: 'Trabalhando' },
  { color: '#6B7280', label: 'Encerrado' },
];

/* ══════════════════════════════════════════════════════════ */
function MapaPrefeito() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [cityCenter, setCityCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [selected, setSelected] = useState<SelectedItem | null>(null);
  const [filter, setFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const { user, token } = getSession();
      if (!user?.city_id || !token) { setLoading(false); return; }

      const [dashRes, workLogsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/cities/${user.city_id}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/work-logs/city/${user.city_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const dashData = await dashRes.json();
      if (dashData.success) {
        setStats(dashData.dashboard.stats);
        setComplaints(dashData.dashboard.map_data || []);
        if (dashData.dashboard.city?.latitude && dashData.dashboard.city?.longitude) {
          setCityCenter({ lat: dashData.dashboard.city.latitude, lng: dashData.dashboard.city.longitude });
        }
      }

      if (workLogsRes.ok) {
        const wlData = await workLogsRes.json();
        if (wlData.success) setWorkLogs(wlData.workLogs || []);
      }
    } catch { } finally { setLoading(false); }
  };

  const isServiceFilter = filter === 'services';

  const filteredComplaints = isServiceFilter ? [] : (filter === 'all' ? complaints : complaints.filter(c => {
    if (filter === 'resolved') return c.status === 'resolved' || c.status === 'closed';
    return c.status === filter;
  }));

  const filteredWorkLogs = isServiceFilter
    ? (serviceFilter === 'all' ? workLogs : workLogs.filter(w => w.status === serviceFilter))
    : workLogs.filter(w => w.status === 'working');

  const mapCenter = cityCenter
    || (complaints.length > 0 ? { lat: parseFloat(complaints[0].latitude), lng: parseFloat(complaints[0].longitude) } : null)
    || { lat: -23.5329, lng: -49.2441 };

  /* ─── KPI cards data ─────────────────────────────────────── */
  const kpiCards = [
    {
      label: 'TOTAL',
      value: stats?.total ?? '—',
      suffix: '',
      border: '#3B82F6',
      icon: <Map size={16} style={{ color: '#3B82F6' }} />,
    },
    {
      label: 'AGUARDANDO',
      value: stats?.pending ?? '—',
      suffix: '',
      border: '#F59E0B',
      icon: <Clock size={16} style={{ color: '#F59E0B' }} />,
    },
    {
      label: 'EM ANDAMENTO',
      value: stats?.in_progress ?? '—',
      suffix: '',
      border: '#3B82F6',
      icon: <Loader2 size={16} style={{ color: '#3B82F6' }} />,
    },
    {
      label: 'RESOLVIDAS',
      value: stats ? stats.resolved + (stats.closed ?? 0) : '—',
      suffix: '',
      border: '#10B981',
      icon: <CheckCircle2 size={16} style={{ color: '#10B981' }} />,
    },
    {
      label: 'TAXA',
      value: stats?.resolution_rate ?? '—',
      suffix: stats ? '%' : '',
      border: '#02DCFB',
      icon: <CheckCircle2 size={16} style={{ color: '#02DCFB' }} />,
    },
    {
      label: 'SERVIÇOS',
      value: workLogs.filter(w => w.status === 'working').length,
      suffix: '',
      border: '#7C3AED',
      icon: <Wrench size={16} style={{ color: '#7C3AED' }} />,
    },
  ];

  /* ─── RENDER ─────────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F1F5F9', fontFamily: FONT }}>
      <Sidebar />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── Lightbox ── */}
        {lightboxImg && (
          <div
            onClick={() => setLightboxImg(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              backgroundColor: 'rgba(0,0,0,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out',
            }}
          >
            <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
              <img
                src={lightboxImg}
                alt="Imagem ampliada"
                style={{
                  maxWidth: '90vw', maxHeight: '90vh', borderRadius: '12px',
                  objectFit: 'contain', boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                }}
              />
              <button
                onClick={() => setLightboxImg(null)}
                style={{
                  position: 'absolute', top: '-16px', right: '-16px',
                  background: '#fff', border: 'none', borderRadius: '50%',
                  width: '32px', height: '32px', fontSize: '18px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)', color: '#111',
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div style={{
          backgroundColor: '#fff',
          boxShadow: '0 1px 0 #E2E8F0',
          padding: '20px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Map size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>
              Mapa da Cidade
            </h1>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0, marginTop: 2 }}>
              Visualize reclamações e serviços em campo
            </p>
          </div>
        </div>

        {/* ── KPI Strip ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 12,
          padding: '16px 32px',
          backgroundColor: '#F1F5F9',
          flexShrink: 0,
        }}>
          {kpiCards.map((card, i) => (
            <div
              key={i}
              style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: '14px 16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
                borderBottom: `3px solid ${card.border}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                {card.icon}
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#374151',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}>
                  {card.label}
                </span>
              </div>
              <span style={{ fontSize: 32, fontWeight: 900, color: '#111827', lineHeight: 1 }}>
                {card.value}{card.suffix}
              </span>
            </div>
          ))}
        </div>

        {/* ── Filter Pills ── */}
        <div style={{
          display: 'flex',
          gap: 8,
          padding: '0 32px 12px',
          flexShrink: 0,
          overflowX: 'auto',
        }}>
          {MAIN_FILTERS.map(f => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => { setFilter(f.key); if (f.key !== 'services') setServiceFilter('all'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 999,
                  border: active ? `1.5px solid ${f.activeColor}` : '1.5px solid #E5E7EB',
                  backgroundColor: active ? f.activeColor + '12' : '#fff',
                  color: active ? f.activeColor : '#6B7280',
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                  fontFamily: FONT,
                }}
              >
                <f.Icon size={14} strokeWidth={2} />
                {f.label}
              </button>
            );
          })}
        </div>

        {/* ── Service Sub-filters ── */}
        {isServiceFilter && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 32px 12px',
            flexShrink: 0,
            backgroundColor: '#F5F3FF',
            borderTop: '1px solid #EDE9FE',
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#7C3AED', marginRight: 4 }}>
              Filtrar:
            </span>
            {SERVICE_SUB_FILTERS.map(f => {
              const active = serviceFilter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setServiceFilter(f.key)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 999,
                    border: active ? '1.5px solid #7C3AED' : '1.5px solid #DDD6FE',
                    backgroundColor: active ? '#7C3AED' : '#fff',
                    color: active ? '#fff' : '#7C3AED',
                    fontSize: 12,
                    fontWeight: active ? 600 : 500,
                    cursor: 'pointer',
                    fontFamily: FONT,
                  }}
                >
                  {f.label}
                </button>
              );
            })}
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9CA3AF' }}>
              {filteredWorkLogs.length} serviço(s) no mapa
            </span>
          </div>
        )}

        {/* ── Legend ── */}
        <div style={{
          display: 'flex',
          gap: 16,
          padding: '8px 32px 12px',
          flexShrink: 0,
          backgroundColor: '#fff',
          borderTop: '1px solid #F1F5F9',
          borderBottom: '1px solid #F1F5F9',
          overflowX: 'auto',
        }}>
          {(isServiceFilter ? SERVICE_LEGEND : COMPLAINT_LEGEND).map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: l.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* ── Map ── */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {loading ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              height: '100%', gap: 12,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                border: '3px solid #E5E7EB', borderTopColor: '#3B82F6',
                animation: 'spin 0.8s linear infinite',
              }} />
              <p style={{ fontSize: 14, color: '#9CA3AF', fontFamily: FONT }}>Carregando mapa...</p>
            </div>
          ) : (
            <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={mapCenter}
                zoom={14}
                options={{
                  styles: mapStyles,
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: true,
                  fullscreenControl: true,
                }}
              >
                {/* ── Complaint pins ── */}
                {filteredComplaints.map(complaint =>
                  complaint.latitude && complaint.longitude ? (
                    <OverlayView
                      key={`complaint-${complaint.id}`}
                      position={{ lat: parseFloat(complaint.latitude), lng: parseFloat(complaint.longitude) }}
                      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    >
                      <div
                        onClick={() => setSelected({ ...complaint, _type: 'complaint' })}
                        title={complaint.title}
                        style={{
                          cursor: 'pointer',
                          transform: 'translate(-50%, -100%)',
                          position: 'relative',
                          width: '28px',
                          height: '42px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                        }}
                      >
                        {/* Ball */}
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: statusColor[complaint.status] || '#6B7280',
                          border: '2px solid rgba(255,255,255,0.4)',
                          boxShadow: '0 3px 10px rgba(0,0,0,0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '10px',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}>
                          {getDepartmentInitials(complaint.department?.name || '')}
                        </div>
                        {/* Needle */}
                        <div style={{
                          width: '2px',
                          height: '14px',
                          background: `linear-gradient(to bottom, ${statusColor[complaint.status] || '#6B7280'}, #888)`,
                          borderRadius: '0 0 2px 2px',
                          marginTop: 0,
                        }} />
                      </div>
                    </OverlayView>
                  ) : null
                )}

                {/* ── Work log pins ── */}
                {filteredWorkLogs.map(wl =>
                  wl.latitude && wl.longitude ? (
                    <OverlayView
                      key={`worklog-${wl.id}`}
                      position={{ lat: parseFloat(wl.latitude), lng: parseFloat(wl.longitude) }}
                      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    >
                      <div
                        onClick={() => setSelected({ ...wl, _type: 'worklog' })}
                        title={wl.title}
                        style={{
                          cursor: 'pointer',
                          transform: 'translate(-50%, -100%)',
                          position: 'relative',
                          width: '28px',
                          height: '42px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                        }}
                      >
                        {/* Ball */}
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: workLogColor[wl.status] || '#7C3AED',
                          border: '2px solid rgba(255,255,255,0.4)',
                          boxShadow: '0 3px 10px rgba(0,0,0,0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Wrench size={13} color="#fff" strokeWidth={2.5} />
                        </div>
                        {/* Needle */}
                        <div style={{
                          width: '2px',
                          height: '14px',
                          background: `linear-gradient(to bottom, ${workLogColor[wl.status] || '#7C3AED'}, #888)`,
                          borderRadius: '0 0 2px 2px',
                          marginTop: 0,
                        }} />
                      </div>
                    </OverlayView>
                  ) : null
                )}

                {/* ── InfoWindow — Complaint ── */}
                {selected?._type === 'complaint' && selected.latitude && selected.longitude && (
                  <InfoWindow
                    position={{ lat: parseFloat(selected.latitude), lng: parseFloat(selected.longitude) }}
                    onCloseClick={() => setSelected(null)}
                  >
                    <div style={{ maxWidth: '280px', fontFamily: FONT }}>
                      <span style={{
                        fontSize: '11px', padding: '2px 10px', borderRadius: '999px', fontWeight: 600,
                        backgroundColor: (statusColor[selected.status] || '#6B7280') + '20',
                        color: statusColor[selected.status] || '#6B7280',
                        display: 'inline-block', marginBottom: '8px',
                      }}>
                        {statusLabel[selected.status] || selected.status}
                      </span>
                      <p style={{ fontWeight: 700, fontSize: '14px', margin: '0 0 4px', color: '#111827' }}>
                        {selected.title}
                      </p>
                      <p style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '6px' }}>
                        {selected.protocol} &bull; {new Date(selected.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                      <p style={{ fontSize: '12px', color: '#4B5563', marginBottom: '8px', lineHeight: '1.4' }}>
                        {selected.description}
                      </p>
                      {selected.department && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: '8px' }}>
                          <Building2 size={12} style={{ color: '#6B7280', flexShrink: 0 }} />
                          <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>
                            <strong>{selected.department.name}</strong>
                          </p>
                        </div>
                      )}
                      {selected.images?.length > 0 && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: '4px' }}>
                            <ImageIcon size={11} style={{ color: '#9CA3AF' }} />
                            <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>Clique para ampliar</p>
                          </div>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {selected.images.map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt={`Foto ${i + 1}`}
                                onClick={(e) => { e.stopPropagation(); setLightboxImg(img); }}
                                style={{
                                  width: '80px', height: '80px', borderRadius: '8px',
                                  objectFit: 'cover', cursor: 'zoom-in', border: '2px solid #e5e7eb',
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </InfoWindow>
                )}

                {/* ── InfoWindow — WorkLog ── */}
                {selected?._type === 'worklog' && selected.latitude && selected.longitude && (
                  <InfoWindow
                    position={{ lat: parseFloat(selected.latitude), lng: parseFloat(selected.longitude) }}
                    onCloseClick={() => setSelected(null)}
                  >
                    <div style={{ maxWidth: '280px', fontFamily: FONT }}>
                      <span style={{
                        fontSize: '11px', padding: '2px 10px', borderRadius: '999px', fontWeight: 600,
                        backgroundColor: (workLogColor[selected.status] || '#7C3AED') + '20',
                        color: workLogColor[selected.status] || '#7C3AED',
                        display: 'inline-block', marginBottom: '8px',
                      }}>
                        {workLogLabel[selected.status]}
                      </span>
                      <p style={{ fontWeight: 700, fontSize: '14px', margin: '0 0 4px', color: '#111827' }}>
                        {selected.title}
                      </p>
                      <p style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '6px' }}>
                        {new Date(selected.createdAt).toLocaleDateString('pt-BR')}
                        {selected.finished_at ? ` → ${new Date(selected.finished_at).toLocaleDateString('pt-BR')}` : ''}
                      </p>
                      {selected.description && (
                        <p style={{ fontSize: '12px', color: '#4B5563', marginBottom: '8px', lineHeight: '1.4' }}>
                          {selected.description}
                        </p>
                      )}
                      {selected.address && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: '6px' }}>
                          <MapPin size={12} style={{ color: '#6B7280', flexShrink: 0 }} />
                          <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>{selected.address}</p>
                        </div>
                      )}
                      {selected.department && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: '4px' }}>
                          <Building2 size={12} style={{ color: '#6B7280', flexShrink: 0 }} />
                          <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>
                            <strong>{selected.department.name}</strong>
                          </p>
                        </div>
                      )}
                      {selected.images?.length > 0 && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: '4px' }}>
                            <ImageIcon size={11} style={{ color: '#9CA3AF' }} />
                            <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>Clique para ampliar</p>
                          </div>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {selected.images.map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt={`Foto ${i + 1}`}
                                onClick={(e) => { e.stopPropagation(); setLightboxImg(img); }}
                                style={{
                                  width: '80px', height: '80px', borderRadius: '8px',
                                  objectFit: 'cover', cursor: 'zoom-in', border: '2px solid #e5e7eb',
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </LoadScript>
          )}
        </div>

      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

import dynamic from 'next/dynamic';
export default dynamic(() => Promise.resolve(MapaPrefeito), { ssr: false });
