import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  X,
  Calendar,
  Building2,
  Edit,
  Eye,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { getDocumentosCriados } from '../api/fluxoDocumentoApi';

export default function DocumentosCriadosModal({ itemTrabalhoId, itemNome, onClose }) {
  const navigate = useNavigate();
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (itemTrabalhoId) {
      fetchDocumentos();
    }
  }, [itemTrabalhoId]);

  const fetchDocumentos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDocumentosCriados(itemTrabalhoId);
      setDocumentos(data || []);
    } catch (err) {
      console.error('Erro ao buscar documentos criados:', err);
      setError('Não foi possível carregar a lista de documentos criados.');
    } finally {
      setLoading(false);
    }
  };

  const formatDataHora = (dataStr) => {
    if (!dataStr) return '-';
    try {
      const d = new Date(dataStr);
      if (isNaN(d.getTime())) return dataStr;
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dataStr;
    }
  };

  const getStatusBadge = (status) => {
    const st = (status || 'Minuta').toLowerCase();
    if (st === 'minuta') {
      return 'bg-gray-100 text-gray-700 border border-gray-300';
    }
    if (st === 'em revisão' || st === 'em revisao') {
      return 'bg-blue-100 text-blue-800 border border-blue-300';
    }
    if (st === 'revisado') {
      return 'bg-indigo-100 text-indigo-800 border border-indigo-300';
    }
    if (st === 'em aprovação' || st === 'em aprovacao') {
      return 'bg-purple-100 text-purple-800 border border-purple-300';
    }
    if (st === 'aprovado') {
      return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
    }
    return 'bg-gray-100 text-gray-800 border border-gray-300';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <FileText size={22} className="text-blue-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Documentos Criados</h2>
              <p className="text-xs text-blue-200 line-clamp-1">
                Item de Trabalho: {itemNome || `ID #${itemTrabalhoId}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo Principal */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Loader2 size={36} className="animate-spin text-blue-600 mb-3" />
              <p className="text-sm font-medium">Carregando documentos criados...</p>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <AlertCircle size={20} />
              <p className="text-sm">{error}</p>
            </div>
          ) : documentos.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300 p-6">
              <FileText size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-base font-medium text-gray-600">Nenhum documento foi criado para este item até o momento.</p>
              <p className="text-xs text-gray-400 mt-1">
                Utilize o botão "Criar Documento" na listagem para iniciar um novo documento.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Documento</th>
                    <th className="py-3 px-4">Nº/Ano</th>
                    <th className="py-3 px-4">Data da Criação</th>
                    <th className="py-3 px-4">Gerências Destinatárias</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {documentos.map((doc, idx) => {
                    let nrAnoStr = '-';
                    if (doc.numeroAno && doc.numeroAno !== '-') {
                      nrAnoStr = doc.numeroAno;
                      if (!String(nrAnoStr).includes('/')) {
                        const ano = doc.ano || (doc.dataCriacao ? new Date(doc.dataCriacao).getFullYear() : new Date().getFullYear());
                        nrAnoStr = `${nrAnoStr}/${ano}`;
                      }
                    } else if (doc.numero !== undefined && doc.numero !== null) {
                      const ano = doc.ano || (doc.dataCriacao ? new Date(doc.dataCriacao).getFullYear() : new Date().getFullYear());
                      nrAnoStr = `${doc.numero}/${ano}`;
                    }
                    return (
                    <tr key={`${doc.tipo}-${doc.id}-${idx}`} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {doc.nome || doc.tipo}
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-mono text-xs">
                        {nrAnoStr}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-400" />
                          <span>{formatDataHora(doc.dataCriacao)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={14} className="text-blue-500" />
                          <span className="font-semibold text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                            {doc.siglasGerencias || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(doc.status)}`}>
                          {doc.status || 'Minuta'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              onClose();
                              navigate(doc.rotaEditar);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                            title="Editar documento"
                          >
                            <Edit size={14} />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => {
                              onClose();
                              navigate(doc.rotaVisualizar);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
                            title="Visualizar documento"
                          >
                            <Eye size={14} />
                            <span>Visualizar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
