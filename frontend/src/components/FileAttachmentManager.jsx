import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, UploadCloud, X, File as FileIcon, FileText, Image as ImageIcon, Download, Search, AlertCircle, Eye, Calendar, FileArchive, ChevronDown, ChevronUp } from 'lucide-react';

export default function FileAttachmentManager({ files = [], onUpload, onDelete, globalCollapseAction }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (globalCollapseAction) {
      setIsExpanded(globalCollapseAction.action === 'expand');
    }
  }, [globalCollapseAction]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFiles = (newFiles) => {
    if (onUpload) {
      Array.from(newFiles).forEach(file => onUpload(file));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reseta o valor do input para permitir selecionar o mesmo arquivo novamente se necessário
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (idToRemove) => {
    if (onDelete) onDelete(idToRemove);
  };

  const normalizedFiles = (files || []).map(f => ({
    id: f.id,
    name: f.fileName || f.name || 'Arquivo Desconhecido',
    type: f.fileType || f.type || 'application/octet-stream',
    size: f.size || 0,
    date: f.dataHora || f.date || new Date().toISOString(),
    url: f.url || `https://sisaudin.ghc.com.br/api/anexos/download/${f.id}`
  }));

  const getFileIcon = (type, name) => {
    if (type.startsWith('image/')) return <ImageIcon className="text-blue-500" />;
    if (type === 'application/pdf') return <FileText className="text-red-500" />;
    if (name.endsWith('.zip') || name.endsWith('.rar')) return <FileArchive className="text-amber-500" />;
    return <FileIcon className="text-gray-500" />;
  };

  const handlePreview = (fileObj) => {
    setPreviewFile(fileObj);
  };

  const filteredFiles = normalizedFiles.filter(f => {
    const matchName = f.name.toLowerCase().includes(filterText.toLowerCase());
    const matchDate = filterDate ? f.date.startsWith(filterDate) : true;
    return matchName && matchDate;
  });

  return (
    <div className="w-full my-1 font-sans">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 px-3 py-1.5 rounded-md border border-gray-200 transition-colors"
      >
        {isExpanded ? <ChevronUp size={14} className="opacity-60" /> : <ChevronDown size={14} className="opacity-60" />}
        <Paperclip size={16} /> 
        Anexos ({normalizedFiles.length})
      </button>

      {isExpanded && (
        <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-sm p-4 animate-in slide-in-from-top-2 duration-200">
          
          {/* Zona de Drop e Seleção */}
          <div 
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
              ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileInput}
            />
            <UploadCloud className={`mx-auto mb-2 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} size={32} />
            <p className="text-sm text-gray-600 font-medium">Clique ou arraste arquivos para cá</p>
            <p className="text-xs text-gray-400 mt-1">Qualquer tipo de arquivo suportado</p>
          </div>

          {/* Filtros */}
          {normalizedFiles.length > 0 && (
            <div className="flex gap-3 mt-4 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Filtrar por nome..." 
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-blue-400"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </div>
              <div className="relative w-40">
                <input 
                  type="date" 
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-blue-400 text-gray-600"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Lista de Arquivos */}
          {normalizedFiles.length > 0 && (
            <div className="space-y-2 mt-3 max-h-60 overflow-y-auto pr-1">
              {filteredFiles.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-4 italic">Nenhum arquivo encontrado nos filtros.</div>
              ) : (
                filteredFiles.map((fileObj) => (
                  <div key={fileObj.id} className="flex items-center justify-between bg-white border border-gray-100 p-2 rounded-md hover:bg-gray-50 group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div 
                        className="p-2 bg-gray-100 rounded-md cursor-pointer hover:bg-blue-100 transition-colors"
                        onClick={() => handlePreview(fileObj)}
                        title="Visualizar"
                      >
                        {getFileIcon(fileObj.type, fileObj.name)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-gray-800 truncate" title={fileObj.name}>{fileObj.name}</span>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(fileObj.date).toLocaleDateString('pt-BR')}</span>
                          {fileObj.size > 0 && <span>{(fileObj.size / 1024).toFixed(1)} KB</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handlePreview(fileObj)}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title="Visualizar"
                      >
                        <Eye size={16} />
                      </button>
                      <a 
                        href={fileObj.url} 
                        download={fileObj.name}
                        className="p-1.5 text-green-600 hover:bg-green-100 rounded-md transition-colors" title="Download"
                      >
                        <Download size={16} />
                      </a>
                      <button 
                        onClick={() => removeFile(fileObj.id)}
                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors" title="Remover"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal de Pré-visualização */}
      {previewFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                {getFileIcon(previewFile.type, previewFile.name)}
                {previewFile.name}
              </h3>
              <div className="flex items-center gap-2">
                <a 
                  href={previewFile.url} 
                  download={previewFile.name}
                  className="flex items-center gap-1 text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-100"
                >
                  <Download size={16} /> Baixar
                </a>
                <button onClick={() => setPreviewFile(null)} className="text-gray-500 hover:text-gray-700 p-1 bg-gray-100 hover:bg-gray-200 rounded-md">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 bg-gray-100 p-6 overflow-auto flex items-center justify-center">
              {previewFile.type.startsWith('image/') ? (
                <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-[70vh] object-contain shadow-sm border border-gray-200 bg-white" />
              ) : previewFile.type === 'application/pdf' ? (
                <iframe src={previewFile.url} className="w-full h-[70vh] bg-white border border-gray-200 shadow-sm" title={previewFile.name} />
              ) : (
                <div className="text-center bg-white p-8 rounded-lg shadow-sm max-w-sm border border-gray-200">
                  <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Visualização Indisponível</h4>
                  <p className="text-sm text-gray-600 mb-6">
                    O formato <strong>{previewFile.name.split('.').pop().toUpperCase()}</strong> não pode ser pré-visualizado diretamente no navegador. 
                    É necessário o uso de um aplicativo externo.
                  </p>
                  <a 
                    href={previewFile.url} 
                    download={previewFile.name}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
                  >
                    <Download size={18} /> Fazer Download
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
