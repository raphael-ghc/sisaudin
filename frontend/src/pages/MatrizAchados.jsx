import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Columns,
  Maximize2,
  FileSpreadsheet,
  ExternalLink,
  Paperclip,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import RichTextEditor from '../components/RichTextEditor';
import FileAttachmentManager from '../components/FileAttachmentManager';
import { getMatrizAchadosById, updateMatrizAchados } from '../api/matrizAchadosApi';
import { getItemTrabalhoById } from '../api/itemTrabalhoApi';
import api from '../api/axiosInstance';
import { API_URL } from '../api/config';
import imgCabecalho from '../img/ghc_cabecalho.png';

// Matriz de Achados: as questões vêm do Planejamento do item (gerências, conteúdo, critérios, técnicas
// e riscos são só para leitura aqui). Cada questão recebe um ou mais fatos encontrados, cada um com
// sua evidência; no documento, cada fato ocupa uma linha.

const novaChave = () => `f${Date.now()}${Math.random().toString(36).slice(2, 8)}`;

const listaNomes = (lista, rotulo = (x) => x?.nome || '') =>
  (Array.isArray(lista) ? lista : []).map(rotulo).filter(Boolean);

const separarTexto = (txt) => String(txt || '').split(',').map(s => s.trim()).filter(Boolean);

// Dados exibidos da questão: da questão do Planejamento ligada ou, nas questões antigas sem ligação, da cópia gravada.
const dadosQuestao = (q) => {
  const qp = q?.questaoPlanejamento;
  if (qp) {
    return {
      ligada: true,
      gerencias: listaNomes(qp.gerencias, g => g?.sigla || g?.nome),
      conteudo: qp.conteudo || qp.questao || '',
      criterios: qp.criterios || qp.criterio || '',
      tecnicas: listaNomes(qp.tecnicas),
      riscos: listaNomes(qp.riscos)
    };
  }
  return {
    ligada: false,
    gerencias: [q?.gerenciaDestinataria || q?.gerencia].filter(Boolean),
    conteudo: q?.conteudo || q?.questao || '',
    criterios: q?.criterios || q?.criterio || '',
    tecnicas: separarTexto(q?.tecnicas),
    riscos: separarTexto(q?.riscos)
  };
};

// Seções dos anexos de cada fato (pelo id do fato).
const secaoFato = (f) => (f?.id ? `Fato Matriz ${f.id}` : null);
const secaoEvidencia = (f) => (f?.id ? `Evidência Matriz ${f.id}` : null);

const comChaves = (matriz) => ({
  ...matriz,
  questoes: (matriz?.questoes || []).map(q => ({
    ...q,
    fatos: (q.fatos || []).map(f => ({ ...f, _k: f._k || novaChave() }))
  }))
});

