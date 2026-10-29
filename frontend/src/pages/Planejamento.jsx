import React, { useState, useEffect, useCallback } from 'react';
import DuplicateNumberModal from '../components/DuplicateNumberModal';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import debounce from 'lodash.debounce';
import { 
  getPlanejamentoById, 
  getPlanejamentoByItemTrabalho, 
  createPlanejamento, 
  updatePlanejamento 
} from '../api/planejamentoApi';
import { getItemTrabalhoById } from '../api/itemTrabalhoApi';
import { getAllGerencias } from '../api/gerenciaApi';
import { getAllGeneric } from '../api/genericApi';
import api from '../api/axiosInstance';
import imgCabecalho from '../img/ghc_cabecalho.png';
import imgRodape from '../img/ghc_rodape.png';
import DocumentPdfViewerModal from '../components/DocumentPdfViewerModal';
import Status from '../components/Status';
import RichTextEditor from '../components/RichTextEditor';
import FileAttachmentManager from '../components/FileAttachmentManager';
import SearchableSelect from '../components/SearchableSelect';
import { openPdfInNativeViewer } from '../utils/pdfUtils';
import { 
  Save, ArrowLeft, Printer, Eye, Plus, Trash2, Edit, 
  FileText, Calendar, CheckCircle, AlertCircle, ChevronDown, 
  ChevronUp, Info, PanelLeft, PanelRight, Columns, Loader2, Download, GripVertical, Lock,
  Edit3, Clock, CheckCircle2, X
} from 'lucide-react';

