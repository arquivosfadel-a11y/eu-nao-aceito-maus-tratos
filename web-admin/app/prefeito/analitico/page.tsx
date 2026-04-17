'use client';

import { useState, useEffect, useRef } from 'react';
import { getSession } from '@/lib/auth';
import Sidebar from '@/components/shared/Sidebar';
import {
  BarChart2, Clock, Loader2, CheckCircle2, TrendingUp,
  Star, Map, Building2, Tag, Trophy, Medal,
  Maximize2,
} from 'lucide-react';

const FONT = "'Inter', system-ui, -apple-system, sans-serif";

/* ─── Types ─────────────────────────────────────────────── */
interface MonthData { month: string; total: number; resolved: number }
interface DeptStat {
  id: string; name: string; total: number; resolved: number;
  in_progress: number; resolution_rate: number; avg_rating: number | null;
}
interface Satisfaction {
  total: number; average: number | null;
  five_stars: number; four_stars: number; three_stars: number;
  two_stars: number; one_star: number;
}
interface HeatmapPoint { id: string; latitude: string; longitude: string; status: string }
interface Analytics {
  complaints_by_month: MonthData[]; department_stats: DeptStat[];
  heatmap_data: HeatmapPoint[]; satisfaction: Satisfaction;
  top_categories: { category: string; total: number }[];
}
interface Stats {
  total: number; resolved: number; in_progress: number;
  pending: number; resolution_rate: string; closed?: number;
}

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

