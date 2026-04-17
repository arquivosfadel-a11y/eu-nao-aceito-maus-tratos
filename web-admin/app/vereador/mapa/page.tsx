'use client';

import { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, OverlayView, InfoWindow } from '@react-google-maps/api';
import { getSession } from '@/lib/auth';
import Sidebar from '@/components/shared/Sidebar';
import {
  Map, Search, Clock, Loader2, CheckCircle2, XCircle, Image as ImageIcon,
} from 'lucide-react';

const FONT = "'Inter', system-ui, -apple-system, sans-serif";

const statusColor: Record<string, string> = {
  pending:     '#6B7280',
  validated:   '#F59E0B',
  in_progress: '#3B82F6',
  resolved:    '#10B981',
  closed:      '#10B981',
};
const statusLabel: Record<string, string> = {
  pending:     'Pendente',
  validated:   'Aguardando',
  in_progress: 'Em Andamento',
  resolved:    'Resolvida',
  closed:      'Encerrada',
};

const mapStyles = [
  { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ visibility: 'on' }, { color: '#e5f5e0' }] },
  { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
];

const FILTERS = [
  { key: 'all',         label: 'Todas',         Icon: Search,       color: '#3B82F6' },
  { key: 'validated',   label: 'Aguardando',     Icon: Clock,        color: '#F59E0B' },
  { key: 'in_progress', label: 'Em Andamento',   Icon: Loader2,      color: '#3B82F6' },
  { key: 'resolved',    label: 'Resolvidas',     Icon: CheckCircle2, color: '#10B981' },
];

const LEGEND = [
  { color: '#F59E0B', label: 'Aguardando'    },
  { color: '#3B82F6', label: 'Em Andamento'  },
  { color: '#10B981', label: 'Resolvida / Encerrada' },
];

interface Complaint {
  id: string; title: string; description: string; protocol: string;
  status: string; latitude: string; longitude: string;
  images: string[]; createdAt: string;
  citizen?: { name: string };
}

