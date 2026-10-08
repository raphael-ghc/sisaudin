import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Info,
  FileText,
  CheckCircle,
  Clock,
  Lock,
  GripVertical,
  Columns,
  Maximize2,
  FileSpreadsheet,
  ExternalLink,
  Paperclip
} from 'lucide-react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import RichTextEditor from '../components/RichTextEditor';
import SearchableSelect from '../components/SearchableSelect';
import FileAttachmentManager from '../components/FileAttachmentManager';
import {
  getMatrizAchadosByItemTrabalho,
  getMatrizAchadosById,
  createMatrizAchados,
  updateMatrizAchados
} from '../api/matrizAchadosApi';
import { getPlanejamentoByItemTrabalho } from '../api/planejamentoApi';
import { getItemTrabalhoById } from '../api/itemTrabalhoApi';
import { getAllGerencias } from '../api/gerenciaApi';
import api from '../api/axiosInstance';
import { getAllGeneric } from '../api/genericApi';

export default function MatrizAchados() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const itemTrabalhoIdParam = searchParams.get('itemTrabalhoId');
  const navigate = useNavigate();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Layout de visualização: 'editor' | 'split' | 'preview'
  const [layoutMode, setLayoutMode] = useState('split');

  // Controle das sanfonas (acordeão)
  const [openSections, setOpenSections] = useState({
    dadosIniciais: true,
    questoes: true
  });

  const [openQuestions, setOpenQuestions] = useState({});

  // Ação global de expandir/recolher
  const [globalCollapseAction, setGlobalCollapseAction] = useState(null);

  // Vínculos de referência (Somente Leitura)
  const [itemTrabalho, setItemTrabalho] = useState(null);
  const [planejamentoRef, setPlanejamentoRef] = useState(null);
  const [gerenciasDisponiveis, setGerenciasDisponiveis] = useState([]);
  const [tecnicasDb, setTecnicasDb] = useState([]);
  const [riscosDb, setRiscosDb] = useState([]);

  // Anexos globais / por seção da matriz
  const [anexos, setAnexos] = useState([]);

  // Drag and Drop para Questões
  const [draggedIdx, setDraggedIdx] = useState(null);

  // Estado do Formulário
  const [formData, setFormData] = useState({
    id: null,
    nome: 'Matriz de Achados de Auditoria',
    descricao: '',
    status: 'Minuta',
    dataEmissao: new Date().toISOString().slice(0, 10),
    itemTrabalhoId: null,
    planejamentoId: null,
    planejamentoNumeroAno: '',
    planejamentoNome: '',
    questoes: []
  });

  const handleToggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleExpandAll = () => {
    setOpenSections({
      dadosIniciais: true,
      questoes: true
    });
    const allOpen = {};
    formData.questoes.forEach((_, i) => { allOpen[i] = true; });
    setOpenQuestions(allOpen);
    setGlobalCollapseAction({ action: 'expand', ts: Date.now() });
  };

  const handleCollapseAll = () => {
    setOpenSections({
      dadosIniciais: false,
      questoes: false
    });
    setOpenQuestions({});
    setGlobalCollapseAction({ action: 'collapse', ts: Date.now() });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
  };

  // Carregar dados de base
  useEffect(() => {
    const fetchBaseData = async () => {
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
        const res = await getAllGerencias(0, 1000);
        setGerenciasDisponiveis(extractList(res));
      } catch (err) { console.error('Erro gerencias:', err); }

      try {
        const res = await getAllGeneric('tecnica-de-auditoria', 0, 1000);
        setTecnicasDb(extractList(res).map(mapToString).filter(Boolean));
      } catch (err) { console.error('Erro tecnicas:', err); }

      try {
        const res = await getAllGeneric('tipo-de-risco', 0, 1000);
        setRiscosDb(extractList(res).map(mapToString).filter(Boolean));
      } catch (err) { console.error('Erro riscos:', err); }
    };
    fetchBaseData();
  }, []);

  // Busca anexos se houver id ou itemTrabalhoId
  const fetchAnexos = useCallback(async () => {
    const targetId = formData.itemTrabalhoId || itemTrabalho?.id || itemTrabalhoIdParam;
    if (!targetId) return;
    try {
      const res = await api.get(`/anexos/item/${targetId}`, {
        params: { documento: 'MatrizAchados' }
      });
      if (res.data) setAnexos(res.data);
    } catch (err) {
      console.error('Erro ao buscar anexos:', err);
    }
  }, [formData.itemTrabalhoId, itemTrabalho?.id, itemTrabalhoIdParam]);

  // Upload e Delete de Anexos
  const handleUploadAnexo = async (file, secaoNome) => {
    const targetId = formData.itemTrabalhoId || itemTrabalho?.id || itemTrabalhoIdParam;
    if (!targetId) {
      toast.warn('É necessário ter o Item de Trabalho vinculado para anexar arquivos.');
      return;
    }
    const uploadForm = new FormData();
    uploadForm.append('file', file);
    uploadForm.append('itemTrabalhoId', targetId);
    uploadForm.append('documento', 'MatrizAchados');
    uploadForm.append('secao', secaoNome);
    try {
      const res = await api.post('/anexos/upload', uploadForm, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAnexos(prev => [...prev, res.data]);
      toast.success('Arquivo anexado com sucesso!');
    } catch (err) {
      console.error('Erro no upload de anexo:', err);
      toast.error('Erro ao fazer upload do arquivo.');
    }
  };

  const handleDeleteAnexo = async (anexoId) => {
    try {
      await api.delete(`/anexos/${anexoId}`);
      setAnexos(prev => prev.filter(a => a.id !== anexoId));
      toast.success('Anexo removido com sucesso!');
    } catch (err) {
      console.error('Erro ao deletar anexo:', err);
      toast.error('Erro ao remover o anexo.');
    }
  };

  const getAnexosBySecao = (secaoNome) => {
    return anexos.filter(a => a.secao === secaoNome);
  };

  // Formatação de data BR
  const formatDataBr = (val) => {
    if (!val) return '-';
    const partes = val.split('-');
    if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
    return val;
  };

  // Salvar no backend
  const handleSave = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setSaving(true);
      let res;
      const targetItemTrabalhoId = formData.itemTrabalho?.id || formData.itemTrabalhoId || itemTrabalho?.id || (itemTrabalhoIdParam ? Number(String(itemTrabalhoIdParam).split(':')[0]) : null) || formData.planejamentoRef?.itemTrabalho?.id;
      const payload = {
        ...formData,
        itemTrabalho: targetItemTrabalhoId ? { id: Number(targetItemTrabalhoId) } : (formData.itemTrabalho || null),
        itemTrabalhoId: targetItemTrabalhoId ? Number(targetItemTrabalhoId) : null,
        questoes: formData.questoes.map((q, idx) => ({
          ...q,
          id: (typeof q.id === 'number' && q.id < 0) ? null : q.id,
          ordem: idx + 1
        }))
      };

      const isNew = !formData.id || formData.id === 'novo';
      if (!isNew) {
        res = await updateMatrizAchados(formData.id, payload);
      } else {
        res = await createMatrizAchados(payload);
      }

      if (res && res.id) {
        setFormData(res);
        setIsDirty(false);
        setLastSaved(new Date());
        if (!itemTrabalho && (res.itemTrabalho || res.itemTrabalhoId)) {
          const loadedItem = await getItemTrabalhoById(res.itemTrabalhoId || res.itemTrabalho?.id);
          setItemTrabalho(loadedItem);
        }
        if (isNew) {
          navigate(`/matriz-achados/${res.id}${targetItemTrabalhoId ? `?itemTrabalhoId=${targetItemTrabalhoId}` : ''}`, { replace: true });
        }
        if (!isSilent) {
          toast.success('Matriz de Achados salva com sucesso!');
        }
      }
    } catch (err) {
      console.error("Erro ao salvar Matriz de Achados:", err);
      if (!isSilent) {
        toast.error('Erro ao salvar Matriz de Achados. Verifique os dados.');
      }
    } finally {
      if (!isSilent) setSaving(false);
    }
  }, [formData, itemTrabalho, itemTrabalhoIdParam]);

  // Carregar dados iniciais e vincular com Planejamento
  useEffect(() => {
    const loadData = async () => {
      try {
        let currentItemTrabalhoId = itemTrabalhoIdParam;

        if (id && id !== 'novo') {
          const loaded = await getMatrizAchadosById(id);
          if (loaded) {
            setFormData(loaded);
            const initOpen = {};
            (loaded.questoes || []).forEach((_, idx) => { initOpen[idx] = true; });
            setOpenQuestions(initOpen);
            if (loaded.itemTrabalho || loaded.itemTrabalhoId) {
              currentItemTrabalhoId = loaded.itemTrabalhoId || loaded.itemTrabalho?.id;
              const item = await getItemTrabalhoById(currentItemTrabalhoId);
              setItemTrabalho(item);
            }
            if (loaded.planejamentoId) {
              setPlanejamentoRef({
                id: loaded.planejamentoId,
                nome: loaded.planejamentoNome || 'Planejamento de Auditoria',
                numeroAno: loaded.planejamentoNumeroAno || `Planejamento #${loaded.planejamentoId}`
              });
            }
          }
        } else if (itemTrabalhoIdParam) {
          // Checar se já existe uma Matriz de Achados salva para este Item de Trabalho
          const existentes = await getMatrizAchadosByItemTrabalho(itemTrabalhoIdParam);
          if (Array.isArray(existentes) && existentes.length > 0) {
            const existing = existentes[0];
            setFormData(existing);
            const initOpen = {};
            (existing.questoes || []).forEach((_, idx) => { initOpen[idx] = true; });
            setOpenQuestions(initOpen);
            const item = await getItemTrabalhoById(itemTrabalhoIdParam);
            setItemTrabalho(item);
            if (existing.planejamentoId) {
              setPlanejamentoRef({
                id: existing.planejamentoId,
                nome: existing.planejamentoNome || 'Planejamento de Auditoria',
                numeroAno: existing.planejamentoNumeroAno || `Planejamento #${existing.planejamentoId}`
              });
            }
          } else {
            // Criando nova Matriz de Achados do zero -> importar dados do Planejamento
            const item = await getItemTrabalhoById(itemTrabalhoIdParam);
            setItemTrabalho(item);

            const planejamentoList = await getPlanejamentoByItemTrabalho(itemTrabalhoIdParam);
            if (Array.isArray(planejamentoList) && planejamentoList.length > 0) {
              const planejamento = planejamentoList[0];
              const pAno = planejamento.dataEmissao ? planejamento.dataEmissao.slice(0, 4) : new Date().getFullYear();
              const pNumeroAno = `Planejamento nº ${planejamento.id}/${pAno}`;

              setPlanejamentoRef({
                id: planejamento.id,
                nome: planejamento.nome || 'Planejamento de Auditoria',
                numeroAno: pNumeroAno
              });

              // Mapeando questões do Planejamento e adicionando Fato Encontrado e Evidência
              const questoesImportadas = (planejamento.questoes || []).map((q, idx) => ({
                id: -(idx + 1),
                gerencia: q.gerencia || '',
                gerenciaDestinataria: q.gerenciaDestinataria || q.gerencia || '',
                questao: q.questao || '',
                conteudo: q.conteudo || q.questao || '',
                criterio: q.criterio || '',
                criterios: q.criterios || q.criterio || '',
                tecnicas: q.tecnicas || '',
                riscos: q.riscos || '',
                fatoEncontrado: '',
                evidencia: '',
                ordem: idx + 1
              }));

              const initOpen = {};
              questoesImportadas.forEach((_, idx) => { initOpen[idx] = true; });
              setOpenQuestions(initOpen);

              setFormData(prev => ({
                ...prev,
                nome: `Matriz de Achados - ${item?.nome || planejamento.nome || 'Auditoria'}`,
                descricao: `Matriz de Achados gerada a partir do ${pNumeroAno}`,
                itemTrabalhoId: Number(itemTrabalhoIdParam),
                planejamentoId: planejamento.id,
                planejamentoNumeroAno: pNumeroAno,
                planejamentoNome: planejamento.nome || 'Planejamento de Auditoria',
                questoes: questoesImportadas
              }));
              toast.info('Questões do Planejamento importadas com sucesso!');
            } else {
              toast.warn('Não foi encontrado um Planejamento criado para este Item de Trabalho. A Matriz de Achados requer o Planejamento prévio.');
              setFormData(prev => ({
                ...prev,
                itemTrabalhoId: Number(itemTrabalhoIdParam)
              }));
            }
          }
        }
        setIsLoaded(true);
      } catch (err) {
        console.error("Erro ao carregar dados da Matriz de Achados:", err);
        toast.error('Erro ao carregar dados. Tente novamente.');
        setIsLoaded(true);
      }
    };
    loadData();
  }, [id, itemTrabalhoIdParam]);

  // Carrega anexos ao inicializar
  useEffect(() => {
    if (isLoaded) {
      fetchAnexos();
    }
  }, [isLoaded, fetchAnexos]);

  // 3s Auto-Save Timer
  useEffect(() => {
    if (!isLoaded || !isDirty) return;
    const timer = setTimeout(() => {
      handleSave(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [formData, isLoaded, isDirty, handleSave]);

  // Helpers para manipulação das Questões
  const addQuestao = () => {
    setFormData(prev => ({
      ...prev,
      questoes: [
        ...prev.questoes,
        {
          id: -(prev.questoes.length + 1),
          gerencia: '',
          gerenciaDestinataria: '',
          questao: '',
          conteudo: '',
          criterio: '',
          criterios: '',
          tecnicas: '',
          riscos: '',
          fatoEncontrado: '',
          evidencia: '',
          ordem: prev.questoes.length + 1
        }
      ]
    }));
    setOpenQuestions(prev => ({ ...prev, [formData.questoes.length]: true }));
    setIsDirty(true);
  };

  const removeQuestao = (index) => {
    if (!window.confirm('Tem certeza que deseja excluir esta questão/achado da matriz?')) {
      return;
    }
    setFormData(prev => {
      const novas = [...prev.questoes];
      novas.splice(index, 1);
      return { ...prev, questoes: novas };
    });
    setIsDirty(true);
  };

  const updateQuestaoField = (index, field, value) => {
    setFormData(prev => {
      const novas = [...prev.questoes];
      const atual = { ...novas[index], [field]: value };
      if (field === 'gerenciaDestinataria') atual.gerencia = value;
      if (field === 'gerencia') atual.gerenciaDestinataria = value;
      if (field === 'conteudo') atual.questao = value;
      if (field === 'questao') atual.conteudo = value;
      if (field === 'criterios') atual.criterio = value;
      if (field === 'criterio') atual.criterios = value;
      novas[index] = atual;
      return { ...prev, questoes: novas };
    });
    setIsDirty(true);
  };

  // Drag & Drop
  const handleDragStart = (idx) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    setFormData(prev => {
      const arr = [...prev.questoes];
      const draggedItem = arr[draggedIdx];
      arr.splice(draggedIdx, 1);
      arr.splice(idx, 0, draggedItem);
      return { ...prev, questoes: arr };
    });
    setDraggedIdx(idx);
    setIsDirty(true);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  // Abrir o Planejamento referenciado em nova aba
  const handleOpenPlanejamento = () => {
    if (!planejamentoRef?.id && !formData.planejamentoId) {
      toast.warn('Nenhum Planejamento referenciado nesta Matriz.');
      return;
    }
    const pid = planejamentoRef?.id || formData.planejamentoId;
    window.open(`/planejamento/${pid}`, '_blank');
  };

  // Constrói descrição resumida do Item de Trabalho
  const getItemTrabalhoDesc = () => {
    if (!itemTrabalho) return 'Nenhum Item de Trabalho vinculado';
    const sigla = itemTrabalho.sigla ? `${itemTrabalho.sigla} - ` : '';
    const numAno = itemTrabalho.numero || itemTrabalho.ano ? ` (Nº ${itemTrabalho.numero || '-'}/${itemTrabalho.ano || '-'})` : '';
    return `${sigla}${itemTrabalho.nome || ''}${numAno}`;
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-screen bg-slate-100 font-sans overflow-hidden print:block print:h-auto print:overflow-visible print:bg-white">
      {/* HEADER / BARRA DE AÇÕES */}
      <header className="bg-white border-b border-gray-200 z-30 shadow-sm shrink-0 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Voltar"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="text-blue-600" size={24} />
                  <h1 className="text-xl font-bold text-gray-900">
                    {formData.nome || 'Matriz de Achados de Auditoria'}
                  </h1>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 font-semibold px-2.5 py-0.5 rounded-full">
                    {formData.status || 'Minuta'}
                  </span>
                  <span>Data de Emissão: {formatDataBr(formData.dataEmissao)}</span>
                  {lastSaved && (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle size={12} /> Salvo {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                  {isDirty && (
                    <span className="text-amber-600 flex items-center gap-1 font-medium">
                      <Clock size={12} /> Alterações não salvas (Auto-save em 3s...)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* CONTROLES DE LAYOUT E SALVAR */}
            <div className="flex items-center gap-3">
              {/* Expandir / Recolher Tudo */}
              <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={handleExpandAll}
                  className="px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-white rounded transition-colors"
                  title="Expandir todas as seções e anexos"
                >
                  Expandir Tudo
                </button>
                <button
                  type="button"
                  onClick={handleCollapseAll}
                  className="px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-white rounded transition-colors"
                  title="Recolher todas as seções e anexos"
                >
                  Recolher Tudo
                </button>
              </div>

              {/* Botões de MODO DE LAYOUT */}
              <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setLayoutMode('editor')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    layoutMode === 'editor'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Apenas Formulário"
                >
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('split')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                    layoutMode === 'split'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Formulário e Preview lado a lado"
                >
                  <Columns size={14} /> Lado a Lado
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('preview')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                    layoutMode === 'preview'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Apenas Preview A4 Paisagem"
                >
                  <Maximize2 size={14} /> Preview (A4 Paisagem)
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 transition-colors shadow-sm"
              >
                <Save size={18} />
                {saving ? 'Salvando...' : 'Salvar Matriz'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CORPO DA PÁGINA COM LAYOUT RESPONSIVO */}
      <main className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 h-full overflow-y-auto pb-20">
        <div className={`grid gap-8 ${
          layoutMode === 'split' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'
        }`}>

          {/* COLUNA ESQUERDA: FORMULÁRIO DE EDIÇÃO */}
          {layoutMode !== 'preview' && (
            <div className="space-y-6">

              {/* SANFONA 1: DADOS INICIAIS E VÍNCULOS */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div
                  className="bg-blue-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-blue-100/70 transition-colors"
                  onClick={() => handleToggleSection('dadosIniciais')}
                >
                  <div className="flex items-center gap-3">
                    {openSections.dadosIniciais ? (
                      <ChevronUp size={20} className="text-gray-500" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-500" />
                    )}
                    <Info className="text-blue-700" size={20} />
                    <h3 className="font-bold text-gray-900">
                      1. Vínculo com Item de Trabalho
                    </h3>
                  </div>
                </div>

                {openSections.dadosIniciais && (
                  <div className="p-6 space-y-6">
                    {/* Item de Trabalho Box */}
                    <div className="bg-gray-50 border border-gray-300 rounded-xl p-5 relative">
                      {/* Vínculo Info */}
                      <div className="flex items-center gap-2 mb-4">
                        <Lock size={16} className="text-gray-500" />
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                          Vínculo com Item de Trabalho
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Selected Item */}
                        <div className="col-span-full">
                          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                            Item de trabalho referenciado
                          </label>
                          <div className="relative">
                            <input
                               type="text"
                               disabled
                               className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none pr-24"
                               value={getItemTrabalhoDesc()}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <span className="text-[10px] bg-gray-200 text-gray-600 font-bold px-2 py-0.5 rounded uppercase border border-gray-300 shadow-sm">
                                Travado
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CARD 2: MATRIZ DE PLANEJAMENTO REFERENTE (READ ONLY + LINK) */}
                    <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Lock size={16} className="text-blue-700" />
                          <span className="text-xs font-bold text-blue-900 uppercase">
                            Matriz de Planejamento Referente
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {planejamentoRef?.numeroAno || formData.planejamentoNumeroAno || 'Planejamento de Auditoria'}
                        </div>
                        <div className="text-xs text-gray-600">
                          {planejamentoRef?.nome || formData.planejamentoNome || 'Sem descrição adicional'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleOpenPlanejamento}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm shrink-0"
                      >
                        <ExternalLink size={14} />
                        Acessar Planejamento
                      </button>
                    </div>

                    {/* CAMPOS GERAIS DA MATRIZ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                          Título / Nome da Matriz
                        </label>
                        <input
                          type="text"
                          value={formData.nome || ''}
                          onChange={(e) => handleChange('nome', e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
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
                  </div>
                )}
              </div>

              {/* SANFONA 2: QUESTÕES E ACHADOS DE AUDITORIA */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <div
                  className="bg-blue-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-blue-100/70 transition-colors rounded-t-xl"
                  onClick={() => handleToggleSection('questoes')}
                >
                  <div className="flex items-center gap-3">
                    {openSections.questoes ? (
                      <ChevronUp size={20} className="text-gray-500" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-500" />
                    )}
                    <FileSpreadsheet className="text-blue-700" size={20} />
                    <h3 className="font-bold text-gray-900">
                      2. Questões de Auditoria e Achados (Matriz de Achados)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      addQuestao();
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white font-semibold text-xs rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <Plus size={14} />
                    Adicionar Questão / Achado
                  </button>
                </div>

                {openSections.questoes && (
                  <div className="p-6 space-y-6">
                    {formData.questoes.length === 0 ? (
                      <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-gray-500">
                        <FileText className="mx-auto text-gray-400 mb-2" size={32} />
                        <p className="text-sm font-medium">
                          Nenhuma Questão ou Achado cadastrado.
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          As questões são importadas do Planejamento, ou você pode adicionar manualmente.
                        </p>
                      </div>
                    ) : (
                      formData.questoes.map((q, index) => (
                        <div
                          key={q.id || `questao-${index}`}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`bg-gray-50/70 border border-gray-200 rounded-xl p-5 space-y-5 transition-all ${
                            draggedIdx === index ? 'opacity-50 ring-2 ring-blue-500' : ''
                          }`}
                        >
                          {/* BARRA DE TÍTULO DA QUESTÃO COM ARRASTAR, FLECHINHA E DELETAR */}
                          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                            <div
                              className="flex items-center gap-3 flex-1 cursor-pointer select-none"
                              onClick={() => setOpenQuestions(prev => ({ ...prev, [index]: prev[index] === false ? true : false }))}
                            >
                              <span
                                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                                title="Arraste para reordenar"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <GripVertical size={20} />
                              </span>
                              {openQuestions[index] !== false ? (
                                <ChevronUp size={18} className="text-blue-700 shrink-0" />
                              ) : (
                                <ChevronDown size={18} className="text-blue-700 shrink-0" />
                              )}
                              <span className="font-bold text-sm text-blue-900">
                                Questão #{index + 1} — {q.gerenciaDestinataria || q.gerencia || 'Gerência Não Definida'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeQuestao(index)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1.5 rounded-lg transition-colors ml-2"
                              title="Remover Questão"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          {openQuestions[index] !== false && (
                            <div className="space-y-5 pt-2">
                              {/* 1. GERÊNCIA DESTINATÁRIA */}
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                                  Gerência Destinatária
                                </label>
                                <div className="flex flex-col sm:flex-row gap-3">
                                  <select
                                    value={q.gerenciaDestinataria || q.gerencia || ''}
                                    onChange={(e) => updateQuestaoField(index, 'gerenciaDestinataria', e.target.value)}
                                    className="flex-1 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                  >
                                    <option value="">Selecione</option>
                                    {(itemTrabalho?.gerencias || [
                                      'Gerência de Auditoria Interna - GAI',
                                      'Diretoria Executiva',
                                      'Gerência Administrativa - GA',
                                      'Gerência de Finanças - GF'
                                    ]).map((ger, idxGer) => (
                                      <option key={idxGer} value={ger.sigla || ger.nome || ger}>
                                        {ger.sigla ? `${ger.sigla} - ${ger.nome || ''}` : ger.nome || ger}
                                      </option>
                                    ))}
                                    <option value="Outra Gerência">Outra Gerência</option>
                                  </select>
                                  <input
                                    type="text"
                                    value={q.gerenciaDestinataria || q.gerencia || ''}
                                    onChange={(e) => updateQuestaoField(index, 'gerenciaDestinataria', e.target.value)}
                                    placeholder="Ou digite a sigla/nome..."
                                    className="flex-1 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                  />
                                </div>
                              </div>

                              {/* 2. CONTEÚDO DA QUESTÃO (RichTextEditor) */}
                          <div>
                            <RichTextEditor
                              title="Conteúdo da Questão de Auditoria"
                              initialContent={q.conteudo || q.questao || ''}
                              onChange={(val) => {
                                updateQuestaoField(index, 'conteudo', val);
                                updateQuestaoField(index, 'questao', val);
                              }}
                              onSave={() => {}}
                              globalCollapseAction={globalCollapseAction}
                              renderAttachments={() => (
                                <FileAttachmentManager
                                  files={getAnexosBySecao(`Questão Q${index + 1}`)}
                                  onUpload={(file) => handleUploadAnexo(file, `Questão Q${index + 1}`)}
                                  onDelete={handleDeleteAnexo}
                                  globalCollapseAction={globalCollapseAction}
                                />
                              )}
                            />
                          </div>

                          {/* 3. CRITÉRIOS APLICÁVEIS (RichTextEditor) */}
                          <div>
                            <RichTextEditor
                              title="Critérios Aplicáveis"
                              initialContent={q.criterios || q.criterio || ''}
                              onChange={(val) => {
                                updateQuestaoField(index, 'criterios', val);
                                updateQuestaoField(index, 'criterio', val);
                              }}
                              onSave={() => {}}
                              globalCollapseAction={globalCollapseAction}
                              renderAttachments={() => (
                                <FileAttachmentManager
                                  files={getAnexosBySecao(`Critérios Q${index + 1}`)}
                                  onUpload={(file) => handleUploadAnexo(file, `Critérios Q${index + 1}`)}
                                  onDelete={handleDeleteAnexo}
                                  globalCollapseAction={globalCollapseAction}
                                />
                              )}
                            />
                          </div>

                          {/* 4. TÉCNICAS DE AUDITORIA (Chips + SearchableSelect) */}
                          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                            <label className="block text-xs font-bold text-gray-700 uppercase">
                              Técnicas de Auditoria
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {(() => {
                                const arr = (q.tecnicas || '')
                                  .split(', ')
                                  .map(item => item.trim())
                                  .filter(Boolean);
                                if (arr.length === 0) {
                                  return (
                                    <span className="text-xs text-gray-400 italic">
                                      Nenhuma técnica selecionada.
                                    </span>
                                  );
                                }
                                return arr.map(tec => (
                                  <span
                                    key={tec}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 text-xs font-medium rounded-full border border-blue-200"
                                  >
                                    {tec}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const removed = arr.filter(t => t !== tec).join(', ');
                                        updateQuestaoField(index, 'tecnicas', removed);
                                      }}
                                      className="hover:text-red-600 focus:outline-none"
                                      title="Remover"
                                    >
                                      &times;
                                    </button>
                                  </span>
                                ));
                              })()}
                            </div>

                            <div className="pt-1">
                              <SearchableSelect
                                placeholder="+ Selecionar e Adicionar Técnica de Auditoria..."
                                options={tecnicasDb.filter(item => {
                                  const arr = (q.tecnicas || '').split(', ').map(i => i.trim());
                                  return !arr.includes(item);
                                }).map(item => ({ value: item, label: item }))}
                                value=""
                                onChange={(val) => {
                                  if (!val) return;
                                  const arr = (q.tecnicas || '').split(', ').map(i => i.trim()).filter(Boolean);
                                  if (!arr.includes(val)) {
                                    arr.push(val);
                                    updateQuestaoField(index, 'tecnicas', arr.join(', '));
                                  }
                                }}
                              />
                            </div>
                          </div>

                          {/* 5. RISCOS RELACIONADOS (Chips + SearchableSelect) */}
                          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                            <label className="block text-xs font-bold text-gray-700 uppercase">
                              Riscos Relacionados
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {(() => {
                                const arr = (q.riscos || '')
                                  .split(', ')
                                  .map(item => item.trim())
                                  .filter(Boolean);
                                if (arr.length === 0) {
                                  return (
                                    <span className="text-xs text-gray-400 italic">
                                      Nenhum risco relacionado selecionado.
                                    </span>
                                  );
                                }
                                return arr.map(r => (
                                  <span
                                    key={r}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 text-xs font-medium rounded-full border border-amber-200"
                                  >
                                    {r}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const removed = arr.filter(t => t !== r).join(', ');
                                        updateQuestaoField(index, 'riscos', removed);
                                      }}
                                      className="hover:text-red-600 focus:outline-none"
                                      title="Remover"
                                    >
                                      &times;
                                    </button>
                                  </span>
                                ));
                              })()}
                            </div>

                            <div className="pt-1">
                              <SearchableSelect
                                placeholder="+ Selecionar e Adicionar Risco Relacionado..."
                                options={riscosDb.filter(item => {
                                  const arr = (q.riscos || '').split(', ').map(i => i.trim());
                                  return !arr.includes(item);
                                }).map(item => ({ value: item, label: item }))}
                                value=""
                                onChange={(val) => {
                                  if (!val) return;
                                  const arr = (q.riscos || '').split(', ').map(i => i.trim()).filter(Boolean);
                                  if (!arr.includes(val)) {
                                    arr.push(val);
                                    updateQuestaoField(index, 'riscos', arr.join(', '));
                                  }
                                }}
                              />
                            </div>
                          </div>

                          {/* 6. FATO ENCONTRADO (RichTextEditor + Anexos) */}
                          <div>
                            <RichTextEditor
                              title="Fato Encontrado (Achado)"
                              initialContent={q.fatoEncontrado || ''}
                              onChange={(val) => updateQuestaoField(index, 'fatoEncontrado', val)}
                              onSave={() => {}}
                              globalCollapseAction={globalCollapseAction}
                              renderAttachments={() => (
                                <FileAttachmentManager
                                  files={getAnexosBySecao(`Fato Encontrado Q${index + 1}`)}
                                  onUpload={(file) => handleUploadAnexo(file, `Fato Encontrado Q${index + 1}`)}
                                  onDelete={handleDeleteAnexo}
                                  globalCollapseAction={globalCollapseAction}
                                />
                              )}
                            />
                          </div>

                          {/* 7. EVIDÊNCIAS / ANEXOS DE EVIDÊNCIA (RichTextEditor + Anexos) */}
                          <div>
                            <RichTextEditor
                              title="Evidência(s) Comprobatória(s)"
                              initialContent={q.evidencia || ''}
                              onChange={(val) => updateQuestaoField(index, 'evidencia', val)}
                              onSave={() => {}}
                              globalCollapseAction={globalCollapseAction}
                              renderAttachments={() => (
                                <FileAttachmentManager
                                  files={getAnexosBySecao(`Evidência Q${index + 1}`)}
                                  onUpload={(file) => handleUploadAnexo(file, `Evidência Q${index + 1}`)}
                                  onDelete={handleDeleteAnexo}
                                  globalCollapseAction={globalCollapseAction}
                                />
                              )}
                            />
                            <p className="text-[11px] text-gray-500 mt-1 pl-1">
                              * Os arquivos enviados em "Anexos" desta seção e de Fato Encontrado estarão disponíveis com link direto para download na Matriz de Achados.
                            </p>
                          </div>
                        </div>
                      )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COLUNA DIREITA (OU MODO PREVIEW): TABELA DA MATRIZ EM A4 PAISAGEM */}
          {layoutMode !== 'editor' && (
            <div className={`overflow-x-auto ${layoutMode === 'preview' ? 'col-span-full' : ''}`}>
              <div className="max-w-[1100px] w-full mx-auto print-landscape-page bg-white shadow-xl rounded-xl p-8 border border-gray-300 min-h-[750px] space-y-6">

                {/* BANNER INSTITUCIONAL E LOGO */}
                <div className="flex items-center justify-between border-b-2 border-gray-800 pb-4">
                  <div className="flex items-center gap-4">
                    <img
                      src="/assets/ghc_cabecalho.png"
                      alt="Logo GHC"
                      className="h-12 object-contain"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div>
                      <h2 className="text-sm font-bold text-gray-900 uppercase">
                        SISAUDIN - Sistema de Auditoria Interna
                      </h2>
                      <p className="text-xs text-gray-600">
                        Grupo Hospitalar Conceição - Ministério da Saúde
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-gray-900 block">
                      MATRIZ DE ACHADOS DE AUDITORIA
                    </span>
                    <span className="text-xs text-gray-500">
                      Emitido em: {formatDataBr(formData.dataEmissao)}
                    </span>
                  </div>
                </div>

                {/* BLOCO DE REFERÊNCIAS DO CABEÇALHO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200 text-xs">
                  <div className="space-y-1">
                    <div className="font-bold text-gray-800 uppercase border-b border-gray-200 pb-1">
                      Item de Trabalho Referente
                    </div>
                    <div className="font-semibold text-gray-900">
                      {getItemTrabalhoDesc()}
                    </div>
                    {itemTrabalho && (
                      <div className="text-gray-600 space-y-0.5">
                        <div><span className="font-bold">Objeto:</span> {itemTrabalho.objeto || '-'}</div>
                        <div><span className="font-bold">Objetivo:</span> {itemTrabalho.objetivo || '-'}</div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="font-bold text-blue-900 uppercase border-b border-gray-200 pb-1 flex items-center justify-between">
                      <span>Matriz de Planejamento Referente</span>
                      <button
                        type="button"
                        onClick={handleOpenPlanejamento}
                        className="text-blue-600 hover:underline inline-flex items-center gap-1 font-semibold"
                      >
                        Acessar <ExternalLink size={12} />
                      </button>
                    </div>
                    <div className="font-semibold text-gray-900">
                      {planejamentoRef?.numeroAno || formData.planejamentoNumeroAno || 'Planejamento de Auditoria'}
                    </div>
                    <div className="text-gray-600">
                      {planejamentoRef?.nome || formData.planejamentoNome || 'Sem descrição adicional'}
                    </div>
                  </div>
                </div>

                {/* TABELA DA MATRIZ DE ACHADOS */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-xs">
                    <thead>
                      <tr className="bg-[#1a472a] text-white">
                        <th className="border border-gray-300 p-2 text-center w-12">Nº</th>
                        <th className="border border-gray-300 p-2 text-left w-36">Gerência Destino</th>
                        <th className="border border-gray-300 p-2 text-left">Questão</th>
                        <th className="border border-gray-300 p-2 text-left w-36">Riscos</th>
                        <th className="border border-gray-300 p-2 text-left w-36">Técnicas</th>
                        <th className="border border-gray-300 p-2 text-left w-44">Critérios</th>
                        <th className="border border-gray-300 p-2 text-left w-48 bg-emerald-900">Fato Encontrado</th>
                        <th className="border border-gray-300 p-2 text-left w-44 bg-emerald-950">Evidências</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.questoes.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-8 text-gray-500 italic">
                            Nenhuma Questão / Achado cadastrado na Matriz.
                          </td>
                        </tr>
                      ) : (
                        formData.questoes.map((q, idx) => {
                          const num = idx + 1;
                          // Obter arquivos anexados em Fato Encontrado e Evidência
                          const evAnexos = [
                            ...getAnexosBySecao(`Evidência Q${num}`),
                            ...getAnexosBySecao(`Fato Encontrado Q${num}`),
                            ...getAnexosBySecao(`Questão Q${num}`)
                          ];

                          return (
                            <tr key={idx} className="hover:bg-gray-50 align-top">
                              <td className="border border-gray-300 p-2 text-center font-bold bg-gray-50">
                                {num}
                              </td>
                              <td className="border border-gray-300 p-2 font-semibold text-gray-800">
                                {q.gerenciaDestinataria || q.gerencia || '-'}
                              </td>
                              <td className="border border-gray-300 p-2">
                                <div
                                  className="prose prose-xs max-w-none text-gray-700 leading-relaxed"
                                  dangerouslySetInnerHTML={{
                                    __html: q.conteudo || q.questao || 'Sem conteúdo'
                                  }}
                                />
                              </td>
                              <td className="border border-gray-300 p-2 text-gray-700">
                                {q.riscos ? (
                                  <ul className="list-disc list-inside space-y-1">
                                    {q.riscos.split(', ').map((r, i) => (
                                      <li key={i}>{r}</li>
                                    ))}
                                  </ul>
                                ) : '-'}
                              </td>
                              <td className="border border-gray-300 p-2 text-gray-700">
                                {q.tecnicas ? (
                                  <ul className="list-disc list-inside space-y-1">
                                    {q.tecnicas.split(', ').map((t, i) => (
                                      <li key={i}>{t}</li>
                                    ))}
                                  </ul>
                                ) : '-'}
                              </td>
                              <td className="border border-gray-300 p-2">
                                <div
                                  className="prose prose-xs max-w-none text-gray-700 leading-relaxed"
                                  dangerouslySetInnerHTML={{
                                    __html: q.criterios || q.criterio || '-'
                                  }}
                                />
                              </td>
                              {/* DESTAQUE: FATO ENCONTRADO */}
                              <td className="border border-gray-300 p-2 bg-emerald-50/40">
                                <div
                                  className="prose prose-xs max-w-none text-gray-800 leading-relaxed font-medium"
                                  dangerouslySetInnerHTML={{
                                    __html: q.fatoEncontrado || '<span class="text-gray-400 italic">Não informado</span>'
                                  }}
                                />
                              </td>
                              {/* DESTAQUE: EVIDÊNCIAS COM LINKS PARA ARQUIVOS UPLOADED */}
                              <td className="border border-gray-300 p-2 bg-emerald-50/70">
                                <div className="space-y-2">
                                  {q.evidencia && (
                                    <div
                                      className="prose prose-xs max-w-none text-gray-800 leading-relaxed"
                                      dangerouslySetInnerHTML={{ __html: q.evidencia }}
                                    />
                                  )}
                                  {evAnexos.length > 0 ? (
                                    <div className="space-y-1 pt-1 border-t border-emerald-200">
                                      <div className="text-[10px] font-bold text-emerald-900 uppercase flex items-center gap-1">
                                        <Paperclip size={10} /> Arquivos / Evidências:
                                      </div>
                                      <ul className="space-y-1">
                                        {evAnexos.map(file => (
                                          <li key={file.id}>
                                            <a
                                              href={file.url || `/api/anexos/${file.id}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-700 hover:underline inline-flex items-center gap-1 text-[11px] font-semibold break-all"
                                              title="Clique para abrir o documento de evidência"
                                            >
                                              <ExternalLink size={10} className="shrink-0" />
                                              {file.nomeArquivo || file.nome || 'Documento Anexado'}
                                            </a>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ) : (
                                    !q.evidencia && (
                                      <span className="text-gray-400 italic text-xs">
                                        Nenhuma evidência anexada
                                      </span>
                                    )
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* RODAPÉ DO PREVIEW A4 */}
                <div className="pt-6 border-t border-gray-300 flex items-center justify-between text-xs text-gray-500">
                  <span>
                    SISAUDIN &bull; Sistema de Gestão de Auditoria Interna do Grupo Hospitalar Conceição
                  </span>
                  <span>
                    Página 1 &bull; Documento de Matriz de Achados de Auditoria
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
