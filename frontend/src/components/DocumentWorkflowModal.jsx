import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Building2,
  ShieldAlert,
  ArrowRight,
  X,
  ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SearchableSelect = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = options.filter((opt) => {
    const label = typeof opt === 'string' ? opt : opt.label;
    return label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const displayValue = value
    ? typeof options[0] === 'string'
      ? value
      : options.find((o) => String(o.value) === String(value))?.label
    : '';

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm cursor-pointer flex justify-between items-center bg-white hover:border-gray-400 transition-colors"
      >
        <span className={value ? 'text-gray-800' : 'text-gray-400'}>
          {displayValue || placeholder || 'Selecione...'}
        </span>
        <ChevronDown size={16} className="text-gray-400" />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>

          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <div className="p-2 border-b border-gray-100 bg-white">
              <input
                type="text"
                autoFocus
                className="w-full border border-blue-400 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Digite para buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-3 text-sm text-gray-500 text-center">
                  Nenhum resultado
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const val = typeof opt === 'string' ? opt : opt.value;
                  const label = typeof opt === 'string' ? opt : opt.label;
                  return (
                    <div
                      key={idx}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                      onClick={() => {
                        onChange(val);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                    >
                      {label}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default function DocumentWorkflowModal({
  isOpen,
  onClose,
  opcao,
  gerencias = [],
  existePlanejamento = false,
  existeMatrizAchados = false
}) {
  const navigate = useNavigate();
  const [gerenciaSelecionada, setGerenciaSelecionada] = useState('');
  const [mostrarJustificativa, setMostrarJustificativa] = useState(false);
  const [justificativa, setJustificativa] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !opcao) return null;

  const { codigo, nome, rotaCriacao, modalVerificacao } = opcao;

  const gerenciasDisponiveis = gerencias;
  const gerenciaOptions = gerenciasDisponiveis.map((g) => ({
    value: g.gerenciaId,
    label: g.siglaGerencia ? `${g.siglaGerencia} - ${g.nomeGerencia}` : g.nomeGerencia
  }));

  // Encontrar o status da gerência selecionada
  const gerenciaObj = gerencias.find(g => String(g.gerenciaId) === String(gerenciaSelecionada));
  const possuiComunicacao = gerenciaObj ? gerenciaObj.possuiComunicacao : false;

  // Regras para verificar se é necessário alertar e pedir justificativa (sem bloqueio)
  const precisaAlertaMatrizAchados =
    (modalVerificacao === 'B3_PLANEJAMENTO_OBRIGATORIO' || modalVerificacao === 'B1_E_B3') &&
    !existeMatrizAchados;

  const precisaAlertaComunicacao =
    (modalVerificacao === 'B1_COMUNICACAO' || modalVerificacao === 'B1_E_B2' || modalVerificacao === 'B1_E_B3') &&
    gerenciaSelecionada &&
    !possuiComunicacao;

  const precisaAlertaPlanejamento =
    (modalVerificacao === 'B2_PLANEJAMENTO_OPCIONAL' || modalVerificacao === 'B1_E_B2') &&
    !existePlanejamento;

  const requerJustificativa =
    precisaAlertaComunicacao || precisaAlertaPlanejamento || precisaAlertaMatrizAchados;

  const handleProsseguir = () => {
    setErrorMsg('');

    if (
      (modalVerificacao === 'B1_COMUNICACAO' || modalVerificacao === 'B1_E_B2' || modalVerificacao === 'B1_E_B3') &&
      !gerenciaSelecionada &&
      gerencias.length > 0
    ) {
      setErrorMsg('Por favor, selecione uma gerência destinatária para verificar o fluxo.');
      return;
    }

    if (requerJustificativa && !justificativa.trim()) {
      setMostrarJustificativa(true);
      setErrorMsg('Como o documento anterior não foi encontrado, a justificativa é obrigatória para prosseguir com a criação do documento.');
      return;
    }

    // Navegar para a rota de criação, passando parâmetros
    const queryParams = new URLSearchParams();
    if (gerenciaSelecionada) queryParams.set('gerenciaId', gerenciaSelecionada);
    if (justificativa.trim()) queryParams.set('justificativaFluxo', justificativa.trim());

    const urlFinal = rotaCriacao.includes('?')
      ? `${rotaCriacao}&${queryParams.toString()}`
      : `${rotaCriacao}?${queryParams.toString()}`;

    onClose();
    navigate(urlFinal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-visible border border-gray-200 my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between text-white rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <FileText className="text-blue-400" size={22} />
            <div>
              <h3 className="font-semibold text-base">Verificação de Fluxo: {nome}</h3>
              <p className="text-xs text-slate-300">Validação de pré-requisitos antes de criar o documento</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Seleção de Gerência Destinatária (se for B1) */}
          {(modalVerificacao === 'B1_COMUNICACAO' || modalVerificacao === 'B1_E_B2' || modalVerificacao === 'B1_E_B3') && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building2 size={14} className="text-blue-600" />
                <span>Selecione a Gerência Destinatária *</span>
              </label>
              {gerenciasDisponiveis.length === 0 ? (
                <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded border border-amber-200">
                  Nenhuma gerência disponível no sistema.
                </p>
              ) : (
                <SearchableSelect
                  placeholder="+ Selecionar Gerência Destinatária..."
                  value={gerenciaSelecionada}
                  options={gerenciaOptions}
                  onChange={(val) => {
                    setGerenciaSelecionada(val);
                    setErrorMsg('');
                  }}
                />
              )}
            </div>
          )}

          {/* Status de Verificação */}
          <div className="space-y-2">
            {(modalVerificacao === 'B3_PLANEJAMENTO_OBRIGATORIO' || modalVerificacao === 'B1_E_B3') && (
              <div
                className={`p-3 rounded-lg border flex items-center justify-between text-xs font-medium ${
                  existeMatrizAchados
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  {existeMatrizAchados ? (
                    <CheckCircle2 className="text-emerald-600" size={16} />
                  ) : (
                    <AlertTriangle className="text-amber-600" size={16} />
                  )}
                  <span>
                    {existeMatrizAchados
                      ? 'Matriz de Achados já foi concluída para este item.'
                      : 'Atenção: A Matriz de Achados é um documento anterior obrigatório no fluxo regular e ainda não foi gerada.'}
                  </span>
                </span>
              </div>
            )}

            {gerenciaSelecionada && (
              <div
                className={`p-3 rounded-lg border flex items-center justify-between text-xs font-medium ${
                  possuiComunicacao
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  {possuiComunicacao ? (
                    <CheckCircle2 className="text-emerald-600" size={16} />
                  ) : (
                    <AlertTriangle className="text-amber-600" size={16} />
                  )}
                  <span>
                    {possuiComunicacao
                      ? 'Comunicação de Auditoria já foi enviada para esta gerência.'
                      : 'Atenção: Não existe Comunicação de Auditoria destinada a esta gerência.'}
                  </span>
                </span>
              </div>
            )}

            {(modalVerificacao === 'B2_PLANEJAMENTO_OPCIONAL' || modalVerificacao === 'B1_E_B2') && (
              <div
                className={`p-3 rounded-lg border flex items-center justify-between text-xs font-medium ${
                  existePlanejamento
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  {existePlanejamento ? (
                    <CheckCircle2 className="text-emerald-600" size={16} />
                  ) : (
                    <AlertTriangle className="text-amber-600" size={16} />
                  )}
                  <span>
                    {existePlanejamento
                      ? 'Planejamento já foi concluído para este item.'
                      : 'Atenção: Ainda não existe Planejamento concluído para este item.'}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Formulário de Justificativa Obrigatória quando o fluxo não foi cumprido */}
          {requerJustificativa && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs">
                <ShieldAlert className="text-amber-600" size={16} />
                <span>Deseja prosseguir sem o documento anterior no fluxo?</span>
              </div>
              <p className="text-xs text-gray-600">
                Como o fluxo padrão não foi concluído (documento anterior não localizado), o sistema exige uma <strong>justificativa obrigatória</strong> para permitir a criação de <strong>{nome}</strong>.
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Justificativa Obrigatória *
                </label>
                <textarea
                  value={justificativa}
                  onChange={(e) => {
                    setJustificativa(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Descreva o motivo pelo qual este documento está sendo gerado sem o documento anterior no fluxo..."
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none min-h-[80px]"
                ></textarea>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleProsseguir}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all"
          >
            <span>Prosseguir para Criação</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