export default function MatrizAchados() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const itemTrabalhoIdParam = searchParams.get('itemTrabalhoId')
    ? String(searchParams.get('itemTrabalhoId')).split(':')[0]
    : null;
  const navigate = useNavigate();

  const [isLoaded, setIsLoaded] = useState(false);
  const [erroCarga, setErroCarga] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Layout de visualização: 'editor' | 'split' | 'preview'
  const [layoutMode, setLayoutMode] = useState('split');

  const [openSections, setOpenSections] = useState({ dadosIniciais: true, questoes: true });
  const [openQuestions, setOpenQuestions] = useState({});
  const [globalCollapseAction, setGlobalCollapseAction] = useState(null);

  const [itemTrabalho, setItemTrabalho] = useState(null);
  const [anexos, setAnexos] = useState([]);

  const [formData, setFormData] = useState({
    id: null,
    nome: 'Matriz de Achados de Auditoria',
    status: 'Minuta',
    dataEmissao: new Date().toISOString().slice(0, 10),
    planejamentoId: null,
    planejamentoNumeroAno: '',
    planejamentoNome: '',
    questoes: []
  });

  // Evita salvamentos sobrepostos (o automático e o manual).
  const salvandoRef = useRef(false);
  // Conta as edições: o que foi digitado durante uma gravação continua pendente depois dela.
  const versaoRef = useRef(0);
  const marcarAlterado = () => {
    versaoRef.current += 1;
    setIsDirty(true);
  };

  const itemId = formData.itemTrabalho?.id || formData.itemTrabalhoId || itemTrabalho?.id || itemTrabalhoIdParam;

  // ---------------------------------------------------------------------------------------------
  // Carga

  const carregarItem = async (idItem) => {
    if (!idItem) return;
    try {
      const res = await getItemTrabalhoById(idItem);
      const it = res?.data?.data || res?.data || res;
      if (it && it.id) setItemTrabalho(it);
    } catch (e) {
      console.warn('Não foi possível carregar o item de trabalho', e);
    }
  };

  useEffect(() => {
    const carregar = async () => {
      setIsLoaded(false);
      setErroCarga(null);
      try {
        if (id && id !== 'novo') {
          let matriz = await getMatrizAchadosById(id);
          // Traz as questões incluídas no Planejamento depois da última visita.
          try {
            const res = await api.post(`/matriz-achados/${id}/sincronizar`);
            if (res?.data?.id) matriz = res.data;
          } catch (e) {
            console.warn('Matriz não sincronizada com o Planejamento', e);
          }
          setFormData(comChaves(matriz));
          await carregarItem(matriz?.itemTrabalhoId || matriz?.itemTrabalho?.id);
        } else if (itemTrabalhoIdParam) {
          // Criação: importa as questões do Planejamento (ou abre a Matriz que o item já tem).
          const res = await api.post(`/matriz-achados/item/${itemTrabalhoIdParam}/importar-planejamento`);
          if (res?.data?.id) {
            navigate(`/matriz-achados/${res.data.id}?itemTrabalhoId=${itemTrabalhoIdParam}`, { replace: true });
            return;
          }
        } else {
          setErroCarga('Abra a Matriz de Achados pelo item de trabalho (Criar Documento → Matriz de Achados).');
        }
      } catch (err) {
        console.error('Erro ao carregar a Matriz de Achados:', err);
        setErroCarga(err?.response?.data?.error || 'Erro ao carregar a Matriz de Achados. Tente novamente.');
      }
      setIsLoaded(true);
    };
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, itemTrabalhoIdParam]);

  const fetchAnexos = useCallback(async () => {
    if (!itemId) return;
    try {
      const res = await api.get(`/anexos/item/${itemId}`, { params: { documento: 'MatrizAchados' } });
      if (Array.isArray(res.data)) setAnexos(res.data);
    } catch (err) {
      console.error('Erro ao buscar anexos:', err);
    }
  }, [itemId]);

  useEffect(() => {
    if (isLoaded) fetchAnexos();
  }, [isLoaded, fetchAnexos]);

  // ---------------------------------------------------------------------------------------------
  // Salvamento (só cabeçalho e fatos; as questões não mudam por aqui)

  const montarEnvio = (dados) => ({
    id: dados.id,
    nome: dados.nome,
    descricao: dados.descricao,
    status: dados.status,
    dataEmissao: dados.dataEmissao || null,
    questoes: (dados.questoes || []).map(q => ({
      id: q.id,
      fatos: (q.fatos || []).map(f => ({ id: f.id || null, fato: f.fato || '', evidencia: f.evidencia || '' }))
    }))
  });

  // Completa só os ids dos fatos novos; o texto digitado durante a requisição não é sobrescrito.
  const mesclarResposta = (atual, salvo) => {
    const salvasPorId = new Map((salvo.questoes || []).map(q => [q.id, q]));
    return {
      ...atual,
      planejamentoNumeroAno: salvo.planejamentoNumeroAno ?? atual.planejamentoNumeroAno,
      questoes: (atual.questoes || []).map(q => {
        const salva = salvasPorId.get(q.id);
        if (!salva) return q;
        const fatosSalvos = salva.fatos || [];
        if (!(q.fatos || []).some((f, i) => !f.id && fatosSalvos[i]?.id)) return q;
        return {
          ...q,
          fatos: q.fatos.map((f, i) => (!f.id && fatosSalvos[i]?.id ? { ...f, id: fatosSalvos[i].id } : f))
        };
      })
    };
  };

  const handleSave = useCallback(async (isSilent = false) => {
    if (!formData.id || salvandoRef.current) return;
    salvandoRef.current = true;
    const versaoEnviada = versaoRef.current;
    if (!isSilent) setSaving(true);
    try {
      const salvo = await updateMatrizAchados(formData.id, montarEnvio(formData));
      if (salvo && salvo.id) {
        setFormData(prev => mesclarResposta(prev, salvo));
        if (versaoRef.current === versaoEnviada) setIsDirty(false);
        setLastSaved(new Date());
        if (!isSilent) toast.success('Matriz de Achados salva com sucesso!');
      }
    } catch (err) {
      console.error('Erro ao salvar Matriz de Achados:', err);
      toast.error(err?.response?.data?.error || 'Erro ao salvar a Matriz de Achados.', { toastId: 'matriz-erro-salvar' });
    } finally {
      salvandoRef.current = false;
      if (!isSilent) setSaving(false);
    }
  }, [formData]);

  // Salvamento automático 3 s depois da última alteração.
  useEffect(() => {
    if (!isLoaded || !isDirty) return;
    const timer = setTimeout(() => handleSave(true), 3000);
    return () => clearTimeout(timer);
  }, [formData, isLoaded, isDirty, handleSave]);

  const handleSincronizar = async () => {
    if (!formData.id) return;
    setSincronizando(true);
    try {
      if (isDirty) await handleSave(true);
      const res = await api.post(`/matriz-achados/${formData.id}/sincronizar`);
      if (res?.data?.id) {
        setFormData(prev => {
          // Mantém os fatos da tela (podem ter edição ainda não salva) e atualiza as questões.
          const fatosDaTela = new Map((prev.questoes || []).map(q => [q.id, q.fatos]));
          const novo = comChaves(res.data);
          return {
            ...novo,
            questoes: novo.questoes.map(q => (fatosDaTela.has(q.id) ? { ...q, fatos: fatosDaTela.get(q.id) } : q))
          };
        });
        toast.success('Questões atualizadas a partir do Planejamento.');
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Não foi possível atualizar a partir do Planejamento.');
    } finally {
      setSincronizando(false);
    }
  };

  // ---------------------------------------------------------------------------------------------
  // Edição

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    marcarAlterado();
  };

  const alterarFatos = (qIndex, transformar) => {
    setFormData(prev => {
      const questoes = [...prev.questoes];
      const q = { ...questoes[qIndex] };
      q.fatos = transformar([...(q.fatos || [])]);
      questoes[qIndex] = q;
      return { ...prev, questoes };
    });
    marcarAlterado();
  };

  const adicionarFato = (qIndex) => {
    alterarFatos(qIndex, fatos => [...fatos, { _k: novaChave(), fato: '', evidencia: '' }]);
    setOpenQuestions(prev => ({ ...prev, [qIndex]: true }));
  };

  const atualizarFato = (qIndex, fIndex, campo, valor) => {
    alterarFatos(qIndex, fatos => {
      fatos[fIndex] = { ...fatos[fIndex], [campo]: valor };
      return fatos;
    });
  };

  const removerFato = async (qIndex, fIndex) => {
    const fato = formData.questoes[qIndex]?.fatos?.[fIndex];
    if (!fato) return;
    const anexosDoFato = anexos.filter(a => a.secao === secaoFato(fato) || a.secao === secaoEvidencia(fato));
    const aviso = anexosDoFato.length > 0
      ? `Excluir o fato ${qIndex + 1}.${fIndex + 1} e os ${anexosDoFato.length} anexo(s) dele?`
      : `Excluir o fato ${qIndex + 1}.${fIndex + 1}?`;
    if (!window.confirm(aviso)) return;
    for (const a of anexosDoFato) {
      try {
        await api.delete(`/anexos/${a.id}`);
      } catch (e) {
        console.error('Erro ao excluir anexo do fato', e);
      }
    }
    setAnexos(prev => prev.filter(a => !anexosDoFato.some(x => x.id === a.id)));
    alterarFatos(qIndex, fatos => fatos.filter((_, i) => i !== fIndex));
  };

  const moverFato = (qIndex, fIndex, direcao) => {
    alterarFatos(qIndex, fatos => {
      const destino = fIndex + direcao;
      if (destino < 0 || destino >= fatos.length) return fatos;
      [fatos[fIndex], fatos[destino]] = [fatos[destino], fatos[fIndex]];
      return fatos;
    });
  };

  // ---------------------------------------------------------------------------------------------
  // Anexos

  const handleUploadAnexo = async (file, secao) => {
    if (!secao) {
      toast.info('Aguarde alguns segundos: o fato está sendo salvo. Depois disso, anexe o arquivo.');
      return;
    }
    if (!itemId) {
      toast.warn('É necessário ter o Item de Trabalho vinculado para anexar arquivos.');
      return;
    }
    const uploadForm = new FormData();
    uploadForm.append('file', file);
    uploadForm.append('itemTrabalhoId', itemId);
    uploadForm.append('documento', 'MatrizAchados');
    uploadForm.append('secao', secao);
    try {
      const res = await api.post('/anexos/upload', uploadForm, { headers: { 'Content-Type': 'multipart/form-data' } });
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

  const getAnexosBySecao = (secao) => (secao ? anexos.filter(a => a.secao === secao) : []);

  // ---------------------------------------------------------------------------------------------
  // Auxiliares de exibição

  const formatDataBr = (val) => {
    if (!val) return '-';
    const partes = String(val).split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : val;
  };

  const getItemTrabalhoDesc = () => {
    if (!itemTrabalho) return 'Nenhum Item de Trabalho vinculado';
    const num = itemTrabalho.numeroReferencia ? String(itemTrabalho.numeroReferencia).padStart(2, '0') : '';
    return `${itemTrabalho.sigla || 'S/ TIPO'} - ${num}/${itemTrabalho.anoReferencia || ''} - ${itemTrabalho.objetoAuditado || 'Sem objeto auditado'}`;
  };

  const handleOpenPlanejamento = () => {
    if (!formData.planejamentoId) {
      toast.warn('Nenhum Planejamento referenciado nesta Matriz.');
      return;
    }
    window.open(`/planejamento/${formData.planejamentoId}`, '_blank');
  };

  const handleExpandAll = () => {
    setOpenSections({ dadosIniciais: true, questoes: true });
    const todas = {};
    formData.questoes.forEach((_, i) => { todas[i] = true; });
    setOpenQuestions(todas);
    setGlobalCollapseAction({ action: 'expand', ts: Date.now() });
  };

  const handleCollapseAll = () => {
    setOpenSections({ dadosIniciais: false, questoes: false });
    const nenhuma = {};
    formData.questoes.forEach((_, i) => { nenhuma[i] = false; });
    setOpenQuestions(nenhuma);
    setGlobalCollapseAction({ action: 'collapse', ts: Date.now() });
  };

  const linkAnexo = (a) => (
    <li key={a.id}>
      <a
        href={`${API_URL}/anexos/download/${a.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-700 hover:underline inline-flex items-center gap-1 text-[11px] font-semibold break-all"
        title="Abrir o arquivo"
      >
        <ExternalLink size={10} className="shrink-0" />
        {a.fileName || 'Documento anexado'}
      </a>
    </li>
  );

  // ---------------------------------------------------------------------------------------------

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (erroCarga) {
    return (
      <div className="max-w-xl mx-auto mt-16 bg-white border border-amber-200 rounded-xl shadow-sm p-8 text-center space-y-4">
        <AlertTriangle className="mx-auto text-amber-500" size={36} />
        <p className="text-gray-800 font-semibold">{erroCarga}</p>
        <button
          type="button"
          onClick={() => navigate(itemTrabalhoIdParam ? `/itens-trabalho?targetItemId=${itemTrabalhoIdParam}` : '/itens-trabalho')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
        >
          <ArrowLeft size={16} /> Voltar para Itens de Trabalho
        </button>
      </div>
    );
  }

  const questoes = formData.questoes || [];

  return (
    <div className="flex flex-col flex-1 h-full bg-slate-100 font-sans overflow-hidden print:block print:h-auto print:overflow-visible print:bg-white">
      {/* HEADER / BARRA DE AÇÕES */}
      <header className="bg-white border-b border-gray-200 z-30 shadow-sm shrink-0 print:hidden">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(itemId ? `/itens-trabalho?targetItemId=${itemId}` : '/itens-trabalho')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Voltar para Itens de Trabalho"
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
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 font-semibold px-2.5 py-0.5 rounded-full">
                    {formData.status || 'Minuta'}
                  </span>
                  <span>Data de Emissão: {formatDataBr(formData.dataEmissao)}</span>
                  {lastSaved && !isDirty && (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle size={12} /> Salvo {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                  {isDirty && (
                    <span className="text-amber-600 flex items-center gap-1 font-medium">
                      <Clock size={12} /> Alterações não salvas (salvamento automático em 3 s)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                <button type="button" onClick={handleExpandAll}
                  className="px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-white rounded transition-colors"
                  title="Expandir todas as seções e anexos">
                  Expandir Tudo
                </button>
                <button type="button" onClick={handleCollapseAll}
                  className="px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-white rounded transition-colors"
                  title="Recolher todas as seções e anexos">
                  Recolher Tudo
                </button>
              </div>

              <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                {[
                  { modo: 'editor', rotulo: 'Editor', titulo: 'Apenas Formulário', icone: null },
                  { modo: 'split', rotulo: 'Lado a Lado', titulo: 'Formulário e documento lado a lado', icone: <Columns size={14} /> },
                  { modo: 'preview', rotulo: 'Documento (A4 Paisagem)', titulo: 'Apenas o documento', icone: <Maximize2 size={14} /> }
                ].map(b => (
                  <button
                    key={b.modo}
                    type="button"
                    onClick={() => setLayoutMode(b.modo)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                      layoutMode === b.modo ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title={b.titulo}
                  >
                    {b.icone} {b.rotulo}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSincronizar}
                disabled={sincronizando}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-blue-200 text-blue-700 font-semibold text-sm rounded-xl hover:bg-blue-50 disabled:opacity-50 transition-colors"
                title="Traz as questões incluídas ou alteradas no Planejamento"
              >
                <RefreshCw size={16} className={sincronizando ? 'animate-spin' : ''} />
                Atualizar do Planejamento
              </button>

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

      {/* CORPO: formulário e documento com rolagens independentes */}
      <div className="flex flex-1 overflow-hidden print:block print:overflow-visible">

        {/* COLUNA 1: FORMULÁRIO */}
        <div className={`overflow-y-auto p-4 md:p-6 flex-1 min-w-0 print:hidden ${layoutMode === 'preview' ? 'hidden' : 'block'}`}>
          <div className="max-w-4xl mx-auto space-y-6 pb-24">

            {/* SANFONA 1: VÍNCULOS */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div
                className="bg-blue-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-blue-100/70 transition-colors"
                onClick={() => setOpenSections(prev => ({ ...prev, dadosIniciais: !prev.dadosIniciais }))}
              >
                <div className="flex items-center gap-3">
                  {openSections.dadosIniciais ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                  <Info className="text-blue-700" size={20} />
                  <h3 className="font-bold text-gray-900">1. Vínculo com Item de Trabalho e Planejamento</h3>
                </div>
              </div>

              {openSections.dadosIniciais && (
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Item de trabalho</label>
                    <div className="relative">
                      <input
                        type="text"
                        disabled
                        className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 pr-24"
                        value={getItemTrabalhoDesc()}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-gray-200 text-gray-600 font-bold px-2 py-0.5 rounded uppercase border border-gray-300">
                        Travado
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Lock size={16} className="text-blue-700" />
                        <span className="text-xs font-bold text-blue-900 uppercase">Matriz de Planejamento de origem</span>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formData.planejamentoNumeroAno || 'Planejamento de Auditoria'}
                      </div>
                      <div className="text-xs text-gray-600">
                        As questões, gerências, critérios, técnicas e riscos vêm do Planejamento. Para alterá-los, edite o Planejamento.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenPlanejamento}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm shrink-0"
                    >
                      <ExternalLink size={14} /> Acessar Planejamento
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Título / Nome da Matriz</label>
                      <input
                        type="text"
                        value={formData.nome || ''}
                        onChange={(e) => handleChange('nome', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Data de Emissão</label>
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

            {/* SANFONA 2: QUESTÕES E FATOS */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div
                className="bg-blue-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-blue-100/70 transition-colors rounded-t-xl"
                onClick={() => setOpenSections(prev => ({ ...prev, questoes: !prev.questoes }))}
              >
                <div className="flex items-center gap-3">
                  {openSections.questoes ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                  <FileSpreadsheet className="text-blue-700" size={20} />
                  <h3 className="font-bold text-gray-900">2. Questões de Auditoria — Fatos Encontrados e Evidências</h3>
                </div>
              </div>

              {openSections.questoes && (
                <div className="p-6 space-y-6">
                  {questoes.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-gray-500">
                      <FileText className="mx-auto text-gray-400 mb-2" size={32} />
                      <p className="text-sm font-medium">O Planejamento ainda não tem questões de auditoria.</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Cadastre as questões na Matriz de Planejamento e use "Atualizar do Planejamento".
                      </p>
                    </div>
                  ) : (
                    questoes.map((q, qIndex) => {
                      const d = dadosQuestao(q);
                      const aberta = openQuestions[qIndex] !== false;
                      const fatos = q.fatos || [];
                      return (
                        <div key={q.id || qIndex} className="bg-gray-50/70 border border-gray-200 rounded-xl p-5 space-y-4">
                          <div
                            className="flex items-center gap-3 cursor-pointer select-none pb-3 border-b border-gray-200"
                            onClick={() => setOpenQuestions(prev => ({ ...prev, [qIndex]: !aberta }))}
                          >
                            {aberta ? <ChevronUp size={18} className="text-blue-700 shrink-0" /> : <ChevronDown size={18} className="text-blue-700 shrink-0" />}
                            <span className="font-bold text-sm text-blue-900">
                              Questão #{qIndex + 1} — {d.gerencias.join(', ') || 'Gerência não definida'}
                            </span>
                            <span className="ml-auto text-xs text-gray-500 shrink-0">
                              {fatos.length} fato(s)
                            </span>
                          </div>

                          {aberta && (
                            <>
                              {/* Dados da questão (somente leitura) */}
                              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 text-sm">
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                                  <Lock size={13} /> Da Matriz de Planejamento (somente leitura)
                                </div>
                                {!d.ligada && (
                                  <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                    Questão da versão anterior, sem ligação com uma questão do Planejamento. Os dados abaixo são a cópia gravada na época.
                                  </div>
                                )}
                                <div>
                                  <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Questão</div>
                                  <div className="prose prose-sm max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: d.conteudo || '<em>Sem conteúdo</em>' }} />
                                </div>
                                <div>
                                  <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Critérios</div>
                                  <div className="prose prose-sm max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: d.criterios || '-' }} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                  <div>
                                    <div className="font-semibold text-gray-600 uppercase mb-1">Gerências</div>
                                    <div className="text-gray-800">{d.gerencias.join(', ') || '-'}</div>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-600 uppercase mb-1">Técnicas</div>
                                    <div className="text-gray-800">{d.tecnicas.join(', ') || '-'}</div>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-600 uppercase mb-1">Riscos</div>
                                    <div className="text-gray-800">{d.riscos.join(', ') || '-'}</div>
                                  </div>
                                </div>
                              </div>

                              {/* Fatos e evidências */}
                              {fatos.map((f, fIndex) => (
                                <div key={f.id || f._k} className="bg-white border border-emerald-200 rounded-xl p-4 space-y-4">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-emerald-900">Fato {qIndex + 1}.{fIndex + 1}</span>
                                    <div className="flex items-center gap-1">
                                      <button type="button" onClick={() => moverFato(qIndex, fIndex, -1)} disabled={fIndex === 0}
                                        className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg disabled:opacity-30" title="Subir">
                                        <ChevronUp size={16} />
                                      </button>
                                      <button type="button" onClick={() => moverFato(qIndex, fIndex, 1)} disabled={fIndex === fatos.length - 1}
                                        className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg disabled:opacity-30" title="Descer">
                                        <ChevronDown size={16} />
                                      </button>
                                      <button type="button" onClick={() => removerFato(qIndex, fIndex)}
                                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg" title="Excluir este fato">
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </div>
                                  <RichTextEditor
                                    title="Fato Encontrado (Achado)"
                                    initialContent={f.fato || ''}
                                    onChange={(val) => atualizarFato(qIndex, fIndex, 'fato', val)}
                                    onSave={() => {}}
                                    globalCollapseAction={globalCollapseAction}
                                    renderAttachments={() => (
                                      <FileAttachmentManager
                                        files={getAnexosBySecao(secaoFato(f))}
                                        onUpload={(file) => handleUploadAnexo(file, secaoFato(f))}
                                        onDelete={handleDeleteAnexo}
                                        globalCollapseAction={globalCollapseAction}
                                      />
                                    )}
                                  />
                                  <RichTextEditor
                                    title="Evidência(s)"
                                    initialContent={f.evidencia || ''}
                                    onChange={(val) => atualizarFato(qIndex, fIndex, 'evidencia', val)}
                                    onSave={() => {}}
                                    globalCollapseAction={globalCollapseAction}
                                    renderAttachments={() => (
                                      <FileAttachmentManager
                                        files={getAnexosBySecao(secaoEvidencia(f))}
                                        onUpload={(file) => handleUploadAnexo(file, secaoEvidencia(f))}
                                        onDelete={handleDeleteAnexo}
                                        globalCollapseAction={globalCollapseAction}
                                      />
                                    )}
                                  />
                                </div>
                              ))}

                              <button
                                type="button"
                                onClick={() => adicionarFato(qIndex)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
                              >
                                <Plus size={14} /> Adicionar fato e evidência
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUNA 2: DOCUMENTO (A4 PAISAGEM) */}
        <div className={`overflow-y-auto p-4 md:p-6 flex-1 min-w-0 ${layoutMode === 'editor' ? 'hidden' : 'block'}`}>
          <div className="overflow-x-auto">
            <div className="min-w-[900px] max-w-[1100px] w-full mx-auto print-landscape-page bg-white shadow-xl rounded-xl p-8 border border-gray-300 space-y-6">

              <div className="flex items-center justify-between border-b-2 border-gray-800 pb-4 gap-4">
                <img src={imgCabecalho} alt="GHC" style={{ maxHeight: '60px', maxWidth: '50%', height: 'auto' }} />
                <div className="text-right">
                  <span className="text-sm font-black text-gray-900 block">MATRIZ DE ACHADOS DE AUDITORIA</span>
                  <span className="text-xs text-gray-500">Emitido em: {formatDataBr(formData.dataEmissao)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-gray-800 uppercase border-b border-gray-200 pb-1">Item de Trabalho</div>
                  <div className="font-semibold text-gray-900">{getItemTrabalhoDesc()}</div>
                  {itemTrabalho && (
                    <div className="text-gray-600 space-y-0.5">
                      <div><span className="font-bold">Objeto:</span> {itemTrabalho.objetoAuditado || '-'}</div>
                      <div><span className="font-bold">Objetivo:</span> {itemTrabalho.objetivoAuditoria || '-'}</div>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-blue-900 uppercase border-b border-gray-200 pb-1">Matriz de Planejamento de origem</div>
                  <div className="font-semibold text-gray-900">{formData.planejamentoNumeroAno || 'Planejamento de Auditoria'}</div>
                </div>
              </div>

              {/* Uma linha por fato. A primeira linha da questão traz os dados dela; as seguintes, só fato e evidência. */}
              <table className="w-full border-collapse border border-gray-300 text-xs">
                <thead>
                  <tr className="bg-[#1a472a] text-white">
                    <th className="border border-gray-300 p-2 text-center w-10">Nº</th>
                    <th className="border border-gray-300 p-2 text-left w-28">Gerência Destino</th>
                    <th className="border border-gray-300 p-2 text-left">Questão</th>
                    <th className="border border-gray-300 p-2 text-left w-28">Riscos</th>
                    <th className="border border-gray-300 p-2 text-left w-28">Técnicas</th>
                    <th className="border border-gray-300 p-2 text-left w-36">Critérios</th>
                    <th className="border border-gray-300 p-2 text-left w-48">Fato Encontrado</th>
                    <th className="border border-gray-300 p-2 text-left w-44">Evidências</th>
                  </tr>
                </thead>
                <tbody>
                  {questoes.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-8 text-gray-500 italic">Nenhuma questão na Matriz.</td>
                    </tr>
                  ) : questoes.flatMap((q, qIndex) => {
                    const d = dadosQuestao(q);
                    const linhas = (q.fatos || []).length > 0 ? q.fatos : [null];
                    return linhas.map((f, fIndex) => {
                      const primeira = fIndex === 0;
                      const anexosDoFato = f ? [...getAnexosBySecao(secaoFato(f)), ...getAnexosBySecao(secaoEvidencia(f))] : [];
                      const vazio = <td className="border border-gray-300 p-2"></td>;
                      return (
                        <tr key={`${q.id || qIndex}-${f ? (f.id || f._k) : 'sem-fato'}`} className="align-top">
                          {primeira ? (
                            <>
                              <td className="border border-gray-300 p-2 text-center font-bold bg-gray-50">{qIndex + 1}</td>
                              <td className="border border-gray-300 p-2 font-semibold text-gray-800">{d.gerencias.join(', ') || '-'}</td>
                              <td className="border border-gray-300 p-2">
                                <div className="prose prose-xs max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: d.conteudo || '-' }} />
                              </td>
                              <td className="border border-gray-300 p-2 text-gray-700">
                                {d.riscos.length ? <ul className="list-disc list-inside space-y-1">{d.riscos.map((r, i) => <li key={i}>{r}</li>)}</ul> : '-'}
                              </td>
                              <td className="border border-gray-300 p-2 text-gray-700">
                                {d.tecnicas.length ? <ul className="list-disc list-inside space-y-1">{d.tecnicas.map((t, i) => <li key={i}>{t}</li>)}</ul> : '-'}
                              </td>
                              <td className="border border-gray-300 p-2">
                                <div className="prose prose-xs max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: d.criterios || '-' }} />
                              </td>
                            </>
                          ) : (
                            <>{vazio}{vazio}{vazio}{vazio}{vazio}{vazio}</>
                          )}
                          <td className="border border-gray-300 p-2 bg-emerald-50/40">
                            {f ? (
                              <>
                                {(q.fatos || []).length > 1 && (
                                  <div className="text-[10px] font-bold text-emerald-900 mb-1">{qIndex + 1}.{fIndex + 1}</div>
                                )}
                                <div className="prose prose-xs max-w-none text-gray-800 leading-relaxed"
                                  dangerouslySetInnerHTML={{ __html: f.fato || '<span class="text-gray-400 italic">Não informado</span>' }} />
                              </>
                            ) : (
                              <span className="text-gray-400 italic">Não informado</span>
                            )}
                          </td>
                          <td className="border border-gray-300 p-2 bg-emerald-50/70">
                            {f?.evidencia && (
                              <div className="prose prose-xs max-w-none text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: f.evidencia }} />
                            )}
                            {anexosDoFato.length > 0 && (
                              <div className="space-y-1 pt-1 mt-1 border-t border-emerald-200">
                                <div className="text-[10px] font-bold text-emerald-900 uppercase flex items-center gap-1">
                                  <Paperclip size={10} /> Arquivos:
                                </div>
                                <ul className="space-y-1">{anexosDoFato.map(linkAnexo)}</ul>
                              </div>
                            )}
                            {!f?.evidencia && anexosDoFato.length === 0 && (
                              <span className="text-gray-400 italic">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>

              <div className="pt-6 border-t border-gray-300 flex items-center justify-between text-xs text-gray-500">
                <span>SISAUDIN &bull; Sistema de Gestão de Auditoria Interna do Grupo Hospitalar Conceição</span>
                <span>Matriz de Achados de Auditoria</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
