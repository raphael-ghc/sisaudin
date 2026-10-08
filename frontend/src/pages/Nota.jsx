import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FileText, Plus, Trash2, Edit2, Calendar, Printer, Save, ArrowLeft,
  CheckCircle2, AlertTriangle, ShieldAlert, Sparkles, Loader2, Info,
  ChevronDown, ChevronUp, PanelLeft, Columns, PanelRight, Shield, UserCheck
} from 'lucide-react';
import debounce from 'lodash.debounce';
import { getAllItensTrabalho, getItemTrabalhoById } from '../api/itemTrabalhoApi';
import api from '../api/axiosInstance';
import { getNotaById, updateNotaById, createEmptyNota } from '../api/notaApi';
import { getNotaByItemTrabalho } from '../api/notaApi';
import { getAllGerencias } from '../api/gerenciaApi';
import Status from '../components/Status';
import RichTextEditor from '../components/RichTextEditor';
import imgCabecalho from '../img/ghc_cabecalho.png';
import imgRodape from '../img/ghc_rodape.png';
import DocumentPdfViewerModal from '../components/DocumentPdfViewerModal';
import { useAppContext } from '../contexts/AppContext';

// Componente SearchableSelect idêntico ao do RelatorioPreliminar
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

export default function Nota() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const itemTrabalhoIdParam = searchParams.get('itemTrabalhoId');


  const [notaId, setNotaId] = useState(id || null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [layoutMode, setLayoutMode] = useState('split');

  const { jwtPayload } = useAppContext();
  const [saveStatus, setSaveStatus] = useState('');
  const [isVinculoOpen, setIsVinculoOpen] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [collapsedReportes, setCollapsedReportes] = useState({});
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [globalCollapseAction, setGlobalCollapseAction] = useState(null);

  const toggleReportes = (itemId) => {
    setCollapsedReportes(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };


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

  // Campos do Documento
  const [selectedItemTrabalhoId, setSelectedItemTrabalhoId] = useState('');
  const [selectedItemData, setSelectedItemData] = useState(null);
  const [itensTrabalho, setItensTrabalho] = useState([]);
  const [gerenciasFullList, setGerenciasFullList] = useState([]);
  const [gerenciasDestinatarias, setGerenciasDestinatarias] = useState([]);

  const [ano, setAno] = useState(new Date().getFullYear());
  const [numero, setNumero] = useState('');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');

  // Seção 1: Sumário Executivo / Introdução
  const [introducao, setIntroducao] = useState('');

  // Seção 2: Análises Preliminares
  const [preliminaresTextoInicial, setPreliminaresTextoInicial] = useState('');
  const [preliminares, setPreliminares] = useState([]);

  // Seção 3: Constatações do Trabalho
  const [constatacoesTextoInicial, setConstatacoesTextoInicial] = useState('');
  const [constatacoes, setConstatacoes] = useState([]);

  // Seção 4: Conclusões e Recomendações Gerais
  const [consideracoes, setConsideracoes] = useState('');

  // Modal para Recomendação
  const [isRecModalOpen, setIsRecModalOpen] = useState(false);
  const [activeConstatacaoIndex, setActiveConstatacaoIndex] = useState(null);
  const [editingRecIndex, setEditingRecIndex] = useState(null);
  const [recForm, setRecForm] = useState({
    content: '',
    dataLimite: '',
    nivelRisco: 'BAIXO',
    gerencia: '',
    tipoBeneficio: 'Gesto',
    detalheBeneficio: '',
    valorBeneficio: ''
  });

  const extractItemData = (res) => {
    if (!res) return null;
    if (res.data) return res.data.data || res.data;
    return res;
  };

  useEffect(() => {
    if (globalCollapseAction) {
      if (globalCollapseAction.action === 'expand') {
        setIsVinculoOpen(true);
      } else if (globalCollapseAction.action === 'collapse') {
        setIsVinculoOpen(false);
      }
    }
  }, [globalCollapseAction]);

  useEffect(() => {
    const fetchItensAndGerencias = async () => {
      try {
        const responseItens = await getAllItensTrabalho();
        let items = [];
        if (responseItens && responseItens.data) {
          const dataObj = responseItens.data.data || responseItens.data;
          if (Array.isArray(dataObj)) items = dataObj;
          else if (dataObj.content) items = dataObj.content;
          else if (dataObj._embedded) items = Object.values(dataObj._embedded)[0] || [];
        } else if (Array.isArray(responseItens)) {
          items = responseItens;
        }
        
        // Se for NOVO documento, só permite escolher Itens de Trabalho APROVADOS
        if (!id) {
          items = items.filter(it => it.status === 'APROVADO' || it.status === 'Aprovado' || String(it.id) === String(itemTrabalhoIdParam));
        }
        setItensTrabalho(items);

        const resGerencias = await getAllGerencias();
        let gerencias = [];
        if (resGerencias && resGerencias.data) {
          const gObj = resGerencias.data.data || resGerencias.data;
          if (Array.isArray(gObj)) gerencias = gObj;
          else if (gObj.content) gerencias = gObj.content;
          else if (gObj._embedded) gerencias = Object.values(gObj._embedded)[0] || [];
        } else if (Array.isArray(resGerencias)) {
          gerencias = resGerencias;
        }
        setGerenciasFullList(gerencias);
      } catch (err) {
        toast.error("Erro ao carregar dados auxiliares.");
      }
    };
    fetchItensAndGerencias();
  }, []);

  useEffect(() => {
    const gid = searchParams.get('gerenciaId');
    if (gid && gerenciasFullList.length > 0 && gerenciasDestinatarias.length === 0) {
      const g = gerenciasFullList.find(x => String(x.id || x.gerenciaId) === String(gid));
      if (g) {
        setGerenciasDestinatarias([g]);
      }
    }
  }, [searchParams, gerenciasFullList]);

  useEffect(() => {
    const loadNota = async () => {
      setLoading(true);
      try {
        let currentNota;
        if (notaId) {
          currentNota = await getNotaById(notaId);
        } else {
          currentNota = await createEmptyNota();
          setNotaId(currentNota.id);
          const paramsToPass = new URLSearchParams(searchParams);
          const queryStr = paramsToPass.toString() ? `?${paramsToPass.toString()}` : '';
          navigate(`/nota--preliminar/${currentNota.id}${queryStr}`, { replace: true });
        }

        if (currentNota) {
          setAno(currentNota.ano || new Date().getFullYear());
          setNumero(currentNota.numero || '');
          setDataInicial(currentNota.dataInicial || '');
          setDataFinal(currentNota.dataFinal || '');
          setIntroducao(currentNota.introducao || '');
          setConsideracoes(currentNota.consideracoes || '');
          setPreliminaresTextoInicial(currentNota.preliminaresTextoInicial || '');
          setConstatacoesTextoInicial(currentNota.constatacoesTextoInicial || '');
          setPreliminares(currentNota.preliminares || []);
          setConstatacoes(currentNota.constatacoes || []);
          setGerenciasDestinatarias(currentNota.gerenciasDestinatarias || []);

          if (currentNota.itemTrabalho) {
            setSelectedItemTrabalhoId(currentNota.itemTrabalho.id);
            const res = await getItemTrabalhoById(currentNota.itemTrabalho.id);
            const itemFull = extractItemData(res);
            setSelectedItemData(itemFull);
          } else if (itemTrabalhoIdParam) {
            setSelectedItemTrabalhoId(Number(itemTrabalhoIdParam));
            const res = await getItemTrabalhoById(itemTrabalhoIdParam);
            const itemFull = extractItemData(res);
            setSelectedItemData(itemFull);
          }

          const itemTrabalhoId = currentNota.itemTrabalho?.id || itemTrabalhoIdParam;
          const isIntroEmpty = !currentNota.introducao;
          const isConsEmpty = !currentNota.consideracoes;
          const isPrelimEmpty = !currentNota.preliminares || currentNota.preliminares.length === 0;
          const isConstEmpty = !currentNota.constatacoes || currentNota.constatacoes.length === 0;

          {/*if (itemTrabalhoId && isIntroEmpty && isConsEmpty && isPrelimEmpty && isConstEmpty) {
            try {
              const npRes = await getNotaByItemTrabalho(itemTrabalhoId);
              const np = npRes.data || npRes;
              if (np && np.id) {
                if (np.introducao) setIntroducao(np.introducao);
                if (np.consideracoes) setConsideracoes(np.consideracoes);
                if (np.preliminaresTextoInicial) setPreliminaresTextoInicial(np.preliminaresTextoInicial);
                if (np.constatacoesTextoInicial) setConstatacoesTextoInicial(np.constatacoesTextoInicial);
                if (np.preliminares?.length > 0) {
                  setPreliminares(np.preliminares.map(p => ({ titulo: p.titulo || '', content: p.content || '' })));
                }
                if (np.constatacoes?.length > 0) {
                  setConstatacoes(np.constatacoes.map(c => ({
                    titulo: c.titulo || '', content: c.content || '',
                    recomendacoes: (c.recomendacoes || []).map(r => ({
                      content: r.content || '', dataLimite: r.dataLimite || '', nivelRisco: r.nivelRisco || 'BAIXO',
                      gerencia: r.gerencia || '', tipoBeneficio: r.tipoBeneficio || 'Gesto',
                      detalheBeneficio: r.detalheBeneficio || '', valorBeneficio: r.valorBeneficio || '', reportes: []
                    }))
                  })));
                }
                toast.info("Dados da Nota Preliminar importados automaticamente!");
              }
            } catch(e) { console.log(e); }
          }*/}

        }

      } catch (err) {
        toast.error("Erro ao carregar Nota de Auditoria.");
      } finally {
        setLoading(false);
      }
    };
    loadNota();
  }, [notaId, navigate]);

  const handleItemChange = async (itemId) => {
    setSelectedItemTrabalhoId(itemId);
    if (!itemId) {
      setSelectedItemData(null);
      return;
    }
    try {
      const res = await getItemTrabalhoById(itemId);
      const itemFull = extractItemData(res);
      setSelectedItemData(itemFull);

      if (!introducao && !consideracoes && preliminares.length === 0 && constatacoes.length === 0) {
        try {
          const npRes = await getNotaByItemTrabalho(itemId);
          const np = npRes.data || npRes;
          if (np && np.id) {
            if (np.introducao) setIntroducao(np.introducao);
            if (np.consideracoes) setConsideracoes(np.consideracoes);
            if (np.preliminaresTextoInicial) setPreliminaresTextoInicial(np.preliminaresTextoInicial);
            if (np.constatacoesTextoInicial) setConstatacoesTextoInicial(np.constatacoesTextoInicial);
            if (np.preliminares?.length > 0) {
              setPreliminares(np.preliminares.map(p => ({ titulo: p.titulo || '', content: p.content || '' })));
            }
            if (np.constatacoes?.length > 0) {
              setConstatacoes(np.constatacoes.map(c => ({
                titulo: c.titulo || '', content: c.content || '',
                recomendacoes: (c.recomendacoes || []).map(r => ({
                  content: r.content || '', dataLimite: r.dataLimite || '', nivelRisco: r.nivelRisco || 'BAIXO',
                  gerencia: r.gerencia || '', tipoBeneficio: r.tipoBeneficio || 'Gesto',
                  detalheBeneficio: r.detalheBeneficio || '', valorBeneficio: r.valorBeneficio || '', reportes: []
                }))
              })));
            }
            toast.info("Dados da Nota Preliminar importados automaticamente!");
          }
        } catch(e) { console.log(e); }
      }
    } catch (err) {
      toast.error("Erro ao carregar dados do Item de Trabalho selecionado.");
    }
  };

  // Auto-save debounced
  const debouncedSave = useCallback(
    debounce(async (id, payload, itemId) => {
      if (!id) return;
      try {
        setSaveStatus('saving');
        await updateNotaById(id, payload, itemId || null);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } catch (e) {
        console.error('Falha no auto-save da Nota de Auditoria', e);
        setSaveStatus('idle');
      }
    }, 3000),
    []
  );

  useEffect(() => {
    if (notaId && !loading && !isReadOnly) {
      setSaveStatus('editing');
      debouncedSave(notaId, {
        ano: ano ? parseInt(ano, 10) : null,
        numero: numero ? parseInt(numero, 10) : null,
        dataInicial: dataInicial || null,
        dataFinal: dataFinal || null,
        introducao,
        consideracoes,
        preliminaresTextoInicial,
        constatacoesTextoInicial,
        preliminares,
        constatacoes,
        gerenciasDestinatarias: gerenciasDestinatarias.map(g => ({ id: g.id, nome: g.nome || g }))
      }, selectedItemTrabalhoId);
    }
  }, [ano, numero, dataInicial, dataFinal, introducao, consideracoes, preliminaresTextoInicial, constatacoesTextoInicial, preliminares, constatacoes, gerenciasDestinatarias, selectedItemTrabalhoId, notaId, debouncedSave, loading]);

  const handleSaveManual = async () => {
    if (!notaId || isReadOnly) return;
    setSaving(true);
    setSaveStatus('saving');
    try {
      const payload = {
        ano: ano ? parseInt(ano, 10) : null,
        numero: numero ? parseInt(numero, 10) : null,
        dataInicial: dataInicial || null,
        dataFinal: dataFinal || null,
        introducao,
        consideracoes,
        preliminaresTextoInicial,
        constatacoesTextoInicial,
        preliminares,
        constatacoes,
        gerenciasDestinatarias: gerenciasDestinatarias.map(g => ({ id: g.id, nome: g.nome || g }))
      };

      await updateNotaById(notaId, payload, selectedItemTrabalhoId || null);
      setSaveStatus('saved');
      toast.success("Nota de Auditoria salva com sucesso!");
    } catch (err) {
      toast.error("Erro ao salvar Nota de Auditoria.");
      setSaveStatus('idle');
    } finally {
      setSaving(false);
    }
  };


  

  const handlePrint = () => {
    window.print();
  };

  // Funções Análises Preliminares
  const addPreliminar = () => {
    setPreliminares([...preliminares, { titulo: `Análise Preliminar ${preliminares.length + 1}`, content: '' }]);
  };

  const updatePreliminar = (index, field, value) => {
    const updated = [...preliminares];
    updated[index][field] = value;
    setPreliminares(updated);
  };

  const removePreliminar = (index) => {
    setPreliminares(preliminares.filter((_, i) => i !== index));
  };

  // Funções Constatações
  const addConstatacao = () => {
    setConstatacoes([...constatacoes, { titulo: `Constatação ${constatacoes.length + 1}`, content: '', recomendacoes: [] }]);
  };

  const updateConstatacao = (index, field, value) => {
    const updated = [...constatacoes];
    updated[index][field] = value;
    setConstatacoes(updated);
  };

  const removeConstatacao = (index) => {
    setConstatacoes(constatacoes.filter((_, i) => i !== index));
  };

  // Funções de Recomendação
  const openAddRecModal = (constatacaoIndex) => {
    setActiveConstatacaoIndex(constatacaoIndex);
    setEditingRecIndex(null);
    setRecForm({
      content: '',
      dataLimite: '',
      nivelRisco: 'BAIXO',
      gerencia: '',
      tipoBeneficio: 'Gesto',
      detalheBeneficio: '',
      valorBeneficio: ''
    });
    setIsRecModalOpen(true);
  };

  const openEditRecModal = (constatacaoIndex, recIndex) => {
    setActiveConstatacaoIndex(constatacaoIndex);
    setEditingRecIndex(recIndex);
    const existingRec = constatacoes[constatacaoIndex].recomendacoes[recIndex];
    setRecForm({
      content: existingRec.content || '',
      dataLimite: existingRec.dataLimite || '',
      nivelRisco: existingRec.nivelRisco || 'BAIXO',
      gerencia: existingRec.gerencia || '',
      tipoBeneficio: existingRec.tipoBeneficio || 'Gesto',
      detalheBeneficio: existingRec.detalheBeneficio || '',
      valorBeneficio: existingRec.valorBeneficio || ''
    });
    setIsRecModalOpen(true);
  };

  const removeRecomendacao = (constatacaoIndex, recIndex) => {
    const updated = [...constatacoes];
    const recToRemove = updated[constatacaoIndex].recomendacoes[recIndex];
    const gerenciaRemovida = recToRemove?.gerencia;

    updated[constatacaoIndex].recomendacoes = updated[constatacaoIndex].recomendacoes.filter((_, i) => i !== recIndex);
    setConstatacoes(updated);

    if (gerenciaRemovida) {
      const stillUsed = updated.some(c => c.recomendacoes && c.recomendacoes.some(r => r.gerencia === gerenciaRemovida));
      if (!stillUsed) {
        setGerenciasDestinatarias(prev => prev.filter(g => (g.nome || g) !== gerenciaRemovida));
      }
    }
  };

  const saveRecomendacaoModal = () => {
    if (!recForm.content.trim()) {
      toast.warning("Descreva o conteúdo da recomendação.");
      return;
    }
    const updated = [...constatacoes];
    const recs = updated[activeConstatacaoIndex].recomendacoes || [];
    
    let gerenciaAntiga = null;
    if (editingRecIndex !== null) {
      gerenciaAntiga = recs[editingRecIndex].gerencia;
      recs[editingRecIndex] = { ...recs[editingRecIndex], ...recForm };
    } else {
      recs.push({ ...recForm });
    }
    updated[activeConstatacaoIndex].recomendacoes = recs;
    setConstatacoes(updated);
    setIsRecModalOpen(false);

    const novaGerencia = recForm.gerencia;
    
    setGerenciasDestinatarias(prev => {
      let updatedGerencias = [...prev];
      
      if (novaGerencia) {
        const exists = updatedGerencias.some(g => (g.nome || g) === novaGerencia);
        if (!exists) {
          const gerenciaObj = gerenciasFullList.find(g => (g.nome || g) === novaGerencia) || { id: Date.now() + Math.random(), nome: novaGerencia };
          updatedGerencias.push(gerenciaObj);
        }
      }
      
      if (gerenciaAntiga && gerenciaAntiga !== novaGerencia) {
        const stillUsed = updated.some(c => c.recomendacoes && c.recomendacoes.some(r => r.gerencia === gerenciaAntiga));
        if (!stillUsed) {
          updatedGerencias = updatedGerencias.filter(g => (g.nome || g) !== gerenciaAntiga);
        }
      }
      
      return updatedGerencias;
    });
  };

  const adicionarReporte = (constatacaoIndex, recIndex, tipo, recGerencia = '') => {
    if (isReadOnly) return;
    const updated = [...constatacoes];
    const recs = updated[constatacaoIndex].recomendacoes || [];
    const r = recs[recIndex];
    r.reportes = [...(r.reportes || []), {
      id: Date.now(), tipo, dataHora: '', gerencia: recGerencia || '', responsavel: '', content: '<p>Insira a manifestação aqui...</p>', anexos: []
    }];
    setConstatacoes(updated);
  };

  const atualizarReporte = (constatacaoIndex, recIndex, reporteIndex, field, value) => {
    if (isReadOnly) return;
    const updated = [...constatacoes];
    updated[constatacaoIndex].recomendacoes[recIndex].reportes[reporteIndex][field] = value;
    setConstatacoes(updated);
  };

  const excluirReporte = (constatacaoIndex, recIndex, reporteIndex) => {
    if (isReadOnly) return;
    const updated = [...constatacoes];
    updated[constatacaoIndex].recomendacoes[recIndex].reportes.splice(reporteIndex, 1);
    setConstatacoes(updated);
  };

  const formatDataBr = (dt) => {
    if (!dt) return '-';
    try {
      const dateStr = String(dt).includes('T') ? String(dt).split('T')[0] + 'T12:00:00' : dt + 'T12:00:00';
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch (e) {
      return dt;
    }
  };

  const handleStatusChange = (novoStatus) => {
    toast.success(`Status atualizado para: ${novoStatus}`);
  };

  const renderSignature = (pessoaStr, cargo) => {
    if (!pessoaStr) return null;
    const nome = typeof pessoaStr === 'string' ? pessoaStr.split(' (')[0] : (pessoaStr.nome || '-');
    const cartaoMatch = typeof pessoaStr === 'string' ? pessoaStr.match(/Cartão:\s*([^)]+)/) : null;
    const cartao = cartaoMatch ? cartaoMatch[1] : (pessoaStr.cartaoPonto || '-');
    return (
      <div style={{ width: '280px', textAlign: 'center', marginBottom: '20px', pageBreakInside: 'avoid' }}>
        <div style={{ borderTop: '1px solid #000', margin: '0 auto 5px auto', width: '240px' }}></div>
        <div style={{ fontWeight: 'bold', fontSize: '10pt', color: '#000' }}>{nome}</div>
        <div style={{ fontSize: '9pt', color: '#000', marginTop: '2px' }}>{cargo}</div>
        <div style={{ fontSize: '9pt', color: '#000', marginTop: '2px' }}>Cartão Ponto: {cartao}</div>
      </div>
    );
  };

  // Agregar Recomendações para Preview de Plano de Ação
  const getAllRecomendacoesComConstatacao = () => {
    const list = [];
    constatacoes.forEach((c, idxC) => {
      (c.recomendacoes || []).forEach((r, idxR) => {
        list.push({
          numConstatacao: idxC + 1,
          tituloConstatacao: c.titulo || `Constatação ${idxC + 1}`,
          numRecomendacao: `${idxC + 1}.${idxR + 1}`,
          ...r
        });
      });
    });
    return list;
  };

  const allRecomendacoes = getAllRecomendacoesComConstatacao();

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

  // Congelar inputs (Read-Only) se não for da equipe, ou se for VISITANTE (A não ser que seja GESTOR ou SISTEMA)
  const isReadOnly = (isVisitante || (!isSisAdminOrGestor && !isInEquipe())) && !!selectedItemData;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="animate-spin text-[#00767d]" size={36} />
        <span className="ml-3 text-gray-600 font-medium">Carregando Nota de Auditoria...</span>
      </div>
    );
  }

  const codNotaStr = numero || ano 
    ? `NA ${numero ? String(numero).padStart(2, '0') : '00'}/${ano || '0000'}` 
    : (selectedItemData ? `NA ${selectedItemData.numeroReferencia ? String(selectedItemData.numeroReferencia).padStart(2, '0') : '00'}/${selectedItemData.anoReferencia || '0000'}` : 'NA 00/0000');

  
  const handleGerarPdfServidor = async () => {
      const previewEl = document.getElementById('document-preview-container');
      if (!previewEl) {
        toast.error('Erro: visualização não encontrada.');
        return;
      }
      setIsGeneratingPdf(true);
      try {
        const clone = previewEl.cloneNode(true);
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
            <title>Nota de Auditoria</title>
            <style>
               blockquote { border-left: 4px solid #cbd5e1 !important; padding: 12px 16px !important; color: #475569 !important; font-style: italic !important; margin: 16px 0 !important; background-color: #f8fafc !important; border-radius: 4px !important; display: block !important; }
               blockquote * { color: #475569 !important; font-style: italic !important; font-family: 'Calibri', sans-serif !important; }
               :root { --ghc-primary: #00767d; --ghc-secondary: #84c9bd; --paper-color: #ffffff; --text-color: #2d3748; --border-color: #cbd5e0; }
               body { background: white; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
               .preview-container { color: var(--text-color); font-size: 10pt; line-height: 1.5; display: flex; flex-direction: column; align-items: center; }
               .preview-container .page { background-color: var(--paper-color); box-sizing: border-box; position: relative; margin-bottom: 20px; display: flex; flex-direction: column; width: 100%; }
               .preview-container h2 { color: var(--ghc-primary); padding: 6px 12px; margin-top: 25px; margin-bottom: 15px; font-size: 12pt; font-weight: bold; text-transform: uppercase; border-left: 5px solid var(--ghc-primary); background: linear-gradient(90deg, rgba(132, 201, 189, 0.20) 0%, rgba(255, 255, 255, 0) 100%); } 
               .preview-container h2.center-title { text-align: center; border-left: none; background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(132, 201, 189, 0.20) 50%, rgba(255,255,255,0) 100%); }
               .preview-container h3 { color: var(--ghc-primary); font-size: 10pt; font-weight: bold; text-transform: uppercase; margin-top: 18px; margin-bottom: 10px; border-bottom: 1px solid var(--border-color); padding-bottom: 4px; }
               .texto-comum { text-align: justify; font-size: 14pt; }
               .texto-comum * { font-family: 'Calibri', sans-serif !important; font-size: 14pt; color: #000; line-height: 1.5; text-align: justify; }
               .texto-comum p { margin-bottom: 10px; }
               table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 9pt; }
               table th, table td { border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: top; }
               table th { background-color: #f1f5f9; font-weight: bold; text-align: left; }
               .toc-list { list-style: none; padding: 0; width: 100%; } 
               .toc-item { margin-bottom: 6px; } 
               .toc-link { display: flex; align-items: baseline; text-decoration: none; color: var(--text-color); font-size: 10pt; } 
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
               .texto-comum p, .editor-content p { text-indent: 1.25cm; }
</style>
          </head>
          <body>
            ${clone.outerHTML}
          </body>
          </html>
        `;
        const response = await api.post('/pdf/gerar', { html: htmlContent, docName: codNotaStr, docVersion: 'Versão Preliminar' }, { responseType: 'blob' });
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${codNotaStr.replace(/\//g, '_').replace(/ /g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("PDF gerado com sucesso no servidor!");
      } catch (err) {
        console.error(err);
        toast.error("Erro ao gerar PDF no servidor.");
      } finally {
        setIsGeneratingPdf(false);
      }
  };

  const footerTitleStr = `Nota de Auditoria ${codNotaStr}`;

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      
      {/* =========================================
          BARRA DE TOPO (HEADER FIXO)
      ========================================= */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm print:hidden">
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <FileText className="text-[#00767d]" size={24} />
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Auditoria Interna - GHC</h1>
              <p className="text-xs text-gray-500">Módulo de Nota de Auditoria #{notaId}</p>
            </div>
          </div>
          
          <div className="hidden md:block h-8 w-px bg-gray-300"></div>
          
          <Status statusInicial="NOVO" onChangeStatus={handleStatusChange} />

          {/* Indicador de Status do Auto-Save */}
          <div className="hidden sm:flex items-center text-xs ml-4 font-medium">
            {saveStatus === 'editing' && <div className="flex items-center text-amber-600 gap-1"><Loader2 size={12} className="animate-spin" /> Digitando...</div>}
            {saveStatus === 'saving' && <div className="flex items-center text-blue-600 gap-1"><Loader2 size={12} className="animate-spin" /> Salvando...</div>}
            {saveStatus === 'saved' && <div className="flex items-center text-emerald-600 gap-1"><CheckCircle2 size={12} /> Alterações salvas</div>}
            {saveStatus === 'idle' && <div className="flex items-center text-gray-400 gap-1"><CheckCircle2 size={12} /> Salvo</div>}
          </div>
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

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button 
              onClick={() => setLayoutMode('editor')} 
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${layoutMode === 'editor' ? 'bg-white text-[#00767d] shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
              title="Ver apenas o editor"
            >
              <PanelLeft size={16} /> Editor
            </button>
            <button 
              onClick={() => setLayoutMode('split')} 
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${layoutMode === 'split' ? 'bg-white text-[#00767d] shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
              title="Dividir tela entre editor e resultado"
            >
              <Columns size={16} /> Lado a Lado
            </button>
            <button 
              onClick={() => setLayoutMode('preview')} 
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${layoutMode === 'preview' ? 'bg-white text-[#00767d] shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
              title="Ver apenas o documento preliminar"
            >
              <PanelRight size={16} /> Preview
            </button>
          </div>

          {/*{!isReadOnly && (
            <button
              onClick={handleSaveManual}
              disabled={isReadOnly || (saving)}
              className="inline-flex items-center px-4 py-2.5 bg-[#00767d] text-white rounded-lg hover:bg-[#005f64] transition-colors text-sm font-medium shadow-sm disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
              Salvar
            </button>
          )}*/}
        </div>
      </div>

      {/* =========================================
          ÁREA DE CONTEÚDO (FLEX ROW RESPONSIVA)
      ========================================= */}
      <div className="flex flex-1 overflow-hidden print:block print:overflow-visible">
        
        {/* =========================================
            COLUNA 1: O EDITOR DE Nota de Auditoria
        ========================================= */}
        <div className={`overflow-y-auto p-4 md:p-8 flex-1 transition-all duration-300 print:hidden ${layoutMode === 'preview' ? 'hidden' : 'block'}`}>
          <div className="max-w-4xl mx-auto pb-20">
            <header className="mb-8 border-b-2 border-[#00767d] pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900 whitespace-nowrap">Preenchimento da Nota de Auditoria</h2>
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
                  onClick={() => navigate('/notas-finais')}
                  className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg border border-gray-200"
                >
                  <FileText size={18} className="mr-1.5" />
                  Ir para Lista de Notas de Auditoria
                </button>
              </div>
            </header>

            {/* CARD 1: VÍNCULO COM ITEM DE TRABALHO */}
            <section className="mb-10">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <div 
                  className="bg-blue-50/70 border-b border-gray-200 px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-blue-100/70 transition-colors rounded-t-xl"
                  onClick={() => setIsVinculoOpen(!isVinculoOpen)}
                >
                  <div className="flex items-center gap-3">
                    {isVinculoOpen ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                    <Info className="text-blue-700" size={20} />
                    <h3 className="font-bold text-gray-900">Vínculo com Item de Trabalho</h3>
                  </div>
                </div>

                {isVinculoOpen && (
                  <div className="p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Selecione o Item de Trabalho Base (Total: {itensTrabalho.length})
                      </label>
                      <SearchableSelect
                        options={itensTrabalho.map(item => ({
                          value: item.id,
                          label: `${item.nome} (${item.sigla || 'S/S'}) - Ano ${item.anoReferencia || ''}`
                        }))}
                        value={selectedItemTrabalhoId}
                        onChange={handleItemChange}
                        placeholder="Buscar Item de Trabalho..."
                        disabled={isReadOnly || !!itemTrabalhoIdParam || (!!selectedItemTrabalhoId && !!notaId)}
                      />

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Ano</label>
                        <input
                          type="number"
                          value={ano || ''}
                          onChange={(e) => setAno(e.target.value.replace(/\D/g, ''))}
                          className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#00767d] focus:outline-none text-sm"
                          placeholder="2025"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Número</label>
                        <input
                          type="number"
                          value={numero || ''}
                          onChange={(e) => setNumero(e.target.value.replace(/\D/g, ''))}
                          className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#00767d] focus:outline-none text-sm"
                          placeholder="2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Data Inicial (Trabalho)</label>
                        <input
                          type="date"
                          value={dataInicial}
                          onChange={(e) => setDataInicial(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#00767d] focus:outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Data Final (Trabalho)</label>
                        <input
                          type="date"
                          value={dataFinal}
                          onChange={(e) => setDataFinal(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#00767d] focus:outline-none text-sm"
                        />
                      </div>
                    </div>

                    {/* SELEÇÃO MÚLTIPLA DE GERÊNCIAS DESTINATÁRIAS */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Gerências Destinatárias da Nota
                      </label>
                      <div className="border border-gray-300 rounded-md p-3 bg-white shadow-sm">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {gerenciasDestinatarias.map((g, idx) => (
                            <span
                              key={g.id || g.nome || idx}
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
                            <span className="text-xs text-gray-400 italic py-1">
                              Nenhuma gerência destinatária selecionada para a capa do documento.
                            </span>
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
                                const selectedObj = gerenciasFullList.find(
                                  (g) => String(g.id) === String(val) || g.nome === val || g === val
                                );
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
                        </div>
                      </div>
                    </div>

                    {/* Read-only Item de Trabalho */}
                    {selectedItemData && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-sm space-y-3">
                        <div className="font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 pb-2">
                          Dados Vinculados do Item de Trabalho
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-600">
                          <div>
                            <span className="font-medium text-gray-800">Tipo de Serviço: </span>
                            {selectedItemData.tipoServico?.nome || selectedItemData.tipoServico || '-'}
                          </div>
                          <div>
                            <span className="font-medium text-gray-800">Macroprocesso: </span>
                            {selectedItemData.macroprocesso?.nome || selectedItemData.macroprocesso || '-'}
                          </div>
                          <div>
                            <span className="font-medium text-gray-800">Origem da Demanda: </span>
                            {selectedItemData.origem?.nome || selectedItemData.origem || '-'}
                          </div>
                          <div>
                            <span className="font-medium text-gray-800">Responsável: </span>
                            {selectedItemData.responsavel?.nome || selectedItemData.responsavel || '-'}
                          </div>
                          <div className="md:col-span-2">
                            <span className="font-medium text-gray-800">Objeto Auditado: </span>
                            {selectedItemData.objetoAuditado || '-'}
                          </div>
                          <div className="md:col-span-2">
                            <span className="font-medium text-gray-800">Objetivo da Auditoria: </span>
                            {selectedItemData.objetivoAuditoria || '-'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* SEÇÃO 1: SUMÁRIO EXECUTIVO / INTRODUÇÃO */}
            <section className="mb-10">
              <RichTextEditor readOnly={isReadOnly}
                title="1. SUMÁRIO EXECUTIVO / INTRODUÇÃO"
                subtitle="Apresente um resumo geral da Nota de Auditoria."
                initialContent={introducao}
                onChange={setIntroducao}
                onFocus={() => setActiveSectionId('intro')}
                globalCollapseAction={globalCollapseAction}
              />
            </section>

            {/* SEÇÃO 2: ANÁLISES PRELIMINARES (Sem Planejamento, esta passa a ser a Seção 2) */}
            <section className="mb-10">
              <RichTextEditor 
                title="2. ANÁLISES PRELIMINARES (TEXTO INICIAL)"
                subtitle="Descreva os exames preliminares realizados pela equipe de auditoria."
                initialContent={preliminaresTextoInicial}
                onChange={setPreliminaresTextoInicial}
                onFocus={() => setActiveSectionId('preliminares')}
                globalCollapseAction={globalCollapseAction}
              />

              <div className="mt-4 space-y-4">
                {preliminares.map((p, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                      <h4 className="font-bold text-gray-800">2.{index + 1}. Item de Análise Preliminar</h4>
                      <button
                        type="button"
                        onClick={() => removePreliminar(index)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                      >
                        <Trash2 size={16} /> Remover
                      </button>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Título</label>
                      <input
                        type="text"
                        value={p.titulo || ''}
                        onChange={(e) => updatePreliminar(index, 'titulo', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00767d] focus:outline-none text-sm"
                        placeholder="Ex: Análise da estrutura documental"
                      />
                    </div>

                    <RichTextEditor 
                      title=""
                      subtitle="Conteúdo detalhado desta análise preliminar."
                      initialContent={p.content || ''}
                      onChange={(val) => updatePreliminar(index, 'content', val)}
                      onFocus={() => setActiveSectionId('preliminares')}
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addPreliminar}
                  className="w-full py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:border-gray-400 font-medium text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Plus size={18} /> Adicionar Item de Análise Preliminar
                </button>
              </div>
            </section>

            {/* SEÇÃO 3: CONSTATAÇÕES DO TRABALHO */}
            <section className="mb-10">
              <RichTextEditor 
                title="3. CONSTATAÇÕES DO TRABALHO (TEXTO INICIAL)"
                subtitle="Apresente os apontamentos gerais e achados da Nota de Auditoria."
                initialContent={constatacoesTextoInicial}
                onChange={setConstatacoesTextoInicial}
                onFocus={() => setActiveSectionId('constatacoes')}
                globalCollapseAction={globalCollapseAction}
              />

              <div className="mt-4 space-y-6">
                {constatacoes.map((c, index) => (
                  <div key={index} className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm relative">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
                      <h4 className="font-bold text-lg text-[#00767d]">3.{index + 1}. Constatação</h4>
                      <button
                        type="button"
                        onClick={() => removeConstatacao(index)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                      >
                        <Trash2 size={18} /> Remover Constatação
                      </button>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Título da Constatação</label>
                      <input
                        type="text"
                        value={c.titulo || ''}
                        onChange={(e) => updateConstatacao(index, 'titulo', e.target.value)}
                        className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00767d] focus:outline-none text-base font-medium"
                        placeholder="Ex: Fragilidade no controle de estoques"
                      />
                    </div>

                    <div className="mb-6">
                      <RichTextEditor readOnly={isReadOnly}
                        title=""
                        subtitle="Descrição detalhada do achado (fato, critério, causa e efeito)."
                        initialContent={c.content || ''}
                        onChange={(val) => updateConstatacao(index, 'content', val)}
                        onFocus={() => setActiveSectionId('constatacoes')}
                      />
                    </div>

                    {/* Recomendações desta Constatação */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h5 className="font-bold text-gray-800 text-sm uppercase tracking-wider">
                            Recomendações (3.{index + 1}.X)
                          </h5>
                          <p className="text-xs text-gray-500">
                            Cadastre as recomendações e defina os prazos e gestores responsáveis.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openAddRecModal(index)}
                          className="bg-[#00767d] hover:bg-[#005f64] text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
                        >
                          <Plus size={14} /> Nova Recomendação
                        </button>
                      </div>

                      {(!c.recomendacoes || c.recomendacoes.length === 0) ? (
                        <div className="text-center py-6 text-gray-400 text-xs italic bg-white rounded border border-dashed border-gray-200">
                          Nenhuma recomendação cadastrada para esta constatação.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {c.recomendacoes.map((rec, rIndex) => (
                            <div key={rIndex} className="bg-white border border-gray-200 rounded-md p-3.5 shadow-xs flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="font-bold text-gray-900 text-sm">3.{index + 1}.{rIndex + 1}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                                    rec.nivelRisco === 'ALTO' ? 'bg-red-100 text-red-800' :
                                    rec.nivelRisco === 'MÉDIO' ? 'bg-amber-100 text-amber-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    Risco {rec.nivelRisco || 'BAIXO'}
                                  </span>
                                  {rec.gerencia && (
                                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium border border-blue-100">
                                      Gestor: {rec.gerencia}
                                    </span>
                                  )}
                                  {rec.dataLimite && (
                                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                                      Prazo: {formatDataBr(rec.dataLimite)}
                                    </span>
                                  )}
                                </div>
                                <div 
                                  className="text-sm text-gray-700 line-clamp-2 font-serif"
                                  dangerouslySetInnerHTML={{ __html: rec.content || '' }}
                                />

                                {/* REPORTES (Manifestações e Posicionamentos) */}
                                <div className="mt-4 border-t border-gray-100 pt-3">
                                  <div 
                                    className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-md transition-colors"
                                    onClick={() => toggleReportes(rec.id || `temp_${index}_${rIndex}`)}
                                  >
                                    <div className="flex items-center gap-2">
                                      {(collapsedReportes[rec.id || `temp_${index}_${rIndex}`] !== undefined ? !collapsedReportes[rec.id || `temp_${index}_${rIndex}`] : (rec.reportes && rec.reportes.length > 0)) ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
                                      <h5 className="font-semibold text-indigo-900 flex items-center gap-2 text-sm">
                                        <FileText size={16} /> Reportes (Manifestações e Posicionamentos)
                                      </h5>
                                    </div>
                                    <span className="bg-indigo-100 text-indigo-800 text-xs py-0.5 px-2 rounded-full font-bold">
                                      {rec.reportes?.length || 0}
                                    </span>
                                  </div>

                                  {(collapsedReportes[rec.id || `temp_${index}_${rIndex}`] !== undefined ? !collapsedReportes[rec.id || `temp_${index}_${rIndex}`] : (rec.reportes && rec.reportes.length > 0)) && (
                                    <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-4 shadow-inner">
                                      
                                      {!isReadOnly && (
                                        <div className="flex gap-2 mb-6 justify-center">
                                          <button onClick={() => adicionarReporte(index, rIndex, 'auditada', rec.gerencia)} className="text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 px-3 py-1.5 rounded-md font-medium border border-amber-200 shadow-sm flex items-center gap-1">
                                            + Manifestação da Área Auditada
                                          </button>
                                          <button onClick={() => adicionarReporte(index, rIndex, 'auditoria', rec.gerencia)} className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-md font-medium border border-indigo-200 shadow-sm flex items-center gap-1">
                                            + Posicionamento da Auditoria
                                          </button>
                                        </div>
                                      )}

                                      <div className="relative">
                                        <div className="space-y-4">
                                          {(rec.reportes || []).map((rep, repIndex) => {
                                            const isAuditada = rep.tipo === 'auditada';
                                            const prevRep = repIndex > 0 ? rec.reportes[repIndex - 1] : null;
                                            const isDifferentSide = prevRep && prevRep.tipo !== rep.tipo;
                                            
                                            const rowMargin = isDifferentSide ? "-mt-24 md:-mt-32 lg:-mt-[150px] relative z-10" : "mt-2";
                                            
                                            const cardContent = (
                                              <>
                                                <div className="flex justify-between items-start mb-2 border-b border-gray-100 pb-1">
                                                  <h6 className={`text-xs font-bold ${isAuditada ? 'text-amber-800' : 'text-indigo-800'}`}>
                                                    {isAuditada ? 'Manifestação' : 'Posicionamento'}
                                                  </h6>
                                                  {!isReadOnly && (
                                                    <button onClick={() => excluirReporte(index, rIndex, repIndex)} className="text-red-400 hover:text-red-600 p-1" title="Excluir">
                                                      <Trash2 size={14} />
                                                    </button>
                                                  )}
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                  <div>
                                                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Data/Hora</label>
                                                    <input type="datetime-local" className="w-full text-xs border border-gray-200 rounded px-1.5 py-1 outline-none" value={rep.dataHora || ''} onChange={(e) => atualizarReporte(index, rIndex, repIndex, 'dataHora', e.target.value)}  />
                                                  </div>
                                                  <div>
                                                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Responsável</label>
                                                    <input type="text" className="w-full text-xs border border-gray-200 rounded px-1.5 py-1 outline-none" value={rep.responsavel || ''} onChange={(e) => atualizarReporte(index, rIndex, repIndex, 'responsavel', e.target.value)} placeholder="Nome"  />
                                                  </div>
                                                  <div className="col-span-2">
                                                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Gerência</label>
                                                    <SearchableSelect
                                                      value={rep.gerencia}
                                                      onChange={(val) => atualizarReporte(index, rIndex, repIndex, 'gerencia', val)}
                                                      options={[{ value: rep.gerencia, label: rep.gerencia }]}
                                                      placeholder="Selecione..."
                                                      disabled={true}
                                                    />
                                                  </div>
                                                </div>
                                                <div className="mt-2 text-sm report-rte-wrapper">
                                                  <RichTextEditor 
                                                    title=""
                                                    initialContent={rep.content}
                                                    onChange={(content) => atualizarReporte(index, rIndex, repIndex, 'content', content)}
                                                    
                                                  />
                                                </div>
                                              </>
                                            );
                                            
                                            return (
                                              <div key={rep.id || repIndex} className={`flex w-full mb-4 ${rowMargin}`}>
                                                {isAuditada ? (
                                                  <>
                                                    <div className="w-[48%] bg-white border border-amber-200 border-l-4 border-l-amber-500 rounded-lg shadow-sm p-3">
                                                      {cardContent}
                                                    </div>
                                                    <div className="w-[4%] flex justify-center relative min-w-[20px]">
                                                      <div className="w-px bg-gray-300 h-full absolute"></div>
                                                      <div className="w-3 h-3 rounded-full bg-amber-500 mt-4 relative z-20 border-2 border-white shadow-sm ring-1 ring-amber-200"></div>
                                                    </div>
                                                    <div className="w-[48%]"></div>
                                                  </>
                                                ) : (
                                                  <>
                                                    <div className="w-[48%]"></div>
                                                    <div className="w-[4%] flex justify-center relative min-w-[20px]">
                                                      <div className="w-px bg-gray-300 h-full absolute"></div>
                                                      <div className="w-3 h-3 rounded-full bg-indigo-500 mt-4 relative z-20 border-2 border-white shadow-sm ring-1 ring-indigo-200"></div>
                                                    </div>
                                                    <div className="w-[48%] bg-white border border-indigo-200 border-r-4 border-r-indigo-500 rounded-lg shadow-sm p-3">
                                                      {cardContent}
                                                    </div>
                                                  </>
                                                )}
                                              </div>
                                            );
                                          })}
                                          {(!rec.reportes || rec.reportes.length === 0) && (
                                            <div className="text-center text-gray-400 italic text-sm py-4 border border-dashed border-gray-200 rounded-lg">Nenhum reporte registrado.</div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => openEditRecModal(index, rIndex)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors"
                                  title="Editar Recomendação"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeRecomendacao(index, rIndex)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                                  title="Excluir Recomendação"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addConstatacao}
                  className="w-full py-3.5 bg-white border-2 border-dashed border-[#00767d]/40 rounded-xl text-[#00767d] hover:bg-[#00767d]/5 hover:border-[#00767d] font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Plus size={20} /> Adicionar Nova Constatação
                </button>
              </div>
            </section>

            {/* SEÇÃO 4: CONCLUSÕES E RECOMENDAÇÕES GERAIS */}
            <section className="mb-10">
              <RichTextEditor readOnly={isReadOnly}
                title="4. CONCLUSÕES E RECOMENDAÇÕES GERAIS"
                subtitle="Descreva as conclusões finais e recomendações gerais da Nota de Auditoria."
                initialContent={consideracoes}
                onChange={setConsideracoes}
                onFocus={() => setActiveSectionId('consideracoes')}
                globalCollapseAction={globalCollapseAction}
              />
            </section>

            {/* SEÇÕES 5 E 6: COMENTÁRIOS DA GESTÃO E PLANO DE AÇÃO */}
            <section className="mb-10">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 text-lg mb-2">5. COMENTÁRIOS DA GESTÃO & 6. PLANO DE AÇÃO</h3>
                <p className="text-sm text-gray-600">
                  As seções de <strong>Comentários da Gestão</strong> e a matriz consolidadora do <strong>Plano de Ação</strong> são geradas automaticamente no documento (Preview / Impressão), organizadas pelas constatações e recomendações cadastradas acima.
                </p>
              </div>
            </section>

          </div>
        </div>

        {/* =========================================
            COLUNA 2: O PREVIEW / DOCUMENTO EM TEMPO REAL (MODELO RELATÓRIO DE AUDITORIA)
        ========================================= */}
        <div className={`bg-gray-300 overflow-y-auto p-4 md:p-8 border-l-2 border-gray-400 flex-1 transition-all duration-300 print:w-full print:p-0 print:border-none print:bg-white print:overflow-visible print:block ${layoutMode === 'editor' ? 'hidden' : 'block'}`}>
          <div className="sticky top-0 z-10 flex justify-end items-center gap-3 mb-4 print:hidden">
            {/*<button 
              onClick={() => setShowPdfModal(true)}
              className="flex items-center gap-2 bg-[#00767d] hover:bg-[#005f64] text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors"
              title="Abrir janela para visualizar o documento em PDF"
            >
              <FileText size={18} />
              <span>Visualizar em PDF</span>
            </button>*/}
            
              

              

              

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
              onClick={handlePrint}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors"
            >
              <Printer size={18} /> Imprimir Nota de Auditoria
            </button>*/}
          </div>

          <style>{`
            :root { 
                --ghc-primary: #00767d; 
                --ghc-secondary: #84c9bd; 
                --paper-color: #ffffff; 
                --text-color: #2d3748; 
                --border-color: #cbd5e0; 
            }
            .preview-container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: var(--text-color); font-size: 10pt; line-height: 1.5; display: flex; flex-direction: column; align-items: center; }
            .preview-container .page { background-color: var(--paper-color); box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); box-sizing: border-box; position: relative; margin-bottom: 20px; display: flex; flex-direction: column; }
            .preview-container .portrait { width: 210mm; min-height: 297mm; padding: 20mm 15mm; } 
            .preview-container .landscape { width: 297mm; min-height: 210mm; padding: 20mm 15mm; }
            .preview-container .page-footer { margin-top: auto; border-top: 1px solid var(--border-color); padding-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 8pt; color: #718096; width: 100%; position: static !important; page-break-inside: avoid; break-inside: avoid; } 
            .preview-container .footer-info { font-weight: bold; color: var(--ghc-primary); text-transform: uppercase; } 
            .preview-container .footer-page-number { font-weight: bold; color: var(--text-color); }
            .preview-container h2 { color: var(--ghc-primary); padding: 6px 12px; margin-top: 25px; margin-bottom: 15px; font-size: 12pt; font-weight: bold; text-transform: uppercase; border-left: 5px solid var(--ghc-primary); background: linear-gradient(90deg, rgba(132, 201, 189, 0.20) 0%, rgba(255, 255, 255, 0) 100%); } 
            .preview-container h2.center-title { text-align: center; border-left: none; background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(132, 201, 189, 0.20) 50%, rgba(255,255,255,0) 100%); }
            .preview-container h3 { color: var(--ghc-primary); font-size: 10pt; font-weight: bold; text-transform: uppercase; margin-top: 18px; margin-bottom: 10px; border-bottom: 1px solid var(--border-color); padding-bottom: 4px; }
            .preview-container .texto-comum, .preview-container .texto-comum p, .preview-container .texto-comum div, .preview-container .texto-comum li, .preview-container .texto-comum ul, .preview-container .texto-comum ol, .preview-container .texto-comum span { text-align: justify !important; font-size: 12pt; color: #000; margin-bottom: 10px; }
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
            .preview-container .toc-list { list-style: none; padding: 0; margin: 0; width: 100%; } 
            .preview-container .toc-item { margin-bottom: 10px; } 
            .preview-container .toc-link { display: flex; align-items: baseline; text-decoration: none; color: var(--text-color); font-size: 11pt; cursor: pointer; } 
            .preview-container .toc-dots { flex: 1; border-bottom: 1px dotted var(--border-color); margin: 0 6px; } 
            .preview-container .toc-page-num { font-weight: bold; color: var(--ghc-primary); }
            .preview-container .badge-risco { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 8pt; font-weight: bold; color: #fff; }
            .preview-container .bg-critico { background-color: #7f1d1d; }
            .preview-container .bg-alto { background-color: #991b1b; }
            .preview-container .bg-medio { background-color: #b45309; }
            .preview-container .bg-baixo { background-color: #166534; }
            .preview-container .rec-block { margin-top: 15px; margin-bottom: 20px; border-left: 3px solid var(--ghc-primary); padding-left: 15px; }
            .preview-container .rec-gerencia { font-weight: bold; color: var(--ghc-primary); margin-bottom: 10px; }
            .preview-container .rec-item { margin-bottom: 15px; font-size: 11pt; }
            .preview-container .rec-meta { display: flex; gap: 20px; font-size: 9pt; color: #475569; margin-top: 5px; }
            .preview-container .rec-beneficio-inline { font-size: 9pt; color: #475569; margin-top: 4px; }
            .preview-container .beneficio-tag { background-color: #f1f5f9; color: var(--ghc-primary); padding: 1px 6px; border-radius: 3px; font-weight: bold; font-size: 8pt; }
            
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
              }
              body {
                background-color: #fff !important;
              }
              .preview-container {
                width: 100% !important;
              }
              .preview-container .page {
                box-shadow: none !important;
                margin: 0 !important;
                padding: 0 !important;
                page-break-after: always;
              }
              .preview-container .page:last-child {
                page-break-after: auto;
              }
            }
          `}</style>
          
          <div id="document-preview-container" className="preview-container">
            {/* === PÁGINA 1: CAPA === */}
            <div className="page portrait capa-page" style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '20mm 15mm' }}> 
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                    <img src={imgCabecalho} alt="GHC Cabeçalho" style={{ maxWidth: '100%', height: 'auto', maxHeight: '100px' }} />
                </div>
                
                <h1 style={{ fontSize: '42pt', fontWeight: 'bold', fontFamily: '"Times New Roman", Times, serif', color: '#000', margin: 0, textTransform: 'none', lineHeight: 1.1 }}>Nota de Auditoria<br/>Interna</h1>
                <p style={{ fontSize: '12pt', fontWeight: 'bold', color: '#718096', marginTop: '15px', marginBottom: '30px' }}>Versão Preliminar</p>
                <div style={{ fontSize: '44pt', fontWeight: 'bold', color: '#000', fontFamily: '"Times New Roman", Times, serif', margin: 0, border: 'none', background: 'none', padding: 0 }}>
                  {numero || ano ? `NA ${numero ? String(numero).padStart(2, '0') : '00'}/${ano || '0000'}` : (selectedItemData ? `NA ${selectedItemData.numeroReferencia ? String(selectedItemData.numeroReferencia).padStart(2, '0') : '00'}/${selectedItemData.anoReferencia || '0000'}` : 'NA 00/0000')}
                </div>
                <hr style={{ border: 0, borderTop: '3px solid #000', margin: '10px 0', width: '380px' }} />
                <p style={{ fontSize: '16pt', fontFamily: '"Times New Roman", Times, serif', color: '#000', marginTop: '10px' }}>Gerência de Auditoria Interna</p>

                <div style={{ backgroundColor: 'var(--ghc-primary)', color: '#fff', padding: '25px 20px', textAlign: 'center', marginTop: '60px', marginBottom: '60px', borderLeft: '10px solid #004d52' }}>
                    <div style={{ color: '#fff', fontSize: '16pt', margin: 0, border: 'none', padding: 0, textTransform: 'none' }}>{selectedItemData?.objetoAuditado || 'Objeto da Auditoria não Definido'}</div>
                </div>

                <div style={{ marginTop: 'auto', paddingBottom: '20px' }}>
                    <div style={{ backgroundColor: '#f8fafc', borderLeft: '4px solid var(--ghc-primary)', color: 'var(--ghc-primary)', padding: '6px 10px', fontWeight: 'bold', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '9pt', width: '100%' }}>
                        Dados Gerais
                    </div>
                    <div style={{ display: 'flex', justifyItems: 'space-between', fontSize: '9pt', lineHeight: 1.6 }}>
                        <div style={{ flex: 1, paddingRight: '20px' }}>
                            <table className="tabela-capa" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    <tr><td style={{ fontWeight: 'bold', width: '45%', padding: '5px 0', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>Item de Trabalho Vinculado/Ano:</td><td style={{ padding: '5px 0', color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>{selectedItemData ? `${selectedItemData.tipoItem?.nome || 'PAINT'} - ${String(selectedItemData.numeroReferencia || '').padStart(2, '0')}/${selectedItemData.anoReferencia || ''}` : '-'}</td></tr>
                                    <tr><td style={{ fontWeight: 'bold', padding: '5px 0', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>Tipo de Serviço:</td><td style={{ padding: '5px 0', color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>{selectedItemData?.tipoServico?.nome || selectedItemData?.tipoServico || '-'}</td></tr>
                                    <tr><td style={{ fontWeight: 'bold', padding: '5px 0', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>Macroprocesso:</td><td style={{ padding: '5px 0', color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>{selectedItemData?.macroprocesso?.nome || selectedItemData?.macroprocesso || '-'}</td></tr>
                                    <tr><td style={{ fontWeight: 'bold', padding: '5px 0', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>Origem da Demanda:</td><td style={{ padding: '5px 0', color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>{selectedItemData?.origem?.nome || selectedItemData?.origem || '-'}</td></tr>
                                    <tr><td style={{ fontWeight: 'bold', padding: '5px 0', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>Data Inicial:</td><td style={{ padding: '5px 0', color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>{dataInicial ? formatDataBr(dataInicial) : '-'}</td></tr>
                                    <tr><td style={{ fontWeight: 'bold', padding: '5px 0', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>Data Final:</td><td style={{ padding: '5px 0', color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>{dataFinal ? formatDataBr(dataFinal) : '-'}</td></tr>
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
                                    <tr>
                                      <td style={{ fontWeight: 'bold', padding: '5px 0', color: '#475569', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }}>Gerências Destinatárias:</td>
                                      <td style={{ padding: '5px 0', color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>{gerenciasDestinatarias && gerenciasDestinatarias.length > 0 ? gerenciasDestinatarias.map(g => g.nome || g).join(', ') : '-'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="page-footer" style={{ borderTop: 'none', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingTop: '10px' }}>
                    <img src={imgRodape} alt="GHC Rodapé" style={{ width: '50%', height: 'auto', maxHeight: '60px', objectFit: 'contain', objectPosition: 'right' }} />
                </div>
            </div>

            {/* === PÁGINA 2: SUMÁRIO === */} 
            <div className="page portrait"> 
                <h2 className="center-title">Sumário</h2> 
                <div style={{ marginTop: '30px' }}>
                  <ul className="toc-list">
                    <li className="toc-item">
                      <div className="toc-link" onClick={() => document.getElementById('preview-intro')?.scrollIntoView({ behavior: 'smooth' })}>
                        <span className="toc-title font-semibold">1. SUMÁRIO EXECUTIVO</span>
                        <span className="toc-dots"></span>
                        <span className="toc-page-num">3</span>
                      </div>
                    </li>
                    <li className="toc-item">
                      <div className="toc-link" onClick={() => document.getElementById('preview-preliminares')?.scrollIntoView({ behavior: 'smooth' })}>
                        <span className="toc-title font-semibold">2. INFORMAÇÕES PRELIMINARES</span>
                        <span className="toc-dots"></span>
                        <span className="toc-page-num">3</span>
                      </div>
                    </li>
                    {preliminares.map((p, i) => (
                      <li key={p.id || i} className="toc-item" style={{ marginLeft: 20, fontSize: '9pt' }}>
                        <div className="toc-link" onClick={() => document.getElementById(`preview-preliminar-${p.id || i}`)?.scrollIntoView({ behavior: 'smooth' })}>
                          <span className="toc-title">2.{i+1}. {p.titulo ? p.titulo.toUpperCase() : 'INFORMAÇÃO PRELIMINAR'}</span>
                          <span className="toc-dots"></span>
                          <span className="toc-page-num">3</span>
                        </div>
                      </li>
                    ))}
                    <li className="toc-item">
                      <div className="toc-link" onClick={() => document.getElementById('preview-constatacoes')?.scrollIntoView({ behavior: 'smooth' })}>
                        <span className="toc-title font-semibold">3. CONSTATAÇÕES E RECOMENDAÇÕES</span>
                        <span className="toc-dots"></span>
                        <span className="toc-page-num">3</span>
                      </div>
                    </li>
                    {constatacoes.map((c, i) => (
                      <li key={c.id || i} className="toc-item" style={{ marginLeft: 20, fontSize: '9pt' }}>
                        <div className="toc-link" onClick={() => document.getElementById(`preview-constatacao-${c.id || i}`)?.scrollIntoView({ behavior: 'smooth' })}>
                          <span className="toc-title">3.{i+1}. {c.titulo ? c.titulo.toUpperCase() : 'CONSTATAÇÃO'}</span>
                          <span className="toc-dots"></span>
                          <span className="toc-page-num">3</span>
                        </div>
                      </li>
                    ))}
                    <li className="toc-item">
                      <div className="toc-link" onClick={() => document.getElementById('preview-consideracoes')?.scrollIntoView({ behavior: 'smooth' })}>
                        <span className="toc-title font-semibold">4. CONCLUSÕES E RECOMENDAÇÕES GERAIS</span>
                        <span className="toc-dots"></span>
                        <span className="toc-page-num">4</span>
                      </div>
                    </li>
                    <li className="toc-item">
                      <div className="toc-link" onClick={() => document.getElementById('preview-comentarios')?.scrollIntoView({ behavior: 'smooth' })}>
                        <span className="toc-title font-semibold">5. COMENTÁRIOS DA GESTÃO</span>
                        <span className="toc-dots"></span>
                        <span className="toc-page-num">4</span>
                      </div>
                    </li>
                    <li className="toc-item">
                      <div className="toc-link" onClick={() => document.getElementById('preview-anexoa')?.scrollIntoView({ behavior: 'smooth' })}>
                        <span className="toc-title font-semibold">6. ANEXO A: PLANO DE AÇÃO</span>
                        <span className="toc-dots"></span>
                        <span className="toc-page-num">5</span>
                      </div>
                    </li>
                  </ul>
                </div> 
                <div className="page-footer"> 
                    <div className="footer-info">Nota de Auditoria NA {numero ? String(numero).padStart(2, '0') : '00'}/{ano || '0000'}</div> 
                    <div className="footer-page-number">Pág. 2</div> 
                </div> 
            </div>

            {/* === PÁGINA 3: CORPO DA NOTA - PARTE 1 === */} 
            <div className="page portrait"> 
                <h2 id="preview-intro">1. SUMÁRIO EXECUTIVO</h2> 
                <div className="texto-comum" dangerouslySetInnerHTML={{ __html: introducao || '<p class="text-gray-400 italic">Preencha o sumário executivo no editor...</p>' }} />
                
                <h2 id="preview-preliminares">2. INFORMAÇÕES PRELIMINARES</h2> 
                {preliminaresTextoInicial ? (
                  <div className="texto-comum" style={{ marginBottom: '20px' }} dangerouslySetInnerHTML={{ __html: preliminaresTextoInicial }} />
                ) : null}
                {preliminares.length === 0 ? (
                  <p className="italic text-gray-500 mb-6">Nenhuma informação preliminar registrada.</p>
                ) : (
                  preliminares.map((p, i) => (
                    <React.Fragment key={p.id || i}>
                      <h3 id={`preview-preliminar-${p.id || i}`}>2.{i+1}. {p.titulo ? p.titulo.toUpperCase() : 'INFORMAÇÃO PRELIMINAR'}</h3>
                      <div className="texto-comum" dangerouslySetInnerHTML={{ __html: p.content || '' }} />
                    </React.Fragment>
                  ))
                )}

                <h2 id="preview-constatacoes">3. CONSTATAÇÕES E RECOMENDAÇÕES</h2> 
                {constatacoesTextoInicial ? (
                  <div className="texto-comum" style={{ marginBottom: '20px' }} dangerouslySetInnerHTML={{ __html: constatacoesTextoInicial }} />
                ) : null}
                {constatacoes.length === 0 ? (
                  <p className="italic text-gray-500 mb-6">Nenhuma constatação registrada.</p>
                ) : (
                  constatacoes.map((c, i) => {
                    const recsPorGerencia = {};
                    c.recomendacoes?.forEach(r => {
                      const gerencia = r.gerencia || 'Sem Gerência Definida';
                      if (!recsPorGerencia[gerencia]) recsPorGerencia[gerencia] = [];
                      recsPorGerencia[gerencia].push(r);
                    });

                    return (
                      <div key={c.id || i}>
                        <h3 id={`preview-constatacao-${c.id || i}`}>3.{i+1}. {c.titulo ? c.titulo.toUpperCase() : 'CONSTATAÇÃO'}</h3>
                        <div className="texto-comum" dangerouslySetInnerHTML={{ __html: c.content || '' }} />
                        
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
                              if (r.nivelRisco === 'ALTO') bgBadge = 'bg-alto';
                              if (r.nivelRisco === 'MÉDIO') bgBadge = 'bg-medio';
                              if (r.nivelRisco === 'BAIXO') bgBadge = 'bg-baixo';

                              return (
                                <div key={r.id || ri} className="rec-item">
                                  <div dangerouslySetInnerHTML={{ __html: `<strong>REC 3.${i+1}.${ri+1}:</strong> ` + (r.content || '') }} />
                                  <div className="rec-meta">
                                      <span><strong>Nível de Risco:</strong> <span className={`badge-risco ${bgBadge}`}>{r.nivelRisco || 'N/D'}</span></span>
                                      <span><strong>Data Limite:</strong> <span>{r.dataLimite ? formatDataBr(r.dataLimite) : 'N/D'}</span></span>
                                  </div>
                                  {r.tipoBeneficio && (
                                    <div className="rec-beneficio-inline">
                                        <strong>Benefício Esperado:</strong> 
                                        <strong style={{ fontSize: '8pt', color: 'var(--ghc-primary)', textTransform: 'uppercase', marginLeft: 4 }}>Tipo:</strong> <span className="beneficio-tag">{r.tipoBeneficio}</span> 
                                        <span style={{ marginLeft: 6 }}>{r.detalheBeneficio || r.valorBeneficio || ''}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    );
                  })
                )}
                
                <div className="page-footer"> 
                    <div className="footer-info">Nota de Auditoria NA {numero ? String(numero).padStart(2, '0') : '00'}/{ano || '0000'}</div> 
                    <div className="footer-page-number">Pág. 3</div> 
                </div> 
            </div>

            {/* === PÁGINA 4: CONCLUSÕES E COMENTÁRIOS DA GESTÃO === */} 
            <div className="page portrait"> 
                <h2 id="preview-consideracoes">4. CONCLUSÕES E RECOMENDAÇÕES GERAIS</h2> 
                <div className="texto-comum" dangerouslySetInnerHTML={{ __html: consideracoes || '<p class="text-gray-400 italic">Preencha as conclusões e recomendações gerais no editor...</p>' }} />

                <h2 id="preview-comentarios">5. COMENTÁRIOS DA GESTÃO</h2> 
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 15, marginBottom: 30, fontSize: '10pt', fontFamily: '"Times New Roman", Times, serif' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px', width: '20%', color: '#334155' }}>Nº Constatação</th>
                      <th style={{ padding: '8px 12px', color: '#334155' }}>Constatação / Comentários dos Gestores</th>
                    </tr>
                  </thead>
                  <tbody>
                    {constatacoes.length > 0 ? (
                      constatacoes.map((c, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#0f172a', verticalAlign: 'top' }}>
                            3.{idx + 1}
                          </td>
                          <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{c.titulo || `Constatação ${idx + 1}`}</div>
                            <div style={{ color: '#64748b', fontStyle: 'italic', fontSize: '9pt', marginTop: '4px' }}>Aguardando manifestação e comentários da gestão responsável.</div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="2" style={{ padding: '15px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>Nenhum comentário disponível.</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* BLOCO DE ASSINATURAS DO TRABALHO */}
                <div style={{ marginTop: '50px', pageBreakInside: 'avoid', fontFamily: '"Times New Roman", Times, serif' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '11pt', marginBottom: '50px', color: '#000' }}>
                      Responsáveis por esta Nota de Auditoria:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '30px', rowGap: '40px' }}>
                        {selectedItemData?.responsavel ? (
                          renderSignature(selectedItemData.responsavel, 'Auditor(a) Responsável')
                        ) : (
                          renderSignature('Equipe de Auditoria Interna (AUDIN)', 'Auditor(a)')
                        )}
                        {selectedItemData?.supervisorTecnico && renderSignature(selectedItemData.supervisorTecnico, 'Supervisor(a) Técnico(a)')}
                    </div>
                </div>

                <div style={{ marginTop: '40px', pageBreakInside: 'avoid', fontFamily: '"Times New Roman", Times, serif' }}>
                    <p style={{ fontSize: '11pt', marginBottom: '50px', textAlign: 'justify', color: '#000' }}>
                      Tendo acompanhado a execução e supervisionado a elaboração desta Nota de Auditoria, aprovo o presente documento.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {selectedItemData?.supervisor ? (
                          renderSignature(selectedItemData.supervisor, 'Supervisor(a) da Gerência de Auditoria Interna')
                        ) : (
                          renderSignature('Gestão da AUDIN', 'Gerência de Auditoria Interna')
                        )}
                    </div>
                </div>
                
                <div className="page-footer"> 
                    <div className="footer-info">Nota de Auditoria NA {numero ? String(numero).padStart(2, '0') : '00'}/{ano || '0000'}</div> 
                    <div className="footer-page-number">Pág. 4</div> 
                </div> 
            </div>

            {/* === PÁGINA 5: ANEXO A - PLANO DE AÇÃO (PAISAGEM) === */} 
            <div className="page landscape" id="preview-anexoa"> 
                <h2 id="sec-anexo-a">6. ANEXO A: PLANO DE AÇÃO</h2> 
                
                {constatacoes.length === 0 ? <p className="italic text-gray-500">O Plano de Ação será gerado automaticamente quando houverem Constatações cadastradas.</p> : constatacoes.map((c, i) => {
                  return (
                    <div key={c.id || i} style={{ marginBottom: 40 }}>
                      <div style={{ marginTop: 5, fontSize: '10pt', fontWeight: 'bold', color: 'var(--ghc-primary)', textTransform: 'uppercase' }}>CONSTATAÇÃO 3.{i+1}{c.titulo ? ` - ${c.titulo}` : ''}</div> 
                      
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10, fontSize: '9pt' }}> 
                          <thead> 
                              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: '#475569' }}> 
                                  <th style={{ padding: '8px 4px', width: '40%' }}>Recomendação</th> 
                                  <th style={{ padding: '8px 4px', width: '15%' }}>Gerência Destinatária</th> 
                                  <th style={{ padding: '8px 4px', width: '10%' }}>Data Limite</th> 
                                  <th style={{ padding: '8px 4px', width: '10%' }}>Risco</th> 
                                  <th style={{ padding: '8px 4px', width: '15%' }}>Benefício Esperado</th> 
                                  <th style={{ padding: '8px 4px', width: '10%' }}>Status</th> 
                              </tr> 
                          </thead> 
                          <tbody>
                              {!c.recomendacoes || c.recomendacoes.length === 0 ? (
                                <tr><td colSpan="6" className="text-gray-400 italic py-4">Nenhuma recomendação associada a esta constatação.</td></tr>
                              ) : c.recomendacoes.map((r, ri) => {
                                let bgBadge = 'bg-gray-400';
                                if (r.nivelRisco === 'ALTO') bgBadge = 'bg-alto';
                                if (r.nivelRisco === 'MÉDIO') bgBadge = 'bg-medio';
                                if (r.nivelRisco === 'BAIXO') bgBadge = 'bg-baixo';

                                return (
                                  <React.Fragment key={r.id || ri}>
                                  <tr style={{ borderBottom: '1px solid #e2e8f0', verticalAlign: 'top' }}> 
                                      <td style={{ padding: '8px 4px' }}>
                                        <strong style={{ color: 'var(--ghc-primary)' }}>REC 3.{i+1}.{ri+1}:</strong>
                                        <div dangerouslySetInnerHTML={{ __html: r.content || '' }} />
                                      </td> 
                                      <td style={{ padding: '8px 4px' }}>{r.gerencia || 'Não definida'}</td> 
                                      <td style={{ padding: '8px 4px' }}>{r.dataLimite ? formatDataBr(r.dataLimite) : 'Não definida'}</td> 
                                      <td style={{ padding: '8px 4px' }}><span className={`badge-risco ${bgBadge}`}>{r.nivelRisco || 'N/D'}</span></td> 
                                      <td style={{ padding: '8px 4px' }}> 
                                          {r.tipoBeneficio ? (
                                            <div>
                                              <div><strong style={{ fontSize: '8pt', color: 'var(--ghc-primary)', textTransform: 'uppercase' }}>Tipo: </strong><span className="beneficio-tag">{r.tipoBeneficio}</span></div>
                                              {r.detalheBeneficio || r.valorBeneficio ? <div style={{ marginTop: 2 }}>{r.detalheBeneficio || r.valorBeneficio}</div> : null}
                                            </div>
                                          ) : <span className="text-gray-400 italic">Não definido</span>}
                                      </td> 
                                      <td style={{ padding: '8px 4px' }}><span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '8pt', fontWeight: 'bold', backgroundColor: '#e2e8f0', color: '#475569' }}>Não Iniciada</span></td> 
                                  </tr>
                                  {r.reportes && r.reportes.length > 0 && (
                                    <tr>
                                      <td colSpan="6" style={{ padding: 0, backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', width: '100%', minHeight: '60px' }}>
                                          <div style={{ flex: 1, padding: '12px 15px', borderRight: '1px solid #e2e8f0', backgroundColor: '#fffbeb' }}>
                                            <strong style={{ fontSize: '8pt', color: '#b45309', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Manifestação da Área Auditada</strong>
                                            {r.reportes.filter(rep => rep.tipo === 'auditada').map(rep => (
                                              <div key={rep.id} style={{ marginBottom: '12px', fontSize: '9pt', border: '1px solid #fcd34d', padding: '10px', borderRadius: '6px', backgroundColor: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                                                <div style={{ fontSize: '7.5pt', color: '#92400e', marginBottom: '6px', paddingBottom: '4px', borderBottom: '1px dashed #fde68a', fontWeight: 'bold' }}>
                                                  {rep.dataHora ? new Date(rep.dataHora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : ''} {rep.responsavel ? `  Responsável: ${rep.responsavel}` : ''}
                                                </div>
                                                <div dangerouslySetInnerHTML={{ __html: rep.content }} />
                                              </div>
                                            ))}
                                            {r.reportes.filter(rep => rep.tipo === 'auditada').length === 0 && <span style={{ fontSize: '8.5pt', color: '#b45309', fontStyle: 'italic', opacity: 0.7 }}>Nenhuma manifestação.</span>}
                                          </div>
                                          <div style={{ flex: 1, padding: '12px 15px', backgroundColor: '#eef2ff' }}>
                                            <strong style={{ fontSize: '8pt', color: '#4338ca', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Posicionamento da Auditoria</strong>
                                            {r.reportes.filter(rep => rep.tipo === 'auditoria').map(rep => (
                                              <div key={rep.id} style={{ marginBottom: '12px', fontSize: '9pt', border: '1px solid #c7d2fe', padding: '10px', borderRadius: '6px', backgroundColor: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                                                <div style={{ fontSize: '7.5pt', color: '#3730a3', marginBottom: '6px', paddingBottom: '4px', borderBottom: '1px dashed #e0e7ff', fontWeight: 'bold' }}>
                                                  {rep.dataHora ? new Date(rep.dataHora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : ''} {rep.responsavel ? `  Responsável: ${rep.responsavel}` : ''}
                                                </div>
                                                <div dangerouslySetInnerHTML={{ __html: rep.content }} />
                                              </div>
                                            ))}
                                            {r.reportes.filter(rep => rep.tipo === 'auditoria').length === 0 && <span style={{ fontSize: '8.5pt', color: '#4338ca', fontStyle: 'italic', opacity: 0.7 }}>Nenhum posicionamento.</span>}
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                                );
                              })}
                          </tbody> 
                      </table>
                    </div>
                  );
                })}

                <div className="page-footer"> 
                    <div className="footer-info">Nota de Auditoria NA {numero ? String(numero).padStart(2, '0') : '00'}/{ano || '0000'}</div> 
                    <div className="footer-page-number">Pág. 5</div> 
                </div> 
            </div>

          </div>
        </div>

      </div>

      {/* =========================================
          MODAL DE RECOMENDAÇÃO
      ========================================= */}
      {isRecModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#00767d] text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">
                {editingRecIndex !== null ? 'Editar Recomendação' : 'Nova Recomendação'}
              </h3>
              <button 
                onClick={() => setIsRecModalOpen(false)}
                className="text-white/80 hover:text-white font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Conteúdo da Recomendação *</label>
                <RichTextEditor 
                  title=""
                  subtitle="Detalhe a ação recomendada."
                  initialContent={recForm.content}
                  onChange={(val) => setRecForm({ ...recForm, content: val })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Prazo / Data Limite</label>
                  <input
                    type="date"
                    value={recForm.dataLimite}
                    onChange={(e) => setRecForm({ ...recForm, dataLimite: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nível de Risco</label>
                  <select
                    value={recForm.nivelRisco}
                    onChange={(e) => setRecForm({ ...recForm, nivelRisco: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white"
                  >
                    <option value="BAIXO">BAIXO</option>
                    <option value="MÉDIO">MÉDIO</option>
                    <option value="ALTO">ALTO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Gestor / Gerência</label>
                  <input
                    type="text"
                    value={recForm.gerencia}
                    onChange={(e) => setRecForm({ ...recForm, gerencia: e.target.value })}
                    placeholder="Ex: Gerência Administrativa"
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Benefício</label>
                  <select
                    value={recForm.tipoBeneficio}
                    onChange={(e) => setRecForm({ ...recForm, tipoBeneficio: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white"
                  >
                    <option value="Gesto">Gestão</option>
                    <option value="Financeiro">Financeiro</option>
                    <option value="Conformidade">Conformidade</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Valor do Benefício (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={recForm.valorBeneficio}
                    onChange={(e) => setRecForm({ ...recForm, valorBeneficio: e.target.value })}
                    placeholder="0.00"
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsRecModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveRecomendacaoModal}
                className="px-5 py-2 text-sm font-medium text-white bg-[#00767d] rounded-lg hover:bg-[#005f64] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
               disabled={isReadOnly}>
                Salvar Recomendação
              </button>
            </div>
          </div>
        </div>
      )}

      <DocumentPdfViewerModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        docTitle={`Nota de Auditoria nº ${numero ? String(numero).padStart(2, '0') : '00'}/${ano}`}
      />
    </div>
  );
}
