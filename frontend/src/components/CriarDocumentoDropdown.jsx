import React, { useState, useRef, useEffect } from 'react';
import {
  FilePlus,
  ChevronDown,
  FileText,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStatusFluxo } from '../api/fluxoDocumentoApi';
import DocumentWorkflowModal from './DocumentWorkflowModal';

export default function CriarDocumentoDropdown({ itemTrabalhoId, itemNome }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fluxoData, setFluxoData] = useState(null);
  const dropdownRef = useRef(null);

  // Estado para modal de verificação
  const [selectedOpcao, setSelectedOpcao] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = async () => {
    if (!isOpen && !fluxoData) {
      setLoading(true);
      try {
        const data = await getStatusFluxo(itemTrabalhoId);
        setFluxoData(data);
      } catch (err) {
        console.error('Erro ao buscar status do fluxo', err);
      } finally {
        setLoading(false);
      }
    }
    setIsOpen(!isOpen);
  };

  const getRotaCorrigida = (opcao) => {
    const rotasMap = {
      'ORDEM_SERVICO': `/ordem-servico?itemTrabalhoId=${itemTrabalhoId}`,
      'COMUNICACAO_AUDITORIA': `/comunicacao?itemTrabalhoId=${itemTrabalhoId}`,
      'SOLICITACAO_AUDITORIA': `/solicitacao?itemTrabalhoId=${itemTrabalhoId}`,
      'NOTA_AUDITORIA_PRELIMINAR': `/nota-preliminar?itemTrabalhoId=${itemTrabalhoId}`,
      'NOTA_TECNICA': `/nota-tecnica?itemTrabalhoId=${itemTrabalhoId}`,
      'PARECER': `/parecer?itemTrabalhoId=${itemTrabalhoId}`,
      'RELATORIO_PRELIMINAR': `/RelatorioPreliminar?tipo=preliminar&itemTrabalhoId=${itemTrabalhoId}`,
      'REUNIAO': `/reuniao?itemTrabalhoId=${itemTrabalhoId}`,
      'VISITA': `/visita?itemTrabalhoId=${itemTrabalhoId}`,
      'RELATORIO_FINAL': `/relatorio-final?itemTrabalhoId=${itemTrabalhoId}`,
      'NOTA_AUDITORIA_FINAL': `/nota-final?itemTrabalhoId=${itemTrabalhoId}`,
      'PLANO_ACAO_FINAL': `/plano-acao?tipo=final&itemTrabalhoId=${itemTrabalhoId}`,
      'PLANEJAMENTO': `/planejamento?itemTrabalhoId=${itemTrabalhoId}`,
      'MATRIZ_ACHADOS': `/matriz-achados?itemTrabalhoId=${itemTrabalhoId}`,
      'REUNIAO_BUSCA_CONJUNTA': `/reunioes-busca-conjunta/${itemTrabalhoId}`
    };
    return rotasMap[opcao.codigo] || opcao.rotaCriacao;
  };

  const handleOptionClick = (opcao) => {
    if (!opcao.habilitado) return;
    setIsOpen(false);

    const rotaDestino = getRotaCorrigida(opcao);

    if (opcao.modalVerificacao) {
      setSelectedOpcao({ ...opcao, rotaCriacao: rotaDestino });
      setModalOpen(true);
    } else {
      navigate(rotaDestino);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#00767d] hover:bg-[#005f64] text-white shadow-sm transition-all border border-[#005f64]"
        title="Criar novo documento para este item de trabalho"
      >
        <FilePlus size={15} />
        <span className="hidden sm:inline">Criar Documento</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 sm:w-96 rounded-xl shadow-2xl bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-50 overflow-hidden border border-gray-200">
          <div className="bg-slate-900 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-blue-400" />
              <span className="font-semibold text-xs uppercase tracking-wider">Documentos do Trabalho</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 truncate">
              {itemNome || `Item de Trabalho #${itemTrabalhoId}`}
            </p>
          </div>

          <div className="max-h-[380px] overflow-y-auto p-1.5 space-y-1">
            {loading ? (
              <div className="p-6 flex flex-col items-center justify-center text-gray-500 gap-2">
                <Loader2 size={24} className="animate-spin text-[#00767d]" />
                <span className="text-xs">Verificando fluxo de documentos...</span>
              </div>
            ) : !fluxoData || !fluxoData.opcoes ? (
              <div className="p-4 text-xs text-center text-red-500">
                Falha ao carregar opções de fluxo.
              </div>
            ) : (
              Object.values(fluxoData.opcoes).map((op) => (
                <button
                  key={op.codigo}
                  type="button"
                  onClick={() => handleOptionClick(op)}
                  disabled={!op.habilitado}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center justify-between gap-3 transition-all ${
                    op.habilitado
                      ? 'hover:bg-blue-50/80 cursor-pointer text-gray-900'
                      : 'opacity-50 cursor-not-allowed bg-gray-50/50 text-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        op.habilitado
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {op.habilitado ? <FileText size={15} /> : <Lock size={14} />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs truncate flex items-center gap-1.5">
                        <span>{op.nome}</span>
                        {op.modalVerificacao && (
                          <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold rounded bg-amber-100 text-amber-800 border border-amber-200">
                            Verificação
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 truncate mt-0.5">
                        {op.habilitado
                          ? 'Clique para gerar (inicia como Minuta)'
                          : op.motivoInabilitado || 'Pré-requisito não atendido'}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {op.habilitado ? (
                      <ArrowRight size={14} className="text-[#00767d]" />
                    ) : (
                      <Lock size={13} className="text-gray-400" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="bg-gray-50 px-3.5 py-2 text-[10px] text-gray-500 flex items-center justify-between border-t border-gray-100">
            <span>Fluxo auditado (Regras A-H)</span>
            <span className="font-medium text-emerald-700">Inicia como Minuta</span>
          </div>
        </div>
      )}

      {/* Modal de verificação de fluxo (ex: B1, B2, B3) */}
      <DocumentWorkflowModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        opcao={selectedOpcao}
        gerencias={fluxoData?.gerenciasItem || []}
        existePlanejamento={fluxoData?.existePlanejamento || false}
        existeMatrizAchados={fluxoData?.existeMatrizAchados || false}
      />
    </div>
  );
}
