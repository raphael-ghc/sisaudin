import html2pdf from 'html2pdf.js';
import { toast } from 'react-toastify';

export const openPdfInNativeViewer = async (elementOrId, docTitle = 'documento_auditoria') => {
  let element = typeof elementOrId === 'string' 
    ? document.getElementById(elementOrId) 
    : elementOrId;

  // Se não foi passado elemento direto ou por id, tenta pegar o visualizador padrão
  if (!element) {
    element = document.getElementById('pdf-viewer-content') || document.getElementById('document-preview-container');
  }

  if (!element) {
    toast.error('Elemento do documento não encontrado para conversão em PDF.');
    return;
  }

  const toastId = toast.loading('Gerando visualização em PDF (leitor nativo do navegador)...');
  try {
    const filename = `${docTitle.replace(/[^a-zA-Z0-9_-]/g, '_') || 'documento'}.pdf`;
    const opt = {
      margin:       [12, 12, 12, 12],
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const pdfBlobUrl = await html2pdf().set(opt).from(element).output('bloburl');
    toast.dismiss(toastId);

    // Abre a URL do blob no visualizador nativo de PDF do navegador
    const newWindow = window.open(pdfBlobUrl, '_blank');
    if (!newWindow) {
      toast.warn('Pop-up bloqueado pelo navegador. Por favor, permita pop-ups para visualizar o PDF.');
    }
  } catch (err) {
    console.error('Erro ao gerar PDF nativo:', err);
    toast.dismiss(toastId);
    toast.error('Erro ao gerar visualização em PDF.');
  }
};

export const downloadNativePdf = async (elementOrId, docTitle = 'documento_auditoria') => {
  let element = typeof elementOrId === 'string' 
    ? document.getElementById(elementOrId) 
    : elementOrId;

  if (!element) {
    element = document.getElementById('pdf-viewer-content') || document.getElementById('document-preview-container');
  }

  if (!element) {
    toast.error('Elemento do documento não encontrado para download.');
    return;
  }

  const toastId = toast.loading('Gerando arquivo PDF para download...');
  try {
    const filename = `${docTitle.replace(/[^a-zA-Z0-9_-]/g, '_') || 'documento'}.pdf`;
    const opt = {
      margin:       [12, 12, 12, 12],
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    await html2pdf().set(opt).from(element).save();
    toast.dismiss(toastId);
    toast.success('PDF baixado com sucesso!');
  } catch (err) {
    console.error('Erro ao baixar PDF:', err);
    toast.dismiss(toastId);
    toast.error('Erro ao gerar arquivo PDF para download.');
  }
};
