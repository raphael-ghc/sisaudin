import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, PlayCircle, XCircle, PauseCircle, ChevronDown, Save, User, Calendar, X } from 'lucide-react';

export default function Status({ statusInicial = 'NOVO', onChangeStatus }) {
  const [status, setStatus] = useState(statusInicial);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [modalAcao, setModalAcao] = useState(null); // 'CANCELADO' ou 'SUSPENSO'
  const [justificativa, setJustificativa] = useState('');
  
  // Estado para armazenar os detalhes da ação (justificativa, responsavel, data)
  const [detalhesStatus, setDetalhesStatus] = useState(null);

  // Fecha o menu ao clicar fora seria ideal, mas para simplificar vamos apenas fechar na seleção
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const getStatusConfig = (s) => {
    switch (s) {
      case 'NOVO': return { label: 'Novo', icon: <PlayCircle size={16} />, color: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'EM ANDAMENTO': return { label: 'Em Andamento', icon: <Clock size={16} />, color: 'bg-amber-100 text-amber-700 border-amber-200' };
      case 'CONCLUÍDO': return { label: 'Concluído', icon: <CheckCircle2 size={16} />, color: 'bg-green-100 text-green-700 border-green-200' };
      case 'CANCELADO': return { label: 'Cancelado', icon: <XCircle size={16} />, color: 'bg-red-100 text-red-700 border-red-200' };
      case 'SUSPENSO': return { label: 'Suspenso', icon: <PauseCircle size={16} />, color: 'bg-gray-200 text-gray-700 border-gray-300' };
      default: return { label: 'Desconhecido', icon: <AlertCircle size={16} />, color: 'bg-gray-100 text-gray-600' };
    }
  };

  const currentConfig = getStatusConfig(status);

  const handleMudarStatusDireto = (novoStatus) => {
    setStatus(novoStatus);
    setDetalhesStatus(null);
    setIsMenuOpen(false);
    if(onChangeStatus) onChangeStatus(novoStatus, null);
  };

  const abrirModalJustificativa = (acao) => {
    setModalAcao(acao);
    setJustificativa('');
    setIsMenuOpen(false);
  };

  const confirmarJustificativa = () => {
    if (!justificativa.trim()) return;
    
    const detalhes = {
      justificativa,
      responsavel: '', // Fixo como mock
      dataHora: new Date().toISOString()
    };
    
    setStatus(modalAcao);
    setDetalhesStatus(detalhes);
    if (onChangeStatus) onChangeStatus(modalAcao, detalhes);
    
    setModalAcao(null);
  };

  const podeCancelarOuSuspender = status !== 'CANCELADO' && status !== 'SUSPENSO' && status !== 'CONCLUÍDO';

  return (
    <div className="relative font-sans flex items-center gap-4">
      {/* BADGE DE STATUS E BOTÃO DE AÇÕES */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold shadow-sm transition-colors ${currentConfig.color}`}>
          {currentConfig.icon}
          <span className="uppercase tracking-wide text-xs">{currentConfig.label}</span>
        </div>

        {podeCancelarOuSuspender && (
          <div className="relative">
            <button 
              onClick={toggleMenu}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm"
            >
              Ações <ChevronDown size={14} />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-1">
                  {status === 'NOVO' && (
                    <button onClick={() => handleMudarStatusDireto('EM ANDAMENTO')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                      <Clock size={16} className="text-amber-500" /> Iniciar (Em Andamento)
                    </button>
                  )}
                  {status === 'EM ANDAMENTO' && (
                    <button onClick={() => handleMudarStatusDireto('CONCLUÍDO')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                      <CheckCircle2 size={16} className="text-green-500" /> Concluir
                    </button>
                  )}
                  <div className="h-px bg-gray-200 my-1"></div>
                  <button onClick={() => abrirModalJustificativa('SUSPENSO')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                    <PauseCircle size={16} className="text-gray-500" /> Suspender
                  </button>
                  <button onClick={() => abrirModalJustificativa('CANCELADO')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 rounded-md transition-colors font-medium">
                    <XCircle size={16} /> Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* EXIBIÇÃO DA JUSTIFICATIVA CASO ESTEJA CANCELADO OU SUSPENSO */}
      {detalhesStatus && (status === 'CANCELADO' || status === 'SUSPENSO') && (
        <div className="hidden md:flex flex-col bg-white border border-gray-200 rounded-lg p-2 px-3 shadow-sm text-xs">
          <div className="flex items-center gap-3 text-gray-500 mb-1">
            <span className="flex items-center gap-1 font-medium"><User size={12} /> {detalhesStatus.responsavel}</span>
            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(detalhesStatus.dataHora).toLocaleString('pt-BR')}</span>
          </div>
          <div className="text-gray-700 italic max-w-xs truncate" title={detalhesStatus.justificativa}>
            "{detalhesStatus.justificativa}"
          </div>
        </div>
      )}

      {/* MODAL DE JUSTIFICATIVA */}
      {modalAcao && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className={`p-4 flex items-center justify-between border-b ${modalAcao === 'CANCELADO' ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-3">
                {modalAcao === 'CANCELADO' ? <XCircle className="text-red-600" size={24} /> : <PauseCircle className="text-gray-600" size={24} />}
                <h3 className={`font-bold text-lg ${modalAcao === 'CANCELADO' ? 'text-red-900' : 'text-gray-800'}`}>
                  {modalAcao === 'CANCELADO' ? 'Cancelar' : 'Suspender'}
                </h3>
              </div>
              <button onClick={() => setModalAcao(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-lg mb-4">
                  <AlertCircle size={18} className="shrink-0" />
                  <p>Atenção: Para {modalAcao === 'CANCELADO' ? 'cancelar' : 'suspender'} é <strong>obrigatório</strong> informar uma justificativa.</p>
                </div>
                
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Justificativa detalhada <span className="text-red-500">*</span>
                </label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all min-h-[120px] resize-none"
                  placeholder="Descreva o motivo desta ação..."
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end gap-3">
              <button 
                onClick={() => setModalAcao(null)} 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Voltar
              </button>
              <button 
                onClick={confirmarJustificativa}
                disabled={!justificativa.trim()}
                className={`flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-lg transition-all ${
                  !justificativa.trim() 
                    ? 'opacity-50 cursor-not-allowed bg-gray-400' 
                    : modalAcao === 'CANCELADO' 
                      ? 'bg-red-600 hover:bg-red-700 shadow-md hover:shadow-lg' 
                      : 'bg-gray-700 hover:bg-gray-800 shadow-md hover:shadow-lg'
                }`}
              >
                <Save size={16} /> Confirmar Ação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
