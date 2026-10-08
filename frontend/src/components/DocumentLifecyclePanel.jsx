import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
  History,
  CheckSquare,
  ArrowRight,
  ShieldAlert,
  Link as LinkIcon,
  MessageSquare,
  User,
  Calendar,
  X
} from 'lucide-react';
import {
  getStatusDocumento,
  transitarStatusDocumento,
  updateRevisaoItem,
  updateAprovacaoItem
} from '../api/documentoStatusApi';

export default function DocumentLifecyclePanel({ tipoDocumento, documentoId, onStatusChange }) {
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal para Exceção (quando tenta avançar com checklist incompleto)
  const [modalExcecaoOpen, setModalExcecaoOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [justificativaExcecao, setJustificativaExcecao] = useState('');
  const [errorModal, setErrorModal] = useState('');

  // Modal para Histórico de Status
  const [modalHistoricoOpen, setModalHistoricoOpen] = useState(false);

  const fetchStatus = async () => {
    if (!tipoDocumento || !documentoId) return;
    setLoading(true);
    try {
      const data = await getStatusDocumento(tipoDocumento, documentoId);
      setStatusData(data);
      setError(null);
      if (onStatusChange) onStatusChange(data.statusAtual);
    } catch (err) {
      setError('Falha ao carregar status do documento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [tipoDocumento, documentoId]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Minuta':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
            <FileText size={14} /> Minuta (Rascunho)
          </span>
        );
      case 'Em revisão':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock size={14} /> Em Revisão
          </span>
        );
      case 'Revisado':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <CheckSquare size={14} /> Revisado
          </span>
        );
      case 'Em aprovação':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
            <Clock size={14} /> Em Aprovação
          </span>
        );
      case 'Aprovado':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 size={14} /> Aprovado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
            {status || 'Desconhecido'}
          </span>
        );
    }
  };

  const getNextStatusOptions = (current) => {
    switch (current) {
      case 'Minuta':
        return [{ label: 'Enviar para Revisão', status: 'Em revisão', variant: 'primary' }];
      case 'Em revisão':
        return [
          { label: 'Concluir Revisão (Revisado)', status: 'Revisado', variant: 'success' },
          { label: 'Voltar para Minuta', status: 'Minuta', variant: 'secondary' }
        ];
      case 'Revisado':
        return [
          { label: 'Enviar para Aprovação', status: 'Em aprovação', variant: 'primary' },
          { label: 'Voltar para Em Revisão', status: 'Em revisão', variant: 'secondary' }
        ];
      case 'Em aprovação':
        return [
          { label: 'Aprovar Documento', status: 'Aprovado', variant: 'success' },
          { label: 'Voltar para Revisão', status: 'Revisado', variant: 'secondary' }
        ];
      case 'Aprovado':
        return [
          { label: 'Reabrir para Aprovação (Somente Gestor)', status: 'Em aprovação', variant: 'warning' }
        ];
      default:
        return [];
    }
  };

  const handleTransitar = async (novoStatus, justificativa = null) => {
    try {
      setErrorModal('');
      const payload = {
        novoStatus,
        justificativaExcecao: justificativa
      };
      const res = await transitarStatusDocumento(tipoDocumento, documentoId, payload);
      setStatusData(res);
      if (onStatusChange) onStatusChange(res.statusAtual);
      setModalExcecaoOpen(false);
      setJustificativaExcecao('');
    } catch (err) {
      const msg = err.response?.data?.statusAtual || 'Erro ao transitar status. Verifique se justificativa é obrigatória.';
      if (msg.includes('OBRIGATORIA_CHECKLIST_REVISAO') || msg.includes('OBRIGATORIA_CHECKLIST_APROVACAO')) {
        setTargetStatus(novoStatus);
        setModalExcecaoOpen(true);
      } else {
        alert(msg);
      }
    }
  };

  const handleUpdateRevisao = async (item, resposta, observacao, link) => {
    try {
      await updateRevisaoItem(tipoDocumento, documentoId, item.id, { resposta, observacao, link });
      fetchStatus();
    } catch (err) {
      console.error('Erro ao atualizar item de revisão', err);
    }
  };

  const handleUpdateAprovacao = async (item, resposta, observacao, link) => {
    try {
      await updateAprovacaoItem(tipoDocumento, documentoId, item.id, { resposta, observacao, link });
      fetchStatus();
    } catch (err) {
      console.error('Erro ao atualizar item de aprovação', err);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 animate-pulse flex items-center justify-between">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-6 bg-gray-200 rounded-full w-24"></div>
      </div>
    );
  }

  if (!statusData) {
    return null;
  }

  const { statusAtual, podeEditar, podeAprovar, revisaoChecklist, aprovacaoChecklist, historico } = statusData;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden my-4">
      {/* Cabeçalho do Painel de Ciclo de Vida */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <FileText className="text-blue-400" size={22} />
          <div>
            <h3 className="font-semibold text-base">Controle de Revisão e Aprovação</h3>
            <p className="text-xs text-slate-300">
              {podeEditar
                ? 'Você possui permissão para editar este documento na fase atual.'
                : 'Edição restrita no status atual (' + statusAtual + ').'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(statusAtual)}
          <button
            onClick={() => setModalHistoricoOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition-colors border border-slate-600"
            title="Ver histórico de alterações de status"
          >
            <History size={14} />
            <span>Histórico</span>
          </button>
        </div>
      </div>

      {/* Botões de Ação para Próximos Status */}
      <div className="px-6 py-3 bg-slate-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ações de Fluxo</span>
        <div className="flex items-center gap-2">
          {getNextStatusOptions(statusAtual).map((opt) => (
            <button
              key={opt.status}
              onClick={() => handleTransitar(opt.status)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
                opt.variant === 'success'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : opt.variant === 'primary'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : opt.variant === 'warning'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300'
              }`}
            >
              <span>{opt.label}</span>
              <ArrowRight size={13} />
            </button>
          ))}
        </div>
      </div>

      {/* Checklists */}
      <div className="p-6 space-y-6">
        {/* Checklist de Revisão (visível a partir de "Em revisão") */}
        {(statusAtual === 'Em revisão' || statusAtual === 'Revisado' || statusAtual === 'Em aprovação' || statusAtual === 'Aprovado') &&
          revisaoChecklist && revisaoChecklist.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                  <CheckSquare className="text-blue-600" size={16} /> Checklist de Revisão
                </span>
                <span className="text-xs text-gray-500">
                  {revisaoChecklist.filter(i => i.resposta).length}/{revisaoChecklist.length} respondidos
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {revisaoChecklist.map((item) => (
                  <ChecklistItemRow
                    key={item.id}
                    item={item}
                    onSave={(resp, obs, link) => handleUpdateRevisao(item, resp, obs, link)}
                    disabled={statusAtual === 'Aprovado' && !podeAprovar}
                  />
                ))}
              </div>
            </div>
          )}

        {/* Checklist de Aprovação (visível a partir de "Em aprovação") */}
        {(statusAtual === 'Em aprovação' || statusAtual === 'Aprovado') &&
          aprovacaoChecklist && aprovacaoChecklist.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-purple-50 px-4 py-2.5 border-b border-purple-200 flex items-center justify-between">
                <span className="font-semibold text-sm text-purple-900 flex items-center gap-2">
                  <CheckCircle2 className="text-purple-600" size={16} /> Checklist de Aprovação (Gestor)
                </span>
                <span className="text-xs text-purple-600">
                  {aprovacaoChecklist.filter(i => i.resposta).length}/{aprovacaoChecklist.length} respondidos
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {aprovacaoChecklist.map((item) => (
                  <ChecklistItemRow
                    key={item.id}
                    item={item}
                    onSave={(resp, obs, link) => handleUpdateAprovacao(item, resp, obs, link)}
                    disabled={!podeAprovar}
                  />
                ))}
              </div>
            </div>
          )}
      </div>

      {/* Modal de Justificativa Obrigatória para Checklist Incompleto */}
      {modalExcecaoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200">
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-800 font-semibold">
                <ShieldAlert className="text-amber-600" size={20} />
                <span>Justificativa Obrigatória para Exceção</span>
              </div>
              <button
                onClick={() => setModalExcecaoOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                Você está tentando transitar o documento para <strong className="text-gray-900">{targetStatus}</strong> sem completar todos os itens do checklist de revisão/aprovação.
              </p>
              <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200 font-medium">
                Caso deseje seguir sem completar o checklist, é obrigatório informar uma justificativa. Esta justificativa será registrada no histórico de auditoria do documento.
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Justificativa da Exceção *
                </label>
                <textarea
                  value={justificativaExcecao}
                  onChange={(e) => setJustificativaExcecao(e.target.value)}
                  placeholder="Descreva o motivo técnico ou gerencial para dispensar itens do checklist..."
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[100px]"
                ></textarea>
              </div>
              {errorModal && (
                <div className="text-xs text-red-600 font-semibold">{errorModal}</div>
              )}
            </div>
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setModalExcecaoOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                disabled={!justificativaExcecao.trim()}
                onClick={() => {
                  if (!justificativaExcecao.trim()) {
                    setErrorModal('Justificativa é obrigatória.');
                    return;
                  }
                  handleTransitar(targetStatus, justificativaExcecao.trim());
                }}
                className="px-5 py-2 text-sm font-semibold bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg shadow-sm"
              >
                Confirmar Transição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Histórico de Status */}
      {modalHistoricoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-200">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2 font-semibold">
                <History className="text-blue-400" size={20} />
                <span>Histórico de Auditoria e Transições de Status</span>
              </div>
              <button
                onClick={() => setModalHistoricoOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
              {(!historico || historico.length === 0) ? (
                <p className="text-sm text-gray-500 text-center py-6">
                  Nenhuma alteração de status registrada até o momento.
                </p>
              ) : (
                <div className="relative border-l-2 border-blue-200 ml-3 pl-6 space-y-6">
                  {historico.map((h, index) => (
                    <div key={h.id || index} className="relative">
                      <div className="absolute -left-[31px] top-0 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow"></div>
                      <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-200">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span className="flex items-center gap-1 font-semibold text-gray-700">
                            <User size={12} /> {h.usuarioNome || h.usuarioUsername || 'Usuário Sistema'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {h.dataHora ? new Date(h.dataHora).toLocaleString('pt-BR') : '-'}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <span className="text-gray-400">{h.statusAnterior || 'Início'}</span>
                          <ArrowRight size={14} className="text-blue-500" />
                          <span className="text-blue-700">{h.statusNovo}</span>
                        </div>
                        {h.justificativaExcecao && (
                          <div className="mt-2 text-xs bg-amber-50 text-amber-900 p-2 rounded border border-amber-200">
                            <strong>Justificativa da Exceção:</strong> {h.justificativaExcecao}
                          </div>
                        )}
                        {h.observacoes && (
                          <div className="mt-1 text-xs text-gray-600">
                            {h.observacoes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setModalHistoricoOpen(false)}
                className="px-5 py-2 text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChecklistItemRow({ item, onSave, disabled }) {
  const [resposta, setResposta] = useState(item.resposta || '');
  const [observacao, setObservacao] = useState(item.observacao || '');
  const [link, setLink] = useState(item.link || '');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setResposta(item.resposta || '');
    setObservacao(item.observacao || '');
    setLink(item.link || '');
    setIsDirty(false);
  }, [item]);

  const handleSave = () => {
    if (onSave) {
      onSave(resposta, observacao, link);
      setIsDirty(false);
    }
  };

  return (
    <div className="p-3.5 hover:bg-gray-50/70 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800 leading-snug">{item.questao}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1 text-xs font-semibold cursor-pointer">
              <input
                type="radio"
                name={`resposta-${item.id}`}
                disabled={disabled}
                checked={resposta === 'SIM'}
                onChange={() => {
                  setResposta('SIM');
                  setIsDirty(true);
                }}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-emerald-700">Sim</span>
            </label>
            <label className="inline-flex items-center gap-1 text-xs font-semibold cursor-pointer">
              <input
                type="radio"
                name={`resposta-${item.id}`}
                disabled={disabled}
                checked={resposta === 'NAO'}
                onChange={() => {
                  setResposta('NAO');
                  setIsDirty(true);
                }}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-red-600">Não</span>
            </label>
            <label className="inline-flex items-center gap-1 text-xs font-semibold cursor-pointer">
              <input
                type="radio"
                name={`resposta-${item.id}`}
                disabled={disabled}
                checked={resposta === 'NA'}
                onChange={() => {
                  setResposta('NA');
                  setIsDirty(true);
                }}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-500">N/A</span>
            </label>
          </div>
          {isDirty && !disabled && (
            <button
              onClick={handleSave}
              className="px-2.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded shadow-sm transition-all"
            >
              Salvar
            </button>
          )}
        </div>
      </div>
      <div className="mt-2.5 flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <MessageSquare size={13} className="absolute left-2.5 top-2 text-gray-400" />
          <input
            type="text"
            disabled={disabled}
            value={observacao}
            onChange={(e) => {
              setObservacao(e.target.value);
              setIsDirty(true);
            }}
            placeholder="Observação da verificação..."
            className="w-full text-xs border border-gray-200 rounded pl-7 pr-3 py-1.5 focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div className="sm:w-1/3 relative">
          <LinkIcon size={13} className="absolute left-2.5 top-2 text-gray-400" />
          <input
            type="text"
            disabled={disabled}
            value={link}
            onChange={(e) => {
              setLink(e.target.value);
              setIsDirty(true);
            }}
            placeholder="Link de evidência (opcional)..."
            className="w-full text-xs border border-gray-200 rounded pl-7 pr-3 py-1.5 focus:border-blue-400 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
