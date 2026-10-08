import React from 'react';
import { FileText, Printer, ExternalLink, X, Download } from 'lucide-react';
import { openPdfInNativeViewer, downloadNativePdf } from '../utils/pdfUtils';

export default function DocumentPdfViewerModal({
  isOpen,
  onClose,
  docTitle = 'Documento de Auditoria',
  children
}) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleOpenNativePdf = () => {
    openPdfInNativeViewer('pdf-viewer-content', docTitle);
  };

  const handleDownloadNativePdf = () => {
    downloadNativePdf('pdf-viewer-content', docTitle);
  };

  const handleOpenInNewWindow = () => {
    const newWindow = window.open('', '_blank', 'width=1000,height=900,scrollbars=yes,resizable=yes');
    if (newWindow) {
      const htmlContent = document.getElementById('pdf-viewer-content')?.innerHTML || '';
      newWindow.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <title>${docTitle || 'Documento em PDF - GHC'}</title>
          <meta charset="utf-8" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body {
              margin: 0;
              padding: 20px;
              background-color: #323639;
              font-family: 'Inter', serif;
              display: flex;
              justify-content: center;
            }
            .pdf-page {
              background-color: white;
              width: 210mm;
              min-height: 297mm;
              padding: 20mm;
              box-shadow: 0 4px 12px rgba(0,0,0,0.5);
              box-sizing: border-box;
              color: #1a202c;
            }
            @media print {
              body {
                background-color: white !important;
                padding: 0 !important;
              }
              .pdf-page {
                width: 100% !important;
                box-shadow: none !important;
                padding: 0 !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="pdf-page">
            ${htmlContent}
          </div>
          <script>
            setTimeout(() => {
              window.print();
            }, 600);
          </script>
        </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col justify-between overflow-hidden animate-fadeIn print:hidden">
      
      {/* HEADER DA JANELA DE VISUALIZAÇÃO EM PDF */}
      <div className="bg-[#202124] text-white px-6 py-3.5 flex flex-wrap items-center justify-between shadow-lg border-b border-gray-700 shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-red-600/20 rounded-lg border border-red-500/30">
            <FileText className="text-red-500" size={20} />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-semibold tracking-wide text-gray-100 flex items-center gap-2">
              <span>Visualizador de PDF</span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-300 font-normal">{docTitle}</span>
            </h2>
            <p className="text-[11px] text-gray-400">Modo de visualização e exportação contínua</p>
          </div>
          <span className="hidden sm:inline-flex bg-[#00767d] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full ml-2">
            A4 RETRATO
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botão de Visualizar no Leitor Nativo de PDF do Navegador (como no print) */}
          <button
            onClick={handleOpenNativePdf}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-colors shadow-sm"
            title="Abre o documento em arquivo PDF numa nova janela com controles do navegador (download, zoom, páginas)"
          >
            <FileText size={16} />
            <span>Visualizar PDF</span>
          </button>

          {/* Botão de Download Imediato do PDF */}
          <button
            onClick={handleDownloadNativePdf}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-colors shadow-sm"
            title="Fazer download imediato do arquivo em formato .pdf"
          >
            <Download size={16} />
            <span className="hidden md:inline">Baixar PDF</span>
          </button>

          {/* Botão de Imprimir */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 bg-[#00767d] hover:bg-[#005f64] text-white px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors shadow-sm"
            title="Imprimir ou Salvar arquivo através da caixa de impressão do navegador"
          >
            <Printer size={16} />
            <span>Imprimir</span>
          </button>

          {/* Botão de Nova Janela HTML (opcional para exibição imediata) */}
          <button
            onClick={handleOpenInNewWindow}
            className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors border border-gray-600"
            title="Abrir documento em nova janela HTML"
          >
            <ExternalLink size={16} />
            <span className="hidden xl:inline">Nova Janela HTML</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors ml-1"
            title="Fechar Visualizador de PDF"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* CORPO DO VISUALIZADOR DE PDF (SIMULANDO LEITOR DE PDF) */}
      <div className="bg-[#323639] flex-1 overflow-y-auto p-4 md:p-10 flex justify-center">
        <div 
          id="pdf-viewer-content"
          className="bg-white text-gray-900 shadow-2xl max-w-[210mm] w-full min-h-[297mm] p-[15mm] md:p-[20mm] rounded-sm font-serif my-2 relative"
        >
          {children || (
            <div 
              className="pdf-cloned-content"
              dangerouslySetInnerHTML={{ 
                __html: typeof document !== 'undefined' ? (document.getElementById('document-preview-container')?.innerHTML || '') : '' 
              }} 
            />
          )}
        </div>
      </div>

      {/* RODAPÉ DO VISUALIZADOR */}
      <div className="bg-[#202124] text-gray-400 text-xs px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between border-t border-gray-700 shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Pronto para visualização PDF nativa, download ou impressão</span>
        </div>
        <div className="text-[11px] text-gray-400">
          Auditoria Interna — Grupo Hospitalar Conceição (GHC)
        </div>
      </div>

    </div>
  );
}