export default function VereadorMapa() {
  const [complaints,  setComplaints]  = useState<Complaint[]>([]);
  const [cityCenter,  setCityCenter]  = useState<{ lat: number; lng: number } | null>(null);
  const [stats,       setStats]       = useState<any>(null);
  const [selected,    setSelected]    = useState<Complaint | null>(null);
  const [filter,      setFilter]      = useState('all');
  const [loading,     setLoading]     = useState(true);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { user, token } = getSession();
      if (!user?.city_id || !token) { setLoading(false); return; }
      const res  = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/cities/${user.city_id}/councilman-dashboard`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      if (data.success) {
        setStats(data.dashboard.stats);
        setComplaints(data.dashboard.map_data || []);
        if (data.dashboard.city?.latitude && data.dashboard.city?.longitude) {
          setCityCenter({ lat: data.dashboard.city.latitude, lng: data.dashboard.city.longitude });
        }
      }
    } catch {} finally { setLoading(false); }
  };

  const filtered = filter === 'all' ? complaints : complaints.filter(c => {
    if (filter === 'resolved') return c.status === 'resolved' || c.status === 'closed';
    return c.status === filter;
  });

  const mapCenter = cityCenter
    || (complaints.length > 0 ? { lat: parseFloat(complaints[0].latitude), lng: parseFloat(complaints[0].longitude) } : null)
    || { lat: -23.5329, lng: -49.2441 };

  const kpiCards = [
    { label: 'TOTAL',        value: stats?.total        ?? '—', suffix: '',  border: '#3B82F6', Icon: Map         },
    { label: 'AGUARDANDO',   value: stats?.pending      ?? '—', suffix: '',  border: '#F59E0B', Icon: Clock       },
    { label: 'EM ANDAMENTO', value: stats?.in_progress  ?? '—', suffix: '',  border: '#3B82F6', Icon: Loader2     },
    { label: 'RESOLVIDAS',   value: stats ? (stats.resolved + (stats.closed ?? 0)) : '—', suffix: '', border: '#10B981', Icon: CheckCircle2 },
    { label: 'TAXA',         value: stats?.resolution_rate ?? '—', suffix: stats ? '%' : '', border: '#02DCFB', Icon: CheckCircle2 },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F1F5F9', fontFamily: FONT }}>
      <Sidebar />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Lightbox */}
        {lightboxImg && (
          <div onClick={() => setLightboxImg(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
            <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
              <img src={lightboxImg} alt="Imagem ampliada" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '12px', objectFit: 'contain', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }} />
              <button onClick={() => setLightboxImg(null)} style={{ position: 'absolute', top: '-16px', right: '-16px', background: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', color: '#111' }}>×</button>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ backgroundColor: '#fff', boxShadow: '0 1px 0 #E2E8F0', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg, #3B82F6, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Map size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>Mapa de Demandas</h1>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0, marginTop: 2 }}>Demandas encaminhadas ao seu mandato</p>
          </div>
        </div>

        {/* KPI Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, padding: '16px 32px', backgroundColor: '#F1F5F9', flexShrink: 0 }}>
          {kpiCards.map((card, i) => (
            <div key={i} style={{ backgroundColor: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)', borderBottom: `3px solid ${card.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <card.Icon size={14} style={{ color: card.border }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{card.label}</span>
              </div>
              <span style={{ fontSize: 32, fontWeight: 900, color: '#111827', lineHeight: 1 }}>{card.value}{card.suffix}</span>
            </div>
          ))}
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 8, padding: '0 32px 12px', flexShrink: 0, overflowX: 'auto' }}>
          {FILTERS.map(f => {
            const active = filter === f.key;
            return (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 999, border: active ? `1.5px solid ${f.color}` : '1.5px solid #E5E7EB', backgroundColor: active ? f.color + '12' : '#fff', color: active ? f.color : '#6B7280', fontSize: 13, fontWeight: active ? 600 : 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', fontFamily: FONT }}>
                <f.Icon size={14} strokeWidth={2} />
                {f.label}
              </button>
            );
          })}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
            {filtered.length} demanda{filtered.length !== 1 ? 's' : ''} no mapa
          </span>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, padding: '8px 32px 12px', flexShrink: 0, backgroundColor: '#fff', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', overflowX: 'auto' }}>
          {LEGEND.map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: l.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Map */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: '#3B82F6', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontSize: 14, color: '#9CA3AF', fontFamily: FONT }}>Carregando mapa...</p>
            </div>
          ) : (
            <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={mapCenter}
                zoom={14}
                options={{ styles: mapStyles, zoomControl: true, streetViewControl: false, mapTypeControl: true, fullscreenControl: true }}
              >
                {filtered.map(c =>
                  c.latitude && c.longitude ? (
                    <OverlayView
                      key={c.id}
                      position={{ lat: parseFloat(c.latitude), lng: parseFloat(c.longitude) }}
                      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    >
                      <div
                        onClick={() => setSelected(c)}
                        title={c.title}
                        style={{ cursor: 'pointer', transform: 'translate(-50%, -100%)', position: 'relative', width: '28px', height: '42px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                      >
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: statusColor[c.status] || '#6B7280', border: '2px solid rgba(255,255,255,0.4)', boxShadow: '0 3px 10px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>
                          {c.citizen?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div style={{ width: '2px', height: '14px', background: `linear-gradient(to bottom, ${statusColor[c.status] || '#6B7280'}, #888)`, borderRadius: '0 0 2px 2px', marginTop: 0 }} />
                      </div>
                    </OverlayView>
                  ) : null
                )}

                {selected && selected.latitude && selected.longitude && (
                  <InfoWindow
                    position={{ lat: parseFloat(selected.latitude), lng: parseFloat(selected.longitude) }}
                    onCloseClick={() => setSelected(null)}
                  >
                    <div style={{ maxWidth: '280px', fontFamily: FONT }}>
                      <span style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '999px', fontWeight: 600, backgroundColor: (statusColor[selected.status] || '#6B7280') + '20', color: statusColor[selected.status] || '#6B7280', display: 'inline-block', marginBottom: '8px' }}>
                        {statusLabel[selected.status] || selected.status}
                      </span>
                      <p style={{ fontWeight: 700, fontSize: '14px', margin: '0 0 4px', color: '#111827' }}>{selected.title}</p>
                      <p style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '6px' }}>
                        {selected.protocol} &bull; {new Date(selected.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                      {selected.citizen?.name && (
                        <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Cidadão: <strong>{selected.citizen.name}</strong></p>
                      )}
                      <p style={{ fontSize: '12px', color: '#4B5563', marginBottom: '8px', lineHeight: '1.4' }}>{selected.description}</p>
                      {selected.images?.length > 0 && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: '4px' }}>
                            <ImageIcon size={11} style={{ color: '#9CA3AF' }} />
                            <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>Clique para ampliar</p>
                          </div>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {selected.images.map((img, i) => (
                              <img key={i} src={img} alt={`Foto ${i + 1}`} onClick={e => { e.stopPropagation(); setLightboxImg(img); }} style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', cursor: 'zoom-in', border: '2px solid #e5e7eb' }} />
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
