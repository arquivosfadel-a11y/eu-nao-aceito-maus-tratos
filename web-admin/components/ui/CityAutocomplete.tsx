'use client';

import { useState, useEffect, useRef } from 'react';

interface IbgeMunicipio {
  nome: string;
  microrregiao: { mesorregiao: { UF: { sigla: string } } };
}

let ibgeCache: string[] | null = null;
let loadingPromise: Promise<void> | null = null;

function loadIbge(): Promise<void> {
  if (ibgeCache) return Promise.resolve();
  if (loadingPromise) return loadingPromise;
  loadingPromise = fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome')
    .then(r => r.json())
    .then((data: IbgeMunicipio[]) => {
      ibgeCache = data.map(m => `${m.nome} — ${m.microrregiao.mesorregiao.UF.sigla}`);
    });
  return loadingPromise;
}

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
}

export default function CityAutocomplete({ value, onChange, className, required }: Props) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [ibgeLoaded, setIbgeLoaded] = useState(!!ibgeCache);
  const [ibgeLoading, setIbgeLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    if (ibgeCache) return;
    setIbgeLoading(true);
    loadIbge().then(() => { setIbgeLoaded(true); setIbgeLoading(false); });
  }, []);

  useEffect(() => {
    if (!ibgeLoaded || query.length < 3) { setSuggestions([]); setOpen(false); return; }
    const q = normalize(query);
    const matches = ibgeCache!.filter(c => normalize(c).includes(q)).slice(0, 8);
    setSuggestions(matches);
    setOpen(matches.length > 0);
  }, [query, ibgeLoaded]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const select = (label: string) => { setQuery(label); onChange(label); setOpen(false); };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); }}
          onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }}
          placeholder={ibgeLoading ? 'Carregando cidades...' : 'Digite o nome da cidade...'}
          className={className}
          required={required}
          disabled={ibgeLoading}
          autoComplete="off"
        />
        {ibgeLoading && (
          <span style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            width: 14, height: 14, borderRadius: '50%',
            border: '2px solid #D1FAE5', borderTopColor: '#1B4332',
            display: 'inline-block', animation: 'spin 0.85s linear infinite',
          }} />
        )}
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: '#fff', border: '1.5px solid #D1FAE5', borderRadius: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.10)', marginTop: 4, overflow: 'hidden',
        }}>
          {suggestions.map((s, i) => (
            <button key={i} type="button" onClick={() => select(s)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '9px 14px', fontSize: 13, color: '#374151',
              background: 'transparent', border: 'none', cursor: 'pointer',
              borderBottom: i < suggestions.length - 1 ? '1px solid #F0F7F4' : 'none',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F0F7F4')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}
