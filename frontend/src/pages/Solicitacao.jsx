import React, { useState, useCallback, useEffect } from 'react';
import DuplicateNumberModal from '../components/DuplicateNumberModal';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FileText, Calendar, Printer, Save, ArrowLeft, RefreshCw, ChevronDown, ChevronUp,
  CheckCircle2, Loader2, Info, PanelLeft, Columns, PanelRight
} from 'lucide-react';
import debounce from 'lodash.debounce';
import { getAllItensTrabalho, getItemTrabalhoById } from '../api/itemTrabalhoApi';
import { getSolicitacaoById, updateSolicitacaoById, createEmptySolicitacao } from '../api/solicitacaoApi';
import { getAllGerencias } from '../api/gerenciaApi';
import api from '../api/axiosInstance';
import { useAppContext } from '../contexts/AppContext';
import Status from '../components/Status';
import RichTextEditor from '../components/RichTextEditor';
import imgCabecalho from '../img/ghc_cabecalho.png';
import imgRodape from '../img/ghc_rodape.png';
import DocumentPdfViewerModal from '../components/DocumentPdfViewerModal';

const ORIENTACOES_PADRAO = 
  "Solicitamos especial atenção dessa área no sentido de que sejam fornecidas a esta Gerência de Auditoria Interna todas as informações requeridas no prazo acima estabelecido. Caso a temática esteja relacionada à outra área ou não seja aplicável, solicitamos a referida indicação e/ou justificativas. Em caso de impossibilidade de atendimento, ou não se verificando a situação arrolada, essa condição deve ser formalmente registrada com as devidas justificativas neste fluxo de Workflow.";

const INFORMACOES_PADRAO = 
  "Assim, solicitamos, em consonância com o disposto no artigo 26 da Lei nº 10.180, de 06/02/2001, a disponibilização de documentos, processos e/ou informações e/ou justificativas e/ou esclarecimentos sobre as ações adotadas, conforme formato abaixo estabelecido:\n\n1. ";

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

