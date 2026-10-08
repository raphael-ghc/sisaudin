// src/components/RichTextEditor.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  CheckCircle2, Loader2, Edit3, Clock, Bold, Italic, Underline, 
  List, ListOrdered, Table, Image as ImageIcon, AlignLeft, 
  AlignCenter, AlignRight, AlignJustify, Quote, BookOpen,
  ArrowRightFromLine, X, Move, Type, Link as LinkIcon, Calendar
} from 'lucide-react';
import { useEditorAutoSave } from '../hooks/useEditorAutoSave';

export default function RichTextEditor({ onSave, initialContent = "" }) {
  const editorRef = useRef(null);
  const editorContainerRef = useRef(null);
  
  // Utilizando o Hook personalizado para gerenciar o salvamento
  const { saveStatus, lastSavedTime, triggerSave } = useEditorAutoSave(onSave, 3000);

  const [selectedImg, setSelectedImg] = useState(null);
  const [imgPos, setImgPos] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const dragState = useRef({ isDragging: false, startX: 0, startY: 0, startW: 0, startH: 0, img: null, handle: 'se' });

  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null });
  const [tableSettings, setTableSettings] = useState({ rows: 3, cols: 3 });
  const [footnoteText, setFootnoteText] = useState('');
  const [imgMeta, setImgMeta] = useState({ title: '', source: '', date: '' });
  const savedRangeRef = useRef(null);

  // Inicializa o conteúdo do editor
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = `
        <style>
          blockquote { border-left: 4px solid #cbd5e1; padding-left: 1rem; color: #475569; font-style: italic; margin: 1rem 0; background: #f8fafc; padding-top: 0.5rem; padding-bottom: 0.5rem; border-radius: 0 8px 8px 0;}
          .footnote-ref { color: #2563eb; cursor: pointer; font-weight: bold; padding: 0 2px; }
          .editor-footnotes { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 0.85em; color: #64748b; }
          .custom-image-figure { max-width: max-content; }
        </style>
        ${initialContent || ''}
      `;
    }
  }, [initialContent]);

  // Função central para lidar com qualquer mudança no editor
  const handleContentChange = () => {
    setSelectedImg(null); // Oculta o redimensionador ao digitar
    if (editorRef.current) {
      triggerSave(editorRef.current.innerHTML); // Dispara o hook de auto-save
    }
  };

  const execCmd = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
    handleContentChange();
  };

  // --- O restante das funções (Tabelas, Modais, Imagens, Drag/Drop) permanecem idênticas ao seu código original ---
  // (Omiti as funções internas longas como confirmTable, applyImageMetadata e handleResizeMove para manter a leitura limpa, 
  // mas você deve colar exatamente as mesmas funções que já escreveu aqui dentro)
  
  const handleEditorClick = (e) => { /* Sua lógica atual */ };
  const handleDrop = (e) => { /* Sua lógica atual, lembre de chamar handleContentChange() no final */ };
  const getModalTitle = () => { /* Sua lógica atual */ };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">
      {/* Cabeçalho do Editor (Status de Salvamento) */}
      <div className="flex justify-between items-center bg-white px-6 py-3 border-b border-gray-100">
        <div className="text-sm text-gray-500 font-medium flex items-center gap-2">
          Editor de Relatório
        </div>
        <div className="bg-gray-50 px-3 py-1.5 rounded-md border border-gray-100 transition-all">
          {saveStatus === 'editing' && <div className="flex items-center text-amber-600 gap-2"><Edit3 size={14} /><span className="text-xs">Editando...</span></div>}
          {saveStatus === 'saving' && <div className="flex items-center text-blue-600 gap-2"><Loader2 size={14} className="animate-spin" /><span className="text-xs">Salvando...</span></div>}
          {saveStatus === 'saved' && <div className="flex items-center text-emerald-600 gap-2"><CheckCircle2 size={14} /><span className="text-xs">Salvo às {lastSavedTime}</span></div>}
          {saveStatus === 'idle' && <div className="flex items-center text-gray-400 gap-2"><Clock size={14} /><span className="text-xs">Pronto</span></div>}
        </div>
      </div>

      {/* Toolbar Principal */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-1 flex-wrap">
        <button onClick={() => execCmd('bold')} className="p-2 hover:bg-gray-200 text-gray-700 rounded"><Bold size={18} /></button>
        <button onClick={() => execCmd('italic')} className="p-2 hover:bg-gray-200 text-gray-700 rounded"><Italic size={18} /></button>
        {/* ... Restante dos seus botões da Toolbar ... */}
      </div>

      {/* Área do Editor */}
      <div className="p-8 relative" ref={editorContainerRef}>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning={true}
          onInput={handleContentChange}
          onClick={handleEditorClick}
          onDrop={handleDrop}
          className="min-h-[400px] outline-none text-gray-800 leading-relaxed"
          style={{ fontSize: '15px' }}
        />
        {/* Overlay de Imagem e Modais (Sua lógica atual do JSX) */}
      </div>
    </div>
  );
}