export default function Planejamento() {

  const [showDuplicateModal, setShowDuplicateModal] = useState({ isOpen: false });

  const acceptSuggestion = (newNumero, newAno) => {
    setNumero(newNumero);
    setAno(newAno);
    setShowDuplicateModal({ isOpen: false });
  };

  const validateNumero = async (numeroToCheck, anoToCheck, currentId, itemId) => {
      if (!numeroToCheck || !anoToCheck) return true;
      try {
          const valRes = await api.get(`/documentos/check-number?entityName=Planejamento&ano=${anoToCheck}&numero=${numeroToCheck}&itemTrabalhoId=${itemId || ''}&currentEntityId=${currentId || ''}`);
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
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const rawItemTrabalhoId = searchParams.get('itemTrabalhoId');
  const itemTrabalhoIdParam = rawItemTrabalhoId ? String(rawItemTrabalhoId).split(':')[0] : null;
  const initialViewMode = searchParams.get('view') === 'true';
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [itemTrabalho, setItemTrabalho] = useState(null);

  // Modo de Layout: 'editor' | 'split' | 'preview' (mesmos moldes do RelatorioPreliminar)
  const [layoutMode, setLayoutMode] = useState(initialViewMode ? 'preview' : 'editor');

  // Controle de auto-save: 'salvo' | 'pendente' | 'salvando' | 'erro'
  const [autoSaveStatus, setAutoSaveStatus] = useState('salvo');
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [draggedQuestaoIdx, setDraggedQuestaoIdx] = useState(null);

  // Sanfonas das seções gerais
  const [openSections, setOpenSections] = useState({
    dadosIniciais: true,
    objetoAuditado: true,
    gerenciasAuditadas: true,
    trabalhosAnteriores: true,
    amostra: true,
    orcamento: true,
    cronograma: true,
    questoes: true
  });

  // Controle de sanfonas das questões individuais
  const [openQuestions, setOpenQuestions] = useState({});

  // Anexos dos Componentes RichTextEditor
  const [anexos, setAnexos] = useState([]);
  const [globalCollapseAction, setGlobalCollapseAction] = useState(null);
  const [gerenciasDb, setGerenciasDb] = useState([]);
  const [tecnicasDb, setTecnicasDb] = useState([]);
  const [riscosDb, setRiscosDb] = useState([]);

  useEffect(() => {
    const fetchCombos = async () => {
      const extractList = (response) => {
        if (!response) return [];
        const resData = response.data || response;
        const list = resData?.data?.content || resData?.content || (resData?._embedded ? Object.values(resData._embedded)[0] : resData?.data) || resData || [];
        return Array.isArray(list) ? list : [];
      };

      const mapToString = (item) => {
        if (!item) return null;
        if (typeof item === 'string') return item;
        return item.nome || item.titulo || item.descricao || item.id || JSON.stringify(item);
      };

      try {
        const gerResponse = await getAllGerencias(0, 1000);
        setGerenciasDb(extractList(gerResponse));
      } catch (error) {
        console.error('Erro ao buscar gerencias:', error);
      }

      try {
        const tecResponse = await getAllGeneric('tecnica-de-auditoria', 0, 1000);
        setTecnicasDb(extractList(tecResponse).map(mapToString).filter(Boolean));
      } catch (error) {
        console.error('Erro ao buscar tecnicas:', error);
      }

      try {
        const risResponse = await getAllGeneric('tipo-de-risco', 0, 1000);
        setRiscosDb(extractList(risResponse).map(mapToString).filter(Boolean));
      } catch (error) {
        console.error('Erro ao buscar riscos:', error);
      }
    };
    fetchCombos();
  }, []);

  const fetchAnexos = async (itemId) => {
    if (!itemId) return;
    try {
      const res = await api.get(`/anexos/item/${itemId}?documento=Planejamento`);
      if (res && res.data) {
        setAnexos(res.data);
      }
    } catch (e) {
      console.error('Erro ao buscar anexos', e);
    }
  };

  const handleUploadAnexo = async (file, secao) => {
    const targetId = formData.itemTrabalho?.id || formData.itemTrabalhoId || itemTrabalho?.id || itemTrabalhoIdParam || (id && id !== 'novo' ? id : null);
    if (!targetId) {
      toast.warn('É necessário ter um Item de Trabalho ou Planejamento selecionado para adicionar anexos.');
      return;
    }
    const uploadForm = new FormData();
    uploadForm.append('file', file);
    uploadForm.append('itemTrabalhoId', targetId);
    uploadForm.append('documento', 'Planejamento');
    uploadForm.append('secao', secao);
    uploadForm.append('responsavel', 'Auditor(a)');

    try {
      const res = await api.post('/anexos/upload', uploadForm, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res && res.data) {
        const novoAnexo = res.data;
        setAnexos(prev => [...prev, novoAnexo]);
        toast.success('Anexo adicionado com sucesso!');
      } else {
        toast.error('Falha ao enviar anexo');
      }
    } catch (e) {
      console.error('Erro no upload', e);
      toast.error('Erro ao conectar ao servidor para envio de anexo');
    }
  };

  const handleDeleteAnexo = async (anexoId) => {
    if (window.confirm('Tem certeza que deseja excluir este anexo?')) {
      try {
        await api.delete(`/anexos/${anexoId}`);
        setAnexos(prev => prev.filter(a => a.id !== anexoId));
        toast.success('Anexo excluído com sucesso!');
      } catch (e) {
        console.error('Erro ao deletar anexo', e);
        toast.error('Erro ao excluir anexo');
      }
    }
  };

  const getAnexosBySecao = (secao) => anexos.filter(a => a.secao === secao);

  const [formData, setFormData] = useState({
    id: null,
    itemTrabalho: null,
    ano: new Date().getFullYear(),
    numero: null,
    status: 'Minuta',
    dataEmissao: new Date().toISOString().split('T')[0],
    tipoAuditoria: 'Avaliação',
    escopo: '',
    descricaoObjetoAuditado: '',
    principaisRiscos: '',
    medidasControle: '',
    materialidadeRecursos: '',
    pontosCriticosControle: '',
    indicadoresDesempenho: '',
    responsaveisObjeto: '',
    sistemasInformatizados: '',
    descricaoGerenciasAuditadas: '',
    trabalhosAnterioresAuditoriaInterna: '',
    trabalhosAnterioresTcu: '',
    trabalhosAnterioresCgu: '',
    dataInicialAmostra: '',
    dataFinalAmostra: '',
    criterioUniversoAmostral: '',
    universo: '',
    amostra: '',
    porcentagemRepresentatividade: '',
    orcamentoEstimado: '',
    dataInicialPlanejamento: '',
    dataFinalPlanejamento: '',
    dataInicialExecucao: '',
    dataFinalExecucao: '',
    dataInicialRelatorio: '',
    dataFinalRelatorio: '',
    gerenciasDestinatarias: [],
    questoes: []
  });

  useEffect(() => {
    loadData();
  }, [id, itemTrabalhoIdParam]);

  useEffect(() => {
    const targetId = formData.itemTrabalho?.id || formData.itemTrabalhoId || itemTrabalho?.id || itemTrabalhoIdParam || (id && id !== 'novo' ? id : null);
    if (targetId) {
      fetchAnexos(targetId);
    }
  }, [formData.itemTrabalho?.id, formData.itemTrabalhoId, itemTrabalho?.id, itemTrabalhoIdParam, id]);

  // O item que vem dentro do planejamento chega sem a equipe (o backend a omite nos documentos).
  // Busca o item pela rota própria para ter equipe, responsável e horas completos.
  const carregarItemCompleto = async (itemId) => {
    if (!itemId) return;
    try {
      const resIt = await getItemTrabalhoById(itemId);
      const it = resIt?.data?.data || resIt?.data || resIt;
      if (it && it.id) setItemTrabalho(it);
    } catch (e) {
      console.warn('Não foi possível carregar o item de trabalho completo', e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setIsInitialLoad(true);
    try {
      if (id && id !== 'novo') {
        const plan = await getPlanejamentoById(id);
        if (plan) {
          const questList = plan.questoes || [];
          setFormData(prev => ({
            ...prev,
            ...plan,
            questoes: questList
          }));
          const qOpens = {};
          questList.forEach((_, idx) => { qOpens[idx] = true; });
          setOpenQuestions(qOpens);

          if (plan.itemTrabalho) {
            setItemTrabalho(plan.itemTrabalho);
            await carregarItemCompleto(plan.itemTrabalho.id);
          }
        }
      } else if (itemTrabalhoIdParam) {
        try {
          const listPlan = await getPlanejamentoByItemTrabalho(itemTrabalhoIdParam);
          if (Array.isArray(listPlan) && listPlan.length > 0) {
            const plan = listPlan[0];
            const questList = plan.questoes || [];
            setFormData(prev => ({
              ...prev,
              ...plan,
              questoes: questList
            }));
            const qOpens = {};
            questList.forEach((_, idx) => { qOpens[idx] = true; });
            setOpenQuestions(qOpens);

            if (plan.itemTrabalho) {
              setItemTrabalho(plan.itemTrabalho);
              await carregarItemCompleto(plan.itemTrabalho.id);
            }
            setLoading(false);
            setIsInitialLoad(false);
            return;
          }
        } catch (e) {
          console.warn("Sem planejamento existente para este item", e);
        }

        const resIt = await getItemTrabalhoById(itemTrabalhoIdParam);
        const it = resIt?.data?.data || resIt?.data || resIt;
        if (it) {
          setItemTrabalho(it);
          setFormData(prev => ({
            ...prev,
            itemTrabalho: it,
            tipoAuditoria: it.tipoItem?.nome || it.tipoItem?.descricao || 'Avaliação'
          }));
        }
      }
    } catch (error) {
      toast.error('Erro ao carregar dados do Planejamento.');
      console.error(error);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setIsInitialLoad(false);
      }, 500);
    }
  };

  const sanitizePayload = (data) => {
    const targetItemId = data.itemTrabalho?.id || itemTrabalho?.id || itemTrabalhoIdParam || null;
    
    // Função auxiliar para converter string vazia de data para null
    const parseDateOrNull = (val) => (val === '' ? null : val);

    return {
      ...data,
      dataEmissao: parseDateOrNull(data.dataEmissao),
      dataInicialAmostra: parseDateOrNull(data.dataInicialAmostra),
      dataFinalAmostra: parseDateOrNull(data.dataFinalAmostra),
      dataInicialPlanejamento: parseDateOrNull(data.dataInicialPlanejamento),
      dataFinalPlanejamento: parseDateOrNull(data.dataFinalPlanejamento),
      dataInicialExecucao: parseDateOrNull(data.dataInicialExecucao),
      dataFinalExecucao: parseDateOrNull(data.dataFinalExecucao),
      dataInicialRelatorio: parseDateOrNull(data.dataInicialRelatorio),
      dataFinalRelatorio: parseDateOrNull(data.dataFinalRelatorio),
      dataInicial: parseDateOrNull(data.dataInicial),
      dataFinal: parseDateOrNull(data.dataFinal),
      itemTrabalho: targetItemId ? { id: Number(targetItemId) } : null,
      itemTrabalhoId: targetItemId ? Number(targetItemId) : null,
      questoes: (data.questoes || []).map(q => ({
        ...q,
        tecnicas: Array.isArray(q.tecnicas) ? q.tecnicas.join(', ') : (q.tecnicas || ''),
        riscos: Array.isArray(q.riscos) ? q.riscos.join(', ') : (q.riscos || '')
      }))
    };
  };

  // Após salvar, completa só o que o formulário ainda não tem (id, dataCriacao, ids das questões novas).
  // Não sobrescreve o conteúdo com a resposta: o que foi digitado durante a requisição continua valendo,
  // e "questoes" só muda de referência quando recebe ids (evita disparar outro auto-save em seguida).
  const mesclarRespostaSalvamento = (prev, saved) => {
    const merged = { ...prev, id: saved.id };
    Object.keys(saved).forEach(k => {
      if (k !== 'questoes' && (merged[k] === undefined || merged[k] === null)) merged[k] = saved[k];
    });
    const atuais = prev.questoes || [];
    const salvas = saved.questoes || [];
    if (atuais.some((q, i) => !q.id && salvas[i]?.id)) {
      merged.questoes = atuais.map((q, i) => (!q.id && salvas[i]?.id ? { ...q, id: salvas[i].id } : q));
    }
    return merged;
  };

  // Auto-Save de 3 segundos (lodash.debounce)
  const debouncedSave = useCallback(
    debounce(async (dataToSave, targetItemIdParam) => {
      try {
        setAutoSaveStatus('salvando');
        const payload = sanitizePayload(dataToSave);
        let saved;
        if (dataToSave.id) {
          saved = await updatePlanejamento(dataToSave.id, payload);
        } else {
          saved = await createPlanejamento(payload);
          if (saved && saved.id) {
            const tgtId = dataToSave.itemTrabalho?.id || targetItemIdParam || '';
            navigate(`/planejamento/${saved.id}${tgtId ? `?itemTrabalhoId=${tgtId}` : ''}`, { replace: true });
          }
        }
        const now = new Date();
        const timeStr = now.toLocaleTimeString('pt-BR');
        setLastSavedTime(timeStr);
        setAutoSaveStatus('salvo');
        if (saved && saved.id) {
          setFormData(prev => mesclarRespostaSalvamento(prev, saved));
        }
      } catch (error) {
        console.error('Erro ao salvar planejamento automaticamente:', error);
        setAutoSaveStatus('erro');
      }
    }, 3000),
    []
  );

  useEffect(() => {
    if (!loading && !isInitialLoad && layoutMode !== 'preview') {
      setAutoSaveStatus('pendente');
      debouncedSave(formData, itemTrabalhoIdParam);
    }
  }, [
    formData.escopo,
    formData.descricaoObjetoAuditado,
    formData.principaisRiscos,
    formData.medidasControle,
    formData.materialidadeRecursos,
    formData.pontosCriticosControle,
    formData.indicadoresDesempenho,
    formData.responsaveisObjeto,
    formData.sistemasInformatizados,
    formData.descricaoGerenciasAuditadas,
    formData.trabalhosAnterioresAuditoriaInterna,
    formData.trabalhosAnterioresTcu,
    formData.trabalhosAnterioresCgu,
    formData.dataInicialAmostra,
    formData.dataFinalAmostra,
    formData.criterioUniversoAmostral,
    formData.universo,
    formData.amostra,
    formData.porcentagemRepresentatividade,
    formData.orcamentoEstimado,
    formData.dataInicialPlanejamento,
    formData.dataFinalPlanejamento,
    formData.dataInicialExecucao,
    formData.dataFinalExecucao,
    formData.dataInicialRelatorio,
    formData.dataFinalRelatorio,
    formData.questoes,
    formData.gerenciasDestinatarias,
    formData.status,
    formData.tipoAuditoria,
    formData.dataEmissao,
    formData.ano,
    formData.numero
  ]);

  const handleChange = (field, value) => {
    const nextFormData = { ...formData, [field]: value };
    setFormData(nextFormData);
  };

  // Gerenciamento de Questões na mesma página
  const handleAddQuestao = () => {
    const novaQuestao = {
      gerenciaDestinataria: itemTrabalho?.gerencias?.[0] || 'Gerência de Auditoria Interna - GAI',
      conteudo: '',
      criterios: '',
      tecnicas: [],
      riscos: [],
      fato: ''
    };
    const novasQuestoes = [...(formData.questoes || []), novaQuestao];
    const nextFormData = { ...formData, questoes: novasQuestoes };
    setFormData(nextFormData);
    setOpenQuestions(prev => ({ ...prev, [novasQuestoes.length - 1]: true }));
    if (!isInitialLoad && layoutMode !== 'preview') {
      setAutoSaveStatus('pendente');
      debouncedSave(nextFormData);
    }
  };

  const handleRemoveQuestao = (index) => {
    const novasQuestoes = (formData.questoes || []).filter((_, i) => i !== index);
    const nextFormData = { ...formData, questoes: novasQuestoes };
    setFormData(nextFormData);
    if (!isInitialLoad && layoutMode !== 'preview') {
      setAutoSaveStatus('pendente');
      debouncedSave(nextFormData);
    }
  };

  const handleDragStartQuestao = (e, index) => {
    setDraggedQuestaoIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverQuestao = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropQuestao = (e, targetIdx) => {
    e.preventDefault();
    if (draggedQuestaoIdx === null || draggedQuestaoIdx === targetIdx) return;
    const atualizadas = [...(formData.questoes || [])];
    const [moved] = atualizadas.splice(draggedQuestaoIdx, 1);
    atualizadas.splice(targetIdx, 0, moved);
    const nextFormData = { ...formData, questoes: atualizadas };
    setFormData(nextFormData);
    setDraggedQuestaoIdx(null);
    if (!isInitialLoad && layoutMode !== 'preview') {
      setAutoSaveStatus('pendente');
      debouncedSave(nextFormData);
    }
  };

  const handleQuestaoChange = (index, field, value) => {
    const novasQuestoes = [...(formData.questoes || [])];
    const atual = { ...novasQuestoes[index] };
    atual[field] = value;
    // Replica nomes para compatibilidade com o modelo
    if (field === 'conteudo') atual.questao = value;
    if (field === 'gerenciaDestinataria') atual.gerencia = value;
    if (field === 'criterios') atual.criterio = value;
    if (field === 'tecnicas') atual.tecnicas = Array.isArray(value) ? value.join(', ') : (value || '');
    if (field === 'riscos') atual.riscos = Array.isArray(value) ? value.join(', ') : (value || '');

    novasQuestoes[index] = atual;
    const nextFormData = { ...formData, questoes: novasQuestoes };
    setFormData(nextFormData);
    if (!isInitialLoad && layoutMode !== 'preview') {
      setAutoSaveStatus('pendente');
      debouncedSave(nextFormData);
    }
  };

  const handleCheckboxQuestaoChange = (index, field, item) => {
    const atualObj = formData.questoes[index] || {};
    let atualLista = [];
    const rawVal = atualObj[field];
    if (Array.isArray(rawVal)) {
      atualLista = [...rawVal];
    } else if (typeof rawVal === 'string' && rawVal.trim() !== '') {
      atualLista = rawVal.split(',').map(s => s.trim());
    }

    const pos = atualLista.indexOf(item);
    if (pos > -1) {
      atualLista.splice(pos, 1);
    } else {
      atualLista.push(item);
    }
    handleQuestaoChange(index, field, atualLista.join(', '));
  };

  const isCheckboxChecked = (index, field, item) => {
    const atualObj = formData.questoes[index] || {};
    const rawVal = atualObj[field];
    if (Array.isArray(rawVal)) return rawVal.includes(item);
    if (typeof rawVal === 'string' && rawVal.trim() !== '') {
      return rawVal.split(',').map(s => s.trim()).includes(item);
    }
    return false;
  };

  const getQuestaoArrayField = (q, field) => {
    if (!q) return [];
    const val = q[field];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string' && val.trim() !== '') {
      return val.split(',').map(s => s.trim());
    }
    return [];
  };

  const handleAddQuestaoItem = (qIndex, field, item) => {
    if (!item) return;
    const list = getQuestaoArrayField(formData.questoes[qIndex] || {}, field);
    if (!list.includes(item)) {
      const newList = [...list, item];
      handleQuestaoChange(qIndex, field, newList.join(', '));
    }
  };

  const handleRemoveQuestaoItem = (qIndex, field, item) => {
    const list = getQuestaoArrayField(formData.questoes[qIndex] || {}, field);
    const newList = list.filter(i => i !== item);
    handleQuestaoChange(qIndex, field, newList.join(', '));
  };

  const handleToggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExpandAll = () => {
    setOpenSections({
      dadosIniciais: true,
      objetoAuditado: true,
      gerenciasAuditadas: true,
      trabalhosAnteriores: true,
      amostra: true,
      orcamento: true,
      cronograma: true,
      questoes: true
    });
    const allQ = {};
    (formData.questoes || []).forEach((_, idx) => { allQ[idx] = true; });
    setOpenQuestions(allQ);
    setGlobalCollapseAction({ action: 'expand', ts: Date.now() });
  };

  const handleCollapseAll = () => {
    setOpenSections({
      dadosIniciais: false,
      objetoAuditado: false,
      gerenciasAuditadas: false,
      trabalhosAnteriores: false,
      amostra: false,
      orcamento: false,
      cronograma: false,
      questoes: false
    });
    setOpenQuestions({});
    setGlobalCollapseAction({ action: 'collapse', ts: Date.now() });
  };

  const handleSaveManual = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setAutoSaveStatus('salvando');
    try {
      const payload = sanitizePayload(formData);
      let saved;
      if (formData.id) {
        saved = await updatePlanejamento(formData.id, payload);
        toast.success('Planejamento salvo com sucesso!');
      } else {
        saved = await createPlanejamento(payload);
        toast.success('Planejamento criado com sucesso!');
      }
      const now = new Date();
      setLastSavedTime(now.toLocaleTimeString('pt-BR'));
      setAutoSaveStatus('salvo');
      if (saved && saved.id) {
        setFormData(prev => mesclarRespostaSalvamento(prev, saved));
        if (!formData.id) {
          const tgtId = formData.itemTrabalho?.id || itemTrabalhoIdParam || '';
          navigate(`/planejamento/${saved.id}${tgtId ? `?itemTrabalhoId=${tgtId}` : ''}`, { replace: true });
        }
      }
    } catch (error) {
      toast.error('Erro ao salvar Planejamento.');
      setAutoSaveStatus('erro');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

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
          <meta charset="utf-8">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
             blockquote { border-left: 4px solid #cbd5e1 !important; padding: 12px 16px !important; color: #475569 !important; font-style: italic !important; margin: 16px 0 !important; background-color: #f8fafc !important; border-radius: 4px !important; display: block !important; }
             blockquote * { color: #475569 !important; font-style: italic !important; font-family: 'Calibri', sans-serif !important; }

            :root { --ghc-primary: #00767d; --ghc-secondary: #84c9bd; --paper-color: #ffffff; --text-color: #2d3748; }
            body { font-family: 'Inter', sans-serif; color: var(--text-color); line-height: 1.6; }
          
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

               @page { margin: 15mm 0; }
               @page landscape_page { margin: 15mm 0; }
               .landscape-page { page: landscape_page; page-break-before: always; }
               .texto-comum p, .editor-content p { text-indent: 1.25cm; }
</style>
        </head>
        <body>
          ${clone.outerHTML}
        </body>
        </html>
      `;

      const docNameStr = `Planejamento nº ${formData.numero ? String(formData.numero).padStart(2, '0') : '02'}/${formData.ano || new Date().getFullYear()}`;
      
      const response = await api.post('/pdf/gerar-sem-sumario', { 
        html: htmlContent, docName: docNameStr, docVersion: 'Versão preliminar' 
      }, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${docNameStr.replace(/\\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar o PDF no servidor.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const formatDataBr = (val) => {
    if (!val) return '';
    const parts = val.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return val;
  };

  const getSupervisorNome = () => {
    if (itemTrabalho?.supervisor?.nome) return itemTrabalho.supervisor.nome;
    if (itemTrabalho?.supervisorTecnico?.nome) return itemTrabalho.supervisorTecnico.nome;
    return 'Não informado';
  };

  const getResponsavelNome = () => {
    if (itemTrabalho?.responsável?.nome) return itemTrabalho.responsável.nome;
    if (itemTrabalho?.responsavel?.nome) return itemTrabalho.responsavel.nome;
    return 'Não informado';
  };

  const getEquipeNomes = () => {
    if (Array.isArray(itemTrabalho?.equipe) && itemTrabalho.equipe.length > 0) {
      return itemTrabalho.equipe.map(p => p.nome).join(', ');
    }
    return 'Não informado';
  };

  const getPaintRef = () => {
    if (!itemTrabalho) return 'PAINT 2026';
    const sigla = itemTrabalho.sigla || 'PAINT';
    const ano = itemTrabalho.anoReferencia || formData.ano || '';
    const num = itemTrabalho.numeroReferencia || '';
    return `${sigla} ${ano}/${num}`.trim();
  };

  const parseLista = (val) => {
    if (!val) return '';
    if (Array.isArray(val)) return val.join(', ');
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed.join(', ');
      } catch (e) {
        return val;
      }
    }
    return String(val);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Carregando documento de Planejamento...</p>
      </div>
    );
  }

  // ==========================================
  // COMPONENTE: PREVIEW A4 DO PLANEJAMENTO
  // ==========================================
  const renderA4Preview = () => (
    <div id="document-preview-container" className="space-y-8 my-4">
      {/* PÁGINA 1: DOCUMENTO RETRATO (A4 Portrait) */}
      <div className="preview-container w-full bg-white p-8 md:p-12 print:p-0 text-gray-900 font-sans">
      {/* CABEÇALHO COM LOGO GHC */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <img src={imgCabecalho} alt="GHC Cabeçalho" style={{ maxWidth: '100%', height: 'auto', maxHeight: '100px' }} />
        </div>

        {/* TÍTULO PRINCIPAL */}
        <div className="text-center my-6">
          <h1 className="text-2xl font-bold text-[#14532d] tracking-wide m-0">
            Planejamento nº {formData.numero || '02'}/{formData.ano || new Date().getFullYear()}
          </h1>
        </div>

        {/* LINHA VERDE E DADOS DE EMISSÃO */}
        <hr className="border-0 border-t-2 border-[#14532d] my-3" />
        <div className="flex justify-between items-center text-sm mb-8 font-sans">
          <div>
            <span className="font-bold text-gray-700">Data de Emissão: </span>
            <span className="text-gray-900">{formatDataBr(formData.dataEmissao)}</span>
          </div>
          <div className="font-bold text-[#14532d]">
            Gerência de Auditoria Interna
          </div>
        </div>
      </div>

      {/* I. DESTINATÁRIO(S) - RESPONSÁVEIS PELO TRABALHO */}
      <div className="mb-6">
        <div className="bg-[#1a472a] text-white font-bold p-1 px-2 text-sm mb-3 uppercase">
          I. DESTINATÁRIO(S) - RESPONSÁVEIS PELO TRABALHO
        </div>
        <div className="grid grid-cols-[160px_1fr] gap-y-2 text-sm">
          <span className="font-bold text-gray-800">Supervisor</span>
          <span>{getSupervisorNome()}</span>

          <span className="font-bold text-gray-800">Responsável</span>
          <span>{getResponsavelNome()}</span>

          <span className="font-bold text-gray-800">Equipe de Auditoria</span>
          <span>{getEquipeNomes()}</span>
        </div>
      </div>

      {/* II. DADOS GERAIS */}
      <div className="mb-6">
        <div className="bg-[#1a472a] text-white font-bold p-1 px-2 text-sm mb-3 uppercase">
          II. DADOS GERAIS
        </div>
        <div className="grid grid-cols-[160px_1fr] gap-y-2 text-sm">
          <span className="font-bold text-gray-800">Item de Trabalho</span>
          <span>{getPaintRef()}</span>

          <span className="font-bold text-gray-800">Tipo de Serviço</span>
          <span>{formData.tipoAuditoria || 'Avaliação'}</span>

          <span className="font-bold text-gray-800">Origem da Demanda</span>
          <span>{itemTrabalho?.origemDemanda || 'Obrigação Legal'}</span>

          <span className="font-bold text-gray-800">Macroprocesso</span>
          <span>{itemTrabalho?.macroprocesso?.nome || 'Planejamento e Gestão'}</span>

          <span className="font-bold text-gray-800">Nível de Risco</span>
          <span>{itemTrabalho?.riscoItem || 'Médio'}</span>

          <span className="font-bold text-gray-800">Horas de Trabalho</span>
          <span>{itemTrabalho?.horasPrevistas ?? 'Não informado'}</span>

          <span className="font-bold text-gray-800">Objeto Auditado</span>
          <span>{itemTrabalho?.objetoAuditado || '-'}</span>

          <span className="font-bold text-gray-800">Objetivo da Auditoria</span>
          <span>{itemTrabalho?.objetivoAuditoria || 'Análise e emissão de Parecer'}</span>
        </div>
      </div>

      {/* III. CRONOGRAMA PROPOSTO */}
      <div className="mb-6">
        <div className="bg-[#1a472a] text-white font-bold p-1 px-2 text-sm mb-3 uppercase">
          III. CRONOGRAMA PROPOSTO
        </div>
        <div className="grid grid-cols-[160px_1fr] gap-y-2 text-sm">
          <span className="font-bold text-gray-800">Planejamento</span>
          <span>
            {formatDataBr(formData.dataInicialPlanejamento)} a {formatDataBr(formData.dataFinalPlanejamento)}
          </span>

          <span className="font-bold text-gray-800">Execução</span>
          <span>
            {formatDataBr(formData.dataInicialExecucao)} a {formatDataBr(formData.dataFinalExecucao)}
          </span>

          <span className="font-bold text-gray-800">Relatório</span>
          <span>
            {formatDataBr(formData.dataInicialRelatorio)} a {formatDataBr(formData.dataFinalRelatorio)}
          </span>
        </div>
      </div>

      {/* IV. ASPECTOS GERAIS DAS ÁREAS AUDITADAS */}
      <div className="mb-6">
        <div className="bg-[#1a472a] text-white font-bold p-1 px-2 text-sm mb-3 uppercase">
          IV. ASPECTOS GERAIS DAS ÁREAS AUDITADAS
        </div>
        <div className="text-sm">
          <div className="font-bold text-gray-800 mb-1">Descrição</div>
          <div 
            className="text-gray-700 leading-relaxed" 
            dangerouslySetInnerHTML={{ __html: formData.descricaoGerenciasAuditadas || 'Nenhuma descrição informada.' }} 
          />
        </div>
      </div>

      {/* V. ASPECTOS GERAIS DO OBJETO AUDITADO */}
      <div className="mb-6">
        <div className="bg-[#1a472a] text-white font-bold p-1 px-2 text-sm mb-3 uppercase">
          V. ASPECTOS GERAIS DO OBJETO AUDITADO
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <div className="font-bold text-gray-800">Escopo do Planejamento</div>
            <div className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: formData.escopo || '-' }} />
          </div>
          <div>
            <div className="font-bold text-gray-800">Descrição do Objeto Auditado</div>
            <div className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: formData.descricaoObjetoAuditado || '-' }} />
          </div>
          <div>
            <div className="font-bold text-gray-800">Principais Riscos</div>
            <div className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: formData.principaisRiscos || '-' }} />
          </div>
          <div>
            <div className="font-bold text-gray-800">Medidas de Controle existentes</div>
            <div className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: formData.medidasControle || '-' }} />
          </div>
          <div>
            <div className="font-bold text-gray-800">Materialidade dos Recursos (em R$)</div>
            <div className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: formData.materialidadeRecursos || '-' }} />
          </div>
          <div>
            <div className="font-bold text-gray-800">Pontos críticos de controle</div>
            <div className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: formData.pontosCriticosControle || '-' }} />
          </div>
          <div>
            <div className="font-bold text-gray-800">Indicadores de desempenho relacionados</div>
            <div className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: formData.indicadoresDesempenho || '-' }} />
          </div>
          <div>
            <div className="font-bold text-gray-800">Responsáveis pelo objeto avaliado</div>
            <div className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: formData.responsaveisObjeto || '-' }} />
          </div>
          <div>
            <div className="font-bold text-gray-800">Sistemas informatizados utilizados</div>
            <div className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: formData.sistemasInformatizados || '-' }} />
          </div>
        </div>
      </div>

      {/* VI. TRABALHOS ANTERIORES */}
      <div className="mb-6">
        <div className="bg-[#1a472a] text-white font-bold p-1 px-2 text-sm mb-3 uppercase">
          VI. TRABALHOS ANTERIORES
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-bold text-gray-800">Auditoria Interna: </span>
            <div className="inline-block" dangerouslySetInnerHTML={{ __html: formData.trabalhosAnterioresAuditoriaInterna || '-' }} />
          </div>
          <div>
            <span className="font-bold text-gray-800">TCU: </span>
            <div className="inline-block" dangerouslySetInnerHTML={{ __html: formData.trabalhosAnterioresTcu || '-' }} />
          </div>
          <div>
            <span className="font-bold text-gray-800">CGU: </span>
            <div className="inline-block" dangerouslySetInnerHTML={{ __html: formData.trabalhosAnterioresCgu || '-' }} />
          </div>
        </div>
      </div>

      {/* VII. AMOSTRA SELECIONADA */}
      <div className="mb-6">
        <div className="bg-[#1a472a] text-white font-bold p-1 px-2 text-sm mb-3 uppercase">
          VII. AMOSTRA SELECIONADA
        </div>
        <div className="grid grid-cols-[200px_1fr] gap-y-2 text-sm">
          <span className="font-bold text-gray-800">Período da Amostra</span>
          <span>
            {formatDataBr(formData.dataInicialAmostra)} a {formatDataBr(formData.dataFinalAmostra)}
          </span>

          <span className="font-bold text-gray-800">Critério para definição do universo amostral</span>
          <div dangerouslySetInnerHTML={{ __html: formData.criterioUniversoAmostral || '-' }} />

          <span className="font-bold text-gray-800">Universo</span>
          <div dangerouslySetInnerHTML={{ __html: formData.universo || '-' }} />

          <span className="font-bold text-gray-800">Amostra</span>
          <div dangerouslySetInnerHTML={{ __html: formData.amostra || '-' }} />

          <span className="font-bold text-gray-800">Porcentagem de Representatividade</span>
          <div dangerouslySetInnerHTML={{ __html: formData.porcentagemRepresentatividade || '-' }} />
        </div>
      </div>

      {/* VIII. ORÇAMENTO ESTIMADO */}
      {formData.orcamentoEstimado && (
        <div className="mb-6">
          <div className="bg-[#1a472a] text-white font-bold p-1 px-2 text-sm mb-3 uppercase">
            VIII. ORÇAMENTO ESTIMADO
          </div>
          <div className="text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: formData.orcamentoEstimado }} />
        </div>
      )}

      {/* Assinatura */}
      <div className="mt-12 text-center text-sm font-semibold text-gray-800">
        <p>{getResponsavelNome()}</p>
        <p className="text-xs text-gray-500 font-normal">Responsável / Auditoria Interna</p>
      </div>
      </div>

      {/* PÁGINA 2: MATRIZ DE PLANEJAMENTO EM OUTRA PÁGINA NO MODO PAISAGEM */}
      {Array.isArray(formData.questoes) && formData.questoes.length > 0 && (
        <div className="preview-container w-full bg-white p-8 md:p-12 print:p-0 text-gray-900 font-sans print-landscape-page">
          <div className="bg-[#1a472a] text-white font-bold py-2 px-3 text-sm mb-4 uppercase tracking-wide border border-gray-700 text-center">
            MATRIZ DE PLANEJAMENTO
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-gray-400 text-xs">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-400 font-bold text-gray-800">
                  <th className="p-2.5 border border-gray-400 w-[5%] text-center">Nº</th>
                  <th className="p-2.5 border border-gray-400 w-[18%]">Gerência Destino</th>
                  <th className="p-2.5 border border-gray-400 w-[35%]">Questão</th>
                  <th className="p-2.5 border border-gray-400 w-[14%]">Riscos</th>
                  <th className="p-2.5 border border-gray-400 w-[14%]">Técnicas</th>
                  <th className="p-2.5 border border-gray-400 w-[14%]">Critérios</th>
                </tr>
              </thead>
              <tbody>
                {formData.questoes.map((q, idx) => (
                  <tr key={idx} className="border-b border-gray-400 align-top hover:bg-gray-50/50">
                    <td className="p-2.5 border border-gray-400 font-bold text-center text-gray-700">
                      {idx + 1}
                    </td>
                    <td className="p-2.5 border border-gray-400 font-semibold text-gray-900">
                      {q.gerenciaDestinataria || q.gerencia || '-'}
                    </td>
                    <td className="p-2.5 border border-gray-400 text-gray-800">
                      <div className="leading-relaxed" dangerouslySetInnerHTML={{ __html: q.conteudo || q.questao || '-' }} />
                    </td>
                    <td className="p-2.5 border border-gray-400 text-gray-700">
                      <div className="whitespace-pre-wrap">
                        {parseLista(q.riscos) || '-'}
                      </div>
                    </td>
                    <td className="p-2.5 border border-gray-400 text-gray-700">
                      <div className="whitespace-pre-wrap">
                        {parseLista(q.tecnicas) || '-'}
                      </div>
                    </td>
                    <td className="p-2.5 border border-gray-400 text-gray-800">
                      <div className="leading-relaxed" dangerouslySetInnerHTML={{ __html: q.criterios || q.criterio || '-' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col flex-1 h-full bg-slate-100 font-sans overflow-hidden print:block print:h-auto print:overflow-visible print:bg-white">
      
      {/* =========================================
          BARRA DE TOPO (HEADER FIXO) 
      ========================================= */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm print:hidden">
        
        {/* Esquerda: Logo/Título do Módulo + Componente Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <FileText className="text-[#00767d]" size={24} />
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Auditoria Interna - GHC</h1>
              <p className="text-xs text-gray-500">Módulo de Planejamento de Auditoria #{formData.id || 'Novo'}</p>
            </div>
          </div>
          
          <div className="hidden md:block h-8 w-px bg-gray-300"></div>
          
          <Status statusInicial={formData.status || "Minuta"} onChangeStatus={(novo) => handleChange('status', novo)} />
        </div>

        {/* Centro/Esquerda: Botões de Ação Global (Expandir / Recolher Tudo) */}
        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 mr-auto ml-8">
          <button 
            onClick={handleExpandAll}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
            title="Expandir todas as seções"
          >
            <ChevronDown size={16} /> Expandir Tudo
          </button>
          <div className="w-px bg-gray-300 mx-1"></div>
          <button 
            onClick={handleCollapseAll}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
            title="Recolher todas as seções"
          >
            <ChevronUp size={16} /> Recolher Tudo
          </button>
        </div>

        {/* Direita: Botões de Layout Mode (Editor / Lado a Lado / Preview) */}
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
              title="Ver apenas o documento final"
            >
              <PanelRight size={16} /> Preview
            </button>
          </div>
          
          <button
            onClick={handleSaveManual}
            disabled={saving}
            className="inline-flex items-center px-4 py-2.5 bg-[#00767d] text-white rounded-lg hover:bg-[#005f64] transition-colors text-sm font-medium shadow-sm disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
            Salvar
          </button>
        </div>
      </div>

      {/* ==========================================
          ÁREA PRINCIPAL DE CONTEÚDO
      ========================================== */}
      <div className="flex flex-1 overflow-hidden print:block print:overflow-visible">
        
        {/* =========================================
            COLUNA 1: EDITOR (LAYOUT SANFONADO)
        ========================================= */}
        <div className={`overflow-y-auto p-4 md:p-8 flex-1 transition-all duration-300 print:hidden ${layoutMode === 'preview' ? 'hidden' : 'block'}`}>
          <div className="max-w-5xl mx-auto space-y-5 pb-24">

            <header className="mb-8 border-b-2 border-[#00767d] pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900 whitespace-nowrap">Preenchimento do Planejamento de Auditoria</h2>
              <div className="flex items-center gap-3 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => navigate((itemTrabalho?.id || itemTrabalhoIdParam) ? `/itens-trabalho?targetItemId=${itemTrabalho?.id || itemTrabalhoIdParam}` : '/itens-trabalho')}
                  className="inline-flex items-center text-[#00767d] hover:text-[#005f64] transition-colors font-semibold text-sm bg-[#00767d]/10 hover:bg-[#00767d]/20 px-3 py-1.5 rounded-lg"
                >
                  <ArrowLeft size={18} className="mr-1.5" />
                  Voltar para Itens de Trabalho
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/planejamentos')}
                  className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg border border-gray-200"
                >
                  <FileText size={18} className="mr-1.5" />
                  Ir para Lista de Planejamentos
                </button>
              </div>
            </header>
            {/* SANFONA 1: DADOS INICIAIS */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div 
                className="bg-blue-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-blue-100/70 transition-colors"
                onClick={() => handleToggleSection('dadosIniciais')}
              >
                <div className="flex items-center gap-3">
                  {openSections.dadosIniciais ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                  <Info className="text-blue-700" size={20} />
                  <h3 className="font-bold text-gray-900">Vínculo com Item de Trabalho</h3>
                </div>
              </div>
              {openSections.dadosIniciais && (
                <div className="p-6 space-y-4">
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Selecione o Item de Trabalho Base {itemTrabalho ? '(Total: 1)' : ''}
                    </label>
                    <div className="relative">
                      <SearchableSelect 
                        options={itemTrabalho ? [{ 
                          value: itemTrabalho.id, 
                          label: `${itemTrabalho.sigla || 'S/ TIPO'} - ${itemTrabalho.numeroReferencia ? String(itemTrabalho.numeroReferencia).padStart(2, '0') : ''}/${itemTrabalho.anoReferencia || ''} - ${itemTrabalho.objetoAuditado || 'Sem objeto auditado'}` 
                        }] : []}
                        value={itemTrabalho ? itemTrabalho.id : ''}
                        onChange={() => {}}
                        placeholder="Buscar por ano/número ou objeto..."
                        disabled={true}
                      />
                      <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none">
                         <span className="text-xs bg-gray-200 text-gray-700 font-bold px-2 py-0.5 rounded uppercase border border-gray-300">
                           Travado
                         </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Ano do Planejamento</label>
                      <input
                        type="number"
                        className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={formData.ano || ''}
                        onChange={(e) => handleChange('ano', e.target.value.replace(/\D/g, ''))}
                        placeholder="Ex: 2026"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Número do Planejamento</label>
                      <input
                        type="number"
                        className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={formData.numero || ''}
                        onChange={(e) => handleChange('numero', e.target.value.replace(/\D/g, ''))}
                        placeholder="Ex: 123"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Data Inicial</label>
                      <input type="date" className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none" value={formData.dataInicialPlanejamento || ''} onChange={(e) => handleChange('dataInicialPlanejamento', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Data Final</label>
                      <input type="date" className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none" value={formData.dataFinalPlanejamento || ''} onChange={(e) => handleChange('dataFinalPlanejamento', e.target.value)} />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Gerências Destinatárias</label>
                    <div className="border border-gray-300 rounded-md p-3 bg-white shadow-sm">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(formData.gerenciasDestinatarias || []).map((g) => (
                          <span key={g} className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 shadow-sm">
                            {g}
                            <button 
                              onClick={() => {
                                handleChange('gerenciasDestinatarias', (formData.gerenciasDestinatarias || []).filter(item => item !== g));
                              }} 
                              className="hover:bg-emerald-200 rounded-full p-0.5 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <SearchableSelect 
                            options={(Array.isArray(gerenciasDb) ? gerenciasDb : []).filter(g => {
                              const nomeGer = g.nome || g.sigla || g;
                              return !(formData.gerenciasDestinatarias || []).includes(nomeGer);
                            }).map(g => ({ value: g.nome || g.sigla || g, label: g.nome || g.sigla || g }))}
                            value=""
                            onChange={(val) => {
                              if (val) {
                                const current = formData.gerenciasDestinatarias || [];
                                if (!current.includes(val)) {
                                  handleChange('gerenciasDestinatarias', [...current, val]);
                                }
                              }
                            }}
                            placeholder="+ Selecionar e Adicionar Gerência Destinatária..."
                          />
                        </div>
                        {(formData.gerenciasDestinatarias && formData.gerenciasDestinatarias.length > 0) && (
                          <button
                            onClick={() => handleChange('gerenciasDestinatarias', [])}
                            className="text-xs font-bold text-red-600 hover:text-red-800 px-3 py-2 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                          >
                            Limpar Todas
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CAMPOS ORIGINAIS DO PLANEJAMENTO (MANTIDOS POR PRECAUÇÃO) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                        Tipo de Auditoria
                      </label>
                      <select
                        value={formData.tipoAuditoria || ''}
                        onChange={(e) => handleChange('tipoAuditoria', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="Avaliação">Avaliação</option>
                        <option value="Consultoria">Consultoria</option>
                        <option value="Auditoria Operacional">Auditoria Operacional</option>
                        <option value="Auditoria Financeira">Auditoria Financeira</option>
                        <option value="Auditoria de Conformidade">Auditoria de Conformidade</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                        Data de Emissão
                      </label>
                      <input
                        type="date"
                        value={formData.dataEmissao || ''}
                        onChange={(e) => handleChange('dataEmissao', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="bg-blue-50/60 border border-blue-200/80 rounded-lg p-2.5 flex items-center gap-2 text-xs text-blue-800 mb-2">
                    <Clock size={14} className="text-blue-600 shrink-0" />
                    <span>Os campos de edição deste planejamento possuem <b>salvamento automático</b> — o progresso é salvo no servidor após 3 segundos de inatividade na digitação.</span>
                  </div>
                  <div>
                    <RichTextEditor
                      title="Escopo do Planejamento"
                      initialContent={formData.escopo || ''}
                      onChange={(val) => handleChange('escopo', val)}
                      onSave={() => {}}
                      globalCollapseAction={globalCollapseAction}
                      renderAttachments={() => (
                        <FileAttachmentManager
                          files={getAnexosBySecao('1. Escopo do Planejamento')}
                          onUpload={(file) => handleUploadAnexo(file, '1. Escopo do Planejamento')}
                          onDelete={handleDeleteAnexo}
                          globalCollapseAction={globalCollapseAction}
                        />
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SANFONA 2: ASPECTOS GERAIS DO OBJETO AUDITADO */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div 
                className="bg-blue-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-blue-100/70 transition-colors"
                onClick={() => handleToggleSection('objetoAuditado')}
              >
                <div className="flex items-center gap-3">
                  {openSections.objetoAuditado ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                  <Info className="text-blue-700" size={20} />
                  <h3 className="font-bold text-gray-900">2. Aspectos Gerais do Objeto Auditado</h3>
                </div>
              </div>
              {openSections.objetoAuditado && (
                <div className="p-6 space-y-4">
                  <div>
                    <RichTextEditor
                      title="Descrição do Objeto Auditado"
                      initialContent={formData.descricaoObjetoAuditado || ''}
                      onChange={(val) => handleChange('descricaoObjetoAuditado', val)}
                      onSave={() => {}}
                      globalCollapseAction={globalCollapseAction}
                      renderAttachments={() => (
                        <FileAttachmentManager
                          files={getAnexosBySecao('2. Descrição do Objeto Auditado')}
                          onUpload={(file) => handleUploadAnexo(file, '2. Descrição do Objeto Auditado')}
                          onDelete={handleDeleteAnexo}
                          globalCollapseAction={globalCollapseAction}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <RichTextEditor
                      title="Principais Riscos"
                      initialContent={formData.principaisRiscos || ''}
                      onChange={(val) => handleChange('principaisRiscos', val)}
                      onSave={() => {}}
                      globalCollapseAction={globalCollapseAction}
                      renderAttachments={() => (
                        <FileAttachmentManager
                          files={getAnexosBySecao('2. Principais Riscos')}
                          onUpload={(file) => handleUploadAnexo(file, '2. Principais Riscos')}
                          onDelete={handleDeleteAnexo}
                          globalCollapseAction={globalCollapseAction}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <RichTextEditor
                      title="Medidas de Controle Existentes"
                      initialContent={formData.medidasControle || ''}
                      onChange={(val) => handleChange('medidasControle', val)}
                      onSave={() => {}}
                      globalCollapseAction={globalCollapseAction}
                      renderAttachments={() => (
                        <FileAttachmentManager
                          files={getAnexosBySecao('2. Medidas de Controle')}
                          onUpload={(file) => handleUploadAnexo(file, '2. Medidas de Controle')}
                          onDelete={handleDeleteAnexo}
                          globalCollapseAction={globalCollapseAction}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <RichTextEditor
                      title="Materialidade dos Recursos (em R$)"
                      initialContent={formData.materialidadeRecursos || ''}
                      onChange={(val) => handleChange('materialidadeRecursos', val)}
                      onSave={() => {}}
                      globalCollapseAction={globalCollapseAction}
                      renderAttachments={() => (
                        <FileAttachmentManager
                          files={getAnexosBySecao('2. Materialidade dos Recursos')}
                          onUpload={(file) => handleUploadAnexo(file, '2. Materialidade dos Recursos')}
                          onDelete={handleDeleteAnexo}
                          globalCollapseAction={globalCollapseAction}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <RichTextEditor
                      title="Pontos Críticos de Controle"
                      initialContent={formData.pontosCriticosControle || ''}
                      onChange={(val) => handleChange('pontosCriticosControle', val)}
                      onSave={() => {}}
                      globalCollapseAction={globalCollapseAction}
                      renderAttachments={() => (
                        <FileAttachmentManager
                          files={getAnexosBySecao('2. Pontos Críticos de Controle')}
                          onUpload={(file) => handleUploadAnexo(file, '2. Pontos Críticos de Controle')}
                          onDelete={handleDeleteAnexo}
                          globalCollapseAction={globalCollapseAction}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <RichTextEditor
                      title="Indicadores de Desempenho Relacionados ao Processo/Área Auditados"
                      initialContent={formData.indicadoresDesempenho || ''}
                      onChange={(val) => handleChange('indicadoresDesempenho', val)}
                      onSave={() => {}}
                      globalCollapseAction={globalCollapseAction}
                      renderAttachments={() => (
                        <FileAttachmentManager
                          files={getAnexosBySecao('2. Indicadores de Desempenho')}
                          onUpload={(file) => handleUploadAnexo(file, '2. Indicadores de Desempenho')}
                          onDelete={handleDeleteAnexo}
                          globalCollapseAction={globalCollapseAction}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <RichTextEditor
                      title="Responsável(is) pelo Objeto (Macroprocesso/Processo) Avaliado"
                      initialContent={formData.responsaveisObjeto || ''}
                      onChange={(val) => handleChange('responsaveisObjeto', val)}
                      onSave={() => {}}
                      globalCollapseAction={globalCollapseAction}
                      renderAttachments={() => (
                        <FileAttachmentManager
                          files={getAnexosBySecao('2. Responsável(is) pelo Objeto')}
                          onUpload={(file) => handleUploadAnexo(file, '2. Responsável(is) pelo Objeto')}
                          onDelete={handleDeleteAnexo}
                          globalCollapseAction={globalCollapseAction}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <RichTextEditor
                      title="Sistemas Informatizados Utilizados"
                      initialContent={formData.sistemasInformatizados || ''}
                      onChange={(val) => handleChange('sistemasInformatizados', val)}
                      onSave={() => {}}
                      globalCollapseAction={globalCollapseAction}
                      renderAttachments={() => (
                        <FileAttachmentManager
                          files={getAnexosBySecao('2. Sistemas Informatizados')}
                          onUpload={(file) => handleUploadAnexo(file, '2. Sistemas Informatizados')}
                          onDelete={handleDeleteAnexo}
                          globalCollapseAction={globalCollapseAction}
                        />
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SANFONA 3: ASPECTOS GERAIS DAS GERÊNCIAS AUDITADAS */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div 
                className="bg-blue-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-blue-100/70 transition-colors"
                onClick={() => handleToggleSection('gerenciasAuditadas')}
              >
                <div className="flex items-center gap-3">
                  {openSections.gerenciasAuditadas ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                  <Info className="text-blue-700" size={20} />
                  <h3 className="font-bold text-gray-900">3. Aspectos Gerais das Gerências Auditadas</h3>
                </div>
              </div>
              {openSections.gerenciasAuditadas && (
                <div className="p-6">
                  <RichTextEditor
                    title="Descrição das Gerências Auditadas"
                    initialContent={formData.descricaoGerenciasAuditadas || ''}
                    onChange={(val) => handleChange('descricaoGerenciasAuditadas', val)}
                    onSave={() => {}}
                    globalCollapseAction={globalCollapseAction}
                    renderAttachments={() => (
                      <FileAttachmentManager
                        files={getAnexosBySecao('3. Aspectos Gerais das Gerências Auditadas')}
                        onUpload={(file) => handleUploadAnexo(file, '3. Aspectos Gerais das Gerências Auditadas')}
                        onDelete={handleDeleteAnexo}
                        globalCollapseAction={globalCollapseAction}
                      />
                    )}
                  />
                </div>
              )}
            </div>

            {/* SANFONA 4: TRABALHOS ANTERIORES */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div 
                className="bg-blue-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-blue-100/70 transition-colors"
                onClick={() => handleToggleSection('trabalhosAnteriores')}
              >
                <div className="flex items-center gap-3">
                  {openSections.trabalhosAnteriores ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                  <Info className="text-blue-700" size={20} />
                  <h3 className="font-bold text-gray-900">4. Trabalhos Anteriores</h3>
                </div>
              </div>
              {openSections.trabalhosAnteriores && (
                <div className="p-6 space-y-4">
                  <div>
                    <RichTextEditor
                      title="Auditoria Interna"
                      initialContent={formData.trabalhosAnterioresAuditoriaInterna || ''}
                      onChange={(val) => handleChange('trabalhosAnterioresAuditoriaInterna', val)}
                      onSave={() => {}}
                      globalCollapseAction={globalCollapseAction}
                      renderAttachments={() => (
                        <FileAttachmentManager
                          files={getAnexosBySecao('4. Auditoria Interna')}
                          onUpload={(file) => handleUploadAnexo(file, '4. Auditoria Interna')}
                          onDelete={handleDeleteAnexo}
                          globalCollapseAction={globalCollapseAction}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <RichTextEditor
                      title="TCU"
                      initialContent={formData.trabalhosAnterioresTcu || ''}
                      onChange={(val) => handleChange('trabalhosAnterioresTcu', val)}
                      onSave={() => {}}
                      globalCollapseAction={globalCollapseAction}
                      renderAttachments={() => (
                        <FileAttachmentManager
                          files={getAnexosBySecao('4. TCU')}
                          onUpload={(file) => handleUploadAnexo(file, '4. TCU')}
                          onDelete={handleDeleteAnexo}
                          globalCollapseAction={globalCollapseAction}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <RichTextEditor
                      title="CGU"
                      initialContent={formData.trabalhosAnterioresCgu || ''}
                      onChange={(val) => handleChange('trabalhosAnterioresCgu', val)}
                      onSave={() => {}}
                      globalCollapseAction={globalCollapseAction}
                      renderAttachments={() => (
                        <FileAttachmentManager
                          files={getAnexosBySecao('4. CGU')}
                          onUpload={(file) => handleUploadAnexo(file, '4. CGU')}
                          onDelete={handleDeleteAnexo}
                          globalCollapseAction={globalCollapseAction}
                        />
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SANFONA 5: AMOSTRA SELECIONADA */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div 
                className="bg-blue-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-blue-100/70 transition-colors"
                onClick={() => handleToggleSection('amostra')}
              >
                <div className="flex items-center gap-3">
                  {openSections.amostra ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                  <Info className="text-blue-700" size={20} />
                  <h3 className="font-bold text-gray-900">5. Amostra Selecionada</h3>
                </div>
              </div>
              {openSections.amostra && (
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                        Data Inicial da Amostra
                      </label>
                      <input
                        type="date"
                        value={formData.dataInicialAmostra || ''}
                        onChange={(e) => handleChange('dataInicialAmostra', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                        Data Final da Amostra
                      </label>
                      <input
                        type="date"
                        value={formData.dataFinalAmostra || ''}
                        onChange={(e) => handleChange('dataFinalAmostra', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <RichTextEditor
                      title="Critério para Definição do Universo Amostral"
                      initialContent={formData.criterioUniversoAmostral || ''}
                      onChange={(val) => handleChange('criterioUniversoAmostral', val)}
                      onSave={() => {}}
                      globalCollapseAction={globalCollapseAction}
                      renderAttachments={() => (
                        <FileAttachmentManager
                          files={getAnexosBySecao('5. Critério Universo Amostral')}
                          onUpload={(file) => handleUploadAnexo(file, '5. Critério Universo Amostral')}
                          onDelete={handleDeleteAnexo}
                          globalCollapseAction={globalCollapseAction}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <RichTextEditor
                      title="Universo"
                      initialContent={formData.universo || ''}
                      onChange={(val) => handleChange('universo', val)}
                      onSave={() => {}}
                      globalCollapseAction={globalCollapseAction}
                      renderAttachments={() => (
                        <FileAttachmentManager
                          files={getAnexosBySecao('5. Universo')}
                          onUpload={(file) => handleUploadAnexo(file, '5. Universo')}
                          onDelete={handleDeleteAnexo}
                          globalCollapseAction={globalCollapseAction}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <RichTextEditor
                      title="Amostra"
                      initialContent={formData.amostra || ''}
                      onChange={(val) => handleChange('amostra', val)}
                      onSave={() => {}}
                      globalCollapseAction={globalCollapseAction}
                      renderAttachments={() => (
                        <FileAttachmentManager
                          files={getAnexosBySecao('5. Amostra')}
                          onUpload={(file) => handleUploadAnexo(file, '5. Amostra')}
                          onDelete={handleDeleteAnexo}
                          globalCollapseAction={globalCollapseAction}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <RichTextEditor
                      title="Porcentagem de Representatividade"
                      initialContent={formData.porcentagemRepresentatividade || ''}
                      onChange={(val) => handleChange('porcentagemRepresentatividade', val)}
                      onSave={() => {}}
                      globalCollapseAction={globalCollapseAction}
                      renderAttachments={() => (
                        <FileAttachmentManager
                          files={getAnexosBySecao('5. Porcentagem Representatividade')}
                          onUpload={(file) => handleUploadAnexo(file, '5. Porcentagem Representatividade')}
                          onDelete={handleDeleteAnexo}
                          globalCollapseAction={globalCollapseAction}
                        />
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SANFONA 6: ORÇAMENTO ESTIMADO */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div 
                className="bg-blue-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-blue-100/70 transition-colors"
                onClick={() => handleToggleSection('orcamento')}
              >
                <div className="flex items-center gap-3">
                  {openSections.orcamento ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                  <Info className="text-blue-700" size={20} />
                  <h3 className="font-bold text-gray-900">6. Orçamento Estimado</h3>
                </div>
              </div>
              {openSections.orcamento && (
                <div className="p-6">
                  <RichTextEditor
                    title="Orçamento Estimado (informar estimativa de valor a ser gasto, natureza, custos extras...)"
                    initialContent={formData.orcamentoEstimado || ''}
                    onChange={(val) => handleChange('orcamentoEstimado', val)}
                    onSave={() => {}}
                    globalCollapseAction={globalCollapseAction}
                    renderAttachments={() => (
                      <FileAttachmentManager
                        files={getAnexosBySecao('6. Orçamento Estimado')}
                        onUpload={(file) => handleUploadAnexo(file, '6. Orçamento Estimado')}
                        onDelete={handleDeleteAnexo}
                        globalCollapseAction={globalCollapseAction}
                      />
                    )}
                  />
                </div>
              )}
            </div>

            {/* SANFONA 7: CRONOGRAMA */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div 
                className="bg-blue-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-blue-100/70 transition-colors"
                onClick={() => handleToggleSection('cronograma')}
              >
                <div className="flex items-center gap-3">
                  {openSections.cronograma ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                  <Info className="text-blue-700" size={20} />
                  <h3 className="font-bold text-gray-900">7. Cronograma Proposto</h3>
                </div>
              </div>
              {openSections.cronograma && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                        Data Inicial do Planejamento
                      </label>
                      <input
                        type="date"
                        value={formData.dataInicialPlanejamento || ''}
                        onChange={(e) => handleChange('dataInicialPlanejamento', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                        Data Final do Planejamento
                      </label>
                      <input
                        type="date"
                        value={formData.dataFinalPlanejamento || ''}
                        onChange={(e) => handleChange('dataFinalPlanejamento', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                        Data Inicial de Execução
                      </label>
                      <input
                        type="date"
                        value={formData.dataInicialExecucao || ''}
                        onChange={(e) => handleChange('dataInicialExecucao', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                        Data Final de Execução
                      </label>
                      <input
                        type="date"
                        value={formData.dataFinalExecucao || ''}
                        onChange={(e) => handleChange('dataFinalExecucao', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                        Data Inicial do Relatório
                      </label>
                      <input
                        type="date"
                        value={formData.dataInicialRelatorio || ''}
                        onChange={(e) => handleChange('dataInicialRelatorio', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                        Data Final do Relatório
                      </label>
                      <input
                        type="date"
                        value={formData.dataFinalRelatorio || ''}
                        onChange={(e) => handleChange('dataFinalRelatorio', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SANFONA 8: QUESTÕES DE AUDITORIA (CADASTRO NA MESMA PÁGINA!) */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div 
                className="bg-blue-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-blue-100/70 transition-colors rounded-t-xl"
                onClick={() => handleToggleSection('questoes')}
              >
                <div className="flex items-center gap-3">
                  {openSections.questoes ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                  <Info className="text-blue-700" size={20} />
                  <h3 className="font-bold text-gray-900">8. Questões de Auditoria (Cadastro Integrado na Página)</h3>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddQuestao();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                >
                  <Plus size={15} />
                  <span>Nova Questão</span>
                </button>
              </div>

              {openSections.questoes && (
                <div className="p-6 space-y-6">
                  {Array.isArray(formData.questoes) && formData.questoes.length > 0 ? (
                    formData.questoes.map((q, qIndex) => {
                      const isOpen = openQuestions[qIndex] ?? true;
                      return (
                        <div 
                          key={qIndex}
                          draggable
                          onDragStart={(e) => handleDragStartQuestao(e, qIndex)}
                          onDragOver={(e) => handleDragOverQuestao(e, qIndex)}
                          onDrop={(e) => handleDropQuestao(e, qIndex)}
                          className={`border rounded-xl bg-white shadow-sm transition-all ${draggedQuestaoIdx === qIndex ? 'opacity-50 border-dashed border-blue-500 bg-blue-50/30' : 'border-blue-200'}`}
                        >
                          {/* Cabeçalho da Questão */}
                          <div className="flex items-center justify-between px-5 py-3.5 bg-blue-50/60 border-b border-blue-100 rounded-t-xl">
                            <div className="flex items-center gap-3 flex-1 text-left">
                              <div
                                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-100/50"
                                title="Arraste e solte para reordenar a questão"
                              >
                                <GripVertical size={18} />
                              </div>
                              <button
                                type="button"
                                onClick={() => setOpenQuestions(prev => ({ ...prev, [qIndex]: !isOpen }))}
                                className="flex items-center gap-3 flex-1 text-left"
                              >
                                {isOpen ? <ChevronUp size={18} className="text-blue-700" /> : <ChevronDown size={18} className="text-blue-700" />}
                                <span className="font-bold text-sm text-blue-900">
                                  Questão #{qIndex + 1} — {q.gerenciaDestinataria || q.gerencia || 'Gerência Não Definida'}
                                </span>
                                <span className="text-xs text-gray-500 truncate max-w-sm hidden md:inline">
                                  {(q.conteudo || q.questao) ? `(${String(q.conteudo || q.questao).substring(0, 45)}...)` : '(Sem conteúdo)'}
                                </span>
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveQuestao(qIndex)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
                              title="Remover esta questão"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          {/* Corpo do Cadastro da Questão (Na mesma página!) */}
                          {isOpen && (
                            <div className="p-5 space-y-5 bg-white">

                              {/* 1. Gerência Destinatária */}
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                                  Gerência Destinatária
                                </label>
                                <div className="flex flex-col sm:flex-row gap-3">
                                  <select
                                    value={q.gerenciaDestinataria || q.gerencia || ''}
                                    onChange={(e) => handleQuestaoChange(qIndex, 'gerenciaDestinataria', e.target.value)}
                                    className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                  >
                                    <option value="">Selecione</option>
                                    {(Array.isArray(gerenciasDb) ? gerenciasDb : []).map((ger, idxGer) => (
                                      <option key={idxGer} value={ger.sigla || ger.nome || ger}>
                                        {ger.sigla ? `${ger.sigla} - ${ger.nome || ''}` : ger.nome || ger}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {/* 2. Conteúdo */}
                              <div>
                                <RichTextEditor
                                  title="Conteúdo da Questão de Auditoria"
                                  initialContent={q.conteudo || q.questao || ''}
                                  onChange={(val) => handleQuestaoChange(qIndex, 'conteudo', val)}
                                  onSave={() => {}}
                                  globalCollapseAction={globalCollapseAction}
                                  renderAttachments={() => (
                                    <FileAttachmentManager
                                      files={getAnexosBySecao(`Questão #${qIndex + 1} - Conteúdo`)}
                                      onUpload={(file) => handleUploadAnexo(file, `Questão #${qIndex + 1} - Conteúdo`)}
                                      onDelete={handleDeleteAnexo}
                                      globalCollapseAction={globalCollapseAction}
                                    />
                                  )}
                                />
                              </div>

                              {/* 3. Critérios */}
                              <div>
                                <RichTextEditor
                                  title="Critérios Aplicáveis"
                                  initialContent={q.criterios || q.criterio || ''}
                                  onChange={(val) => handleQuestaoChange(qIndex, 'criterios', val)}
                                  onSave={() => {}}
                                  globalCollapseAction={globalCollapseAction}
                                  renderAttachments={() => (
                                    <FileAttachmentManager
                                      files={getAnexosBySecao(`Questão #${qIndex + 1} - Critérios`)}
                                      onUpload={(file) => handleUploadAnexo(file, `Questão #${qIndex + 1} - Critérios`)}
                                      onDelete={handleDeleteAnexo}
                                      globalCollapseAction={globalCollapseAction}
                                    />
                                  )}
                                />
                              </div>

                              {/* 4. Técnicas (Pills + SearchableSelect) */}
                              <div className="p-4 bg-gray-50/70 border border-gray-200/80 rounded-xl">
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-3">
                                  Técnicas de Auditoria
                                </label>
                                <div className="border border-gray-300 rounded-md p-3 bg-white shadow-sm">
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {getQuestaoArrayField(q, 'tecnicas').map((tecnica, idxT) => (
                                      <span
                                        key={idxT}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 shadow-sm"
                                      >
                                        {tecnica}
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveQuestaoItem(qIndex, 'tecnicas', tecnica)}
                                          className="text-blue-600 hover:text-blue-900 font-bold focus:outline-none ml-1"
                                          title="Remover"
                                        >
                                          ×
                                        </button>
                                      </span>
                                    ))}
                                    {getQuestaoArrayField(q, 'tecnicas').length === 0 && (
                                      <span className="text-xs text-gray-400 italic py-1">
                                        Nenhuma técnica de auditoria selecionada para esta questão.
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 border-t border-gray-100 pt-2">
                                    <div className="flex-1">
                                      <SearchableSelect
                                        placeholder="+ Selecionar e Adicionar Técnica de Auditoria..."
                                        value=""
                                        options={tecnicasDb
                                          .filter(t => !getQuestaoArrayField(q, 'tecnicas').includes(t))
                                          .map(t => ({ value: t, label: t }))}
                                        onChange={(val) => handleAddQuestaoItem(qIndex, 'tecnicas', val)}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 5. Riscos (Pills + SearchableSelect) */}
                              <div className="p-4 bg-gray-50/70 border border-gray-200/80 rounded-xl">
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-3">
                                  Riscos Relacionados
                                </label>
                                <div className="border border-gray-300 rounded-md p-3 bg-white shadow-sm">
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {getQuestaoArrayField(q, 'riscos').map((risco, idxR) => (
                                      <span
                                        key={idxR}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-sm"
                                      >
                                        {risco}
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveQuestaoItem(qIndex, 'riscos', risco)}
                                          className="text-amber-600 hover:text-amber-900 font-bold focus:outline-none ml-1"
                                          title="Remover"
                                        >
                                          ×
                                        </button>
                                      </span>
                                    ))}
                                    {getQuestaoArrayField(q, 'riscos').length === 0 && (
                                      <span className="text-xs text-gray-400 italic py-1">
                                        Nenhum risco relacionado selecionado para esta questão.
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 border-t border-gray-100 pt-2">
                                    <div className="flex-1">
                                      <SearchableSelect
                                        placeholder="+ Selecionar e Adicionar Risco Relacionado..."
                                        value=""
                                        options={riscosDb
                                          .filter(r => !getQuestaoArrayField(q, 'riscos').includes(r))
                                          .map(r => ({ value: r, label: r }))}
                                        onChange={(val) => handleAddQuestaoItem(qIndex, 'riscos', val)}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-10 text-center text-gray-400 text-sm bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                      Nenhuma questão cadastrada. Clique no botão "Nova Questão" acima para adicionar e preencher na mesma página.
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleAddQuestao}
                      className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
                    >
                      <Plus size={16} />
                      <span>Adicionar Nova Questão</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* =========================================
            COLUNA 2: PREVIEW A4 (LADO A LADO OU PREVIEW)
        ========================================= */}
        <div className={`overflow-y-auto p-4 md:p-8 flex-1 transition-all duration-300 ${layoutMode === 'editor' ? 'hidden' : 'block'}`}>
          <div className="mb-4 flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200 shadow-sm print:hidden">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Visualização Formatada (A4 Retrato)
            </span>
            <div className="flex justify-end items-center gap-3 print:hidden">
              <button 
                type="button"
                onClick={handleGerarPdfServidor}
                disabled={isGeneratingPdf}
                className={`flex items-center gap-2 text-white px-4 py-2 rounded-lg shadow-sm transition-colors font-medium ${isGeneratingPdf ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                title="Gera o PDF nativo no servidor (Playwright)"
              >
                {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                <span>{isGeneratingPdf ? 'Gerando...' : 'Gerar PDF no Servidor'}</span>
              </button>
              {/*<button 
                type="button"
                onClick={() => setShowPdfModal(true)}
                className="bg-[#00767d] hover:bg-[#005f64] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm font-medium"
                title="Abrir janela para visualizar o documento em PDF"
              >
                <FileText size={18} />
                <span>Visualizar em PDF</span>
              </button>*/}
              {/*<button 
                type="button"
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm font-medium"
              >
                <Printer size={18} />
                <span>Imprimir Planejamento</span>
              </button>*/}
            </div>
          </div>

          {renderA4Preview()}
        </div>

      </div>

      {/* Modal de visualização completa */}
      
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
        docTitle={`Planejamento nº ${formData.numero || '02'}/${formData.ano || new Date().getFullYear()}`}
      >
        {renderA4Preview()}
      </DocumentPdfViewerModal>
    </div>
  );
}
