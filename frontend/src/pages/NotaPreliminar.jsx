// src/pages/NotaPreliminar.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import DuplicateNumberModal from '../components/DuplicateNumberModal';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import RichTextEditor from '../components/RichTextEditor';
import FileAttachmentManager from '../components/FileAttachmentManager';
import Historico from '../components/Historico';
import Status from '../components/Status';
import { Shield, PanelLeft, Columns, PanelRight, FileText, ChevronDown, ChevronUp, Printer, Calendar, Info, AlertTriangle, X, Trash2, Edit3, Loader2, CheckCircle2, Clock, ArrowLeft, Save } from 'lucide-react';
import { useEditorAutoSave } from '../hooks/useEditorAutoSave';
import { toast } from 'react-toastify';
import { getAllItensTrabalho, getItemTrabalhoById } from '../api/itemTrabalhoApi';
import { getAllGeneric } from '../api/genericApi';
import { getAllGerencias } from '../api/gerenciaApi';
import { getRelatorioById, updateRelatorioById, getRelatorioByItemTrabalho, createEmptyRelatorio } from '../api/notaPreliminarApi';
import api from '../api/axiosInstance';
import { API_URL, API_BASE } from '../api/config';
import debounce from 'lodash.debounce';
import { Client } from '@stomp/stompjs';
//import SockJS from 'sockjs-client';
import imgCabecalho from '../img/ghc_cabecalho.png';
import imgRodape from '../img/ghc_rodape.png';
import DocumentPdfViewerModal from '../components/DocumentPdfViewerModal';
import { useAppContext } from '../contexts/AppContext';


const SectionPageNumbers = ({ startPage, pageCount, isLandscape = false }) => {
    if (!startPage || !pageCount) return null;
    return (
        <div className="print-only-page-numbers" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 100 }}>
            {Array.from({ length: pageCount }).map((_, i) => {
                const pageNum = startPage + i;
                const pageHeight = isLandscape ? '170mm' : '257mm';
                return (
                    <div key={i} className="print-page-number" style={{
                        position: 'absolute',
                        top: `calc(${i + 1} * ${pageHeight} - 12mm)`, 
                        right: '15mm', 
                        fontSize: '9pt',
                        fontWeight: 'bold',
                        color: 'var(--text-color)',
                        textAlign: 'right'
                    }}>
                        {/*Página A {pageNum}*/}
                    </div> 
                );
            })}
        </div>
    );
};

const hasResumoContent = (text) => {
  if (!text) return false;
  const stripped = String(text).replace(/<[^>]*>/g, '').trim();
  return stripped.length > 0;
};

const formatDataBr = (dt) => {
  if (!dt) return 'N/D';
  try {
    const dateStr = String(dt).includes('T') ? String(dt).split('T')[0] + 'T12:00:00' : dt + 'T12:00:00';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  } catch (e) {
    return dt;
  }
};

