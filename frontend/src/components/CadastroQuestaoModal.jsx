import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, ChevronDown, ChevronUp, Check } from 'lucide-react';

const TECNICAS_LISTA = [
  "Análise documental",
  "Confirmação externa",
  "Indagação",
  "Inspeção",
  "Questionário",
  "Técnicas de auditoria assistidas por computador (TAAC)",
  "Benchmarking",
  "Entrevista",
  "Inquérito",
  "Observação",
  "Recálculo"
];

const RISCOS_LISTA = [
  "Ambiental",
  "Conformidade",
  "Continuidade do Negócio",
  "Financeiro",
  "Governança",
  "Integridade",
  "Segurança da Informação",
  "Transparência e Accountability",
  "Assistencial",
  "Contábil",
  "Estratégico",
  "Gestão de Pessoas",
  "Imagem",
  "Operacional",
  "Tecnologia da Informação"
];

export default function CadastroQuestaoModal({
  isOpen,
  onClose,
  onSave,
  questaoInicial,
  gerenciasDisponiveis = []
}) {
  const [formData, setFormData] = useState({
    id: null,
    gerenciaDestinataria: '',
    conteudo: '',
    criterios: '',
    tecnicas: [],
    riscos: [],
    fato: ''
  });

  const [openSections, setOpenSections] = useState({
    gerencia: true,
    conteudo: true,
    criterios: true,
    tecnicas: true,
    riscos: true,
    fato: true
  });

  useEffect(() => {
    if (isOpen) {
      if (questaoInicial) {
        // Trata tecnicas e riscos como array ou string separada por vírgula
        let tecnicasArr = [];
        if (Array.isArray(questaoInicial.tecnicas)) {
          tecnicasArr = questaoInicial.tecnicas;
        } else if (typeof questaoInicial.tecnicas === 'string' && questaoInicial.tecnicas.trim() !== '') {
          try {
            const parsed = JSON.parse(questaoInicial.tecnicas);
            tecnicasArr = Array.isArray(parsed) ? parsed : questaoInicial.tecnicas.split(',').map(s => s.trim());
          } catch (e) {
            tecnicasArr = questaoInicial.tecnicas.split(',').map(s => s.trim());
          }
        }

        let riscosArr = [];
        if (Array.isArray(questaoInicial.riscos)) {
          riscosArr = questaoInicial.riscos;
        } else if (typeof questaoInicial.riscos === 'string' && questaoInicial.riscos.trim() !== '') {
          try {
            const parsed = JSON.parse(questaoInicial.riscos);
            riscosArr = Array.isArray(parsed) ? parsed : questaoInicial.riscos.split(',').map(s => s.trim());
          } catch (e) {
            riscosArr = questaoInicial.riscos.split(',').map(s => s.trim());
          }
        }

        setFormData({
          id: questaoInicial.id || null,
          gerenciaDestinataria: questaoInicial.gerenciaDestinataria || questaoInicial.gerencia || '',
          conteudo: questaoInicial.conteudo || questaoInicial.questao || '',
          criterios: questaoInicial.criterios || questaoInicial.criterio || '',
          tecnicas: tecnicasArr,
          riscos: riscosArr,
          fato: questaoInicial.fato || ''
        });
      } else {
        setFormData({
          id: null,
          gerenciaDestinataria: '',
          conteudo: '',
          criterios: '',
          tecnicas: [],
          riscos: [],
          fato: ''
        });
      }
      setOpenSections({
        gerencia: true,
        conteudo: true,
        criterios: true,
        tecnicas: true,
        riscos: true,
        fato: true
      });
    }
  }, [isOpen, questaoInicial]);

  if (!isOpen) return null;

  const handleToggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAbrirTodos = () => {
    setOpenSections({
      gerencia: true,
      conteudo: true,
      criterios: true,
      tecnicas: true,
      riscos: true,
      fato: true
    });
  };

  const handleFecharTodos = () => {
    setOpenSections({
      gerencia: false,
      conteudo: false,
      criterios: false,
      tecnicas: false,
      riscos: false,
      fato: false
    });
  };

  const handleCheckboxChange = (field, item) => {
    const atual = [...(formData[field] || [])];
    const index = atual.indexOf(item);
    if (index > -1) {
      atual.splice(index, 1);
    } else {
      atual.push(item);
    }
    setFormData(prev => ({ ...prev, [field]: atual }));
  };

  const handleSalvar = () => {
    const payload = {
      ...formData,
      // Garante compatibilidade de nomes de campos com backend e outras telas
      questao: formData.conteudo,
      gerencia: formData.gerenciaDestinataria,
      criterio: formData.criterios,
      tecnicas: Array.isArray(formData.tecnicas) ? formData.tecnicas.join(', ') : (formData.tecnicas || ''),
      riscos: Array.isArray(formData.riscos) ? formData.riscos.join(', ') : (formData.riscos || '')
    };
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-bold text-gray-800">
            Cadastro: Questão
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSalvar}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              <Save size={16} />
              <span>Salvar</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Voltar</span>
            </button>
          </div>
        </div>

        {/* Sub-cabeçalho com Abrir Todos / Fechar Todos */}
        <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 border-b border-gray-200">
          <button
            type="button"
            onClick={handleAbrirTodos}
            className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-300 hover:bg-blue-50 rounded shadow-sm transition-colors"
          >
            Abrir Todos
          </button>
          <button
            type="button"
            onClick={handleFecharTodos}
            className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-300 hover:bg-blue-50 rounded shadow-sm transition-colors"
          >
            Fechar Todos
          </button>
        </div>

        {/* Corpo rolável com Sanfonas */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* 1. Gerência Destinatária */}
          <div className="border border-blue-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <button
              type="button"
              onClick={() => handleToggleSection('gerencia')}
              className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100/70 text-blue-900 font-semibold text-sm transition-colors text-left"
            >
              <span>Gerência Destinatária</span>
              {openSections.gerencia ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {openSections.gerencia && (
              <div className="p-4 bg-white border-t border-blue-100">
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                  Gerência Destinatária
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={formData.gerenciaDestinataria}
                    onChange={(e) => setFormData(prev => ({ ...prev, gerenciaDestinataria: e.target.value }))}
                    className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">Selecione</option>
                    {gerenciasDisponiveis.map((ger, idx) => (
                      <option key={idx} value={ger.sigla || ger.nome || ger}>
                        {ger.sigla ? `${ger.sigla} - ${ger.nome || ''}` : ger.nome || ger}
                      </option>
                    ))}
                    <option value="Gerência de Auditoria Interna - GAI">Gerência de Auditoria Interna - GAI</option>
                    <option value="Diretoria Executiva">Diretoria Executiva</option>
                    <option value="Outra Gerência">Outra Gerência</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Ou digite a sigla/nome da gerência..."
                    value={formData.gerenciaDestinataria}
                    onChange={(e) => setFormData(prev => ({ ...prev, gerenciaDestinataria: e.target.value }))}
                    className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Conteúdo */}
          <div className="border border-blue-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <button
              type="button"
              onClick={() => handleToggleSection('conteudo')}
              className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100/70 text-blue-900 font-semibold text-sm transition-colors text-left"
            >
              <span>Conteúdo</span>
              {openSections.conteudo ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {openSections.conteudo && (
              <div className="p-4 bg-white border-t border-blue-100">
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                  Conteúdo da Questão de Auditoria
                </label>
                <textarea
                  rows="3"
                  value={formData.conteudo}
                  onChange={(e) => setFormData(prev => ({ ...prev, conteudo: e.target.value }))}
                  placeholder="Descreva o conteúdo / pergunta da questão de auditoria..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* 3. Critérios */}
          <div className="border border-blue-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <button
              type="button"
              onClick={() => handleToggleSection('criterios')}
              className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100/70 text-blue-900 font-semibold text-sm transition-colors text-left"
            >
              <span>Critérios</span>
              {openSections.criterios ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {openSections.criterios && (
              <div className="p-4 bg-white border-t border-blue-100">
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                  Critérios aplicáveis
                </label>
                <textarea
                  rows="3"
                  value={formData.criterios}
                  onChange={(e) => setFormData(prev => ({ ...prev, criterios: e.target.value }))}
                  placeholder="Descreva os critérios (leis, normas, políticas, manuais)..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* 4. Técnicas */}
          <div className="border border-blue-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <button
              type="button"
              onClick={() => handleToggleSection('tecnicas')}
              className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100/70 text-blue-900 font-semibold text-sm transition-colors text-left"
            >
              <span>Técnicas</span>
              {openSections.tecnicas ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {openSections.tecnicas && (
              <div className="p-4 bg-white border-t border-blue-100">
                <label className="block text-xs font-medium text-gray-500 uppercase mb-3">
                  Técnicas de Auditoria
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2.5 gap-x-6">
                  {TECNICAS_LISTA.map((tecnica, idx) => {
                    const checked = (formData.tecnicas || []).includes(tecnica);
                    return (
                      <label
                        key={idx}
                        className="flex items-center gap-2.5 cursor-pointer text-sm text-gray-700 hover:text-blue-600 select-none"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleCheckboxChange('tecnicas', tecnica)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span>{tecnica}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 5. Riscos */}
          <div className="border border-blue-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <button
              type="button"
              onClick={() => handleToggleSection('riscos')}
              className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100/70 text-blue-900 font-semibold text-sm transition-colors text-left"
            >
              <span>Riscos</span>
              {openSections.riscos ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {openSections.riscos && (
              <div className="p-4 bg-white border-t border-blue-100">
                <label className="block text-xs font-medium text-gray-500 uppercase mb-3">
                  Riscos Relacionados
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2.5 gap-x-6">
                  {RISCOS_LISTA.map((risco, idx) => {
                    const checked = (formData.riscos || []).includes(risco);
                    return (
                      <label
                        key={idx}
                        className="flex items-center gap-2.5 cursor-pointer text-sm text-gray-700 hover:text-blue-600 select-none"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleCheckboxChange('riscos', risco)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span>{risco}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 6. Fato */}
          <div className="border border-blue-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <button
              type="button"
              onClick={() => handleToggleSection('fato')}
              className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100/70 text-blue-900 font-semibold text-sm transition-colors text-left"
            >
              <span>Fato</span>
              {openSections.fato ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {openSections.fato && (
              <div className="p-4 bg-white border-t border-blue-100">
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                  Fato (situação encontrada)
                </label>
                <textarea
                  rows="3"
                  value={formData.fato}
                  onChange={(e) => setFormData(prev => ({ ...prev, fato: e.target.value }))}
                  placeholder="Descreva o fato / situação encontrada..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            )}
          </div>

        </div>

        {/* Rodapé fixo do Modal */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSalvar}
            className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            <Save size={16} />
            <span>Salvar Questão</span>
          </button>
        </div>

      </div>
    </div>
  );
}
