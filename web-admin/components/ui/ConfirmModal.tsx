'use client';

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmModal({
  title, message,
  confirmLabel = 'Confirmar',
  confirmColor = '#EF4444',
  onConfirm, onCancel, loading,
}: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 110,
      backgroundColor: 'rgba(0,0,0,0.50)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 28,
        width: '100%', maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 10 }}>{title}</h3>
        <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.65, marginBottom: 24 }}>{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} disabled={loading}
            style={{ padding: '10px 20px', borderRadius: 10, fontSize: 14, border: '1.5px solid #E5E7EB', background: 'transparent', color: '#6B7280', cursor: 'pointer', fontWeight: 500 }}>
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading}
            style={{ padding: '10px 24px', borderRadius: 10, fontSize: 14, backgroundColor: loading ? '#9CA3AF' : confirmColor, color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
            {loading ? 'Aguarde...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