const SearchableSelect = ({ options, value, onChange, placeholder, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredOptions = options.filter(opt => {
    const label = typeof opt === 'string' ? opt : opt.label;
    return label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const displayValue = value ? (typeof options[0] === 'string' ? value : options.find(o => String(o.value) === String(value))?.label) : '';

  return (
    <div className="relative">
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full border rounded-md px-3 py-2 text-sm flex justify-between items-center transition-colors ${
          disabled 
            ? 'bg-gray-100 text-gray-700 cursor-not-allowed border-gray-300 font-semibold shadow-inner' 
            : 'border-gray-300 bg-white cursor-pointer hover:border-gray-400'
        }`}
        title={disabled ? 'Campo travado e vinculado ao Item de Trabalho selecionado na listagem' : ''}
      >
        <span className={value ? "text-gray-800" : "text-gray-400"}>
          {displayValue || placeholder || 'Selecione...'}
        </span>
        <div className="flex items-center gap-1.5">
          {disabled && (
            <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-normal">
              Travado
            </span>
          )}
          <ChevronDown size={16} className={`text-gray-400 ${disabled ? 'opacity-40' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
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
                <div className="px-3 py-3 text-sm text-gray-500 text-center">Nenhum resultado</div>
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

// ==========================================
// COMPONENTES DE GERENCIAMENTO DE SELEÇÃO
// ==========================================
const MultiSelectDropdown = ({ options, values, onChange, placeholder, onSearch, searchValue, isLoading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredOptions = options.filter(opt => {
    const label = typeof opt === 'string' ? opt : opt.label;
    return label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const toggleOption = (opt) => {
    const value = typeof opt === 'string' ? opt : opt.value;
    if (values.includes(value)) {
      onChange(values.filter(v => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  const displayValue = values.map(v => {
    const opt = options.find(o => (typeof o === 'string' ? o === v : o.value === v));
    return opt ? (typeof opt === 'string' ? opt : opt.label) : v;
  }).join(', ');

  return (
    <div className="relative w-full">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm cursor-pointer flex justify-between items-center bg-white hover:border-gray-400 transition-colors"
      >
        <span className={values.length > 0 ? "text-gray-800" : "text-gray-400"}>
            {displayValue || placeholder || 'Selecione...'}
        </span>
        <ChevronDown size={16} className="text-gray-400" />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
            <div className="p-2 border-b border-gray-100 bg-white rounded-t-md">
              <input
                type="text"
                autoFocus
                className="w-full border border-blue-400 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Digite para buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto rounded-b-md bg-white">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-3 text-sm text-gray-500 text-center">Nenhum resultado</div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const val = typeof opt === 'string' ? opt : opt.value;
                  const label = typeof opt === 'string' ? opt : opt.label;
                  return (
                    <label 
                      key={idx}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                    >
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        checked={values.includes(val)}
                        onChange={() => toggleOption(opt)}
                      />
                      <span>{label}</span>
                    </label>
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

const ResumoConstatacaoSection = ({
  item,
  collapsed,
  onToggle,
  onUpdate,
  handleAutoSave,
  isReadOnly
}) => {
  const onSaveResumo = useCallback(async (contentObj) => {
    await handleAutoSave(`Resumo NotaPreliminarConstatacao ${item.id}`, JSON.stringify(contentObj));
  }, [handleAutoSave, item.id]);

  const { saveStatus, lastSavedTime, triggerSave } = useEditorAutoSave(onSaveResumo, 2500);

  const handleChangeField = (field, value) => {
    onUpdate(item.id, field, value);
    const updated = {
      resumoFato: item.resumoFato || '',
      resumoCriterio: item.resumoCriterio || '',
      resumoCausa: item.resumoCausa || '',
      resumoImpacto: item.resumoImpacto || '',
      [field]: value
    };
    triggerSave(updated);
  };

  return (
    <div className="bg-gray-50 border-b border-blue-100">
      <div 
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-100"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <button type="button" className="text-gray-500 hover:text-gray-700 flex items-center" title={collapsed ? "Expandir seção" : "Recolher seção"}>
            {collapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
          <h4 className="font-semibold text-gray-700 text-sm flex items-center gap-1.5">
            Resumo da Constatação
          </h4>
        </div>
        
        <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end">
            {saveStatus === 'editing' && <div className="flex items-center text-amber-600 gap-1" title="Alterações pendentes de salvamento"><Edit3 size={13} /><span className="text-[11px] font-medium">Editando...</span></div>}
            {saveStatus === 'saving' && <div className="flex items-center text-blue-600 gap-1" title="Salvando alterações automaticamente"><Loader2 size={13} className="animate-spin" /><span className="text-[11px] font-medium">Salvando...</span></div>}
            {saveStatus === 'saved' && <div className="flex items-center text-emerald-600 gap-1" title="Todas as alterações foram salvas"><CheckCircle2 size={13} /><span className="text-[11px] font-medium">Salvo às {lastSavedTime}</span></div>}
            {saveStatus === 'idle' && <div className="flex items-center text-gray-400 gap-1" title="Salvo automaticamente ao digitar"><Clock size={13} /><span className="text-[11px] font-medium">Auto-salvamento ativo</span></div>}
          </div>
        </div>
      </div>
      
      {!collapsed && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Resumo do Fato/Condição</label>
            <textarea
              className="w-full border border-gray-300 rounded p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
              rows={3}
              disabled={isReadOnly}
              value={item.resumoFato || ''}
              onChange={(e) => handleChangeField('resumoFato', e.target.value)}
              placeholder="Descreva brevemente o fato ou condição..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Resumo do Critério</label>
            <textarea
              className="w-full border border-gray-300 rounded p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
              rows={3}
              disabled={isReadOnly}
              value={item.resumoCriterio || ''}
              onChange={(e) => handleChangeField('resumoCriterio', e.target.value)}
              placeholder="Descreva brevemente o critério..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Resumo da Causa</label>
            <textarea
              className="w-full border border-gray-300 rounded p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
              rows={3}
              disabled={isReadOnly}
              value={item.resumoCausa || ''}
              onChange={(e) => handleChangeField('resumoCausa', e.target.value)}
              placeholder="Descreva brevemente a causa..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Resumo do Impacto/Riscos</label>
            <textarea
              className="w-full border border-gray-300 rounded p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
              rows={3}
              disabled={isReadOnly}
              value={item.resumoImpacto || ''}
              onChange={(e) => handleChangeField('resumoImpacto', e.target.value)}
              placeholder="Descreva brevemente o impacto e riscos..."
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default function NotaPreliminar() {

  const [showDuplicateModal, setShowDuplicateModal] = useState({ isOpen: false });

  const acceptSuggestion = (newNumero, newAno) => {
    setNumero(newNumero);
    setAno(newAno);
    setShowDuplicateModal({ isOpen: false });
  };

  const validateNumero = async (numeroToCheck, anoToCheck, currentId, itemId) => {
      if (!numeroToCheck || !anoToCheck) return true;
      try {
          const valRes = await api.get(`/documentos/check-number?entityName=NotaPreliminar&ano=${anoToCheck}&numero=${numeroToCheck}&itemTrabalhoId=${itemId || ''}&currentEntityId=${currentId || ''}`);
          if (!valRes.data.available) {
              setShowDuplicateModal({
                  isOpen: true,
                  message: `O número ${numeroToCheck}/${anoToCheck} já está em uso para este tipo de documento.`,
                  nextAvailable: valRes.data.nextAvailable,
                  ano: anoToCheck
              });
              return false;
          }
          return true;
      } catch(err) {
          console.error(err);
          return true;
      }
  };
  const { jwtPayload } = useAppContext();
  const navigate = useNavigate();
  const [layoutMode, setLayoutMode] = useState('split'); // 'editor', 'split', 'preview'
  const [activeSectionId, setActiveSectionId] = useState(null);
  const previewContainerRef = useRef(null);

  React.useEffect(() => {
    const scrollToPreview = () => {
      if (activeSectionId && layoutMode === 'split') {
        const el = document.getElementById(`preview-${activeSectionId}`) || document.getElementById(`preview-${activeSectionId.split('-')[0]}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };

    scrollToPreview();

    let throttleTimeout = null;
    const handleTypingScroll = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          scrollToPreview();
          throttleTimeout = null;
        }, 400);
      }
    };

    window.addEventListener('editor-typing-scroll', handleTypingScroll);
    return () => window.removeEventListener('editor-typing-scroll', handleTypingScroll);
  }, [activeSectionId, layoutMode]);

  const [itensTrabalhoList, setItensTrabalhoList] = useState([]);
  const [gerenciasList, setGerenciasList] = useState([]);
  const [niveisRiscoList, setNiveisRiscoList] = useState([]);
  const [beneficiosQualitativosList, setBeneficiosQualitativosList] = useState([]);
  const [beneficiosFinanceirosList, setBeneficiosFinanceirosList] = useState([]);
  const [searchParams] = useSearchParams();
  const itemTrabalhoIdParam = searchParams.get('itemTrabalhoId');
  const location = useLocation();
  const { id } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [notaId, setRelatorioId] = useState(id || location.state?.notaId || null);
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle');
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [selectedItemTrabalhoId, setSelectedItemTrabalhoId] = useState(itemTrabalhoIdParam ? Number(itemTrabalhoIdParam) : '');
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [globalCollapseAction, setGlobalCollapseAction] = useState(null);

  const [itemTrabalhoDetailsVisible, setItemTrabalhoDetailsVisible] = useState(true);

  // Estados de conteúdo para alimentar o Preview em tempo real
  const [introducao, setIntroducao] = useState('<p>Este relatório tem como objetivo avaliar as inconformidades listadas na última verificação...</p>');
  const [introducaoFiles, setIntroducaoFiles] = useState([]);
  const [preliminares, setPreliminares] = useState([]);
  const [constatacoes, setConstatacoes] = useState([]);
  const [preliminaresTextoInicial, setPreliminaresTextoInicial] = useState('');
  const [constatacoesTextoInicial, setConstatacoesTextoInicial] = useState('');
  const [consideracoes, setConsideracoes] = useState('<p>Considerações finais da auditoria...</p>');
  const [consideracoesFiles, setConsideracoesFiles] = useState([]);

  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [ano, setAno] = useState('');
  const [numero, setNumero] = useState('');
  const [gerenciasFullList, setGerenciasFullList] = useState([]);
  const [gerenciasDestinatarias, setGerenciasDestinatarias] = useState([]);

  const selectedItemData = itensTrabalhoList.find(i => i.id === selectedItemTrabalhoId);
  const isSisAdminOrGestor = ['SISTEMA', 'GESTOR'].includes(jwtPayload?.role);
  const isVisitante = jwtPayload?.role === 'VISITANTE';
  
  const isInEquipe = () => {
     if (!selectedItemData) return false;
     const myName = jwtPayload?.nome || jwtPayload?.name;
     if (!myName) return false;
     const checkName = (p) => {
        if (!p) return false;
        if (typeof p === 'string') return p.includes(myName);
        return p.nome && p.nome.includes(myName);
     };
     if (checkName(selectedItemData.responsavel)) return true;
     if (checkName(selectedItemData.supervisor)) return true;
     if (checkName(selectedItemData.supervisorTecnico)) return true;
     if (selectedItemData.equipe && Array.isArray(selectedItemData.equipe)) {
        return selectedItemData.equipe.some(p => checkName(p));
     }
     return false;
  };
  const isReadOnly = (isVisitante || (!isSisAdminOrGestor && !isInEquipe())) && !!selectedItemData;

  // ==========================================
  // ATUALIZAR TÍTULO DA ABA/IMPRESSÃO NATIVA
  // ==========================================
  useEffect(() => {
    const tituloOriginal = document.title;
    const titleSigla = (selectedItemData?.sigla || '').toUpperCase().includes('EXTRA') ? 'NA' : 'NA';
      document.title = `${titleSigla} ${numero ? String(numero).padStart(2, '0') : '00'}/${ano} - Auditoria Interna`;
    return () => { document.title = tituloOriginal; };
  }, [numero, ano]);

  // Anexos Finais
  const [anexosFinais, setAnexosFinais] = useState([]);
  const [collapsedAnexos, setCollapsedAnexos] = useState({});
  const toggleAnexo = (id) => setCollapsedAnexos(prev => ({ ...prev, [id]: !prev[id] }));

  const [collapsedResumos, setCollapsedResumos] = useState({});
  const toggleResumo = (id) => setCollapsedResumos(prev => ({ ...prev, [id]: !prev[id] }));

  const [collapsedRecomendacoes, setCollapsedRecomendacoes] = useState({});
  const toggleRecomendacao = (id) => setCollapsedRecomendacoes(prev => ({ ...prev, [id]: !prev[id] }));

  // Anexos de Componentes
  const [anexos, setAnexos] = useState([]);
  const [pageNumbers, setPageNumbers] = useState({});
  const [pageOrientations, setPageOrientations] = useState([]);
  const [pageCountMetadata, setPageCountMetadata] = useState({ startPage: 5, totalPages: 5 });

  React.useEffect(() => {
    const calculatePages = () => {
      const newPageNums = {};
      const newPageOrientations = []; 
      
      const PADDING_PX = 151; 
      const PRINTABLE_PORTNAIT_PX = 971; 
      const PRINTABLE_LANDSCAPE_PX = 643; 
      
      const getPagesForElement = (el, isLandscape = false) => {
          if (!el) return 1;
          const contentHeight = Math.max(0, el.scrollHeight - PADDING_PX);
          const pageHeight = isLandscape ? PRINTABLE_LANDSCAPE_PX : PRINTABLE_PORTNAIT_PX;
          const pages = Math.max(1, Math.ceil(contentHeight / pageHeight));
          for(let i = 0; i < pages; i++) {
              newPageOrientations.push(isLandscape ? 'landscape' : 'portrait');
          }
          return pages;
      };

      const elCapa = document.getElementById('page-capa');
      const pagesCapa = getPagesForElement(elCapa);
      const elNota = document.getElementById('page-nota');
      const pagesNota = getPagesForElement(elNota);
      const elSumario = document.getElementById('page-sumario');
      const pagesSumario = getPagesForElement(elSumario);

      let currentStartPage = pagesCapa + pagesNota + pagesSumario + 1;
      const getTopicPage = (topicId, parentEl, startPage, isLandscape = false) => {
        const elTopic = document.getElementById(topicId);
        if (!elTopic || !parentEl) return startPage;
        const parentTopPadding = 75; 
        const offsetTop = Math.max(0, elTopic.getBoundingClientRect().top - (parentEl.getBoundingClientRect().top + parentTopPadding));
        const pageHeightPx = isLandscape ? PRINTABLE_LANDSCAPE_PX : PRINTABLE_PORTNAIT_PX;
        const pageOffset = Math.floor(offsetTop / pageHeightPx);
        return startPage + pageOffset;
      };
      const elPrelimConst = document.getElementById('page-preliminares-constatacoes');
      const pagesPrelimConst = getPagesForElement(elPrelimConst);
      newPageNums['footer-preliminares-constatacoes'] = currentStartPage + pagesPrelimConst - 1;

      newPageNums['preview-preliminares'] = getTopicPage('preview-preliminares', elPrelimConst, currentStartPage);
      preliminares.forEach((p) => {
        newPageNums[`preview-preliminar-${p.id}`] = getTopicPage(`preview-preliminar-${p.id}`, elPrelimConst, currentStartPage);
      });

      newPageNums['preview-constatacoes'] = getTopicPage('preview-constatacoes', elPrelimConst, currentStartPage);
      constatacoes.forEach((c) => {
        newPageNums[`preview-constatacao-${c.id}`] = getTopicPage(`preview-constatacao-${c.id}`, elPrelimConst, currentStartPage);
      });

      newPageNums['preview-consideracoes'] = getTopicPage('preview-consideracoes', elPrelimConst, currentStartPage);

      currentStartPage += pagesPrelimConst;

      const elAnexoA = document.getElementById('page-anexo-a');
      const pagesAnexoA = getPagesForElement(elAnexoA, true);
      newPageNums['footer-anexoa'] = currentStartPage + pagesAnexoA - 1;
      newPageNums['preview-anexoa'] = currentStartPage;

      currentStartPage += pagesAnexoA;

      anexosFinais.forEach((a) => {
        const elAnexo = document.getElementById(`page-anexo-${a.id}`);
        const isLandscape = (a.tipo === 'arquivo' && a.arquivos && a.arquivos.some(f => f.type === 'application/pdf') && a.orientacao === 'paisagem');
        const pagesAnexo = getPagesForElement(elAnexo, isLandscape);
        newPageNums[`preview-anexo-${a.id}`] = currentStartPage;
        newPageNums[`footer-anexo-${a.id}`] = currentStartPage + pagesAnexo - 1;
        currentStartPage += pagesAnexo;
      });

      setPageCountMetadata({
          startPage: pagesCapa + pagesNota + pagesSumario + 1,
          totalPages: currentStartPage - 1
      });

      setPageNumbers(newPageNums);
      setPageOrientations(newPageOrientations);
    };

    const timer = setTimeout(calculatePages, 300);
    window.addEventListener('resize', calculatePages);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculatePages);
    };
  }, [preliminares, constatacoes, anexosFinais, consideracoes, preliminaresTextoInicial, constatacoesTextoInicial]);

  const fetchAnexos = async (itemTrabalhoId) => {
    if (!itemTrabalhoId) return;
    try {
      const res = await fetch(`${API_URL}/anexos/item/${itemTrabalhoId}?documento=Nota%20de%20Auditoria`);
      if (res.ok) {
        const data = await res.json();
        setAnexos(data);
      }
    } catch (e) {
      console.error('Erro ao buscar anexos', e);
    }
  };

  useEffect(() => {
    if (selectedItemTrabalhoId) {
      fetchAnexos(selectedItemTrabalhoId);
    }
  }, [selectedItemTrabalhoId]);

  const handleUploadAnexo = async (file, secao) => {
    if (isReadOnly) return;
    if (!selectedItemTrabalhoId) {
       alert('Selecione um item de trabalho primeiro.');
       return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('itemTrabalhoId', selectedItemTrabalhoId);
    formData.append('documento', 'Nota de Auditoria');
    formData.append('secao', secao);
    formData.append('responsavel', 'Auditor(a)'); 

    try {
      const res = await fetch(`${API_URL}/anexos/upload`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const novoAnexo = await res.json();
        setAnexos(prev => [...prev, novoAnexo]);
      } else {
        alert('Falha ao enviar anexo');
      }
    } catch (e) {
      console.error('Erro no upload', e);
    }
  };

  const handleDeleteAnexo = async (id) => {
    if (isReadOnly) return;
    if (window.confirm('Tem certeza que deseja excluir este anexo?')) {
      try {
        const res = await fetch(`${API_URL}/anexos/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setAnexos(prev => prev.filter(a => a.id !== id));
        }
      } catch (e) {
        console.error('Erro ao deletar anexo', e);
      }
    }
  };

  const getAnexosBySecao = (secao) => anexos.filter(a => a.secao === secao);

  // Mock de Histórico
  const [historicoEventos, setHistoricoEventos] = useState([
    { id: 1, tipo: 'criação', dataHora: '2026-07-20T09:00:00Z', acao: 'Criação da Nota de Auditoria', responsavel: '', detalhes: 'Documento inicial criado no sistema' },
    { id: 2, tipo: 'edição', dataHora: '2026-07-20T10:15:00Z', acao: 'Edição da Constatação 4.1', responsavel: '', detalhes: 'Ajustado o texto descritivo e adicionada nova recomendação' },
    { id: 3, tipo: 'exclusão', dataHora: '2026-07-20T10:30:00Z', acao: 'Exclusão de Anexo', responsavel: '', detalhes: 'Removida a Tabela de Juros (Anexo B)' }
  ]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getAllItensTrabalho();
        if (response.data) {
           const dataObj = response.data.data || response.data;
           let items = [];
           if (Array.isArray(dataObj)) items = dataObj;
           else if (dataObj.content) items = dataObj.content;
           else if (dataObj._embedded) items = Object.values(dataObj._embedded)[0] || [];
           
           if (!id) {
             items = items.filter(it => it.status === 'APROVADO' || it.status === 'Aprovado' || String(it.id) === String(itemTrabalhoIdParam));
           }
           setItensTrabalhoList(items);
        }

        try {
          const gerResponse = await getAllGerencias();
          let items = [];
          if (gerResponse && gerResponse.data) {
            const dataObj = gerResponse.data.data || gerResponse.data;
            if (Array.isArray(dataObj)) items = dataObj;
            else if (dataObj.content && Array.isArray(dataObj.content)) items = dataObj.content;
            else if (dataObj._embedded) items = Object.values(dataObj._embedded)[0] || [];
            else if (Array.isArray(gerResponse.data)) items = gerResponse.data;
          }
          if (!items || items.length === 0) {
            items = [];
          }
          items.sort((a, b) => {
            const nA = a.nome || a || '';
            const nB = b.nome || b || '';
            return String(nA).localeCompare(String(nB), 'pt-BR');
          });
          setGerenciasList(items.map((i) => i.nome || i));
          setGerenciasFullList(items.map((i, idx) => (typeof i === 'string' ? { id: idx + 1000, nome: i } : i)));
        } catch (gerErr) {
          console.error('Erro ao buscar gerências:', gerErr);
          setGerenciasList([]);
          setGerenciasFullList([]);
        }

        const riscoResponse = await getAllGeneric('nivel-de-risco');
        if (riscoResponse.data) {
           const dataObj = riscoResponse.data.data || riscoResponse.data;
           let items = [];
           if (Array.isArray(dataObj)) items = dataObj;
           else if (dataObj.content) items = dataObj.content;
           else if (dataObj._embedded) items = Object.values(dataObj._embedded)[0] || [];
           setNiveisRiscoList(items.map(i => i.nome));
        }

        const bqResponse = await getAllGeneric('classe-qualitativa');
        if (bqResponse.data) {
           const dataObj = bqResponse.data.data || bqResponse.data;
           let items = [];
           if (Array.isArray(dataObj)) items = dataObj;
           else if (dataObj.content) items = dataObj.content;
           else if (dataObj._embedded) items = Object.values(dataObj._embedded)[0] || [];
           setBeneficiosQualitativosList(items.map(i => i.nome));
        }

        const bfResponse = await getAllGeneric('classe-financeira');
        if (bfResponse.data) {
           const dataObj = bfResponse.data.data || bqResponse.data;
           let items = [];
           if (Array.isArray(dataObj)) items = dataObj;
           else if (dataObj.content) items = dataObj.content;
           else if (dataObj._embedded) items = Object.values(dataObj._embedded)[0] || [];
           setBeneficiosFinanceirosList(items.map(i => i.nome));
        }

      } catch (e) {
        console.error('Erro ao buscar dados iniciais', e);
      }
    };
    fetchData();
  }, [id]);

  const [pessoasOptions, setPessoasOptions] = useState([]);
  const [equipeSelecionada, setEquipeSelecionada] = useState([]);
  const [responsavelSelecionado, setResponsavelSelecionado] = useState('');
  const [supervisorSelecionado, setSupervisorSelecionado] = useState('');
  const [supervisorTecnicoSelecionado, setSupervisorTecnicoSelecionado] = useState('');

  React.useEffect(() => {
    const fetchPessoas = async () => {
      try {
        const response = await getAllGeneric('pessoa');
        if (response.data) {
           const baseData = response.data.data || response.data;
           const items = Array.isArray(baseData) ? baseData : (baseData.content || baseData._embedded?.pessoaList || []);
           setPessoasOptions(items.map(p => `${p.nome} (Cartão: ${p.cartaoPonto}) (Cargo: ${p.cargo?.nome || '-'})`));
        }
      } catch (e) {
        console.error('Erro ao buscar pessoas', e);
      }
    };
    fetchPessoas();
  }, []);

  React.useEffect(() => {
    const fetchDetalhesItem = async () => {
      if (selectedItemTrabalhoId) {
        try {
          const res = await getItemTrabalhoById(selectedItemTrabalhoId);
          if (res.data) {
            const item = res.data.data || res.data;
            const formatPessoaStr = p => p ? `${p.nome} (Cartão: ${p.cartaoPonto}) (Cargo: ${p.cargo?.nome || '-'})` : '';
            setEquipeSelecionada(item.equipe ? item.equipe.map(formatPessoaStr).filter(Boolean) : []);
            setResponsavelSelecionado(formatPessoaStr(item.responsavel));
            setSupervisorSelecionado(formatPessoaStr(item.supervisor));
            setSupervisorTecnicoSelecionado(formatPessoaStr(item.supervisorTecnico));
          }
        } catch (e) {
          console.error("Erro ao buscar detalhes do item de trabalho", e);
        }
      }
    };
    fetchDetalhesItem();
  }, [selectedItemTrabalhoId]);

  useEffect(() => {
    const gid = searchParams.get('gerenciaId');
    if (gid && gerenciasFullList.length > 0 && gerenciasDestinatarias.length === 0) {
      const g = gerenciasFullList.find(x => String(x.id || x.gerenciaId) === String(gid));
      if (g) {
        setGerenciasDestinatarias([g]);
      }
    }
  }, [searchParams, gerenciasFullList]);

  React.useEffect(() => {
    const fetchRelatorioData = async () => {
        setIsLoading(true);
        try {
            let relRes = null;
            if (notaId) {
                relRes = await getRelatorioById(notaId);
            } else if (itemTrabalhoIdParam) {
                try {
                    relRes = await getRelatorioByItemTrabalho(itemTrabalhoIdParam);
                } catch (e) {
                    relRes = null;
                }
            }
            if (!relRes) {
                if (isReadOnly && !notaId) return;
                relRes = await createEmptyRelatorio();
                if (relRes && relRes.id) {
                    setRelatorioId(relRes.id);
                    const basePath = location.pathname.startsWith('/nota') ? '/nota' : '/NotaPreliminar';
                    const queryStr = location.search || (itemTrabalhoIdParam ? `?itemTrabalhoId=${itemTrabalhoIdParam}` : '');
                    navigate(`${basePath}/${relRes.id}${queryStr}`, { replace: true });
                }
            } else if (relRes && !notaId) {
                setRelatorioId(relRes.id);
                const basePath = location.pathname.startsWith('/nota') ? '/nota' : '/NotaPreliminar';
                const queryStr = location.search || (itemTrabalhoIdParam ? `?itemTrabalhoId=${itemTrabalhoIdParam}` : '');
                navigate(`${basePath}/${relRes.id}${queryStr}`, { replace: true });
            }

            if (relRes) {
                setIntroducao(relRes.introducao || '');
                setConsideracoes(relRes.consideracoes || '');
                setPreliminaresTextoInicial(relRes.preliminaresTextoInicial || '');
                setConstatacoesTextoInicial(relRes.constatacoesTextoInicial || '');
                
                setDataInicial(relRes.dataInicial || '');
                setDataFinal(relRes.dataFinal || '');
                setAno(relRes.ano || '');
                setNumero(relRes.numero || '');
                if (relRes.gerenciasDestinatarias) {
                    setGerenciasDestinatarias(relRes.gerenciasDestinatarias);
                }

                if (relRes.preliminares) {
                    setPreliminares(relRes.preliminares);
                }
                if (relRes.constatacoes) {
                    setConstatacoes(relRes.constatacoes);
                }
                if (relRes.anexosFinais) {
                    setAnexosFinais(relRes.anexosFinais.sort((a, b) => (a.ordem || 0) - (b.ordem || 0)));
                }

                if (relRes.itemTrabalho) {
                    setSelectedItemTrabalhoId(relRes.itemTrabalho.id);
                } else if (itemTrabalhoIdParam) {
                    setSelectedItemTrabalhoId(Number(itemTrabalhoIdParam));
                }

            }
        } catch (error) {
            console.error("Erro ao buscar dados do relatório:", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchRelatorioData();
  }, [notaId]);

  const handleStatusChange = (novoStatus, detalhes) => {
    const novoEvento = {
      id: Date.now(),
      tipo: 'edição',
      dataHora: detalhes?.dataHora || new Date().toISOString(),
      acao: `Alterou status para ${novoStatus}`,
      responsavel: detalhes?.responsavel,
      detalhes: detalhes?.justificativa ? `Justificativa: ${detalhes.justificativa}` : ''
    };
    setHistoricoEventos(prev => [novoEvento, ...prev]);
  };

  const stompClient = useRef(null);
  const sessionId = useRef(Math.random().toString(36).substring(2, 10)).current;
  const [activeEditors, setActiveEditors] = useState({});
  const currentUser = 'Auditor Chefe (Você)'; 

  const debouncedSave = useCallback(
      debounce(async (dataToSave, id, itemTrabId, onStart, onSuccess, onError) => {
          if (!id || isReadOnly) return;

      if (!(await validateNumero(payload.numero, payload.ano, id, itemId))) return;
          try {
              if (onStart) onStart();
              await updateRelatorioById(id, dataToSave, itemTrabId);
              console.log('Autosaved', dataToSave);
              if (onSuccess) onSuccess();
          } catch (e) {
              console.error('Falha no auto-save', e);
              if (onError) onError(e);
          }
      }, 3000),
      [isReadOnly]
  );

  useEffect(() => {
     if (notaId && !isLoading && !isReadOnly) {
         setAutoSaveStatus('editing');
         debouncedSave({
             introducao,
             consideracoes,
             preliminaresTextoInicial: preliminaresTextoInicial || '',
             constatacoesTextoInicial: constatacoesTextoInicial || '',
             dataInicial: dataInicial || null,
             dataFinal: dataFinal || null,
             ano: ano || null,
             numero: numero || null,
             gerenciasDestinatarias: gerenciasDestinatarias.map(g => ({ id: g.id, nome: g.nome })),
             preliminares: preliminares.map(p => ({
                 id: typeof p.id === 'string' || (p.id && p.id > 1000000000000) ? null : p.id,
                 titulo: p.titulo,
                 content: p.content
             })),
             constatacoes: constatacoes.map(c => ({
                 id: typeof c.id === 'string' || (c.id && c.id > 1000000000000) ? null : c.id,
                 titulo: c.titulo,
                 content: c.content,
                 resumoFato: c.resumoFato || '',
                 resumoCriterio: c.resumoCriterio || '',
                 resumoCausa: c.resumoCausa || '',
                 resumoImpacto: c.resumoImpacto || '',
                 recomendacoes: c.recomendacoes ? c.recomendacoes.map(r => ({
                     id: typeof r.id === 'string' || (r.id && r.id > 1000000000000) ? null : r.id,
                     content: r.content,
                     dataLimite: r.dataLimite,
                     nivelRisco: r.nivelRisco,
                     gerencia: r.gerencia,
                     tipoBeneficio: r.tipoBeneficio,
                     detalheBeneficio: r.detalheBeneficio,
                     statusBeneficio: r.statusBeneficio,
                     anoImplementacao: r.anoImplementacao,
                     descricaoBeneficioRealizado: r.descricaoBeneficioRealizado,
                     descricaoCustoBeneficio: r.descricaoCustoBeneficio,
                     valorCustoBeneficio: r.valorCustoBeneficio,
                     valorBrutoBeneficio: r.valorBrutoBeneficio,
                     valorLiquidoBeneficio: r.valorLiquidoBeneficio
                 })) : []
             })),
             anexosFinais: anexosFinais.map((a, idx) => ({
                 id: typeof a.id === 'string' || (a.id && a.id > 1000000000000) ? null : a.id,
                 titulo: a.titulo || '',
                 tipo: a.tipo || 'texto',
                 orientacao: a.orientacao || 'retrato',
                 content: a.content || '',
                 ordem: idx + 1
             }))
         }, notaId, selectedItemTrabalhoId,
         () => setAutoSaveStatus('saving'),
         () => {
             setAutoSaveStatus('saved');
             setLastSavedTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
         },
         () => setAutoSaveStatus('idle')
         );
     }
  }, [introducao, consideracoes, preliminaresTextoInicial, constatacoesTextoInicial, selectedItemTrabalhoId, notaId, debouncedSave, dataInicial, dataFinal, ano, numero, preliminares, constatacoes, anexosFinais, gerenciasDestinatarias, isLoading, isReadOnly]);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleGerarPdfServidor = async () => {
    const previewEl = document.getElementById('document-preview-container');
    if (!previewEl) {
      toast.error('Erro: visualização não encontrada.');
      return;
    }
    
    setIsGeneratingPdf(true);
    try {
      const clone = previewEl.cloneNode(true);
      
      // Converter URLs de imagens para caminhos absolutos para o backend (Playwright) conseguir baixar
      const images = clone.querySelectorAll('img');
        
        const convertImageToBase64 = async (imgEl) => {
            try {
                if (imgEl.src.startsWith('data:')) return;
                
                const response = await fetch(imgEl.src);
                const blob = await response.blob();
                
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        imgEl.src = reader.result;
                        resolve();
                    };
                    reader.onerror = resolve;
                    reader.readAsDataURL(blob);
                });
            } catch (e) {
                console.error('Failed to convert image to base64:', e);
            }
        };
        
        const imagePromises = Array.from(images).map(convertImageToBase64);
        await Promise.all(imagePromises);
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Nota Preliminar</title>
          <style>
             blockquote { border-left: 4px solid #cbd5e1 !important; padding: 12px 16px !important; color: #475569 !important; font-style: italic !important; margin: 16px 0 !important; background-color: #f8fafc !important; border-radius: 4px !important; display: block !important; }
             blockquote * { color: #475569 !important; font-style: italic !important; font-family: 'Calibri', sans-serif !important; }
             :root { 
                 --ghc-primary: #00767d; 
                 --ghc-secondary: #84c9bd; 
                 --paper-color: #ffffff; 
                 --text-color: #2d3748; 
                 --border-color: #cbd5e0; 
             }
             body { background: white; margin: 0; padding: 0; font-family: 'Calibri', sans-serif !important; }
             .preview-container { color: var(--text-color); font-size: 14pt; line-height: 1.5; display: flex; flex-direction: column; align-items: center; }
             .preview-container .page { background-color: var(--paper-color); box-sizing: border-box; position: relative; margin-bottom: 20px; display: flex; flex-direction: column; width: 100%; }
             .preview-container h2 { color: var(--ghc-primary); padding: 6px 12px; margin-top: 25px; margin-bottom: 15px; font-size: 18pt; font-weight: bold; text-transform: uppercase; border-left: 5px solid var(--ghc-primary); background: linear-gradient(90deg, rgba(132, 201, 189, 0.20) 0%, rgba(255, 255, 255, 0) 100%); } 
             .preview-container h2.center-title { text-align: center; border-left: none; background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(132, 201, 189, 0.20) 50%, rgba(255,255,255,0) 100%); }
             .preview-container h3 { color: var(--ghc-primary); font-size: 16pt; font-weight: bold; text-transform: uppercase; margin-top: 18px; margin-bottom: 10px; border-bottom: 1px solid var(--border-color); padding-bottom: 4px; }
             
             .texto-comum { text-align: justify; font-size: 14pt; font-family: 'Calibri', sans-serif !important; color: #000; line-height: 1.5; text-align: justify;}
             .texto-comum * { font-family: 'Calibri', sans-serif !important; font-size: 14pt; color: #000; line-height: 1.5; text-align: justify; }
             .texto-comum p { margin-bottom: 10px; font-family: 'Calibri', sans-serif !important; font-size: 14pt; color: #000; line-height: 1.5; text-align: justify; }
             
             table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 9pt; }
             table th, table td { border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: top; }
             table th { background-color: #f1f5f9; font-weight: bold; text-align: left; }
             .toc-list { list-style: none; padding: 0; width: 100%; } 

             .toc-title { font-size: 20pt;}
             .toc-item { margin-bottom: 6px; font-size: 20pt;} 

             .toc-link { display: flex; align-items: baseline; text-decoration: none; color: var(--text-color); font-size: 14pt; } 
             .toc-dots { flex: 1; border-bottom: 1px dotted var(--border-color); margin: 0 6px; } 
             .toc-page-num { font-weight: bold; color: var(--ghc-primary); }
             .matriz-container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 10px; margin-bottom: 15px; } 
             .matriz-box { border: 1px solid #cbd5e0; border-radius: 4px; padding: 8px 10px; } 
             .matriz-header { font-size: 8pt; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; padding-bottom: 2px; } 
             .matriz-text { font-size: 9pt; text-align: justify; line-height: 1.3; }
             .box-fato { border-left: 3px solid var(--ghc-primary); } 
             .box-fato .matriz-header { color: var(--ghc-primary); border-bottom: 1px solid var(--ghc-primary); } 
             .box-criterio { border-left: 3px solid var(--ghc-primary); } 
             .box-criterio .matriz-header { color: var(--ghc-primary); border-bottom: 1px solid var(--ghc-primary); } 
             .box-causa { border-left: 3px solid var(--ghc-primary); } 
             .box-causa .matriz-header { color: var(--ghc-primary); border-bottom: 1px solid var(--ghc-primary); } 
             .box-impacto { border-left: 3px solid var(--ghc-primary); } 
             .box-impacto .matriz-header { color: var(--ghc-primary); border-bottom: 1px solid var(--ghc-primary); }
             .action-plan-table th { background-color: var(--ghc-primary); color: white; border: 1px solid var(--ghc-primary); }
             .tabela-capa td { border: none !important; padding: 4px 0 !important; }
          
               .rec-block { background-color: #f7fafc; border: 1px solid var(--border-color); border-left: 4px solid var(--ghc-secondary); border-radius: 4px; padding: 10px 15px; margin-top: 10px; margin-bottom: 15px; }
               .rec-gerencia { font-weight: bold; color: var(--ghc-primary); text-transform: uppercase; font-size: 9pt; margin-bottom: 10px; border-bottom: 1px dashed var(--border-color); padding-bottom: 5px; }
               .rec-item { margin-bottom: 12px; font-size: 9.5pt; text-align: justify; }
               .rec-item:last-child { margin-bottom: 0; }
               .rec-meta { display: flex; gap: 20px; margin-top: 6px; font-size: 8.5pt; color: #4a5568; background: #fff; padding: 4px 8px; border-radius: 3px; border: 1px solid #e2e8f0; }
               .rec-beneficio-inline { margin-top: 6px; font-size: 8.5pt; color: #2d3748; background: #fff; padding: 4px 8px; border-radius: 3px; border: 1px solid #e2e8f0; }
               .badge-risco { padding: 2px 6px; border-radius: 4px; font-weight: bold; color: white; font-size: 8pt; text-transform: uppercase; }
               .bg-critico { background-color: #742a2a; }
               .bg-alto { background-color: #e53e3e; }
               .bg-medio { background-color: #dd6b20; }
               .bg-baixo { background-color: #3182ce; }
               .beneficio-tag { background-color: #e6fffa; color: #234e52; border: 1px solid #b2f5ea; padding: 1px 4px; border-radius: 3px; font-size: 7.5pt; font-weight: bold; }

               @page { size: A4 portrait; margin: 10mm; }
               @page landscape_page { size: A4 landscape; margin: 10mm; }
               .landscape-page { page: landscape_page; page-break-before: always; }
</style>
        </head>
        <body>
          ${clone.outerHTML}
        </body>
        </html>
      `;

      const response = await api.post('/pdf/gerar', { html: htmlContent, docName: codRelatorioStr, docVersion: 'Versão Preliminar' }, { responseType: 'blob' });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Relatorio_Preliminar_${selectedItemData?.numeroReferencia || 'GHC'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar o PDF no servidor.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSaveManual = async () => {
    if (!notaId || isReadOnly) return;

    if (!(await validateNumero(numero, ano, notaId, selectedItemTrabalhoId))) { setLoading(false); return; }
    setSaving(true);
      setAutoSaveStatus('saving');
      try {
          await updateRelatorioById(notaId, {
              introducao,
              consideracoes,
              preliminaresTextoInicial: preliminaresTextoInicial || '',
              constatacoesTextoInicial: constatacoesTextoInicial || '',
              dataInicial: dataInicial || null,
              dataFinal: dataFinal || null,
              ano: ano || null,
              numero: numero || null,
              gerenciasDestinatarias: gerenciasDestinatarias.map(g => ({ id: g.id, nome: g.nome })),
              preliminares: preliminares.map(p => ({
                  id: typeof p.id === 'string' || (p.id && p.id > 1000000000000) ? null : p.id,
                  titulo: p.titulo,
                  content: p.content
              })),
              constatacoes: constatacoes.map(c => ({
                  id: typeof c.id === 'string' || (c.id && c.id > 1000000000000) ? null : c.id,
                  titulo: c.titulo,
                  content: c.content,
                  resumoFato: c.resumoFato || '',
                  resumoCriterio: c.resumoCriterio || '',
                  resumoCausa: c.resumoCausa || '',
                  resumoImpacto: c.resumoImpacto || '',
                  recomendacoes: c.recomendacoes ? c.recomendacoes.map(r => ({
                      id: typeof r.id === 'string' || (r.id && r.id > 1000000000000) ? null : r.id,
                      content: r.content,
                      dataLimite: r.dataLimite,
                      nivelRisco: r.nivelRisco,
                      gerencia: r.gerencia,
                      tipoBeneficio: r.tipoBeneficio,
                      detalheBeneficio: r.detalheBeneficio,
                      statusBeneficio: r.statusBeneficio,
                      anoImplementacao: r.anoImplementacao,
                      descricaoBeneficioRealizado: r.descricaoBeneficioRealizado,
                      descricaoCustoBeneficio: r.descricaoCustoBeneficio,
                      valorCustoBeneficio: r.valorCustoBeneficio,
                      valorBrutoBeneficio: r.valorBrutoBeneficio,
                      valorLiquidoBeneficio: r.valorLiquidoBeneficio
                  })) : []
              })),
              anexosFinais: anexosFinais.map((a, idx) => ({
                  id: typeof a.id === 'string' || (a.id && a.id > 1000000000000) ? null : a.id,
                  titulo: a.titulo || '',
                  tipo: a.tipo || 'texto',
                  orientacao: a.orientacao || 'retrato',
                  content: a.content || '',
                  ordem: idx + 1
              }))
          }, selectedItemTrabalhoId);
          setAutoSaveStatus('saved');
          setLastSavedTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          toast.success('Nota de Auditoria salvo com sucesso!');
      } catch (error) {
          console.error("Erro ao salvar relatório manualmente:", error);
          toast.error("Erro ao salvar Nota de Auditoria.");
          setAutoSaveStatus('idle');
      } finally {
          setSaving(false);
      }
  };

  {/*
  useEffect(() => {
     if (notaId) {
        const socket = new SockJS(`${API_BASE}/ws-collab`);
        const client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('STOMP connected');
                client.subscribe(`/topic/collab/${notaId}`, (message) => {
                    if (message.body) {
                        const body = JSON.parse(message.body);
                        if (body.sessionId === sessionId) return;

                        setActiveEditors(prev => {
                            const newSt = { ...prev };
                            if (body.action === 'focus') {
                                newSt[body.field] = body.user;
                            } else if (body.action === 'blur') {
                                delete newSt[body.field];
                            }
                            return newSt;
                        });
                    }
                });
            }
        });
        client.activate();
        stompClient.current = client;

        return () => {
            if (stompClient.current) {
                stompClient.current.deactivate();
            }
        };
     }
  }, [notaId]);
  */}

  const handleFieldFocus = (fieldName) => {
      if (isReadOnly || !stompClient.current || !stompClient.current.connected || !notaId) return;
      stompClient.current.publish({
          destination: `/app/collab/${notaId}/presence`,
          body: JSON.stringify({ sessionId, user: currentUser, field: fieldName, action: 'focus' })
      });
  };

  const handleFieldBlur = (fieldName) => {
      if (isReadOnly || !stompClient.current || !stompClient.current.connected || !notaId) return;
      stompClient.current.publish({
          destination: `/app/collab/${notaId}/presence`,
          body: JSON.stringify({ sessionId, user: currentUser, field: fieldName, action: 'blur' })
      });
  };

  const renderEditorPresence = (fieldName) => {
      const editingUser = activeEditors[fieldName];
      if (!editingUser) return null;
      return (
          <div className="absolute top-0 right-0 -mt-3 mr-4 bg-blue-50 text-blue-800 text-xs font-bold px-2 py-1 rounded shadow-sm z-10 flex items-center gap-1 animate-pulse border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
              {editingUser} editando...
          </div>
      );
  };

  const [draggedItemInfo, setDraggedItemInfo] = useState(null);

  const handleDragStart = (e, type, index, item, parentId = null) => {
    if (isReadOnly) return;
    setDraggedItemInfo({ type, index, item, parentId });
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      if (e.target && e.target.style) {
        e.target.style.opacity = '0.5';
      }
    }, 0);
  };

  const handleDragEnd = (e) => {
    if (e.target && e.target.style) {
      e.target.style.opacity = '1';
    }
    setDraggedItemInfo(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetType, targetIndex, targetParentId = null) => {
    e.preventDefault();
    if (isReadOnly || !draggedItemInfo) return;

    const { type: sourceType, index: sourceIndex, item: draggedItem, parentId: sourceParentId } = draggedItemInfo;

    if ((sourceType === 'recomendacao' && targetType !== 'recomendacao') ||
        (sourceType !== 'recomendacao' && targetType === 'recomendacao') ||
        (sourceType === 'anexoFinal' && targetType !== 'anexoFinal') ||
        (sourceType !== 'anexoFinal' && targetType === 'anexoFinal')) {
      setDraggedItemInfo(null);
      return;
    }

    if (sourceType === 'recomendacao' && targetType === 'recomendacao') {
      const newConstatacoes = [...constatacoes];
      const sourceConstatacaoIndex = newConstatacoes.findIndex(c => c.id === sourceParentId);
      const targetConstatacaoIndex = newConstatacoes.findIndex(c => c.id === targetParentId);
      
      if (sourceConstatacaoIndex === -1 || targetConstatacaoIndex === -1) {
        setDraggedItemInfo(null);
        return;
      }

      if (sourceParentId === targetParentId) {
        if (sourceIndex === targetIndex) {
          setDraggedItemInfo(null);
          return;
        }
        const novasRecomendacoes = [...newConstatacoes[sourceConstatacaoIndex].recomendacoes];
        novasRecomendacoes.splice(sourceIndex, 1);
        novasRecomendacoes.splice(targetIndex, 0, draggedItem);
        newConstatacoes[sourceConstatacaoIndex].recomendacoes = novasRecomendacoes;
      } else {
        newConstatacoes[sourceConstatacaoIndex].recomendacoes.splice(sourceIndex, 1);
        const novasRecomendacoesDestino = newConstatacoes[targetConstatacaoIndex].recomendacoes ? [...newConstatacoes[targetConstatacaoIndex].recomendacoes] : [];
        if (targetIndex === -1) novasRecomendacoesDestino.push(draggedItem);
        else novasRecomendacoesDestino.splice(targetIndex, 0, draggedItem);
        newConstatacoes[targetConstatacaoIndex].recomendacoes = novasRecomendacoesDestino;
      }
      setConstatacoes(newConstatacoes);
    }
    else if (sourceType === targetType) {
      if (sourceIndex === targetIndex) {
        setDraggedItemInfo(null);
        return;
      }

      if (targetType === 'preliminar') {
        const newList = [...preliminares];
        newList.splice(sourceIndex, 1);
        newList.splice(targetIndex, 0, draggedItem);
        setPreliminares(newList);
      } else if (targetType === 'constatacao') {
        const newList = [...constatacoes];
        newList.splice(sourceIndex, 1);
        newList.splice(targetIndex, 0, draggedItem);
        setConstatacoes(newList);
      } else if (targetType === 'anexoFinal') {
        const newList = [...anexosFinais];
        newList.splice(sourceIndex, 1);
        newList.splice(targetIndex, 0, draggedItem);
        setAnexosFinais(newList);
      }
    } 
    else {
      if (sourceType === 'preliminar') {
        const newSource = [...preliminares];
        newSource.splice(sourceIndex, 1);
        setPreliminares(newSource);
      } else {
        const newSource = [...constatacoes];
        newSource.splice(sourceIndex, 1);
        setConstatacoes(newSource);
      }

      let newItem = { ...draggedItem };
      if (targetType === 'constatacao' && !newItem.recomendacoes) {
        newItem.recomendacoes = [];
      }

      if (targetType === 'preliminar') {
        const newTarget = [...preliminares];
        if (targetIndex === -1) newTarget.push(newItem);
        else newTarget.splice(targetIndex, 0, newItem);
        setPreliminares(newTarget);
      } else {
        const newTarget = [...constatacoes];
        if (targetIndex === -1) newTarget.push(newItem);
        else newTarget.splice(targetIndex, 0, newItem);
        setConstatacoes(newTarget);
      }
    }
    setDraggedItemInfo(null);
  };

  const adicionarAnexoFinal = () => { if (!isReadOnly) setAnexosFinais([...anexosFinais, { id: Date.now(), titulo: '', tipo: 'texto', orientacao: 'retrato', content: '<p>Insira o conteúdo do anexo aqui...</p>', arquivos: [] }]); };
  const excluirAnexoFinal = (id) => { if (!isReadOnly) setAnexosFinais(anexosFinais.filter(item => item.id !== id)); };
  const atualizarAnexoFinal = (id, field, value) => { if (!isReadOnly) setAnexosFinais(anexosFinais.map(a => a.id === id ? { ...a, [field]: value } : a)); };

  const handleAutoSave = useCallback(async (secaoNome, htmlContent) => {
    if (isReadOnly) return;
    console.log(`[Banco de Dados] ${secaoNome} salvo:`, htmlContent);
    await new Promise(resolve => setTimeout(resolve, 800));
  }, [isReadOnly]);
  const adicionarInformacaoPreliminar = () => { if (!isReadOnly) setPreliminares([...preliminares, { id: Date.now(), titulo: '', content: '<p>Insira a informação preliminar aqui...</p>', anexos: [] }]); };
  const atualizarTituloPreliminar = (id, titulo) => { if (!isReadOnly) setPreliminares(preliminares.map(p => p.id === id ? { ...p, titulo } : p)); };
  const excluirInformacaoPreliminar = (id) => { if (!isReadOnly) setPreliminares(preliminares.filter(item => item.id !== id)); };
  const atualizarPreliminar = (id, content) => { if (!isReadOnly) setPreliminares(preliminares.map(p => p.id === id ? { ...p, content } : p)); };
  const atualizarAnexosPreliminar = (id, newFiles) => { if (!isReadOnly) setPreliminares(preliminares.map(p => p.id === id ? { ...p, anexos: newFiles } : p)); };

  const adicionarConstatacao = () => { if (!isReadOnly) setConstatacoes([...constatacoes, { id: Date.now(), titulo: '', content: '<p>Insira a constatação aqui...</p>', recomendacoes: [], anexos: [] }]); };
  const excluirConstatacao = (id) => { if (!isReadOnly) setConstatacoes(constatacoes.filter(item => item.id !== id)); };
  const atualizarConstatacao = (id, field, value) => { if (!isReadOnly) setConstatacoes(constatacoes.map(c => c.id === id ? { ...c, [field]: value } : c)); };
  const atualizarAnexosConstatacao = (id, newFiles) => { if (!isReadOnly) setConstatacoes(constatacoes.map(c => c.id === id ? { ...c, anexos: newFiles } : c)); };

  const adicionarRecomendacao = (constatacaoId) => {
    if (isReadOnly) return;
    setConstatacoes(constatacoes.map(c => c.id === constatacaoId ? {
      ...c, recomendacoes: [...c.recomendacoes, { id: Date.now(), content: '<p>Insira a recomendação aqui...</p>', dataLimite: '', nivelRisco: '', gerencia: '', tipoBeneficio: '', detalheBeneficio: '', statusBeneficio: '', anoImplementacao: '', descricaoBeneficioRealizado: '', descricaoCustoBeneficio: '', valorCustoBeneficio: '', valorBrutoBeneficio: '', valorLiquidoBeneficio: '', anexos: [] }]
    } : c));
  };
  const excluirRecomendacao = (constatacaoId, recomendacaoId) => {
    if (isReadOnly) return;
    
    let gerenciaRemovida = null;
    constatacoes.forEach(c => {
      if (c.id === constatacaoId) {
        const rec = c.recomendacoes.find(r => r.id === recomendacaoId);
        if (rec && rec.gerencia) gerenciaRemovida = rec.gerencia;
      }
    });

    const newConstatacoes = constatacoes.map(c => c.id === constatacaoId ? { ...c, recomendacoes: c.recomendacoes.filter(r => r.id !== recomendacaoId) } : c);
    setConstatacoes(newConstatacoes);

    if (gerenciaRemovida) {
      const stillUsed = newConstatacoes.some(c => c.recomendacoes && c.recomendacoes.some(r => r.gerencia === gerenciaRemovida));
      if (!stillUsed) {
        setGerenciasDestinatarias(prev => prev.filter(g => (g.nome || g) !== gerenciaRemovida));
      }
    }
  };

  const atualizarAnexosRecomendacao = (constatacaoId, recomendacaoId, newFiles) => {
    if (isReadOnly) return;
    setConstatacoes(constatacoes.map(c => c.id === constatacaoId ? {
      ...c, recomendacoes: c.recomendacoes.map(r => r.id === recomendacaoId ? { ...r, anexos: newFiles } : r)
    } : c));
  };

  const atualizarRecomendacao = (constatacaoId, recomendacaoId, field, value) => {
    if (isReadOnly) return;
    
    let gerenciaAntiga = null;
    
    const newConstatacoes = constatacoes.map(c => {
      if (c.id === constatacaoId) {
        return {
          ...c, recomendacoes: c.recomendacoes.map(r => {
            if (r.id === recomendacaoId) {
              if (field === 'gerencia') gerenciaAntiga = r.gerencia;
              if (field === 'tipoBeneficio' && r.tipoBeneficio !== value) return { ...r, [field]: value, detalheBeneficio: '' };
              return { ...r, [field]: value };
            }
            return r;
          })
        };
      }
      return c;
    });
    
    setConstatacoes(newConstatacoes);

    if (field === 'gerencia') {
      const novaGerencia = value;
      
      setGerenciasDestinatarias(prev => {
        let updated = [...prev];
        
        if (novaGerencia) {
          const exists = updated.some(g => (g.nome || g) === novaGerencia);
          if (!exists) {
            const gerenciaObj = gerenciasFullList.find(g => (g.nome || g) === novaGerencia) || { id: Date.now() + Math.random(), nome: novaGerencia };
            updated.push(gerenciaObj);
          }
        }
        
        if (gerenciaAntiga && gerenciaAntiga !== novaGerencia) {
          const stillUsed = newConstatacoes.some(c => c.recomendacoes && c.recomendacoes.some(r => r.gerencia === gerenciaAntiga));
          if (!stillUsed) {
            updated = updated.filter(g => (g.nome || g) !== gerenciaAntiga);
          }
        }
        
        return updated;
      });
    }
  };

  const getRiscoColor = (risco) => {
    switch(risco) {
        case 'Crítico': return 'bg-red-50 text-red-800 border-red-300 font-bold';
        case 'Alto': return 'bg-orange-50 text-orange-800 border-orange-300 font-bold';
        case 'Médio': return 'bg-yellow-50 text-yellow-800 border-yellow-300 font-medium';
        case 'Baixo': return 'bg-green-50 text-green-800 border-green-300 font-medium';
        default: return 'bg-white text-gray-700 border-gray-300';
    }
  };

  const renderSignature = (pessoaStr, cargo) => {
    if (!pessoaStr) return null;
    const nome = pessoaStr.split(' (')[0];
    const cartaoMatch = pessoaStr.match(/Cartão:\s*([^)]+)/);
    const cartao = cartaoMatch ? cartaoMatch[1] : '-';
      

    const cargoMatch = pessoaStr.match(/Cargo:\s*([^)]+)/);
    const cargo2 = cargoMatch ? cargoMatch[1] : '-';

    return (
        <div style={{ width: '280px', textAlign: 'center', marginBottom: '20px', pageBreakInside: 'avoid' }}>
            <div style={{ borderTop: '1px solid #000', margin: '0 auto 5px auto', width: '240px' }}></div>
            <div style={{ fontWeight: 'bold', fontSize: '10pt', color: '#000' }}>{nome}</div>
            <div style={{ fontSize: '9pt', color: '#000', marginTop: '2px' }}>{cargo2}</div>
            <div style={{ fontSize: '9pt', color: '#000', marginTop: '2px' }}>Cartão Ponto: {cartao}</div>
        </div>
    );
  };

  const codRelatorioStr = numero || ano 
    ? `NA ${numero ? String(numero).padStart(2, '0') : '00'}/${ano || '0000'}` 
    : (selectedItemData ? `NA ${selectedItemData.numeroReferencia ? String(selectedItemData.numeroReferencia).padStart(2, '0') : '00'}/${selectedItemData.anoReferencia || '0000'}` : 'NA 00/0000');

  return (
    <div className="flex flex-col flex-1 h-full bg-slate-100 font-sans overflow-hidden print:block print:h-auto print:overflow-visible print:bg-white">
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center h-full">
          <div className="text-gray-500 text-lg">Carregando dados do relatório...</div>
        </div>
      ) : (
        <>
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center z-50 shadow-sm shrink-0 print:hidden">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 whitespace-nowrap">
              <button
                type="button"
                onClick={() => navigate((selectedItemTrabalhoId || itemTrabalhoIdParam) ? `/itens-trabalho?targetItemId=${selectedItemTrabalhoId || itemTrabalhoIdParam}` : '/itens-trabalho')}
                className="inline-flex items-center text-[#00767d] hover:text-[#005f64] transition-colors font-semibold text-sm bg-[#00767d]/10 hover:bg-[#00767d]/20 px-3 py-1.5 rounded-lg"
              >
                <ArrowLeft size={18} className="mr-1.5" />
                Voltar para Itens de Trabalho
              </button>
              <button
                type="button"
                onClick={() => navigate('/notas')}
                className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg border border-gray-200"
              >
                <FileText size={18} className="mr-1.5" />
                Ir para Lista de Notas
              </button>
            </div>
          
          <div className="hidden md:block h-8 w-px bg-gray-300"></div>
          
          <Status statusInicial="NOVO" onChangeStatus={handleStatusChange} />
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 mr-auto ml-8">
          <button 
            onClick={() => setGlobalCollapseAction({ action: 'expand', ts: Date.now() })} 
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
            title="Expandir todos os campos"
          >
            <ChevronDown size={16} /> Expandir Tudo
          </button>
          <div className="w-px bg-gray-300 mx-1"></div>
          <button 
            onClick={() => setGlobalCollapseAction({ action: 'collapse', ts: Date.now() })} 
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
            title="Recolher todos os campos"
          >
            <ChevronUp size={16} /> Recolher Tudo
          </button>
        </div>

        {isReadOnly && (
          <div className="flex bg-amber-50 text-amber-700 border border-amber-200 px-4 py-1.5 rounded-lg text-sm font-medium mx-4 items-center gap-2">
            <Shield size={16} /> Somente Leitura
          </div>
        )}

        <div className="flex items-center gap-3 mr-4">
          <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
            {autoSaveStatus === 'editing' && <div className="flex items-center text-amber-600 gap-1" title="Alterações pendentes de salvamento"><Edit3 size={15} /><span className="text-xs font-medium">Editando...</span></div>}
            {autoSaveStatus === 'saving' && <div className="flex items-center text-blue-600 gap-1" title="Salvando alterações automaticamente"><Loader2 size={15} className="animate-spin" /><span className="text-xs font-medium">Salvando...</span></div>}
            {autoSaveStatus === 'saved' && <div className="flex items-center text-emerald-600 gap-1" title="Todas as alterações foram salvas"><CheckCircle2 size={15} /><span className="text-xs font-medium">Salvo às {lastSavedTime}</span></div>}
            {autoSaveStatus === 'idle' && <div className="flex items-center text-gray-500 gap-1" title="Salvo automaticamente após 3 segundos de inatividade"><Clock size={15} /><span className="text-xs font-medium">Auto-salvamento ativo</span></div>}
          </div>

          {/*{!isReadOnly && (
            <button
              onClick={handleSaveManual}
              disabled={saving || !notaId}
              className="inline-flex items-center px-4 py-2 bg-[#00767d] text-white rounded-lg hover:bg-[#005f64] transition-colors text-sm font-medium shadow-sm disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
              Salvar
            </button>
          )}*/}
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
          <button 
            onClick={() => setLayoutMode('editor')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${layoutMode === 'editor' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
            title="Ver apenas o editor"
          >
            <PanelLeft size={16} /> Editor
          </button>
          <button 
            onClick={() => setLayoutMode('split')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${layoutMode === 'split' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
            title="Dividir tela entre editor e resultado"
          >
            <Columns size={16} /> Lado a Lado
          </button>
          <button 
            onClick={() => setLayoutMode('preview')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${layoutMode === 'preview' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
            title="Ver apenas o documento final"
          >
            <PanelRight size={16} /> Preview
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden print:block print:overflow-visible">
        
        <div className={`overflow-y-auto p-4 md:p-8 flex-1 transition-all duration-300 print:hidden ${layoutMode === 'preview' ? 'hidden' : 'block'}`}>
          <div className="max-w-4xl mx-auto pb-20">
            <header className="mb-8 border-b-2 border-blue-900 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900 whitespace-nowrap">Preenchimento da Nota</h2>
              <div className="flex items-center gap-3 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => navigate((selectedItemTrabalhoId || itemTrabalhoIdParam) ? `/itens-trabalho?targetItemId=${selectedItemTrabalhoId || itemTrabalhoIdParam}` : '/itens-trabalho')}
                  className="inline-flex items-center text-[#00767d] hover:text-[#005f64] transition-colors font-semibold text-sm bg-[#00767d]/10 hover:bg-[#00767d]/20 px-3 py-1.5 rounded-lg"
                >

                  <ArrowLeft size={18} className="mr-1.5" />
                  Voltar para Itens de Trabalho
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/notas')}
                  className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg border border-gray-200"
                >
                  <FileText size={18} className="mr-1.5" />
                  Ir para Lista de Notas
                </button>
              </div>
            </header>

            <section className="mb-10">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <div 
                  className="bg-blue-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-blue-100 transition-colors rounded-t-xl"
                  onClick={() => setItemTrabalhoDetailsVisible(!itemTrabalhoDetailsVisible)}
                >
                  <div className="flex items-center gap-3">
                    {itemTrabalhoDetailsVisible ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                    <Info className="text-blue-700" size={20} />
                    <h3 className="font-bold text-gray-900">Vínculo com Item de Trabalho</h3>
                  </div>
                </div>

                {itemTrabalhoDetailsVisible && (
                  <div className="p-6">
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Selecione o Item de Trabalho Base (Total: {itensTrabalhoList.length})</label>
                        <SearchableSelect 
                          options={itensTrabalhoList.map(item => ({ 
                            value: item.id, 
                            label: `${item.tipoItem?.nome || 'S/ TIPO'} - ${String(item.numeroReferencia || '').padStart(2, '0')}/${item.anoReferencia || ''} - ${item.objetoAuditado || 'Sem objeto auditado'}` 
                          }))}
                          value={selectedItemTrabalhoId}
                        onChange={setSelectedItemTrabalhoId}
                        placeholder="Buscar por ano/número ou objeto..."
                        disabled={isReadOnly || !!itemTrabalhoIdParam || (!!selectedItemTrabalhoId && !!notaId)}
                      />

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Ano da Nota</label>
                        <input
                          type="number"
                          className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          value={ano}
                          onChange={(e) => setAno(e.target.value.replace(/\D/g, ''))}
                          placeholder="Ex: 2026"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Número da Nota</label>
                        <input
                          type="number"
                          className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          value={numero}
                          onChange={(e) => setNumero(e.target.value.replace(/\D/g, ''))}
                          placeholder="Ex: 123"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Data Inicial</label>
                        <input type="date" className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Data Final</label>
                        <input type="date" className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Gerências Destinatárias da Nota</label>
                      <div className="border border-gray-300 rounded-md p-3 bg-white shadow-sm">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {gerenciasDestinatarias.map((g) => (
                            <span
                              key={g.id || g.nome}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 shadow-sm"
                            >
                              {g.nome || g}
                              <button
                                type="button"
                                onClick={() => {
                                  setGerenciasDestinatarias(
                                    gerenciasDestinatarias.filter((item) => (item.id || item.nome) !== (g.id || g.nome))
                                  );
                                }}
                                className="text-teal-600 hover:text-teal-900 font-bold focus:outline-none"
                                title="Remover"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          {gerenciasDestinatarias.length === 0 && (
                            <span className="text-xs text-gray-400 italic py-1">Nenhuma gerência destinatária selecionada para a capa do documento.</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 border-t border-gray-100 pt-2">
                          <div className="flex-1">
                            <SearchableSelect
                              placeholder="+ Selecionar e Adicionar Gerência Destinatária..."
                              value=""
                              options={gerenciasFullList
                                .filter((g) => !gerenciasDestinatarias.some((sel) => {
                                  const selNome = sel.nome || sel;
                                  const gNome = g.nome || g;
                                  const selId = sel.id;
                                  const gId = g.id;
                                  if (selId != null && gId != null) {
                                    return String(selId) === String(gId);
                                  }
                                  return selNome === gNome;
                                }))
                                .sort((a, b) => String(a.nome || a).localeCompare(String(b.nome || b), 'pt-BR'))
                                .map((g) => ({
                                  value: g.id || g.nome || g,
                                  label: g.nome || g
                                }))}
                              onChange={(val) => {
                                if (!val) return;
                                const selectedObj = gerenciasFullList.find((g) => String(g.id) === String(val) || g.nome === val || g === val);
                                if (
                                  selectedObj &&
                                  !gerenciasDestinatarias.some((item) => {
                                    const itemNome = item.nome || item;
                                    const selNome = selectedObj.nome || selectedObj;
                                    const itemId = item.id;
                                    const selId = selectedObj.id;
                                    if (itemId != null && selId != null) {
                                      return String(itemId) === String(selId);
                                    }
                                    return itemNome === selNome;
                                  })
                                ) {
                                  setGerenciasDestinatarias([...gerenciasDestinatarias, selectedObj]);
                                }
                              }}
                            />
                          </div>
                          {gerenciasDestinatarias.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setGerenciasDestinatarias([])}
                              className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 hover:bg-red-50 rounded transition-colors"
                            >
                              Limpar Todas
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {selectedItemData && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 mt-6 border-t border-gray-200">
                        <div>
                          <p className="text-xs text-gray-500 font-semibold mb-1">Responsável</p>
                          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">{selectedItemData.responsavel?.nome || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold mb-1">Supervisor</p>
                          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">{selectedItemData.supervisor?.nome || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold mb-1">Supervisor Técnico</p>
                          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">{selectedItemData.supervisorTecnico?.nome || '-'}</p>
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                          <p className="text-xs text-gray-500 font-semibold mb-1">Equipe</p>
                          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">{selectedItemData.equipe?.map(e => e.nome).join(', ') || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold mb-1">Tipo de Serviço</p>
                          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">{selectedItemData.tipoServico?.nome || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold mb-1">Macroprocesso</p>
                          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">{selectedItemData.macroprocesso?.nome || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold mb-1">Origem da Demanda</p>
                          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">{selectedItemData.origem?.nome || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold mb-1">Nível de Risco</p>
                          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">{selectedItemData.nivelRisco?.nome || '-'}</p>
                        </div>
                        <div className="md:col-span-2 lg:col-span-2">
                          <p className="text-xs text-gray-500 font-semibold mb-1">Objeto Auditado</p>
                          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">{selectedItemData.objetoAuditado || '-'}</p>
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                          <p className="text-xs text-gray-500 font-semibold mb-1">Objetivo da Auditoria</p>
                          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">{selectedItemData.objetivoAuditoria || '-'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className="mb-10">
              <div className="relative">
                {renderEditorPresence('introducao')}
                <RichTextEditor readOnly={isReadOnly}
                  title="1. INTRODUÇÃO"
                  subtitle="Salvo automaticamente após 3 segundos de inatividade."
                  initialContent={introducao}
                  onChange={setIntroducao}
                  onSave={(content) => handleAutoSave('1. INTRODUÇÃO', content)}
                  onFocus={() => { setActiveSectionId('intro'); handleFieldFocus('introducao'); }}
                  onBlur={() => handleFieldBlur('introducao')}
                  globalCollapseAction={globalCollapseAction}
                  renderAttachments={() => <FileAttachmentManager files={getAnexosBySecao('1. INTRODUÇÃO')} onUpload={(file) => handleUploadAnexo(file, '1. INTRODUÇÃO')} onDelete={handleDeleteAnexo} globalCollapseAction={globalCollapseAction} />}
                />
              </div>
            </section>

            

            <section className="mb-10">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b-2 border-blue-900 pb-3">
                <h2 className="text-xl font-bold text-blue-900">3. INFORMAÇÕES PRELIMINARES</h2>
                <button onClick={adicionarInformacaoPreliminar} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium shadow-sm text-sm">
                  + Adicionar Informação Preliminar
                </button>
              </div>

              <div className="mb-6 relative">
                <RichTextEditor readOnly={isReadOnly} 
                  title="Informações Preliminares - Texto Inicial" 
                  initialContent={preliminaresTextoInicial}
                  onChange={setPreliminaresTextoInicial}
                  onSave={(content) => handleAutoSave('Informações Preliminares - Texto Inicial', content)} 
                  onFocus={() => setActiveSectionId('preliminares-texto-inicial')} 
                  globalCollapseAction={globalCollapseAction} 
                  renderAttachments={() => <FileAttachmentManager files={getAnexosBySecao('Informações Preliminares - Texto Inicial')} onUpload={(file) => handleUploadAnexo(file, 'Informações Preliminares - Texto Inicial')} onDelete={handleDeleteAnexo} globalCollapseAction={globalCollapseAction} />}
                />
              </div>

              <div 
                className="space-y-6 min-h-[100px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'preliminar', -1)}
              >
                {preliminares.length === 0 ? (
                  <div className="text-center py-10 bg-white border border-dashed border-gray-300 rounded-lg text-gray-500">Nenhuma informação preliminar adicionada. Arraste itens para cá.</div>
                ) : (
                  preliminares.map((item, index) => (
                    <div 
                      key={item.id} 
                      className="bg-white border border-blue-200 rounded-xl shadow-sm relative group cursor-grab active:cursor-grabbing"
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'preliminar', index, item)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={(e) => {
                        e.stopPropagation();
                        handleDrop(e, 'preliminar', index);
                      }}
                    >
                      <div className="absolute right-4 top-4 text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity flex cursor-grab z-10" title="Arraste para reordenar ou mover para constatações">
                        <span className="text-2xl font-bold">⋮⋮</span>
                      </div>
                      <div className="bg-blue-50/40 p-4 pb-4">
                        <div className="mb-4">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Título da Informação Preliminar</label>
                          <input 
                            type="text" 
                            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-blue-500" 
                            placeholder="Ex: INFORMAÇÃO GERAL SOBRE O SISP" 
                            value={item.titulo || ''} 
                            onChange={(e) => atualizarTituloPreliminar(item.id, e.target.value)} 
                          />
                        </div>
                        <RichTextEditor readOnly={isReadOnly}
                          title={`3.${index + 1} - Informação Preliminar`}
                          initialContent={item.content}
                          onChange={(content) => atualizarPreliminar(item.id, content)}
                          onSave={(content) => handleAutoSave(`Preliminar ${item.id}`, content)}
                          onRemove={() => excluirInformacaoPreliminar(item.id)}
                          onFocus={() => setActiveSectionId(`preliminar-${item.id}`)}
                          globalCollapseAction={globalCollapseAction}
                          renderAttachments={() => <FileAttachmentManager files={getAnexosBySecao(`3.${index + 1} - Informação Preliminar`)} onUpload={(file) => handleUploadAnexo(file, `3.${index + 1} - Informação Preliminar`)} onDelete={handleDeleteAnexo} globalCollapseAction={globalCollapseAction} />}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="mb-10">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b-2 border-blue-900 pb-3">
                <h2 className="text-xl font-bold text-blue-900">4. CONSTATAÇÕES E RECOMENDAÇÕES</h2>
                <button onClick={adicionarConstatacao} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium shadow-sm text-sm">
                  + Adicionar Constatação
                </button>
              </div>

              <div className="mb-6 relative">
                <RichTextEditor readOnly={isReadOnly} 
                  title="Constatações e Recomendações - Texto Inicial" 
                  initialContent={constatacoesTextoInicial}
                  onChange={setConstatacoesTextoInicial}
                  onSave={(content) => handleAutoSave('Constatações e Recomendações - Texto Inicial', content)} 
                  onFocus={() => setActiveSectionId('constatacoes-texto-inicial')} 
                  globalCollapseAction={globalCollapseAction} 
                  renderAttachments={() => <FileAttachmentManager files={getAnexosBySecao('Constatações e Recomendações - Texto Inicial')} onUpload={(file) => handleUploadAnexo(file, 'Constatações e Recomendações - Texto Inicial')} onDelete={handleDeleteAnexo} globalCollapseAction={globalCollapseAction} />}
                />
              </div>

              <div 
                className="space-y-10 min-h-[100px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'constatacao', -1)}
              >
                {constatacoes.length === 0 ? (
                  <div className="text-center py-10 bg-white border border-dashed border-gray-300 rounded-lg text-gray-500">Nenhuma constatação adicionada. Arraste itens para cá.</div>
                ) : (
                  constatacoes.map((item, index) => (
                    <div 
                      key={item.id} 
                      className="bg-white border border-blue-200 rounded-xl shadow-sm relative group cursor-grab active:cursor-grabbing"
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'constatacao', index, item)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={(e) => {
                        e.stopPropagation();
                        handleDrop(e, 'constatacao', index);
                      }}
                    >
                      <div className="absolute right-4 top-4 text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity flex cursor-grab z-10" title="Arraste para reordenar ou mover para informações preliminares">
                        <span className="text-2xl font-bold">⋮⋮</span>
                      </div>
                      <div className="bg-blue-50/40 p-4 pb-0 border-b border-blue-100">
                        <div className="mb-4">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Título da Constatação</label>
                          <input 
                            type="text" 
                            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-blue-500" 
                            placeholder="Ex: Pagamentos em atraso..."
                            value={item.titulo || ''}
                            onChange={(e) => atualizarConstatacao(item.id, 'titulo', e.target.value)}
                          />
                        </div>
                        <RichTextEditor readOnly={isReadOnly}
                          title={`4.${index + 1} - Constatação`}
                          initialContent={item.content}
                          onChange={(content) => atualizarConstatacao(item.id, 'content', content)}
                          onSave={(content) => handleAutoSave(`NotaPreliminarConstatacao ${item.id}`, content)}
                          onRemove={() => excluirConstatacao(item.id)}
                          onFocus={() => setActiveSectionId(`constatacao-${item.id}`)}
                          globalCollapseAction={globalCollapseAction}
                          renderAttachments={() => <FileAttachmentManager files={getAnexosBySecao(`4.${index + 1} - Constatação`)} onUpload={(file) => handleUploadAnexo(file, `4.${index + 1} - Constatação`)} onDelete={handleDeleteAnexo} globalCollapseAction={globalCollapseAction} />}
                        />
                      </div>

                      <ResumoConstatacaoSection isReadOnly={isReadOnly}
                        item={item}
                        collapsed={collapsedResumos[item.id]}
                        onToggle={() => toggleResumo(item.id)}
                        onUpdate={atualizarConstatacao}
                        handleAutoSave={handleAutoSave}
                      />

                      <div className="p-4 bg-white" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-semibold text-indigo-900">Recomendações</h4>
                          <button onClick={() => adicionarRecomendacao(item.id)} className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-md font-medium border border-indigo-200">
                            + Recomendação
                          </button>
                        </div>
                        {(!item.recomendacoes || item.recomendacoes.length === 0) ? (
                          <div 
                            className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded border text-center min-h-[50px]"
                            onDragOver={handleDragOver}
                            onDrop={(e) => { e.stopPropagation(); handleDrop(e, 'recomendacao', -1, item.id); }}
                          >
                            Nenhuma recomendação associada. Arraste recomendações para cá.
                          </div>
                        ) : (
                          <div 
                            className="space-y-6 min-h-[50px]"
                            onDragOver={handleDragOver}
                            onDrop={(e) => { e.stopPropagation(); handleDrop(e, 'recomendacao', -1, item.id); }}
                          >
                            {item.recomendacoes.map((rec, recIndex) => (
                              <div 
                                key={rec.id} 
                                className="bg-slate-50 border border-indigo-100 p-4 rounded-lg relative group cursor-grab active:cursor-grabbing"
                                draggable
                                onDragStart={(e) => { e.stopPropagation(); handleDragStart(e, 'recomendacao', recIndex, rec, item.id); }}
                                onDragEnd={handleDragEnd}
                                onDragOver={handleDragOver}
                                onDrop={(e) => { e.stopPropagation(); handleDrop(e, 'recomendacao', recIndex, item.id); }}
                              >
                                <div 
                                  className="absolute -left-3 top-4 cursor-pointer text-red-600 bg-white rounded-full shadow border border-red-200 flex items-center justify-center p-0.5 z-10 hover:bg-red-50 transition-colors"
                                  onClick={() => toggleRecomendacao(rec.id)}
                                  title="Abrir/Recolher Recomendação"
                                >
                                  {collapsedRecomendacoes[rec.id] ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                                </div>
                                <div className="absolute right-2 top-2 text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity flex cursor-grab z-10" title="Arraste para reordenar ou mover de constatação">
                                  <span className="text-xl font-bold">⋮⋮</span>
                                </div>

                                {collapsedRecomendacoes[rec.id] ? (
                                  <div className="flex items-center py-2 px-4 cursor-pointer" onClick={() => toggleRecomendacao(rec.id)}>
                                    <span className="font-bold text-indigo-900 ml-2">Recomendação 4.{index + 1}.{recIndex + 1}</span>
                                    <span className="text-gray-500 text-sm ml-2 italic">- Clique para expandir</span>
                                  </div>
                                ) : (
                                  <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Data Limite</label>
                                    <input type="date" className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 outline-none" value={rec.dataLimite} onChange={(e) => atualizarRecomendacao(item.id, rec.id, 'dataLimite', e.target.value)} />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Risco</label>
                                    <SearchableSelect
                                      value={rec.nivelRisco}
                                      onChange={(val) => atualizarRecomendacao(item.id, rec.id, 'nivelRisco', val)}
                                      options={niveisRiscoList.map(r => ({ value: r, label: r }))}
                                      placeholder="Selecione..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Gerência</label>
                                    <SearchableSelect
                                      value={rec.gerencia}
                                      onChange={(val) => atualizarRecomendacao(item.id, rec.id, 'gerencia', val)}
                                      options={gerenciasList.map(g => ({ value: g, label: g }))}
                                      placeholder="Selecione..."
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Status do Benefício</label>
                                    <SearchableSelect
                                      value={rec.statusBeneficio}
                                      onChange={(val) => atualizarRecomendacao(item.id, rec.id, 'statusBeneficio', val)}
                                      options={[
                                        { value: 'Esperado', label: 'Esperado' },
                                        { value: 'Realizado', label: 'Realizado' }
                                      ]}
                                      placeholder="Selecione..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de Benefício</label>
                                    <SearchableSelect
                                      value={rec.tipoBeneficio}
                                      onChange={(val) => atualizarRecomendacao(item.id, rec.id, 'tipoBeneficio', val)}
                                      options={[
                                        { value: 'Qualitativo', label: 'Qualitativo' },
                                        { value: 'Financeiro', label: 'Financeiro' }
                                      ]}
                                      placeholder="Selecione..."
                                    />
                                  </div>
                                  {rec.tipoBeneficio && (
                                    <div>
                                      <label className="block text-xs font-semibold text-gray-600 mb-1">Detalhe do Benefício</label>
                                      <SearchableSelect
                                        value={rec.detalheBeneficio}
                                        onChange={(val) => atualizarRecomendacao(item.id, rec.id, 'detalheBeneficio', val)}
                                        options={(rec.tipoBeneficio === 'Qualitativo' ? beneficiosQualitativosList : beneficiosFinanceirosList).map(b => ({ value: b, label: b }))}
                                        placeholder="Selecione..."
                                      />
                                    </div>
                                  )}
                                </div>
                                {rec.statusBeneficio === 'Realizado' && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4 mb-4 border-t border-indigo-100 pt-4">
                                    <div>
                                      <label className="block text-xs font-semibold text-gray-600 mb-1">Ano de Implementação</label>
                                      <input type="text" className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 outline-none" value={rec.anoImplementacao || ''} onChange={(e) => atualizarRecomendacao(item.id, rec.id, 'anoImplementacao', e.target.value)} placeholder="Ex: 2026" />
                                    </div>
                                    <div className="sm:col-span-2 xl:col-span-3">
                                      <label className="block text-xs font-semibold text-gray-600 mb-1">Descrição do Benefício Realizado</label>
                                      <input type="text" className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 outline-none" value={rec.descricaoBeneficioRealizado || ''} onChange={(e) => atualizarRecomendacao(item.id, rec.id, 'descricaoBeneficioRealizado', e.target.value)} placeholder="Descreva o benefício" />
                                    </div>
                                    
                                    {rec.tipoBeneficio === 'Financeiro' && (
                                      <>
                                        <div className="sm:col-span-2 xl:col-span-4">
                                          <label className="block text-xs font-semibold text-gray-600 mb-1">Descrição do Custo para Realizar o Benefício</label>
                                          <input type="text" className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 outline-none" value={rec.descricaoCustoBeneficio || ''} onChange={(e) => atualizarRecomendacao(item.id, rec.id, 'descricaoCustoBeneficio', e.target.value)} placeholder="Descreva o custo" />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-semibold text-gray-600 mb-1">Valor do Custo (R$)</label>
                                          <input type="number" step="0.01" className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 outline-none" value={rec.valorCustoBeneficio || ''} onChange={(e) => atualizarRecomendacao(item.id, rec.id, 'valorCustoBeneficio', e.target.value ? parseFloat(e.target.value) : '')} placeholder="0.00" />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-semibold text-gray-600 mb-1">Valor Bruto do Benefício (R$)</label>
                                          <input type="number" step="0.01" className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 outline-none" value={rec.valorBrutoBeneficio || ''} onChange={(e) => atualizarRecomendacao(item.id, rec.id, 'valorBrutoBeneficio', e.target.value ? parseFloat(e.target.value) : '')} placeholder="0.00" />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-semibold text-gray-600 mb-1">Valor Líquido do Benefício (R$)</label>
                                          <input type="number" step="0.01" className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 outline-none" value={rec.valorLiquidoBeneficio || ''} onChange={(e) => atualizarRecomendacao(item.id, rec.id, 'valorLiquidoBeneficio', e.target.value ? parseFloat(e.target.value) : '')} placeholder="0.00" />
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )}
                                <RichTextEditor readOnly={isReadOnly}
                                  title={`Recomendação 4.${index + 1}.${recIndex + 1}`}
                                  initialContent={rec.content}
                                  onChange={(content) => atualizarRecomendacao(item.id, rec.id, 'content', content)}
                                  onSave={(content) => handleAutoSave(`Rec ${rec.id}`, content)}
                                  onRemove={() => excluirRecomendacao(item.id, rec.id)}
                                  onFocus={() => setActiveSectionId(`recomendacao-${rec.id}`)}
                                  globalCollapseAction={globalCollapseAction}
                                  renderAttachments={() => <FileAttachmentManager files={getAnexosBySecao(`Recomendação 4.${index + 1}.${recIndex + 1}`)} onUpload={(file) => handleUploadAnexo(file, `Recomendação 4.${index + 1}.${recIndex + 1}`)} onDelete={handleDeleteAnexo} globalCollapseAction={globalCollapseAction} />}
                                />

                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="mb-10">
              <RichTextEditor readOnly={isReadOnly}
                title="5. CONSIDERAÇÕES FINAIS"
                subtitle="Salvo automaticamente após 3 segundos de inatividade."
                initialContent={consideracoes}
                onChange={setConsideracoes}
                onSave={(content) => handleAutoSave('5. CONSIDERAÇÕES', content)}
                onFocus={() => setActiveSectionId('consideracoes')}
                globalCollapseAction={globalCollapseAction}
                renderAttachments={() => <FileAttachmentManager files={getAnexosBySecao('5. CONSIDERAÇÕES FINAIS')} onUpload={(file) => handleUploadAnexo(file, '5. CONSIDERAÇÕES FINAIS')} onDelete={handleDeleteAnexo} globalCollapseAction={globalCollapseAction} />}
              />
            </section>

            <section className="mb-10">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b-2 border-blue-900 pb-3">
                <h2 className="text-xl font-bold text-blue-900">6. ANEXO A - PLANO DE AÇÃO</h2>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm">
                <p className="text-gray-500 font-medium">O Plano de Ação é gerado automaticamente com base nas Constatações registradas.</p>
                <p className="text-gray-400 text-sm mt-2">Ele será exibido no documento final como Anexo A.</p>
              </div>
            </section>

            <section className="mb-10">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b-2 border-blue-900 pb-3">
                <h2 className="text-xl font-bold text-blue-900">7. ANEXOS (ADICIONAIS)</h2>
                <button onClick={adicionarAnexoFinal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium shadow-sm text-sm">
                  + Novo Anexo
                </button>
              </div>

              <div 
                className="space-y-6 min-h-[100px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'anexoFinal', -1)}
              >
                {anexosFinais.length === 0 ? (
                  <div className="text-center py-10 bg-white border border-dashed border-gray-300 rounded-lg text-gray-500">Nenhum anexo adicional adicionado.</div>
                ) : (
                  anexosFinais.map((item, index) => (
                    <div 
                      key={item.id} 
                      className="bg-white border border-gray-200 rounded-xl shadow-sm relative group cursor-grab active:cursor-grabbing"
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'anexoFinal', index, item)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={(e) => {
                        e.stopPropagation();
                        handleDrop(e, 'anexoFinal', index);
                      }}
                    >
                      <div className="absolute right-12 top-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex cursor-grab z-10" title="Arraste para reordenar">
                        <span className="text-xl">⋮⋮</span>
                      </div>

                      <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center justify-between cursor-pointer" onClick={() => toggleAnexo(item.id)}>
                        <div className="flex items-center gap-2">
                          <button className="text-gray-500 hover:text-gray-700 flex items-center">
                            {collapsedAnexos[item.id] ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                          </button>
                          <h4 className="font-semibold text-gray-700">
                            {`Anexo ${String.fromCharCode(66 + index)}`} {item.titulo ? `- ${item.titulo}` : ''}
                          </h4>
                        </div>
                      </div>

                      {!collapsedAnexos[item.id] && (
                        <div className="p-4">
                          <div className="flex flex-wrap gap-4 mb-4 items-end" onMouseDown={(e) => e.stopPropagation()}>
                            <div className="w-full sm:w-auto flex-1">
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Título do Anexo</label>
                              <input 
                                type="text" 
                                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-blue-500" 
                                placeholder="Ex: Tabela de Juros..."
                                value={item.titulo || ''}
                                onChange={(e) => atualizarAnexoFinal(item.id, 'titulo', e.target.value)}
                              />
                            </div>
                            <div className="w-full sm:w-auto flex-1">
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de Anexo</label>
                              <SearchableSelect
                                value={item.tipo}
                                onChange={(val) => atualizarAnexoFinal(item.id, 'tipo', val)}
                                options={[
                                  { value: 'texto', label: 'Conteúdo Digitado (Texto)' },
                                  { value: 'arquivo', label: 'Arquivo (PDF/Imagem)' }
                                ]}
                                placeholder="Selecione..."
                              />
                            </div>
                            {item.tipo === 'arquivo' && item.arquivos && item.arquivos.some(f => f.type === 'application/pdf') && (
                              <div className="w-full sm:w-auto flex-1">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Orientação da Página</label>
                                <SearchableSelect
                                  value={item.orientacao}
                                  onChange={(val) => atualizarAnexoFinal(item.id, 'orientacao', val)}
                                  options={[
                                    { value: 'retrato', label: 'Retrato' },
                                    { value: 'paisagem', label: 'Paisagem' }
                                  ]}
                                  placeholder="Selecione..."
                                />
                              </div>
                            )}
                            <div className="w-full sm:w-auto ml-auto">
                              <button onClick={() => excluirAnexoFinal(item.id)} className="w-full sm:w-auto text-red-500 hover:text-red-700 text-sm font-medium border border-red-200 bg-red-50 px-3 py-2 rounded-md">Excluir Anexo</button>
                            </div>
                          </div>

                          <div onMouseDown={(e) => e.stopPropagation()}>
                            {item.tipo === 'texto' ? (
                              <RichTextEditor readOnly={isReadOnly}
                                title={`Anexo ${String.fromCharCode(66 + index)}`}
                                initialContent={item.content}
                                onChange={(content) => atualizarAnexoFinal(item.id, 'content', content)}
                                onSave={(content) => handleAutoSave(`AnexoFinal ${item.id}`, content)}
                                onFocus={() => setActiveSectionId(`anexo-final-${item.id}`)}
                                globalCollapseAction={globalCollapseAction}
                                renderAttachments={() => <FileAttachmentManager files={getAnexosBySecao(`Anexo ${String.fromCharCode(66 + index)}`)} onUpload={(file) => handleUploadAnexo(file, `Anexo ${String.fromCharCode(66 + index)}`)} onDelete={handleDeleteAnexo} globalCollapseAction={globalCollapseAction} />}
                              />
                            ) : (
                              <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                                <h4 className="font-semibold text-gray-700 mb-2">Anexar Arquivo para o Anexo {String.fromCharCode(66 + index)}</h4>
                                <FileAttachmentManager files={getAnexosBySecao(`Anexo ${String.fromCharCode(66 + index)}`)} onUpload={(file) => handleUploadAnexo(file, `Anexo ${String.fromCharCode(66 + index)}`)} onDelete={handleDeleteAnexo} globalCollapseAction={globalCollapseAction} />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="mb-10 border-t-2 border-gray-200 pt-8 mt-12">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Histórico de Alterações</h2>
              <Historico eventos={historicoEventos} />
            </section>
          </div>
        </div>

        <div className={`bg-gray-300 overflow-y-auto p-4 md:p-8 border-l-2 border-gray-400 flex-1 transition-all duration-300 print:w-full print:p-0 print:border-none print:bg-white print:overflow-visible print:block ${layoutMode === 'editor' ? 'hidden' : 'block'}`}>
          <div className="sticky top-0 z-10 flex justify-end items-center gap-3 mb-4 print:hidden">
            
            <button 
              onClick={handleGerarPdfServidor}
              disabled={isGeneratingPdf}
              className={`flex items-center gap-2 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors ${isGeneratingPdf ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              title="Gera o PDF com paginação automática no Sumário (Playwright)"
            >
              {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
              <span>{isGeneratingPdf ? 'Gerando...' : 'Gerar PDF no Servidor'}</span>
            </button>
            {/*<button 
              onClick={() => window.print()} 
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors"
            >
              <Printer size={18} /> Imprimir Nota
            </button>*/}
          </div>
          <style>{`
            :root { 
                --ghc-primary: #00767d; 
                --ghc-secondary: #84c9bd; 
                --paper-color: #ffffff; 
                --text-color: #2d3748; 
                --border-color: #cbd5e0; 
                --risco-critico: #742a2a; 
                --risco-alto: #e53e3e; 
                --risco-medio: #dd6b20; 
                --risco-baixo: #3182ce;
                --status-atendida: #38a169; 
                --status-parcial: #ecc94b; 
                --status-nao: #e53e3e; 
            }
            .preview-container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: var(--text-color); font-size: 10pt; line-height: 1.5; display: flex; flex-direction: column; align-items: center; }
            .preview-container .page { background-color: var(--paper-color); box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); box-sizing: border-box; position: relative; margin-bottom: 20px; display: flex; flex-direction: column; }
            .preview-container .portrait { width: 210mm; min-height: 297mm; padding: 20mm 15mm; } 
            .preview-container .landscape { width: 297mm; min-height: 210mm; padding: 20mm 15mm; }
            .preview-container .page-footer { margin-top: auto; border-top: 1px solid var(--border-color); padding-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 8pt; color: #718096; width: 100%; position: static !important; page-break-inside: avoid; break-inside: avoid; } 
            .preview-container .footer-info { font-weight: bold; color: var(--ghc-primary); text-transform: uppercase; } 
            .preview-container .footer-page-number { font-weight: bold; color: var(--text-color); }
            .preview-container h2 { color: var(--ghc-primary); padding: 6px 12px; margin-top: 25px; margin-bottom: 15px; font-size: 18pt; font-weight: bold; text-transform: uppercase; border-left: 5px solid var(--ghc-primary); background: linear-gradient(90deg, rgba(132, 201, 189, 0.20) 0%, rgba(255, 255, 255, 0) 100%); } 
            .preview-container h2.center-title { text-align: center; border-left: none; background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(132, 201, 189, 0.20) 50%, rgba(255,255,255,0) 100%); }
            .preview-container h3 { color: var(--ghc-primary); font-size: 16pt; font-weight: bold; text-transform: uppercase; margin-top: 18px; margin-bottom: 10px; border-bottom: 1px solid var(--border-color); padding-bottom: 4px; }
            .preview-container .texto-comum, .preview-container .texto-comum p, .preview-container .texto-comum div, .preview-container .texto-comum li, .preview-container .texto-comum ul, .preview-container .texto-comum ol, .preview-container .texto-comum span { text-align: justify !important; font-size: 14pt; color: #000; margin-bottom: 10px; }
            .preview-container .texto-comum * { font-family: 'Calibri', sans-serif !important; font-size: 14pt !important; color: #000 !important; line-height: 1.5; text-align: justify !important; }
            .preview-container .texto-comum font[size="4"], .preview-container .texto-comum font[size="4"] * { font-size: 14pt !important; font-weight: bold !important; }
            .preview-container .texto-comum p { margin-bottom: 10px; }
            .preview-container .texto-comum ul { list-style-type: disc !important; padding-left: 2.5rem !important; margin: 0.5rem 0 !important; display: block !important; text-align: justify !important; }
            .preview-container .texto-comum ol { padding-left: 2.5rem !important; margin: 0.5rem 0 !important; display: block !important; text-align: justify !important; }
            .preview-container .texto-comum ol:not([type]), .preview-container .texto-comum ol[type="1"], .preview-container .texto-comum ol[type="decimal"] { list-style-type: decimal !important; }
            .preview-container .texto-comum ol[type="a" s], .preview-container .texto-comum ol.list-lower-alpha, .preview-container .texto-comum ol[style*="lower-alpha"] { list-style-type: lower-alpha !important; }
            .preview-container .texto-comum ol[type="A" s], .preview-container .texto-comum ol.list-upper-alpha, .preview-container .texto-comum ol[style*="upper-alpha"] { list-style-type: upper-alpha !important; }
            .preview-container .texto-comum li { display: list-item !important; text-align: justify !important; margin-bottom: 0.25rem; }
            .preview-container blockquote, .preview-container .texto-comum blockquote { border-left: 4px solid #cbd5e1 !important; padding: 12px 16px !important; color: #475569 !important; font-style: italic !important; margin: 16px 0 !important; background-color: #f8fafc !important; border-radius: 4px !important; text-align: justify !important; display: block !important; }
            .preview-container blockquote *, .preview-container .texto-comum blockquote * { color: #475569 !important; font-style: italic !important; font-family: 'Calibri', sans-serif !important; }
            .preview-container table, .preview-container .texto-comum table { width: 100% !important; max-width: 100% !important; border-collapse: collapse !important; margin: 15px 0 20px 0 !important; table-layout: fixed !important; font-size: 9pt !important; border: 1px solid #cbd5e1 !important; box-sizing: border-box !important; }
            .preview-container table th, .preview-container .texto-comum table th { border: 1px solid #cbd5e1 !important; padding: 6px 8px !important; background-color: #f1f5f9 !important; font-weight: bold !important; text-align: left !important; vertical-align: middle !important; color: #1e293b !important; font-size: 9pt !important; min-width: 0 !important; max-width: 100% !important; box-sizing: border-box !important; word-wrap: break-word !important; overflow-wrap: break-word !important; word-break: break-word !important; }
            .preview-container table th *, .preview-container .texto-comum table th * { font-weight: bold !important; color: #1e293b !important; text-align: left !important; font-size: 9pt !important; word-wrap: break-word !important; overflow-wrap: break-word !important; word-break: break-word !important; }
            .preview-container table td, .preview-container .texto-comum table td { border: 1px solid #cbd5e1 !important; padding: 6px 8px !important; vertical-align: top !important; text-align: left !important; line-height: 1.35 !important; color: #0f172a !important; font-size: 9pt !important; min-width: 0 !important; max-width: 100% !important; box-sizing: border-box !important; word-wrap: break-word !important; overflow-wrap: break-word !important; word-break: break-word !important; }
            .preview-container table td *, .preview-container .texto-comum table td * { text-align: left !important; line-height: 1.35 !important; color: #0f172a !important; font-size: 9pt !important; word-wrap: break-word !important; overflow-wrap: break-word !important; word-break: break-word !important; }
            .preview-container table thead td, .preview-container table thead th, .preview-container table tr:first-child th, .preview-container .texto-comum table thead td, .preview-container .texto-comum table thead th, .preview-container .texto-comum table tr:first-child th { background-color: #f1f5f9 !important; font-weight: bold !important; color: #1e293b !important; }
            .preview-container .rec-block { background-color: #f7fafc; border: 1px solid var(--border-color); border-left: 4px solid var(--ghc-secondary); border-radius: 4px; padding: 10px 15px; margin-top: 10px; margin-bottom: 15px; }
            .preview-container .rec-gerencia { font-weight: bold; color: var(--ghc-primary); text-transform: uppercase; font-size: 9pt; margin-bottom: 10px; border-bottom: 1px dashed var(--border-color); padding-bottom: 5px; }
            .preview-container .rec-item { margin-bottom: 12px; font-size: 9.5pt; text-align: justify; }
            .preview-container .rec-item:last-child { margin-bottom: 0; }
            .preview-container .rec-meta { display: flex; gap: 20px; margin-top: 6px; font-size: 8.5pt; color: #4a5568; background: #fff; padding: 4px 8px; border-radius: 3px; border: 1px solid #e2e8f0; }
            .preview-container .rec-beneficio-inline { margin-top: 6px; font-size: 8.5pt; color: #2d3748; background: #fff; padding: 4px 8px; border-radius: 3px; border: 1px solid #e2e8f0; }
            .preview-container .toc-list { list-style: none; padding: 0; margin: 0; width: 100%; } 
            .preview-container .toc-item { margin-bottom: 6px; } 
            .preview-container .toc-link { display: flex; align-items: baseline; text-decoration: none; color: var(--text-color); font-size: 10pt; cursor: pointer; } 
            .preview-container .toc-dots { flex: 1; border-bottom: 1px dotted var(--border-color); margin: 0 6px; } 
            .preview-container .toc-page-num { font-weight: bold; color: var(--ghc-primary); }
            .preview-container .matriz-container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 10px; margin-bottom: 15px; } 
            .preview-container .matriz-box { background-color: #fff; border: 1px solid #cbd5e0; border-radius: 4px; padding: 8px 10px; } 
            .preview-container .matriz-header { font-size: 8pt; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; padding-bottom: 2px; } 
            .preview-container .matriz-text { font-size: 9pt; text-align: justify; color: #2d3748; line-height: 1.3; }
            .preview-container .box-fato { border-left: 3px solid var(--ghc-primary); } 
            .preview-container .box-fato .matriz-header { color: var(--ghc-primary); border-bottom: 1px solid var(--ghc-primary); } 
            .preview-container .box-criterio { border-left: 3px solid var(--ghc-primary); } 
            .preview-container .box-criterio .matriz-header { color: var(--ghc-primary); border-bottom: 1px solid var(--ghc-primary); } 
            .preview-container .box-causa { border-left: 3px solid var(--ghc-primary); } 
            .preview-container .box-causa .matriz-header { color: var(--ghc-primary); border-bottom: 1px solid var(--ghc-primary); } 
            .preview-container .box-impacto { border-left: 3px solid var(--ghc-primary); } 
            .preview-container .box-impacto .matriz-header { color: var(--ghc-primary); border-bottom: 1px solid var(--ghc-primary); }
            .preview-container .action-plan-table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 15px; } 
            .preview-container .action-plan-table th { background-color: var(--ghc-primary); color: white; text-transform: uppercase; font-size: 8pt; padding: 6px 8px; letter-spacing: 0.5px; border: 1px solid var(--ghc-primary); text-align: left; } 
            .preview-container .action-plan-table td { border: 1px solid var(--border-color); padding: 5px 8px; vertical-align: top; line-height: 1.3; }
            .preview-container .sep-rec td { border-top: 3px solid #a0aec0 !important; }
            .preview-container .badge-risco { color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 8pt; text-transform: uppercase; display: inline-block; } 
            .preview-container .bg-critico { background-color: var(--risco-critico); } .preview-container .bg-alto { background-color: var(--risco-alto); } .preview-container .bg-medio { background-color: var(--risco-medio); } .preview-container .bg-baixo { background-color: var(--risco-baixo); }
            .preview-container .badge-status { color: white; padding: 2px 6px; border-radius: 10px; font-weight: bold; font-size: 8pt; text-transform: uppercase; display: inline-block; text-align: center; width: 100%; box-sizing: border-box; } 
            .preview-container .status-atendida { background-color: var(--status-atendida); } .preview-container .status-parcial { background-color: var(--status-parcial); color: #000; } .preview-container .status-nao { background-color: var(--status-nao); } 
            .preview-container .beneficio-container { margin-bottom: 6px; display: flex; gap: 4px; flex-wrap: wrap; align-items: center; } 
            .preview-container .beneficio-tag { font-weight: bold; text-transform: uppercase; font-size: 8pt; color: var(--ghc-primary); background: #ebf8ff; padding: 1px 4px; border-radius: 2px; } 
            .preview-container .beneficio-detalhes { background-color: transparent; border: 1px solid #e2e8f0; border-radius: 4px; padding: 5px; margin-top: 4px; }
            .preview-container .bd-item { margin-bottom: 4px; font-size: 8pt; line-height: 1.3; }
            .preview-container .bd-item:last-child { margin-bottom: 0; }
            .preview-container .bd-item strong { color: var(--ghc-primary); font-size: 8pt; text-transform: uppercase; margin-right: 4px; }
            
            @media print {
              html, body, #root {
                height: auto !important;
                min-height: auto !important;
                overflow: visible !important;
              }
              @page { margin: 20mm; }
              @page portrait-page { size: A4 portrait; margin: 20mm; }
              @page landscape-page { size: A4 landscape; margin: 20mm; }
              
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              
              body { background-color: white; }
              .preview-container { background-color: white; width: 100%; display: block; }
              .preview-container .portrait { page: portrait-page; width: 100% !important; }
              .preview-container .landscape { page: landscape-page; width: 100% !important; }
              .preview-container .page {
                box-shadow: none !important;
                margin: 0 !important;
                padding: 0 !important;
                page-break-after: always !important;
                break-after: page !important;
                display: block !important;
              }
              .preview-container .page:last-child {
                page-break-after: auto;
              }
            }
          `}</style>
          
          <div id="document-preview-container" className="preview-container">
            {/* 
              NOTA: O código customizado em JS (print-only-page-numbers) que calculava o 
              position: absolute foi REMOVIDO para que o navegador lide nativamente com 
              a paginação, eliminando o erro de desalinhamento nas quebras de tabelas.
            */}

            {/* === PÁGINA 1: CAPA === */} 
            <div className="page portrait capa-page" id="page-capa" style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '15mm 15mm' }}> 
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', width: '100%' }}>
                    <img src={imgCabecalho} alt="GHC Cabeçalho" style={{ width: '100%', height: 'auto', objectFit: 'contain', maxHeight: '180px' }} />
                </div>
                
                <h1 style={{ fontSize: '56pt', fontWeight: 'bold', fontFamily: '"Times New Roman", Times, serif', color: '#000', margin: 0, textTransform: 'none', lineHeight: 1.1 }}>Nota de <br/>Auditoria Interna</h1>
                <h1 style={{ fontSize: '20pt', fontWeight: 'bold', color: '#718096', marginTop: '15px', marginBottom: '20px' }}>Versão Preliminar</h1>
                <h1 style={{ fontSize: '42pt', fontWeight: 'bold', color: '#000', fontFamily: '"Times New Roman", Times, serif', margin: 0, border: 'none', background: 'none', padding: 0 }}>{codRelatorioStr}</h1>
                <hr style={{ border: 0, borderTop: '3px solid #000', margin: '10px 0', width: '100%' }} />
                <h1 style={{ fontSize: '18pt', fontFamily: '"Times New Roman", Times, serif', color: '#000', marginTop: '10px' }}>Gerência de Auditoria Interna</h1>

                <div style={{ backgroundColor: 'var(--ghc-primary)', color: '#fff', padding: '15px 20px', textAlign: 'center', marginTop: '20px', marginBottom: '20px', borderLeft: '10px solid #004d52' }}>
                    <h1 style={{ color: '#fff', fontSize: '18pt', fontWeight: 'bold', margin: 0, border: 'none', padding: 0, textTransform: 'none' }}>{selectedItemData?.objetoAuditado || 'Objeto da Auditoria não Definido'}</h1>
                </div>

                <div style={{ paddingBottom: '10px' }}>
                    <div style={{ backgroundColor: '#f8fafc', borderLeft: '4px solid var(--ghc-primary)', color: 'var(--ghc-primary)', padding: '6px 10px', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '9pt', width: '100%' }}>
                        Dados Gerais
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9pt', lineHeight: 1.6 }}>
                        <div style={{ flex: 1, paddingRight: '20px' }}>
                            <table className="tabela-capa" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    <tr><td style={{ fontWeight: 'bold', width: '45%', padding: '5px 0', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>Item de Trabalho Vinculado/Ano:</td><td style={{ padding: '5px 0', color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>{selectedItemData ? `${selectedItemData.tipoItem?.nome || 'S/ TIPO'} - ${String(selectedItemData.numeroReferencia || '').padStart(2, '0')}/${selectedItemData.anoReferencia || ''}` : '-'}</td></tr>
                                    <tr><td style={{ fontWeight: 'bold', padding: '5px 0', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>Tipo de Serviço:</td><td style={{ padding: '5px 0', color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>{selectedItemData?.tipoServico?.nome || (typeof selectedItemData?.tipoServico === 'string' ? selectedItemData?.tipoServico : null) || '-'}</td></tr>
                                    <tr><td style={{ fontWeight: 'bold', padding: '5px 0', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>Macroprocesso:</td><td style={{ padding: '5px 0', color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>{selectedItemData?.macroprocesso?.nome || (typeof selectedItemData?.macroprocesso === 'string' ? selectedItemData?.macroprocesso : null) || '-'}</td></tr>
                                    <tr><td style={{ fontWeight: 'bold', padding: '5px 0', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>Origem da Demanda:</td><td style={{ padding: '5px 0', color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>{selectedItemData?.origem?.nome || (typeof selectedItemData?.origem === 'string' ? selectedItemData?.origem : null) || '-'}</td></tr>
                                    <tr><td style={{ fontWeight: 'bold', padding: '5px 0', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>Nível de Risco:</td><td style={{ padding: '5px 0', color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>{selectedItemData?.nivelRisco?.nome || (typeof selectedItemData?.nivelRisco === 'string' ? selectedItemData?.nivelRisco : null) || '-'}</td></tr>
                                    <tr><td style={{ fontWeight: 'bold', padding: '5px 0', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>Data Inicial:</td><td style={{ padding: '5px 0', color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>{formatDataBr(dataInicial)}</td></tr>
                                    <tr><td style={{ fontWeight: 'bold', padding: '5px 0', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>Data Final:</td><td style={{ padding: '5px 0', color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>{formatDataBr(dataFinal)}</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div style={{ flex: 1, paddingLeft: '20px' }}>
                            <table className="tabela-capa" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    <tr><td style={{ fontWeight: 'bold', width: '35%', padding: '5px 0', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>Gerente:</td><td style={{ padding: '5px 0', color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>{selectedItemData?.supervisor?.nome || '-'}</td></tr>
                                    <tr><td style={{ fontWeight: 'bold', padding: '5px 0', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>Supervisor Técnico:</td><td style={{ padding: '5px 0', color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>{selectedItemData?.supervisorTecnico?.nome || '-'}</td></tr>
                                    <tr><td style={{ fontWeight: 'bold', padding: '5px 0', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>Responsável:</td><td style={{ padding: '5px 0', color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>{selectedItemData?.responsavel?.nome || '-'}</td></tr>
                                    <tr><td style={{ fontWeight: 'bold', padding: '5px 0', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>Equipe:</td><td style={{ padding: '5px 0', color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>{selectedItemData?.equipe?.length > 0 ? selectedItemData.equipe.map(e => e.nome).join(', ') : '-'}</td></tr>
                                    <tr><td style={{ fontWeight: 'bold', padding: '5px 0', color: '#475569', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }}>Gerências Destinatárias:</td><td style={{ padding: '5px 0', color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>{gerenciasDestinatarias && gerenciasDestinatarias.length > 0 ? gerenciasDestinatarias.map(g => g.nome || g).join(', ') : '-'}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>


            </div>

            {/* === PÁGINA 2: NOTA INTRODUTÓRIA === */}
            <div className="page portrait" id="page-nota" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>
                <div style={{ padding: '30px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
                    <h2 className="center-title" style={{ marginBottom: '30px' }}>Nota Introdutória</h2>
                    <div style={{ textAlign: 'justify', fontSize: '11pt', lineHeight: 1.8, fontFamily: '"Times New Roman", Times, serif' }}>
                        <p style={{ textIndent: '40px', marginBottom: '15px' }}>Considerando as alterações introduzidas em nossos instrumentos de comunicação, no sentido de torná-los mais acessíveis e interativos, destacamos aqui os principais tópicos que você poderá encontrar ao ler este documento, bem como suas definições e finalidades:</p>
                        <p style={{ textIndent: '40px', marginBottom: '15px' }}><strong>Informações Preliminares</strong> são dados e informações que o leitor deve conhecer para contextualizar-se no trabalho e melhor compreender os tópicos seguintes;</p>
                        <p style={{ textIndent: '40px', marginBottom: '15px' }}><strong>Constatações</strong> são fatos diagnosticados pela Equipe de Auditoria acerca dos quais estão associados riscos de desconformidades;</p>
                        <p style={{ textIndent: '40px', marginBottom: '15px' }}><strong>Recomendações</strong> são proposições de ações realizadas pela Equipe de Auditoria, a fim de que os gestores possam mitigar ou eliminar os riscos identificados;</p>
                        <p style={{ textIndent: '40px', marginBottom: '15px' }}><strong>Benefícios Esperados</strong> são aprimoramentos e vantagens de gestão que a Equipe de Auditoria acredita que podem ser alcançados caso a Recomendação seja implementada;</p>
                        <p style={{ textIndent: '40px', marginBottom: '15px' }}><strong>Benefícios Realizados</strong> são aprimoramentos e vantagens de gestão que foram alcançados por meio da implementação da Recomendação; e</p>
                        <p style={{ textIndent: '40px', marginBottom: '15px' }}><strong>Riscos</strong> são eventos que, caso ocorram, poderão prejudicar o atingimento dos objetivos traçados pela instituição;</p>
                        <p style={{ textIndent: '40px', marginBottom: '15px' }}>Agradecemos pela sua atenção e colocamo-nos à disposição, caso entenda necessário, para debater aspectos deste relatório.</p>
                    </div>
                </div>
            </div>

            {/* === PÁGINA 3: SUMÁRIO === */} 
            <div className="page portrait" id="page-sumario" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}> 
                <h2 className="center-title">Sumário</h2> 
                <div>
                  <ul className="toc-list">
                    <li className="toc-item"><a href="#preview-intro" className="toc-link" style={{ textDecoration: 'none', color: 'inherit' }}><span className="toc-title">1. INTRODUÇÃO</span><span className="toc-dots"></span><span className="toc-page-num">{pageNumbers['preview-intro'] || 4}</span></a></li>
                    <li className="toc-item"><a href="#preview-preliminares" className="toc-link" style={{ textDecoration: 'none', color: 'inherit' }}><span className="toc-title">3. INFORMAÇÕES PRELIMINARES</span><span className="toc-dots"></span><span className="toc-page-num">{pageNumbers['preview-preliminares'] || 5}</span></a></li>
                    {preliminares.map((p, i) => (
                      <li key={p.id} className="toc-item" style={{marginLeft: 20, fontSize: '9pt'}}><a href={`#preview-preliminar-${p.id}`} className="toc-link" style={{ textDecoration: 'none', color: 'inherit' }}><span className="toc-title">INFORMAÇÃO {(i+1).toString().padStart(2, '0')} - {p.titulo ? p.titulo.toUpperCase() : 'SEM TÍTULO'}</span><span className="toc-dots"></span><span className="toc-page-num">{pageNumbers[`preview-preliminar-${p.id}`] || 5}</span></a></li>
                    ))}
                    <li className="toc-item"><a href="#preview-constatacoes" className="toc-link" style={{ textDecoration: 'none', color: 'inherit' }}><span className="toc-title">4. CONSTATAÇÕES E RECOMENDAÇÕES</span><span className="toc-dots"></span><span className="toc-page-num">{pageNumbers['preview-constatacoes'] || 5}</span></a></li>
                    {constatacoes.map((c, i) => (
                      <li key={c.id} className="toc-item" style={{marginLeft: 20, fontSize: '9pt'}}><a href={`#preview-constatacao-${c.id}`} className="toc-link" style={{ textDecoration: 'none', color: 'inherit' }}><span className="toc-title">CONSTATAÇÃO {(i+1).toString().padStart(2, '0')} - {c.titulo ? c.titulo.toUpperCase() : 'SEM TÍTULO'}</span><span className="toc-dots"></span><span className="toc-page-num">{pageNumbers[`preview-constatacao-${c.id}`] || 5}</span></a></li>
                    ))}
                    <li className="toc-item"><a href="#preview-consideracoes" className="toc-link" style={{ textDecoration: 'none', color: 'inherit' }}><span className="toc-title">5. CONSIDERAÇÕES FINAIS</span><span className="toc-dots"></span><span className="toc-page-num">{pageNumbers['preview-consideracoes'] || 5}</span></a></li>
                    <li className="toc-item"><a href="#preview-anexoa" className="toc-link" style={{ textDecoration: 'none', color: 'inherit' }}><span className="toc-title">6. ANEXO A - PLANO DE AÇÃO</span><span className="toc-dots"></span><span className="toc-page-num">{pageNumbers['preview-anexoa'] || 6}</span></a></li>
                    {anexosFinais.map((a, i) => (
                      <li key={a.id} className="toc-item"><a href={`#preview-anexo-${a.id}`} className="toc-link" style={{ textDecoration: 'none', color: 'inherit' }}><span className="toc-title">{7+i}. ANEXO {String.fromCharCode(66 + i)}{a.titulo ? ` - ${a.titulo.toUpperCase()}` : ''}</span><span className="toc-dots"></span><span className="toc-page-num">{pageNumbers[`preview-anexo-${a.id}`] || (7+i)}</span></a></li>
                    ))}
                  </ul>
                </div> 
            </div>

            {/* === PÁGINA 4: CORPO DO RELATÓRIO === */} 
            <div className="page portrait relative" id="page-intro-plan" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}> 
                <h2 id="preview-intro">1. INTRODUÇÃO</h2> 
                <div className="texto-comum" dangerouslySetInnerHTML={{ __html: introducao || '<p class="text-gray-400 italic">Preencha a introdução no editor...</p>' }} />
            </div>

            {/* === PÁGINA 5: INFORMAÇÕES PRELIMINARES E CONSTATAÇÕES === */} 
            <div className="page portrait relative" id="page-preliminares-constatacoes"> 
                <h2 id="preview-preliminares">3. INFORMAÇÕES PRELIMINARES</h2> 
                {preliminaresTextoInicial ? (
                  <div className="texto-comum" style={{ marginBottom: '20px' }} dangerouslySetInnerHTML={{ __html: preliminaresTextoInicial }} />
                ) : (
                  <div className="texto-comum" style={{ marginBottom: '20px' }}> 
                      <p>Abaixo são detalhadas as informações preliminares levantadas pela equipe de auditoria.</p> 
                  </div>
                )}
                {preliminares.length === 0 ? <p className="italic text-gray-500 mb-6">Nenhuma informação preliminar registrada.</p> : preliminares.map((p, i) => (
                  <React.Fragment key={p.id}>
                    <h3 id={`preview-preliminar-${p.id}`}>INFORMAÇÃO {(i+1).toString().padStart(2, '0')} - {p.titulo ? p.titulo.toUpperCase() : 'SEM TÍTULO'}</h3>
                    <div className="texto-comum" dangerouslySetInnerHTML={{ __html: p.content }} />
                  </React.Fragment>
                ))}

                <h2 id="preview-constatacoes">4. CONSTATAÇÕES E RECOMENDAÇÕES</h2> 
                {constatacoesTextoInicial ? (
                  <div className="texto-comum" style={{ marginBottom: '20px' }} dangerouslySetInnerHTML={{ __html: constatacoesTextoInicial }} />
                ) : (
                  <div className="texto-comum" style={{ marginBottom: '20px' }}> 
                      <p>Abaixo são detalhadas as inconformidades mapeadas pela equipe técnica, bem como as recomendações emitidas, estruturadas e direcionadas por Gerência Destinatária responsável pela implementação.</p> 
                  </div>
                )}

                {constatacoes.length === 0 ? <p className="italic text-gray-500 mb-6">Nenhuma constatação registrada.</p> : constatacoes.map((c, i) => {
                  
                  // Agrupar recomendações por gerência
                  const recsPorGerencia = {};
                  c.recomendacoes?.forEach(r => {
                    const gerencia = r.gerencia || 'Sem Gerência Definida';
                    if (!recsPorGerencia[gerencia]) recsPorGerencia[gerencia] = [];
                    recsPorGerencia[gerencia].push(r);
                  });

                  return (
                    <div key={c.id}>
                      <h3 id={`preview-constatacao-${c.id}`}>CONSTATAÇÃO {(i+1).toString().padStart(2, '0')} - {c.titulo ? c.titulo.toUpperCase() : 'SEM TÍTULO'}</h3>
                      <div className="texto-comum" dangerouslySetInnerHTML={{ __html: c.content }} />
                      
                      {Object.keys(recsPorGerencia).length > 0 && (
                        <h4 style={{ fontWeight: 'bold', fontSize: '10.5pt', color: 'var(--ghc-primary)', marginTop: '20px', marginBottom: '10px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                          RECOMENDAÇÕES
                        </h4>
                      )}
                      {Object.keys(recsPorGerencia).map(ger => (
                        <div key={ger} className="rec-block">
                          <div className="rec-gerencia">Destinatário: {ger}</div>
                          {recsPorGerencia[ger].map((r, ri) => {
                            
                            let bgBadge = 'bg-gray-400';
                            if (r.nivelRisco === 'Crítico') bgBadge = 'bg-critico';
                            if (r.nivelRisco === 'Alto') bgBadge = 'bg-alto';
                            if (r.nivelRisco === 'Médio') bgBadge = 'bg-medio';
                            if (r.nivelRisco === 'Baixo') bgBadge = 'bg-baixo';

                            return (
                              <div key={r.id} className="rec-item">
                                {(() => {
                                  const originalIndex = (c.recomendacoes || []).findIndex(origR => origR.id === r.id);
                                  const displayIndex = originalIndex !== -1 ? originalIndex + 1 : ri + 1;
                                  return (
                                    <>
                                      <div dangerouslySetInnerHTML={{ __html: `<strong>RECOMENDAÇÃO ${displayIndex.toString().padStart(2, '0')}:</strong> ` + r.content }} />
                                      <div className="rec-meta">
                                          <span><strong>Nível de Risco:</strong> <span className={`badge-risco ${bgBadge}`}>{r.nivelRisco || 'N/D'}</span></span>
                                          <span><strong>Data Limite:</strong> <span>{formatDataBr(r.dataLimite)}</span></span>
                                      </div>
                                    </>
                                  );
                                })()}
                                {r.tipoBeneficio && (
                                  <div className="rec-beneficio-inline">
                                      <strong>Benefício Esperado:</strong> 
                                      <strong style={{ fontSize: '8pt', color: 'var(--ghc-primary)', textTransform: 'uppercase', marginLeft: 4 }}>Tipo:</strong> <span className="beneficio-tag">{r.tipoBeneficio}</span> 
                                      <span style={{ marginLeft: 6 }}>{r.detalheBeneficio}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  );
                })}

                <h2 id="preview-consideracoes">5. CONSIDERAÇÕES FINAIS</h2> 
                <div className="texto-comum" dangerouslySetInnerHTML={{ __html: consideracoes || '<p class="text-gray-400 italic">Preencha as considerações finais...</p>' }} />

                <div style={{ marginTop: '50px', pageBreakInside: 'avoid', fontFamily: '"Times New Roman", Times, serif' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '11pt', marginBottom: '60px', color: '#000' }}>Responsáveis por este trabalho de Auditoria:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '30px', rowGap: '50px' }}>
                        {(() => {
                          const getNome = (str) => (str ? str.split(' (')[0].trim() : '');
                          const nomeResp = getNome(responsavelSelecionado); 
                          const nomeSupTec = getNome(supervisorTecnicoSelecionado);
                          const assinadosNomes = new Set();
                          if (nomeResp) assinadosNomes.add(nomeResp);

                          const showSupTec = supervisorTecnicoSelecionado && nomeSupTec && !assinadosNomes.has(nomeSupTec);
                          if (showSupTec) assinadosNomes.add(nomeSupTec);

                          return (
                            <>
                              {responsavelSelecionado && renderSignature(responsavelSelecionado, 'Auditor(a) Responsável')}
                              {/*{showSupTec && renderSignature(supervisorTecnicoSelecionado, 'Supervisor(a) Técnico(a)')}*/}
                              {equipeSelecionada
                                .filter((eq) => {
                                  const nomeEq = getNome(eq);
                                  if (!nomeEq || assinadosNomes.has(nomeEq)) return false;
                                  assinadosNomes.add(nomeEq);
                                  return true;
                                })
                                .map((eq, idx) => (
                                  <React.Fragment key={idx}>{renderSignature(eq, 'Auditor(a)')}</React.Fragment>
                                ))}
                            </>
                          );
                        })()}
                    </div>
                </div>

                <div style={{ marginTop: '50px', pageBreakInside: 'avoid', fontFamily: '"Times New Roman", Times, serif' }}>
                    <p style={{ fontSize: '11pt', marginBottom: '60px', textAlign: 'justify', color: '#000' }}>Tendo acompanhado a execução e supervisionado a elaboração desta Nota, aprovo a documentação de auditoria que consubstancia o presente documento.</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '50px', flexWrap: 'wrap' }}>                        
                        {(() => {
                          const getNome = (str) => (str ? str.split(' (')[0].trim() : '');
                          const nomeSupTec = getNome(supervisorTecnicoSelecionado);
                          const nomeSup = getNome(supervisorSelecionado);
                          
                          const showSupTec = supervisorTecnicoSelecionado && nomeSupTec && nomeSup !== nomeSupTec;

                          return (
                            <>
                              {showSupTec && renderSignature(supervisorTecnicoSelecionado, 'Supervisor(a) Técnico(a)')}                              
                              {supervisorSelecionado && renderSignature(supervisorSelecionado, 'Supervisor(a) da Gerência de Auditoria Interna')}
                            </>
                          );
                        })()}
                    </div>
                </div>
            </div>

            {/* === PÁGINA 6: ANEXO A === */}
            <div className="page landscape relative landscape-page" id="page-anexo-a"> 
                <h2 id="preview-anexoa">6. ANEXO A - PLANO DE AÇÃO</h2> 
                
                {constatacoes.length === 0 ? <p className="italic text-gray-500">O Plano de Ação será gerado automaticamente quando houverem Constatações cadastradas.</p> : constatacoes.map((c, i) => {
                  const showFato = hasResumoContent(c.resumoFato);
                  const showCriterio = hasResumoContent(c.resumoCriterio);
                  const showCausa = hasResumoContent(c.resumoCausa);
                  const showImpacto = hasResumoContent(c.resumoImpacto);
                  const activeQuadrosCount = [showFato, showCriterio, showCausa, showImpacto].filter(Boolean).length;

                  return (
                    <div key={c.id} style={{ marginBottom: 40 }}>
                      <div style={{ marginTop: 5, fontSize: '10pt', fontWeight: 'bold', color: 'var(--ghc-primary)', textTransform: 'uppercase' }}>CONSTATAÇÃO {(i+1).toString().padStart(2, '0')}{c.titulo ? `: ${c.titulo}` : ''}</div> 
                      {activeQuadrosCount > 0 && (
                        <div className="matriz-container" style={{ gridTemplateColumns: `repeat(${activeQuadrosCount}, 1fr)` }}> 
                            {showFato && (
                              <div className="matriz-box box-fato"> <div className="matriz-header">O FATO (SITUAÇÃO)</div> <div className="matriz-text" dangerouslySetInnerHTML={{ __html: c.resumoFato?.replace(/\n/g, '<br/>') }} /> </div> 
                            )}
                            {showCriterio && (
                              <div className="matriz-box box-criterio"> <div className="matriz-header">CRITÉRIO (REGRA)</div> <div className="matriz-text" dangerouslySetInnerHTML={{ __html: c.resumoCriterio?.replace(/\n/g, '<br/>') }} /> </div> 
                            )}
                            {showCausa && (
                              <div className="matriz-box box-causa"> <div className="matriz-header">CAUSA PROVÁVEL</div> <div className="matriz-text" dangerouslySetInnerHTML={{ __html: c.resumoCausa?.replace(/\n/g, '<br/>') }} /> </div> 
                            )}
                            {showImpacto && (
                              <div className="matriz-box box-impacto"> <div className="matriz-header">IMPACTO E RISCO</div> <div className="matriz-text" dangerouslySetInnerHTML={{ __html: c.resumoImpacto?.replace(/\n/g, '<br/>') }} /> </div> 
                            )}
                        </div>
                      )}

                      <table className="action-plan-table"> 
                          <thead> 
                              <tr> 
                                  <th style={{ width: '24%' }}>Recomendação Proposta</th> 
                                  <th style={{ width: '14%' }}>Gerência Destinatária</th> 
                                  <th style={{ width: '9%' }}>Data Limite</th> 
                                  <th style={{ width: '9%' }}>Nível Risco</th> 
                                  <th style={{ width: '33%' }}>Benefício</th> 
                                  <th style={{ width: '11%' }}>Status</th> 
                              </tr> 
                          </thead> 
                          <tbody> 
                              {(!c.recomendacoes || c.recomendacoes.length === 0) ? (
                                <tr><td colSpan="6" className="text-center italic text-gray-500">Nenhuma recomendação vinculada a esta constatação.</td></tr>
                              ) : c.recomendacoes.map((r, ri) => {
                                let bgBadge = 'bg-gray-400';
                                if (r.nivelRisco === 'Crítico') bgBadge = 'bg-critico';
                                if (r.nivelRisco === 'Alto') bgBadge = 'bg-alto';
                                if (r.nivelRisco === 'Médio') bgBadge = 'bg-medio';
                                if (r.nivelRisco === 'Baixo') bgBadge = 'bg-baixo';

                                return (
                                  <tr key={r.id} className="sep-rec"> 
                                      <td>
                                        <strong style={{ color: 'var(--ghc-primary)' }}>RECOMENDAÇÃO {(ri+1).toString().padStart(2, '0')}:</strong>
                                        <div dangerouslySetInnerHTML={{ __html: r.content }} />
                                      </td> 
                                      <td>{r.gerencia || 'Não definida'}</td> 
                                      <td>{formatDataBr(r.dataLimite)}</td> 
                                      <td><span className={`badge-risco ${bgBadge}`}>{r.nivelRisco || 'N/D'}</span></td> 
                                      <td> 
                                          {r.tipoBeneficio ? (
                                            <>
                                              <div className="beneficio-container"> 
                                                  <strong style={{ fontSize: '8pt', color: 'var(--ghc-primary)', textTransform: 'uppercase' }}>Tipo:</strong>
                                                  <span className="beneficio-tag">{r.tipoBeneficio}</span> 
                                              </div> 
                                              <div className="beneficio-detalhes">
                                                  <div className="bd-item"><strong>Descrição do Benefício:</strong> <span>{r.detalheBeneficio}</span></div>
                                              </div>
                                            </>
                                          ) : <span className="text-gray-400 italic">Não definido</span>}
                                      </td> 
                                      <td><span className="badge-status status-nao">Não Iniciada</span></td> 
                                  </tr> 
                                );
                              })}
                          </tbody> 
                      </table>
                    </div>
                  );
                })}
            </div>

            {/* === PÁGINAS DE ANEXOS ADICIONAIS === */}
            {anexosFinais.map((anexo, i) => {
              const letraAnexo = String.fromCharCode(66 + i);
              const secaoFiles = getAnexosBySecao(`Anexo ${letraAnexo}`);
              const allFiles = (anexo.arquivos && anexo.arquivos.length > 0) 
                ? anexo.arquivos 
                : secaoFiles.map(f => ({ 
                    ...f, 
                    name: f.fileName || f.name || 'Arquivo', 
                    type: f.fileType || f.type || '', 
                    url: f.url || `${API_URL}/anexos/download/${f.id}` 
                  }));
              const isPdf = anexo.tipo === 'arquivo' && allFiles.some(f => f.type && f.type === 'application/pdf');
              const orientationClass = (isPdf && anexo.orientacao === 'paisagem') ? 'landscape' : 'portrait';
              
              return (
                <div key={anexo.id} className={`page ${orientationClass} relative`} id={`page-anexo-${anexo.id}`} style={{ padding: '2cm' }}>
                    <h2 id={`sec-anexo-${letraAnexo.toLowerCase()}`}>{7+i}. ANEXO {letraAnexo}{anexo.titulo ? ` - ${anexo.titulo.toUpperCase()}` : ''}</h2>
                    
                    {anexo.tipo === 'texto' ? (
                      <div className="texto-comum" dangerouslySetInnerHTML={{ __html: anexo.content }} />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4" style={{ flex: 1, width: '100%' }}>
                        {allFiles && allFiles.length > 0 ? (
                          allFiles.map((arq, idx) => (
                            <div key={idx} className="mb-4 w-full flex justify-center" style={{ flex: 1, alignItems: 'center' }}>
                              {arq.type && arq.type.startsWith('image/') ? (
                                <img src={arq.url || (arq.file ? URL.createObjectURL(arq.file) : '')} alt={arq.name} style={{ maxWidth: '100%', maxHeight: '220mm', objectFit: 'contain' }} />
                              ) : arq.type === 'application/pdf' ? (
                                <iframe src={arq.url || (arq.file ? URL.createObjectURL(arq.file) : '')} title={arq.name} style={{ width: '100%', height: orientationClass === 'landscape' ? '150mm' : '230mm', border: '1px solid #cbd5e0', borderRadius: '4px' }} />
                              ) : (
                                <div className="p-10 border-2 border-dashed border-gray-300 rounded-xl text-center bg-gray-50 w-full">
                                  <p className="text-lg font-bold text-gray-600">📄 {arq.name}</p>
                                  <p className="text-sm text-gray-400">Este é um arquivo {arq.type}. No relatório final ele será anexado aqui.</p>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center italic text-gray-500 py-20">Nenhum arquivo anexado para este anexo.</div>
                        )}
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
        </>
      )}

      
      <DuplicateNumberModal
        isOpen={showDuplicateModal.isOpen}
        onClose={() => setShowDuplicateModal({ isOpen: false })}
        onAcceptSuggestion={acceptSuggestion}
        message={showDuplicateModal.message}
        nextAvailable={showDuplicateModal.nextAvailable}
        ano={showDuplicateModal.ano}
      />

      <DocumentPdfViewerModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        docTitle={`Nota de Auditoria nº ${numero ? String(numero).padStart(2, '0') : '00'}/${ano}`}
      />
    </div>
  );
}