'use client';

import { useState, useEffect } from 'react';
import { getSession } from '@/lib/auth';

const API_URL = 'http://localhost:3000/api';

const statusColor: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  validated: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  not_resolved: 'bg-red-100 text-red-700'
};

const statusLabel: Record<string, string> = {
  pending: 'Pendente',
  validated: 'Validada',
  in_progress: 'Em Andamento',
  resolved: 'Resolvida',
  not_resolved: 'Não Resolvida'
};

export default function ReclamacoesValidacao() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const { token } = getSession();

  useEffect(() => {
    fetchComplaints();
  }, [filter]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/complaints?status=${filter}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setComplaints(data.complaints || []);
      }
    } catch (error) {
      console.log('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/complaints/${id}/validate`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert('Reclamação validada com sucesso!');
        fetchComplaints();
      }
    } catch (error) {
      console.log('Erro:', error);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Motivo da rejeição:');
    if (!reason) return;
    try {
      const res = await fetch(`${API_URL}/complaints/${id}/reject`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (data.success) {
        alert('Reclamação rejeitada!');
        fetchComplaints();
      }
    } catch (error) {
      console.log('Erro:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6">
        <h1 className="text-2xl font-bold">📋 Central de Reclamações</h1>
        <p className="text-blue-200 text-sm mt-1">Valide ou rejeite reclamações dos cidadãos</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 p-4 overflow-x-auto bg-white border-b">
        {[
          { key: 'pending', label: '⏳ Pendentes' },
          { key: 'validated', label: '🟡 Validadas' },
          { key: 'in_progress', label: '🔵 Em Andamento' },
          { key: 'resolved', label: '✅ Resolvidas' },
          { key: 'rejected', label: '❌ Rejeitadas' }
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap border transition-all ${
              filter === f.key
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-gray-100 text-gray-600 border-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="p-6 space-y-4">
        {loading ? (
          <p className="text-center text-gray-500">Carregando...</p>
        ) : complaints.length === 0 ? (
          <p className="text-center text-gray-500">Nenhuma reclamação encontrada.</p>
        ) : (
          complaints.map((complaint: any) => (
            <div key={complaint.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">{complaint.protocol}</p>
                  <h3 className="font-semibold text-gray-800">{complaint.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{complaint.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1 ml-4 flex-shrink-0">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColor[complaint.status]}`}>
                    {statusLabel[complaint.status]}
                  </span>
                  {complaint.city?.city_type === 'camara' ? (
                    <span className="text-xs px-3 py-1 rounded-full font-medium bg-purple-100 text-purple-700">
                      🏢 Câmara
                    </span>
                  ) : (
                    <span className="text-xs px-3 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
                      🏛️ Prefeitura
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-4 text-xs text-gray-400 mb-4">
                <span>📍 {complaint.address || 'Sem endereço'}</span>
                <span>🏷️ {complaint.category}</span>
                <span>📅 {new Date(complaint.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>

              {complaint.images?.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {complaint.images.map((img: string, i: number) => (
                    <img key={i} src={img} className="w-16 h-16 rounded-lg object-cover" />
                  ))}
                </div>
              )}

              {complaint.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleValidate(complaint.id)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    ✅ Validar
                  </button>
                  <button
                    onClick={() => handleReject(complaint.id)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    ❌ Rejeitar
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}