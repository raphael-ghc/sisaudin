import React, { useState } from 'react';

export default function AuditWorkflow() {
  const [showJustificationModal, setShowJustificationModal] = useState(false);
  const [justification, setJustification] = useState('');
  const [hasPendingChecklists, setHasPendingChecklists] = useState(true);

  const handleAdvancePhase = () => {
    // Ao invés de travar o sistema por haver pendências, perguntamos se deseja seguir e pedimos justificativa.
    if (hasPendingChecklists) {
      setShowJustificationModal(true);
    } else {
      executeAdvance();
    }
  };

  const executeAdvance = () => {
    console.log("Fase avançada com sucesso. Justificativa:", justification);
    setShowJustificationModal(false);
    // Lógica para atualizar o status do trabalho no backend
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-gray-800">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-light text-blue-900">Gestão de Trabalhos</h1>
        <p className="text-sm text-gray-500 mt-1">Auditoria de Conformidade - Processos Licitatórios</p>
      </header>

      <main className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 max-w-4xl">
        <h2 className="text-xl font-semibold mb-4">Relatório Preliminar</h2>
        <p className="text-gray-600 mb-6">
          O papel de trabalho atual possui 2 itens de checklist não preenchidos.
        </p>

        <div className="flex gap-4">
          <button className="px-4 py-2 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition border border-blue-200">
            Editar Documento
          </button>
          <button 
            onClick={handleAdvancePhase}
            className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition shadow-sm"
          >
            Avançar para Revisão
          </button>
        </div>
      </main>

      {/* Modal de Justificativa (Elegante e não-bloqueante) */}
      {showJustificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Avançar com Pendências?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Ainda há itens do checklist não validados. Você deseja realmente seguir com a submissão? Por favor, insira uma justificativa para a revisão do coordenador.
            </p>
            
            <textarea 
              className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition mb-4"
              rows="4"
              placeholder="Ex: Os itens pendentes aguardam resposta da área de suprimentos, mas não impedem a revisão preliminar."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowJustificationModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition"
              >
                Cancelar
              </button>
              <button 
                onClick={executeAdvance}
                disabled={justification.trim().length === 0}
                className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition shadow-sm"
              >
                Confirmar e Avançar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}