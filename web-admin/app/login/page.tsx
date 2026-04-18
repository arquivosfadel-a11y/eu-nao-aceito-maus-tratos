'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, LogIn, AlertCircle, Eye, EyeOff,
  PawPrint, Heart, Shield,
} from 'lucide-react';
import { login, saveSession, getRedirectByRole } from '@/lib/auth';

const PRIMARY   = '#1B4332';
const SECONDARY = '#52B788';
const ACCENT    = '#F4A261';

const FEATURES = [
  { icon: Shield,    label: 'Validação e encaminhamento de denúncias', color: SECONDARY },
  { icon: Heart,     label: 'Módulo de adoção de animais',             color: ACCENT    },
  { icon: PawPrint,  label: 'Proteção animal com tecnologia',          color: '#86efac' },
];

function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: { x: number; y: number; vx: number; vy: number; size: number }[] = [];
    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        size: Math.random() * 2 + 0.8,
      });
    }

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(82,183,136,0.55)';
        ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(82,183,136,${0.12 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.8 }}
    />
  );
}

function Orb({ size, color, x, y, delay }: { size: number; color: string; x: string; y: string; delay: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ width: size, height: size, left: x, top: y, background: color, filter: 'blur(80px)' }}
      animate={{ scale: [1, 1.2, 1], opacity: [0.20, 0.38, 0.20] }}
      transition={{ duration: 8 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  );
}

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await login(email, password);
      if (response.success) {
        saveSession(response.token, response.user);
        window.location.href = getRedirectByRole(response.user.role);
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (!err.response) {
        setError('Não foi possível conectar ao servidor. Verifique sua conexão.');
      } else {
        setError('Email ou senha incorretos');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#071c12', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>

      {/* LEFT PANEL — branding */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-center items-center p-14 relative overflow-hidden">
        <AnimatedBackground />

        <Orb size={500} color={`${SECONDARY}28`} x="-10%" y="20%"  delay={0} />
        <Orb size={400} color={`${ACCENT}18`}    x="50%"  y="55%"  delay={2} />
        <Orb size={300} color={`${PRIMARY}80`}   x="20%"  y="70%"  delay={4} />

        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, #071c12 100%)' }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative z-10 flex flex-col items-center text-center"
          style={{ maxWidth: 420, marginTop: 'auto', marginBottom: 'auto' }}
        >
          {/* Logo */}
          <img
            src="/logo.png"
            alt="Eu Não Aceito Maus Tratos"
            style={{ width: 120, height: 120, objectFit: 'contain', marginBottom: 20, borderRadius: 24 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />

          <p style={{ fontSize: 28, fontWeight: 800, color: '#ffffff', marginBottom: 6, lineHeight: 1.2 }}>
            Eu Não Aceito
          </p>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#ffffff', marginBottom: 8, lineHeight: 1.2 }}>
            Maus Tratos
          </p>
          <p style={{ fontSize: 14, color: ACCENT, opacity: 0.85, marginBottom: 48, letterSpacing: '0.01em' }}>
            Juntos protegendo quem não tem voz
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 340 }}>
            {FEATURES.map((f, i) => (
              <motion.div key={f.label}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 + i * 0.1 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0' }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    backgroundColor: `${f.color}18`,
                    border: `1px solid ${f.color}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <f.icon size={18} style={{ color: f.color }} />
                  </div>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4, textAlign: 'left' }}>
                    {f.label}
                  </span>
                </motion.div>
                {i < FEATURES.length - 1 && (
                  <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.07)' }} />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* VETech */}
        <div style={{ position: 'absolute', bottom: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 10 }}>
          <img src="/logovetech.png" alt="VETech Systems"
            style={{ width: 80, objectFit: 'contain', opacity: 0.7 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>www.vetechsystems.com.br</span>
        </div>
      </div>

      {/* RIGHT PANEL — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">

        {/* Divider */}
        <div
          className="hidden lg:block absolute inset-y-0 left-0 w-px"
          style={{ background: `linear-gradient(to bottom, transparent, ${SECONDARY}30 40%, ${SECONDARY}30 60%, transparent)` }}
        />

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1, ease: 'easeOut' }}
          className="w-full max-w-[400px] relative z-10"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <img src="/logo.png" alt="Logo" className="w-9 h-9 rounded-xl object-contain"
              style={{ background: `${PRIMARY}44` }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="text-white font-extrabold text-sm leading-tight">
              Eu Não Aceito Maus Tratos
            </span>
          </div>

          {/* Form card */}
          <div
            className="rounded-3xl p-8"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Bem-vindo de volta</h2>
              <p className="text-sm mt-1.5" style={{ color: 'rgba(255,255,255,0.40)' }}>
                Acesse o painel administrativo
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.50)' }}>
                  Email
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: `${SECONDARY}80` }} />
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com.br" required
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none transition-all duration-200"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = `${SECONDARY}70`;
                      e.currentTarget.style.background = `${SECONDARY}08`;
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${SECONDARY}14`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.50)' }}>
                  Senha
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: `${SECONDARY}80` }} />
                  <input
                    type={showPwd ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" required
                    className="w-full pl-10 pr-12 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none transition-all duration-200"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = `${SECONDARY}70`;
                      e.currentTarget.style.background = `${SECONDARY}08`;
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${SECONDARY}14`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors duration-200"
                    style={{ color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.color = SECONDARY)}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
                    aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                type="submit" disabled={loading}
                whileTap={{ scale: 0.975 }}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-extrabold tracking-wide cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 mt-2"
                style={{
                  background: `linear-gradient(135deg, ${SECONDARY}, #2d9e6e)`,
                  color: '#fff',
                  boxShadow: `0 0 24px ${SECONDARY}40`,
                }}
                onMouseEnter={e => !loading && (e.currentTarget.style.boxShadow = `0 0 36px ${SECONDARY}60`)}
                onMouseLeave={e => !loading && (e.currentTarget.style.boxShadow = `0 0 24px ${SECONDARY}40`)}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.75, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 rounded-full border-2 border-current border-t-transparent"
                  />
                ) : (
                  <>
                    <LogIn size={16} strokeWidth={2.5} />
                    <span>Entrar no painel</span>
                  </>
                )}
              </motion.button>
            </form>
          </div>

          <p className="text-center text-xs mt-5" style={{ color: 'rgba(255,255,255,0.18)' }}>
            Acesso restrito a usuários autorizados
          </p>
        </motion.div>
      </div>
    </div>
  );
}