/* ─── BarChart ───────────────────────────────────────────── */
function BarChart({ data }: { data: MonthData[] }) {
  if (!data?.length) return (
    <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '40px', fontFamily: FONT }}>
      Sem dados disponíveis
    </div>
  );
  const maxVal = Math.max(...data.map(d => Number(d.total)), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '160px', padding: '0 8px' }}>
      {data.map((d, i) => {
        const month = new Date(d.month);
        const totalH  = (Number(d.total)    / maxVal) * 140;
        const resolvedH = (Number(d.resolved) / maxVal) * 140;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{
              position: 'relative', width: '100%', height: '140px',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '2px',
            }}>
              <div title={`Total: ${d.total}`} style={{
                width: '45%', height: `${totalH}px`, backgroundColor: '#3B82F6',
                borderRadius: '4px 4px 0 0', minHeight: '4px', transition: 'height 0.5s ease',
              }} />
              <div title={`Resolvidas: ${d.resolved}`} style={{
                width: '45%', height: `${resolvedH}px`, backgroundColor: '#10B981',
                borderRadius: '4px 4px 0 0', minHeight: '4px', transition: 'height 0.5s ease',
              }} />
            </div>
            <span style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: FONT }}>
              {MONTH_NAMES[month.getMonth()]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── LeafletMap ─────────────────────────────────────────── */
function LeafletMap({ data, cityCenter, height = '320px', mode = 'all' }: {
  data: HeatmapPoint[];
  cityCenter: { lat: number; lng: number } | null;
  height?: string;
  mode?: 'all' | 'resolved' | 'comparative';
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    const loadLeaflet = async () => {
      if (!(window as any).L) {
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css'; link.rel = 'stylesheet';
          link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
          document.head.appendChild(link);
        }
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }
      return (window as any).L;
    };

    const initMap = async () => {
      if (!mapRef.current) return;
      const L = await loadLeaflet();
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }

      const defaultLat = cityCenter?.lat || -23.5505;
      const defaultLng = cityCenter?.lng || -46.6333;
      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true });
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap', maxZoom: 19,
      }).addTo(map);

      if (data.length === 0) { map.setView([defaultLat, defaultLng], 13); return; }

      const bounds: [number, number][] = [];

      if (mode === 'comparative') {
        /* ── Comparative: split into open + resolved clusters ── */
        const openPts     = data.filter(p => !['resolved','closed'].includes(p.status));
        const resolvedPts = data.filter(p =>  ['resolved','closed'].includes(p.status));

        type SC = { lat: number; lng: number; count: number };
        const buildClusters = (pts: HeatmapPoint[]): SC[] => {
          const cs: SC[] = [];
          pts.forEach(pt => {
            const lat = parseFloat(pt.latitude), lng = parseFloat(pt.longitude);
            if (isNaN(lat) || isNaN(lng)) return;
            bounds.push([lat, lng]);
            const ex = cs.find(c => Math.abs(c.lat - lat) < 0.002 && Math.abs(c.lng - lng) < 0.002);
            if (ex) ex.count++; else cs.push({ lat, lng, count: 1 });
          });
          return cs;
        };

        const rc = buildClusters(resolvedPts);
        const oc = buildClusters(openPts);
        const maxC = Math.max(...rc.map(c => c.count), ...oc.map(c => c.count), 1);

        /* resolved — green filled halos */
        rc.forEach(c => {
          const intensity = c.count / maxC;
          const r = 80 + intensity * 200;
          L.circle([c.lat, c.lng], { radius: r, color: 'transparent', fillColor: '#10B981', fillOpacity: 0.15 + intensity * 0.35 }).addTo(map);
          L.circle([c.lat, c.lng], { radius: r * 0.4, color: 'transparent', fillColor: '#34D399', fillOpacity: 0.3 + intensity * 0.4 }).addTo(map);
          const size = c.count > 1 ? 16 : 12;
          const icon = L.divIcon({
            html: c.count > 1
              ? `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#10B981;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:700">${c.count}</div>`
              : `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#10B981;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
            iconSize: [size, size], iconAnchor: [size/2, size/2], className: '',
          });
          L.marker([c.lat, c.lng], { icon }).addTo(map);
        });

        /* open — red hollow rings */
        oc.forEach(c => {
          const intensity = c.count / maxC;
          const r = 80 + intensity * 200;
          L.circle([c.lat, c.lng], { radius: r, color: '#EF4444', weight: 2, fill: false, fillOpacity: 0 }).addTo(map);
          const size = c.count > 1 ? 16 : 12;
          const icon = L.divIcon({
            html: c.count > 1
              ? `<div style="width:${size}px;height:${size}px;border-radius:50%;background:transparent;border:2px solid #EF4444;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#EF4444;font-size:9px;font-weight:700">${c.count}</div>`
              : `<div style="width:${size}px;height:${size}px;border-radius:50%;background:transparent;border:2px solid #EF4444;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
            iconSize: [size, size], iconAnchor: [size/2, size/2], className: '',
          });
          L.marker([c.lat, c.lng], { icon }).addTo(map);
        });

      } else {
        /* ── Standard mode (all / resolved) ── */
        const clusters: { lat: number; lng: number; count: number; hasOpen: boolean }[] = [];
        data.forEach(point => {
          const lat = parseFloat(point.latitude);
          const lng = parseFloat(point.longitude);
          if (isNaN(lat) || isNaN(lng)) return;
          bounds.push([lat, lng]);
          const isOpen = !['resolved','closed'].includes(point.status);
          const existing = clusters.find(c => Math.abs(c.lat - lat) < 0.002 && Math.abs(c.lng - lng) < 0.002);
          if (existing) { existing.count++; if (isOpen) existing.hasOpen = true; }
          else clusters.push({ lat, lng, count: 1, hasOpen: isOpen });
        });

        const maxCount = Math.max(...clusters.map(c => c.count), 1);
        clusters.forEach(cluster => {
          const intensity  = cluster.count / maxCount;
          const haloRadius = 80 + intensity * 200;
          L.circle([cluster.lat, cluster.lng], {
            radius: haloRadius, color: 'transparent',
            fillColor: cluster.hasOpen ? '#EF4444' : '#10B981',
            fillOpacity: 0.15 + intensity * 0.35,
          }).addTo(map);
          L.circle([cluster.lat, cluster.lng], {
            radius: haloRadius * 0.4, color: 'transparent',
            fillColor: cluster.hasOpen ? '#F97316' : '#34D399',
            fillOpacity: 0.3 + intensity * 0.4,
          }).addTo(map);
          const dotColor = cluster.hasOpen ? '#EF4444' : '#10B981';
          const size = cluster.count > 1 ? 16 : 12;
          const icon = L.divIcon({
            html: cluster.count > 1
              ? `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${dotColor};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:700">${cluster.count}</div>`
              : `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${dotColor};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
            iconSize: [size, size], iconAnchor: [size/2, size/2], className: '',
          });
          L.marker([cluster.lat, cluster.lng], { icon }).addTo(map);
        });
      }

      if (bounds.length > 0) map.fitBounds(bounds as any, { padding: [50, 50] });
    };

    initMap();
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [data, cityCenter, mode]);

  return (
    <div style={{ position: 'relative' }}>
      <div ref={mapRef} style={{ width: '100%', height, borderRadius: '12px', overflow: 'hidden' }} />
      <div style={{
        position: 'absolute', bottom: '10px', left: '10px', zIndex: 1000,
        backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '8px',
        padding: '6px 12px', fontSize: '11px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        display: 'flex', gap: '12px', alignItems: 'center', fontFamily: FONT,
      }}>
        {mode === 'comparative' ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2px solid #EF4444', backgroundColor: 'transparent' }} />
              <span style={{ color: '#374151', fontWeight: 500 }}>Em aberto</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              <span style={{ color: '#374151', fontWeight: 500 }}>Resolvida</span>
            </div>
          </>
        ) : (
          [['#EF4444','Em aberto'],['#10B981','Resolvida']].map(([c, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: c }} />
              <span style={{ color: '#374151', fontWeight: 500 }}>{l}</span>
            </div>
          ))
        )}
        <span style={{ color: '#9CA3AF', borderLeft: '1px solid #E5E7EB', paddingLeft: '8px' }}>
          {data.length} ocorrências
        </span>
      </div>
    </div>
  );
}

/* ─── HeatmapGrid ────────────────────────────────────────── */
function HeatmapGrid({ data, cityCenter, mode = 'all' }: {
  data: HeatmapPoint[];
  cityCenter: { lat: number; lng: number } | null;
  mode?: 'all' | 'resolved' | 'comparative';
}) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!data?.length) return (
    <div style={{
      height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#F8FAFC', borderRadius: '12px', color: '#94A3B8',
      border: '1px dashed #E2E8F0', fontFamily: FONT,
    }}>
      <div style={{ textAlign: 'center' }}>
        <Map size={32} style={{ color: '#CBD5E1', marginBottom: 8 }} />
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Nenhuma reclamação com localização</p>
        <p style={{ margin: '4px 0 0', fontSize: '11px' }}>Ocorrências com GPS aparecerão aqui</p>
      </div>
    </div>
  );

  return (
    <>
      {modalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          backgroundColor: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        }}>
          <div style={{
            width: '100%', maxWidth: '1100px', backgroundColor: '#fff',
            borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}>
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid #E5E7EB',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: '#012235',
            }}>
              <div>
                <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '16px', margin: 0, fontFamily: FONT }}>
                  Mapa de Calor Geográfico
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '2px 0 0', fontFamily: FONT }}>
                  {data.length} ocorrências registradas com localização
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
                  borderRadius: '8px', padding: '6px 14px', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 600, fontFamily: FONT,
                }}
              >
                Fechar
              </button>
            </div>
            <LeafletMap data={data} cityCenter={cityCenter} height="70vh" mode={mode} />
          </div>
        </div>
      )}

      <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setModalOpen(true)}>
        <LeafletMap data={data} cityCenter={cityCenter} height="320px" mode={mode} />
        <div style={{
          position: 'absolute', top: '10px', right: '10px', zIndex: 1000,
          backgroundColor: 'rgba(1,34,53,0.85)', borderRadius: '8px',
          padding: '5px 10px', fontSize: '11px', color: '#02dcfb', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '5px', pointerEvents: 'none',
          fontFamily: FONT,
        }}>
          <Maximize2 size={12} />
          Expandir mapa
        </div>
      </div>
    </>
  );
}

/* ─── Medal helper ───────────────────────────────────────── */
function MedalIcon({ i }: { i: number }) {
  if (i === 0) return <Trophy size={14} style={{ color: '#F59E0B', flexShrink: 0 }} />;
  if (i === 1) return <Medal  size={14} style={{ color: '#94A3B8', flexShrink: 0 }} />;
  if (i === 2) return <Medal  size={14} style={{ color: '#C2855A', flexShrink: 0 }} />;
  return null;
}

/* ══════════════════════════════════════════════════════════ */
function DashboardAnalytico() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [cityCenter, setCityCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [cityName, setCityName] = useState('');
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('6m');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [allComplaintsRaw, setAllComplaintsRaw] = useState<any[]>([]);
  const [heatmapMode, setHeatmapMode] = useState<'all' | 'resolved' | 'comparative'>('all');

  useEffect(() => { fetchData(); }, []);

  const buildMonthData = (complaints: any[], year: number) => {
    const monthMap: Record<string, { total: number; resolved: number }> = {};
    for (let m = 0; m < 12; m++) {
      const key = `${year}-${String(m + 1).padStart(2, '0')}`;
      monthMap[key] = { total: 0, resolved: 0 };
    }
    complaints.forEach((c: any) => {
      const d = new Date(c.createdAt);
      if (d.getFullYear() !== year) return;
      const key = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key].total++;
      if (['resolved','closed'].includes(c.status)) monthMap[key].resolved++;
    });
    return Object.entries(monthMap).map(([key, v]) => ({ month: key + '-01', total: v.total, resolved: v.resolved }));
  };

  useEffect(() => {
    if (!allComplaintsRaw.length || !analytics) return;
    setAnalytics(prev => prev ? { ...prev, complaints_by_month: buildMonthData(allComplaintsRaw, selectedYear) } : prev);
  }, [selectedYear, allComplaintsRaw]);

  const fetchData = async () => {
    try {
      const { user, token } = getSession();
      if (!user?.city_id || !token) { setLoading(false); return; }
      const headers = { Authorization: `Bearer ${token}` };
      const base = process.env.NEXT_PUBLIC_API_URL;

      const [dashRes, analyticsRes, complaintsRes] = await Promise.all([
        fetch(`${base}/cities/${user.city_id}/dashboard`, { headers }),
        fetch(`${base}/cities/${user.city_id}/analytics`, { headers }),
        fetch(`${base}/complaints?city_id=${user.city_id}&limit=500`, { headers }),
      ]);

      const dashData = await dashRes.json();
      if (dashData.success) {
        setStats(dashData.dashboard.stats);
        setCityName(dashData.dashboard.city?.name || '');
        if (dashData.dashboard.city?.latitude && dashData.dashboard.city?.longitude) {
          setCityCenter({ lat: dashData.dashboard.city.latitude, lng: dashData.dashboard.city.longitude });
        }
      }

      const analyticsData = await analyticsRes.json();
      const complaintsData = await complaintsRes.json();
      const allComplaints = (complaintsData.complaints || []).filter((c: any) =>
        !['pending','rejected'].includes(c.status)
      );
      setAllComplaintsRaw(allComplaints);

      const complaints_by_month = buildMonthData(allComplaints, new Date().getFullYear());
      const heatmap_data = allComplaints
        .filter((c: any) => c.latitude && c.longitude)
        .map((c: any) => ({ id: c.id, latitude: c.latitude, longitude: c.longitude, status: c.status }));

      let department_stats = analyticsData?.analytics?.department_stats || [];
      if (!department_stats.length && dashData.success) {
        department_stats = (dashData.dashboard.departments || []).map((d: any) => ({
          id: d.id, name: d.name,
          total: d.total_complaints, resolved: d.resolved_complaints,
          in_progress: 0,
          resolution_rate: d.total_complaints > 0
            ? parseFloat(((d.resolved_complaints / d.total_complaints) * 100).toFixed(1)) : 0,
          avg_rating: null,
        }));
      }
      if (!department_stats.length) {
        const deptMap: Record<string, any> = {};
        allComplaints.forEach((c: any) => {
          const id = c.department_id || c.department?.id;
          const name = c.department?.name || 'Sem Secretaria';
          if (!id) return;
          if (!deptMap[id]) deptMap[id] = { id, name, total: 0, resolved: 0, in_progress: 0 };
          deptMap[id].total++;
          if (['resolved','closed'].includes(c.status)) deptMap[id].resolved++;
          if (c.status === 'in_progress') deptMap[id].in_progress++;
        });
        department_stats = Object.values(deptMap).map((d: any) => ({
          ...d,
          resolution_rate: d.total > 0 ? parseFloat(((d.resolved / d.total) * 100).toFixed(1)) : 0,
          avg_rating: null,
        }));
      }

      setAnalytics({
        complaints_by_month, department_stats, heatmap_data,
        satisfaction: analyticsData?.analytics?.satisfaction || {
          total: 0, average: null, five_stars: 0, four_stars: 0,
          three_stars: 0, two_stars: 0, one_star: 0,
        },
        top_categories: analyticsData?.analytics?.top_categories || [],
      });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const satisfaction = analytics?.satisfaction;
  const avgRating   = satisfaction?.average ? parseFloat(String(satisfaction.average)) : null;
  const totalRatings = satisfaction?.total || 0;
  const satisfactionPercent = avgRating ? Math.round((avgRating / 5) * 100) : 0;

  const ratingBars = [
    { label: '5', count: satisfaction?.five_stars  || 0, color: '#3B82F6' },
    { label: '4', count: satisfaction?.four_stars  || 0, color: '#3B82F6' },
    { label: '3', count: satisfaction?.three_stars || 0, color: '#3B82F6' },
    { label: '2', count: satisfaction?.two_stars   || 0, color: '#3B82F6' },
    { label: '1', count: satisfaction?.one_star    || 0, color: '#3B82F6' },
  ];
  const maxRatingCount = Math.max(...ratingBars.map(r => r.count), 1);

  /* ─── KPI cards ─────────────────────────────────────────── */
  const kpiCards = [
    { label: 'TOTAL',        value: stats?.total ?? '—',       suffix: '',  border: '#3B82F6', Icon: BarChart2    },
    { label: 'AGUARDANDO',   value: stats?.pending ?? '—',     suffix: '',  border: '#F59E0B', Icon: Clock        },
    { label: 'EM ANDAMENTO', value: stats?.in_progress ?? '—', suffix: '',  border: '#8B5CF6', Icon: Loader2      },
    {
      label: 'RESOLVIDAS',
      value: stats ? (stats.resolved + (stats.closed ?? 0)) : '—',
      suffix: '', border: '#10B981', Icon: CheckCircle2,
    },
    { label: 'TAXA',         value: stats?.resolution_rate ?? '—', suffix: stats ? '%' : '', border: '#02DCFB', Icon: TrendingUp },
  ];

  /* ─── RENDER ─────────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F1F5F9', fontFamily: FONT }}>
      <Sidebar />

      <main style={{ flex: 1, overflowY: 'auto' }}>

        {/* ── Header ── */}
        <div style={{
          backgroundColor: '#fff',
          boxShadow: '0 1px 0 #E2E8F0',
          padding: '20px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BarChart2 size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 21, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>
              Dashboard Analítico
            </h1>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0, marginTop: 2 }}>
              {cityName ? `${cityName} — ` : ''}Inteligência de dados em tempo real
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { key: '6m', label: '6 meses' },
              { key: '3m', label: '3 meses' },
              { key: '1m', label: '1 mês'   },
            ].map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)} style={{
                padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: 600, fontFamily: FONT,
                backgroundColor: period === p.key ? '#012235' : '#F3F4F6',
                color: period === p.key ? '#02dcfb' : '#6B7280',
                transition: 'all 0.15s',
              }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: '3px solid #E5E7EB', borderTopColor: '#6366F1',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ fontSize: 14, color: '#9CA3AF', fontFamily: FONT }}>Carregando dados analíticos...</p>
          </div>
        ) : (
          <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* ── KPI Grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
              {kpiCards.map((card, i) => (
                <div key={i} style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
                  borderBottom: `4px solid ${card.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <card.Icon size={14} style={{ color: card.border }} />
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: '#374151',
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                    }}>
                      {card.label}
                    </span>
                  </div>
                  <span style={{ fontSize: 44, fontWeight: 900, color: '#111827', lineHeight: 1 }}>
                    {card.value}{card.suffix}
                  </span>
                </div>
              ))}
            </div>

            {/* ── Bar Chart + Satisfaction ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>

              {/* Bar Chart */}
              <div style={{
                backgroundColor: '#fff', borderRadius: 16, padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BarChart2 size={16} style={{ color: '#6366F1' }} />
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>
                      Reclamações por Mês
                    </h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#3B82F6' }} />
                        <span style={{ color: '#6B7280' }}>Total</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#10B981' }} />
                        <span style={{ color: '#6B7280' }}>Resolvidas</span>
                      </div>
                    </div>
                    {/* Year filter */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[2024, 2025, 2026, 2027].map(y => (
                        <button key={y} onClick={() => setSelectedYear(y)} style={{
                          padding: '3px 10px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                          fontSize: '11px', fontWeight: 600, fontFamily: FONT,
                          backgroundColor: selectedYear === y ? '#111827' : '#F3F4F6',
                          color: selectedYear === y ? '#fff' : '#6B7280',
                          transition: 'all 0.15s',
                        }}>
                          {y}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <BarChart data={(() => {
                  const all = analytics?.complaints_by_month || [];
                  if (period === '1m') return all.slice(-1);
                  if (period === '3m') return all.slice(-3);
                  return all; // '6m' — padrão: todos os 12 meses, mas mostrar 6 mais recentes
                })()} />
              </div>

              {/* Satisfaction */}
              <div style={{
                backgroundColor: '#fff', borderRadius: 16, padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '20px' }}>
                  <Star size={16} style={{ color: '#F59E0B' }} />
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>
                    Índice de Satisfação Cidadã
                  </h3>
                </div>
                {totalRatings === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: '#9CA3AF', fontFamily: FONT }}>
                    <Star size={40} style={{ color: '#E5E7EB', marginBottom: 8 }} />
                    <p style={{ fontSize: '13px', margin: 0 }}>Nenhuma avaliação ainda</p>
                    <p style={{ fontSize: '11px', marginTop: 4, lineHeight: 1.5 }}>
                      Os cidadãos avaliam após cada resolução.
                    </p>
                  </div>
                ) : (
                  <>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                      <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        border: '6px solid #3B82F6',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '8px',
                      }}>
                        <span style={{ fontSize: '24px', fontWeight: 800, color: '#3B82F6' }}>
                          {avgRating?.toFixed(1)}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#3B82F6', margin: '4px 0' }}>
                        {satisfactionPercent >= 70 ? 'Satisfatório' : satisfactionPercent >= 40 ? 'Regular' : 'Insatisfatório'}
                      </p>
                      <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>
                        Baseado em {totalRatings} avaliação{totalRatings !== 1 ? 'ões' : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {ratingBars.map((bar, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 2, width: 28 }}>
                            <Star size={10} style={{ color: '#F59E0B' }} />
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280' }}>{bar.label}</span>
                          </div>
                          <div style={{ flex: 1, height: '8px', backgroundColor: '#DBEAFE', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: '4px',
                              backgroundColor: bar.color,
                              width: `${(bar.count / maxRatingCount) * 100}%`,
                              transition: 'width 0.6s ease',
                            }} />
                          </div>
                          <span style={{ fontSize: '11px', color: '#9CA3AF', width: '20px', textAlign: 'right' }}>
                            {bar.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── Heatmap + Department Performance ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

              {/* Heatmap */}
              <div style={{
                backgroundColor: '#fff', borderRadius: 16, padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Map size={16} style={{ color: '#3B82F6' }} />
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>
                      Mapa de Calor Geográfico
                    </h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {[
                      { key: 'all',         label: 'Registradas' },
                      { key: 'resolved',    label: 'Resolvidas'  },
                      { key: 'comparative', label: 'Comparativo' },
                    ].map(m => (
                      <button key={m.key} onClick={() => setHeatmapMode(m.key as 'all' | 'resolved' | 'comparative')} style={{
                        padding: '3px 10px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                        fontSize: '11px', fontWeight: 600, fontFamily: FONT,
                        backgroundColor: heatmapMode === m.key ? '#111827' : '#F3F4F6',
                        color: heatmapMode === m.key ? '#fff' : '#6B7280',
                        transition: 'all 0.15s',
                      }}>{m.label}</button>
                    ))}
                    <span style={{
                      fontSize: '11px', fontWeight: 600, color: '#6B7280',
                      backgroundColor: '#F3F4F6', padding: '4px 10px', borderRadius: '20px',
                    }}>
                      {heatmapMode === 'resolved'
                        ? (analytics?.heatmap_data || []).filter(p => ['resolved','closed'].includes(p.status)).length
                        : analytics?.heatmap_data?.length || 0} ocorrências
                    </span>
                  </div>
                </div>
                <HeatmapGrid
                  data={heatmapMode === 'resolved'
                    ? (analytics?.heatmap_data || []).filter(p => ['resolved','closed'].includes(p.status))
                    : (analytics?.heatmap_data || [])}
                  cityCenter={cityCenter}
                  mode={heatmapMode}
                />
                <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '8px', textAlign: 'center' }}>
                  {heatmapMode === 'resolved'
                    ? 'Concentração de reclamações resolvidas · pontos verdes = alta concentração'
                    : heatmapMode === 'comparative'
                    ? 'Comparativo · anel vermelho vazado = em aberto · verde preenchido = resolvida'
                    : 'Mapa real da cidade · pontos vermelhos = em aberto · verdes = resolvidas'}
                </p>
              </div>

              {/* Dept performance */}
              <div style={{
                backgroundColor: '#fff', borderRadius: 16, padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Building2 size={16} style={{ color: '#8B5CF6' }} />
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>
                      Desempenho por Secretaria
                    </h3>
                  </div>
                  <span style={{ fontSize: '11px', color: '#9CA3AF' }}>ordenado por % resolução</span>
                </div>

                {!analytics?.department_stats?.length ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#9CA3AF', fontFamily: FONT }}>
                    <p>Nenhuma secretaria com dados ainda</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', maxHeight: '320px', overflowY: 'auto' }}>
                    {[...analytics.department_stats]
                      .sort((a, b) => b.resolution_rate - a.resolution_rate)
                      .map((dept) => {
                        const rate = dept.resolution_rate;
                        return (
                          <div
                            key={dept.id}
                            style={{
                              borderRadius: '10px',
                              padding: '12px 14px',
                              backgroundColor: '#fff',
                              border: '1px solid #E5E7EB',
                              borderLeft: '3px solid #3B82F6',
                              transition: 'box-shadow 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 10px rgba(59,130,246,0.1)')}
                            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                  fontSize: '13px', fontWeight: 600, color: '#111827', margin: 0,
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                  {dept.name}
                                </p>
                                <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '2px 0 0' }}>
                                  {dept.resolved}/{dept.total} resolvidas
                                </p>
                              </div>
                              <span style={{
                                fontSize: '15px', fontWeight: 700, color: '#1E40AF',
                                marginLeft: '8px', flexShrink: 0,
                              }}>
                                {rate}%
                              </span>
                            </div>
                            <div style={{ height: '7px', backgroundColor: '#EFF6FF', borderRadius: '999px', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', borderRadius: '999px', transition: 'width 0.8s ease',
                                width: `${rate}%`, minWidth: rate > 0 ? '4px' : '0',
                                backgroundColor: '#3B82F6',
                              }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Top Categories ── */}
            {(analytics?.top_categories?.length ?? 0) > 0 && (
              <div style={{
                backgroundColor: '#fff', borderRadius: 16, padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '16px' }}>
                  <Tag size={16} style={{ color: '#F59E0B' }} />
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>
                    Principais Categorias de Reclamações
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {analytics!.top_categories.map((cat, i) => {
                    const colors = ['#3B82F6','#8B5CF6','#F59E0B','#10B981','#EF4444'];
                    const c = colors[i % colors.length];
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        backgroundColor: c + '15', borderRadius: '20px',
                        padding: '8px 16px', border: `1px solid ${c}30`,
                      }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: c }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                          {cat.category || 'Outros'}
                        </span>
                        <span style={{
                          fontSize: '12px', fontWeight: 700, color: c,
                          backgroundColor: c + '20', borderRadius: '10px', padding: '1px 8px',
                        }}>
                          {cat.total}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default DashboardAnalytico;