export default function Solicitacao() {

  const [showDuplicateModal, setShowDuplicateModal] = useState({ isOpen: false });

  const acceptSuggestion = (newNumero, newAno) => {
    setNumero(newNumero);
    setAno(newAno);
    setShowDuplicateModal({ isOpen: false });
  };

  const validateNumero = async (numeroToCheck, anoToCheck, currentId, itemId) => {
      if (!numeroToCheck || !anoToCheck) return true;
      try {
          const valRes = await api.get(`/documentos/check-number?entityName=Solicitacao&ano=${anoToCheck}&numero=${numeroToCheck}&itemTrabalhoId=${itemId || ''}&currentEntityId=${currentId || ''}`);
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const itemTrabalhoIdParam = searchParams.get('itemTrabalhoId');

  const [saId, setSaId] = useState(id && id !== 'novo' ? id : null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { jwtPayload } = useAppContext();

  // Modos de visualização (Editor, Lado a Lado, Preview)
  const [layoutMode, setLayoutMode] = useState(searchParams.get('view') === 'true' ? 'preview' : 'split');
  const [showPdfModal, setShowPdfModal] = useState(searchParams.get('pdf') === 'true');
  const [globalCollapseAction, setGlobalCollapseAction] = useState(null);
  const [isVinculoOpen, setIsVinculoOpen] = useState(true);

  // Campos do Documento
  const [selectedItemTrabalhoId, setSelectedItemTrabalhoId] = useState('');
  const [selectedItemData, setSelectedItemData] = useState(null);
  const [itensTrabalho, setItensTrabalho] = useState([]);
  const [gerenciasFullList, setGerenciasFullList] = useState([]);
  const [gerenciasDestinatarias, setGerenciasDestinatarias] = useState([]);

  const [ano, setAno] = useState(new Date().getFullYear());
  const [numero, setNumero] = useState('');
  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().split('T')[0]);
  const [prazoAtendimento, setPrazoAtendimento] = useState('');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [orientacoesGerais, setOrientacoesGerais] = useState(ORIENTACOES_PADRAO);
  const [informacoesSolicitadas, setInformacoesSolicitadas] = useState(INFORMACOES_PADRAO);
  const [solicitacoes, setSolicitacoes] = useState('');

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
        if (!id || id === 'novo') {
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
    const loadSa = async () => {
      setLoading(true);
      try {
        let currentSa;
        if (saId) {
          currentSa = await getSolicitacaoById(saId);
        } else {
          currentSa = await createEmptySolicitacao();
          setSaId(currentSa.id);
          const paramsToPass = new URLSearchParams(searchParams);
          const queryStr = paramsToPass.toString() ? `?${paramsToPass.toString()}` : '';
          navigate(`/solicitacao/${currentSa.id}${queryStr}`, { replace: true });
        }

        if (currentSa) {
          setAno(currentSa.ano || new Date().getFullYear());
          setNumero(currentSa.numero || '');
          setDataInicial(currentSa.dataInicial || '');
          setDataFinal(currentSa.dataFinal || '');
          setDataEmissao(currentSa.dataEmissao || new Date().toISOString().split('T')[0]);
          setPrazoAtendimento(currentSa.dataLimiteAtendimento || currentSa.prazoAtendimento || '');
          setOrientacoesGerais(currentSa.orientacoesGerais || ORIENTACOES_PADRAO);
          setInformacoesSolicitadas(currentSa.informacoesSolicitadas || INFORMACOES_PADRAO);
          setSolicitacoes(currentSa.solicitacoes || '');
          setGerenciasDestinatarias(currentSa.gerenciasDestinatarias || []);

          if (currentSa.itemTrabalho) {
            setSelectedItemTrabalhoId(currentSa.itemTrabalho.id);
            const res = await getItemTrabalhoById(currentSa.itemTrabalho.id);
            const itemFull = extractItemData(res);
            setSelectedItemData(itemFull);
          } else if (itemTrabalhoIdParam) {
            setSelectedItemTrabalhoId(Number(itemTrabalhoIdParam));
            const res = await getItemTrabalhoById(itemTrabalhoIdParam);
            const itemFull = extractItemData(res);
            setSelectedItemData(itemFull);
          }
        }

      } catch (err) {
        toast.error("Erro ao carregar Solicitação de Auditoria.");
      } finally {
        setLoading(false);
      }
    };
    loadSa();
  }, [saId, navigate]);

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
    } catch (err) {
      toast.error("Erro ao carregar dados do Item de Trabalho selecionado.");
    }
  };

  // Auto-save com debounce
  const debouncedSave = useCallback(
    debounce(async (id, payload, itemId, readOnlyMode = false) => {
      if (!id || readOnlyMode) return;

      if (!(await validateNumero(payload.numero, payload.ano, id, itemId))) return;
      try {
        await updateSolicitacaoById(id, payload, itemId || null);
        console.log('Autosaved Solicitação de Auditoria', payload);
      } catch (e) {
        console.error('Falha no auto-save da Solicitação de Auditoria', e);
      }
    }, 3000),
    []
  );

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

  useEffect(() => {
    if (saId && !loading && !isReadOnly) {
      debouncedSave(saId, {
        ano: ano ? parseInt(ano, 10) : null,
        numero: numero ? parseInt(numero, 10) : null,
        dataInicial: dataInicial || null,
        dataFinal: dataFinal || null,
        dataEmissao: dataEmissao || null,
        dataLimiteAtendimento: prazoAtendimento || null,
        orientacoesGerais: orientacoesGerais || ORIENTACOES_PADRAO,
        informacoesSolicitadas: informacoesSolicitadas || INFORMACOES_PADRAO,
        solicitacoes: solicitacoes || '',
        gerenciasDestinatarias: gerenciasDestinatarias.map(g => ({ id: g.id || g.gerenciaId, nome: g.nome || g }))
      }, selectedItemTrabalhoId, isReadOnly);
    }
  }, [ano, numero, dataInicial, dataFinal, dataEmissao, prazoAtendimento, orientacoesGerais, informacoesSolicitadas, solicitacoes, gerenciasDestinatarias, selectedItemTrabalhoId, saId, debouncedSave, loading, isReadOnly]);

  const handleSaveManual = async () => {
    if (!saId || isReadOnly) return;

    if (!(await validateNumero(numero, ano, saId, selectedItemTrabalhoId))) { setLoading(false); return; }
    setSaving(true);
    try {
      const payload = {
        ano: ano ? parseInt(ano, 10) : null,
        numero: numero ? parseInt(numero, 10) : null,
        dataInicial: dataInicial || null,
        dataFinal: dataFinal || null,
        dataEmissao: dataEmissao || null,
        dataLimiteAtendimento: prazoAtendimento || null,
        orientacoesGerais: orientacoesGerais || ORIENTACOES_PADRAO,
        informacoesSolicitadas: informacoesSolicitadas || INFORMACOES_PADRAO,
        solicitacoes: solicitacoes || '',
        gerenciasDestinatarias: gerenciasDestinatarias.map(g => ({ id: g.id || g.gerenciaId, nome: g.nome || g }))
      };

      await updateSolicitacaoById(saId, payload, selectedItemTrabalhoId || null);
      toast.success("Solicitação de Auditoria salva com sucesso!");
    } catch (err) {
      toast.error("Erro ao salvar Solicitação de Auditoria.");
    } finally {
      setSaving(false);
    }
  };

  const handleGerarPdfServidor = async () => {
    setIsGeneratingPdf(true);
    try {
      const element = document.getElementById('document-preview-container');
      if (!element) return;
      const clone = element.cloneNode(true);
      const images = clone.querySelectorAll('img');
      images.forEach(img => { img.src = img.src; });
      const docTitle = `Solicitacao_de_Auditoria_n_${numero ? String(numero).padStart(2, '0') : '00'}_${ano || new Date().getFullYear()}`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${docTitle}</title>
          <style>
             blockquote { border-left: 4px solid #cbd5e1 !important; padding: 12px 16px !important; color: #475569 !important; font-style: italic !important; margin: 16px 0 !important; background-color: #f8fafc !important; border-radius: 4px !important; display: block !important; }
             blockquote * { color: #475569 !important; font-style: italic !important; font-family: 'Calibri', sans-serif !important; }
             :root { --ghc-primary: #00767d; --ghc-secondary: #84c9bd; --paper-color: #ffffff; --text-color: #2d3748; --border-color: #cbd5e0; }
             body { background: white; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
             .sa-preview-page { color: var(--text-color); font-size: 10pt; line-height: 1.5; display: flex; flex-direction: column; align-items: center; }
             
             * {
               box-sizing: border-box;
             }

             @page { margin: 15mm 0; }
          </style>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          ${clone.outerHTML}
        </body>
        </html>
      `;
      const response = await api.post('/pdf/gerar-sem-sumario', { html: htmlContent, docName: docTitle, docVersion: 'Solicitação de Auditoria' }, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("PDF gerado com sucesso no servidor!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResetOrientacoes = () => {
    setOrientacoesGerais(ORIENTACOES_PADRAO);
    toast.info("Orientações gerais restauradas para o texto padrão.");
  };

  const handleResetInformacoes = () => {
    setInformacoesSolicitadas(INFORMACOES_PADRAO);
    toast.info("Informações solicitadas restauradas para o texto padrão.");
  };

  const formatDataBr = (dt) => {
    if (!dt) return '-';
    try {
      return new Date(dt + 'T12:00:00').toLocaleDateString('pt-BR');
    } catch (e) {
      return dt;
    }
  };

  const handleStatusChange = (novoStatus) => {
    toast.success(`Status atualizado para: ${novoStatus}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="animate-spin text-[#00767d]" size={36} />
        <span className="ml-3 text-gray-600 font-medium">Carregando Solicitação de Auditoria...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      
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
              <p className="text-xs text-gray-500">Módulo de Solicitação de Auditoria #{saId}</p>
            </div>
          </div>
          
          <div className="hidden md:block h-8 w-px bg-gray-300"></div>
          
          <Status statusInicial="NOVO" onChangeStatus={handleStatusChange} />

          {isReadOnly && (
            <div className="flex bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded text-xs font-medium ml-4 items-center gap-1.5 shadow-inner">
              <Info size={14} /> Somente Leitura
            </div>
          )}
        </div>

        {/* Centro/Esquerda: Botões de Ação Global (Expandir / Recolher Tudo) */}
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

        {/* Direita: Botões de Layout Mode */}
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
            COLUNA 1: O EDITOR DE SOLICITAÇÃO DE AUDITORIA
        ========================================= */}
        <div className={`overflow-y-auto p-4 md:p-8 flex-1 transition-all duration-300 print:hidden ${layoutMode === 'preview' ? 'hidden' : 'block'}`}>
          <div className="max-w-4xl mx-auto pb-20">
            <header className="mb-8 border-b-2 border-[#00767d] pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">Preenchimento da Solicitação de Auditoria</h2>
              <div className="flex flex-wrap items-center gap-3">
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
                  onClick={() => navigate('/solicitacoes')}
                  className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg border border-gray-200"
                >
                  <FileText size={18} className="mr-1.5" />
                  Ir para Lista de Solicitações
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
                    <h3 className="font-bold text-gray-900">Vínculo com Item de Trabalho e Prazos</h3>
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
                        disabled={isReadOnly || !!itemTrabalhoIdParam || (!!selectedItemTrabalhoId && !!saId)}
                      />

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Ano</label>
                        <input
                          type="number"
                          value={ano || ''}
                          disabled={isReadOnly}
                          onChange={(e) => setAno(e.target.value.replace(/\D/g, ''))}
                          className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#00767d] focus:outline-none text-sm disabled:opacity-50"
                          placeholder="2025"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Número</label>
                        <input
                          type="number"
                          value={numero || ''}
                          disabled={isReadOnly}
                          onChange={(e) => setNumero(e.target.value.replace(/\D/g, ''))}
                          className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#00767d] focus:outline-none text-sm disabled:opacity-50"
                          placeholder="2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Emissão</label>
                        <input
                          type="date"
                          value={dataEmissao}
                          disabled={isReadOnly}
                          onChange={(e) => setDataEmissao(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#00767d] focus:outline-none text-sm disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-red-700 mb-2">
                          Prazo para Atendimento (Destaque em Vermelho)
                        </label>
                        <input
                          type="date"
                          value={prazoAtendimento}
                          disabled={isReadOnly}
                          onChange={(e) => setPrazoAtendimento(e.target.value)}
                          className="w-full p-2 border border-red-300 rounded-md bg-red-50/30 focus:ring-2 focus:ring-red-500 focus:outline-none text-sm font-medium disabled:opacity-50"
                        />
                      </div>
                      {/*<div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Data Inicial (Trabalho)</label>
                        <input
                          type="date"
                          value={dataInicial}
                          disabled={isReadOnly}
                          onChange={(e) => setDataInicial(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#00767d] focus:outline-none text-sm disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Data Final (Trabalho)</label>
                        <input
                          type="date"
                          value={dataFinal}
                          disabled={isReadOnly}
                          onChange={(e) => setDataFinal(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#00767d] focus:outline-none text-sm disabled:opacity-50"
                        />
                      </div>*/}
                    </div>

                    {/* SELEÇÃO MÚLTIPLA DE GERÊNCIAS DESTINATÁRIAS */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Gerências Destinatárias da Solicitação
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
                              disabled={isReadOnly}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Informações Read-Only do Item de Trabalho selecionado */}
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
                            <span className="font-medium text-gray-800">Responsável (Contato): </span>
                            {selectedItemData.responsavel ? `${selectedItemData.responsavel.nome || selectedItemData.responsavel} - ${selectedItemData.responsavel.email || ''} (Ramal/Tel: ${selectedItemData.responsavel.telefone || ''})` : '-'}
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

            {/* CARD 2: III. ORIENTAÇÕES GERAIS */}
            <section className="mb-10">
              <div className="relative">
                <div className="absolute top-4 right-14 z-20">
                  {!isReadOnly && (
                    <button
                      onClick={handleResetOrientacoes}
                      className="inline-flex items-center px-2.5 py-1 text-xs bg-white hover:bg-gray-100 text-gray-700 rounded-md border border-gray-300 transition-colors font-medium shadow-sm"
                      title="Restaurar o texto padrão das orientações (sem texto riscado)"
                    >
                      <RefreshCw size={12} className="mr-1" />
                      Restaurar Padrão
                    </button>
                  )}
                </div>

                <RichTextEditor
                  title="III. ORIENTAÇÕES GERAIS"
                  subtitle="Salvo automaticamente após 3 segundos de inatividade."
                  initialContent={orientacoesGerais}
                  onChange={setOrientacoesGerais}
                  globalCollapseAction={globalCollapseAction}
                 readOnly={isReadOnly} />
              </div>
            </section>

            {/* CARD 3: IV. INFORMAÇÕES SOLICITADAS PELA AUDIN */}
            <section className="mb-10">
              <div className="relative">
                <div className="absolute top-4 right-14 z-20">
                  {!isReadOnly && (
                    <button
                      onClick={handleResetInformacoes}
                      className="inline-flex items-center px-2.5 py-1 text-xs bg-white hover:bg-gray-100 text-gray-700 rounded-md border border-gray-300 transition-colors font-medium shadow-sm"
                      title="Restaurar o texto padrão das solicitações (sem itens riscados)"
                    >
                      <RefreshCw size={12} className="mr-1" />
                      Restaurar Padrão
                    </button>
                  )}
                </div>

                <RichTextEditor
                  title="IV. INFORMAÇÕES SOLICITADAS PELA AUDIN"
                  subtitle="Insira os documentos, processos ou justificativas solicitadas."
                  initialContent={informacoesSolicitadas}
                  onChange={setInformacoesSolicitadas}
                  globalCollapseAction={globalCollapseAction}
                 readOnly={isReadOnly} />
              </div>
            </section>

            {/* CARD 4: V. SOLICITAÇÕES */}
            <section className="mb-10">
              <div className="relative">
                <RichTextEditor
                  title="V. SOLICITAÇÕES"
                  subtitle="Insira o detalhamento das solicitações realizadas."
                  initialContent={solicitacoes}
                  onChange={setSolicitacoes}
                  globalCollapseAction={globalCollapseAction}
                  readOnly={isReadOnly} />
              </div>
            </section>

          </div>
        </div>

        {/* =========================================
            COLUNA 2: O PREVIEW / DOCUMENTO EM TEMPO REAL
        ========================================= */}
        <div className={`bg-gray-200 overflow-y-auto p-4 md:p-8 border-l-2 border-gray-300 flex-1 transition-all duration-300 ${layoutMode === 'editor' ? 'hidden print:block' : 'block'}`}>
          <div className="max-w-4xl mx-auto pb-20 print:pb-0 print:max-w-none">
            
            <div className="flex justify-end items-center gap-3 mb-6 print:hidden">
              {/*<button 
                onClick={() => setShowPdfModal(true)}
                className="bg-[#00767d] hover:bg-[#005f64] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm font-medium"
                title="Abrir janela para visualizar o documento em PDF"
              >
                <FileText size={18} />
                <span>Visualizar em PDF</span>
              </button>*/}
              {/*<button 
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm font-medium"
              >
                <Printer size={18} />
                <span>Imprimir Solicitação de Auditoria</span>
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
            </div>

            <style>{`
              @media print {
                html, body, #root {
                  height: auto !important;
                  min-height: auto !important;
                  overflow: visible !important;
                }
                body * {
                  visibility: hidden;
                }
                .sa-preview-page, .sa-preview-page * {
                  visibility: visible;
                }
                .sa-preview-page {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  margin: 0;
                  padding: 0 !important;
                  box-shadow: none !important;
                  border: none !important;
                  background: white !important;
                  overflow: visible !important;
                }
              }
            `}</style>

            <div id="document-preview-container" className="sa-preview-page bg-white w-full p-10 min-h-[1100px] flex flex-col justify-between text-gray-900 font-serif">
              
              {/* CABEÇALHO COM LOGO GHC */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <img src={imgCabecalho} alt="GHC Cabeçalho" style={{ maxWidth: '100%', height: 'auto', maxHeight: '100px' }} />
                </div>

                {/* TÍTULO PRINCIPAL */}
                <div className="text-center my-5">
                  <h1 className="text-2xl font-bold text-[#14532d] tracking-wide m-0">
                    Solicitação de Auditoria Interna nº {numero ? String(numero).padStart(2, '0') : '02'}/{ano || new Date().getFullYear()}
                  </h1>
                </div>

                {/* LINHA VERDE E DADOS DE EMISSÃO */}
                <hr className="border-0 border-t-2 border-[#14532d] my-3" />
                <div className="flex justify-between items-center text-sm mb-4 font-sans">
                  <div>
                    <span className="font-bold text-gray-700">Data de Emissão: </span>
                    <span className="text-gray-900">{formatDataBr(dataEmissao)}</span>
                  </div>
                  <div className="font-bold text-[#14532d]">
                    Gerência de Auditoria Interna
                  </div>
                </div>

                {/* DESTAQUE DO PRAZO EM VERMELHO (CONFORME PRINT DO ANEXO) */}
                <div className="my-5 border border-gray-200 bg-gray-50/50 py-2.5 px-4 text-center font-sans">
                  <span className="font-bold text-[#dc2626] text-base uppercase tracking-wide">
                    PRAZO PARA ATENDIMENTO: {formatDataBr(prazoAtendimento || dataFinal) || '29/01/2025'}
                  </span>
                </div>

                {/* I. DESTINATÁRIO(S) */}
                <div className="mb-5">
                  <div className="bg-[#14532d] text-white px-3 py-1.5 font-bold uppercase text-sm tracking-wide font-sans mb-2">
                    I. DESTINATÁRIO(S)
                  </div>
                  <div className="text-sm text-gray-800 font-serif py-1">
                    {gerenciasDestinatarias.length > 0 ? (
                      gerenciasDestinatarias.map((g, idx) => (
                        <div key={idx} className="mb-0.5">
                          {g.nome || g}
                        </div>
                      ))
                    ) : (
                      <span className="italic text-gray-400 font-sans">Nenhuma gerência destinatária selecionada.</span>
                    )}
                  </div>
                </div>

                {/* II. DADOS GERAIS */}
                <div className="mb-5">
                  <div className="bg-[#14532d] text-white px-3 py-1.5 font-bold uppercase text-sm tracking-wide font-sans mb-2">
                    II. DADOS GERAIS
                  </div>
                  <table className="w-full text-sm border-collapse font-serif">
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-1.5 pr-4 font-bold text-[#14532d] w-48">Item de Trabalho</td>
                        <td className="py-1.5 text-gray-800">
                          {selectedItemData
                            ? `${selectedItemData.tipoItem?.nome || 'PAINT'} ${selectedItemData.anoReferencia || ''}/${selectedItemData.numeroReferencia ? String(selectedItemData.numeroReferencia).padStart(2, '0') : ''}`
                            : 'PAINT 2025/02'}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-1.5 pr-4 font-bold text-[#14532d]">Tipo de Serviço</td>
                        <td className="py-1.5 text-gray-800">
                          {selectedItemData?.tipoServico?.nome || selectedItemData?.tipoServico || 'Avaliação'}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-1.5 pr-4 font-bold text-[#14532d]">Origem da Demanda</td>
                        <td className="py-1.5 text-gray-800">
                          {selectedItemData?.origem?.nome || selectedItemData?.origem || 'Obrigação Legal'}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-1.5 pr-4 font-bold text-[#14532d]">Macroprocesso</td>
                        <td className="py-1.5 text-gray-800">
                          {selectedItemData?.macroprocesso?.nome || selectedItemData?.macroprocesso || 'Planejamento e Gestão'}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-1.5 pr-4 font-bold text-[#14532d] align-top">Objeto Auditado</td>
                        <td className="py-1.5 text-gray-800">
                          {selectedItemData?.objetoAuditado || 'Parecer da Gerência de Auditoria Interna sobre a Prestação de Contas Anual do HNSC - Exercício 2024'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 pr-4 font-bold text-[#14532d] align-top">Objetivo da Auditoria</td>
                        <td className="py-1.5 text-gray-800">
                          {selectedItemData?.objetivoAuditoria || 'Análise e emissão de Parecer sobre o Relatório Integrado de Prestação de Contas de 2024 ao Tribunal de Contas da União.'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* III. ORIENTAÇÕES GERAIS */}
                <div className="mb-5">
                  <div className="bg-[#14532d] text-white px-3 py-1.5 font-bold uppercase text-sm tracking-wide font-sans mb-3">
                    III. ORIENTAÇÕES GERAIS
                  </div>
                  <div 
                    className="text-sm leading-relaxed text-gray-800 whitespace-pre-line text-justify font-serif"
                    dangerouslySetInnerHTML={{ __html: orientacoesGerais || ORIENTACOES_PADRAO }}
                  />
                </div>

                {/* IV. INFORMAÇÕES SOLICITADAS PELA AUDIN */}
                <div className="mb-8">
                  <div className="bg-[#14532d] text-white px-3 py-1.5 font-bold uppercase text-sm tracking-wide font-sans mb-3">
                    IV. INFORMAÇÕES SOLICITADAS PELA AUDIN
                  </div>
                  <div 
                    className="text-sm leading-relaxed text-gray-800 whitespace-pre-line text-justify font-serif mb-4"
                    dangerouslySetInnerHTML={{ __html: informacoesSolicitadas || INFORMACOES_PADRAO }}
                  />

                  {solicitacoes && (
                    <div 
                      className="text-sm leading-relaxed text-gray-800 whitespace-pre-line text-justify font-serif mb-4"
                      dangerouslySetInnerHTML={{ __html: solicitacoes }}
                    />
                  )}

                  {/* PARÁGRAFO DINÂMICO COM CONTATO DO RESPONSÁVEL (SUBSTITUINDO A PARTE RISCADA EM AZUL) */}
                  <div className="mt-6 text-sm text-gray-800 font-serif leading-relaxed">
                    <p className="mb-4">
                      Estamos à disposição para eventuais esclarecimentos por meio do correio eletrônico{' '}
                      <strong className="text-blue-700">
                        {selectedItemData?.responsavel?.email || 'mnatalia@ghc.com.br'}
                      </strong>{' '}
                      ou pelo telefone{' '}
                      <strong className="text-blue-700">
                        {selectedItemData?.responsavel?.telefone || '1693'}
                      </strong>.
                    </p>
                    <p className="mb-2">Atenciosamente,</p>
                  </div>
                </div>

                {/* ASSINATURA RESPONSÁVEL */}
                <div className="mt-12 text-center text-sm font-serif">
                  <div className="font-bold text-gray-900">
                    {selectedItemData?.responsavel?.nome}
                  </div>
                  <div className="text-gray-700">
                    {selectedItemData?.responsavel?.cargo?.nome || selectedItemData?.responsavel?.cargo || 'Administrador'}
                  </div>
                  <div className="font-bold text-gray-900">
                    Gerência de Auditoria Interna (AUDIN)
                  </div>
                </div>
              </div>

              {/* RODAPÉ COM LOGO GHC */}
              <div className="mt-12 pt-4 flex justify-end items-center">
                <img src={imgRodape} alt="GHC Rodapé" className="max-h-12 w-auto object-contain" />
              </div>

            </div>
          </div>
        </div>

      </div>
      
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
        docTitle={`Solicitação de Auditoria nº ${numero ? String(numero).padStart(2, '0') : '00'}/${ano}`}
      />
    </div>
  );
}
