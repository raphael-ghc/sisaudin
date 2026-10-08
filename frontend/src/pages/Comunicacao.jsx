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
import api from '../api/axiosInstance';
import { getComunicacaoById, updateComunicacaoById, createEmptyComunicacao } from '../api/comunicacaoApi';
import { getAllGerencias } from '../api/gerenciaApi';
import Status from '../components/Status';
import DocumentLifecyclePanel from '../components/DocumentLifecyclePanel';
import RichTextEditor from '../components/RichTextEditor';
import imgCabecalho from '../img/ghc_cabecalho.png';
import imgRodape from '../img/ghc_rodape.png';
import DocumentPdfViewerModal from '../components/DocumentPdfViewerModal';

const ORIENTACOES_PADRAO = 
  "<p>Em conformidade com o disposto na Instrução Normativa CGU/SFC nº 03/2017, informamos que daremos início aos trabalhos de auditoria, conforme discriminado acima.</p>" + 
  "<p>Os trabalhos serão realizados compreendendo, no primeiro momento, a fase de planejamento dos trabalhos e, na sequência, a execução dos procedimentos de auditoria. Após, será encaminhado Relatório Preliminar de Auditoria ou Solicitação de Auditoria e Constatações (SAC), para apresentação de esclarecimentos adicionais e que servirá de subsídio para a realização de Reuniã o de Busca Conjunta de Soluções (RBCS) que discutirá os achados (quando houver), e posterior emissão do Relatório Final de Auditoria.</p>"+
  "<p>Para o bom desenvolvimento dos trabalhos, <b>solicitamos a designação de empregado para realizar a interlocução entre a equipe de auditoria e as unidades auditadas</b>, de forma a viabilizar a tempestiva apresentação de documentos, manifestações, acessos e/ou esclarecimentos necessários à condução da auditoria, bem como atendimento às Solicitações de Auditoria Interna (SAIs).</p>" + 
  "<p>A equipe, o Supervisor e a coordenação dos trabalhos serão compostas pelos empregados citados acima. Solicitamos especial atenção da(s) área(s), no sentido de que sejam fornecidos, aos referidos empregados, todos os documentos e informações solicitados, observando-se os prazos estabelecidos, em atenção ao artigo 26 da Lei n° 10.180/2001 e ao item 144 do Anexo da Instrução Normativa CGU/SFC n.º 03/2017.</p>" + 
  "<p>Estamos à disposição para eventuais esclarecimentos.</p>" + 
  "<p>Atenciosamente,</p>";

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

export default function Comunicacao() {

  const [showDuplicateModal, setShowDuplicateModal] = useState({ isOpen: false });

  const acceptSuggestion = (newNumero, newAno) => {
    setNumero(newNumero);
    setAno(newAno);
    setShowDuplicateModal({ isOpen: false });
  };

  const validateNumero = async (numeroToCheck, anoToCheck, currentId, itemId) => {
      if (!numeroToCheck || !anoToCheck) return true;
      try {
          const valRes = await api.get(`/documentos/check-number?entityName=Comunicacao&ano=${anoToCheck}&numero=${numeroToCheck}&itemTrabalhoId=${itemId || ''}&currentEntityId=${currentId || ''}`);
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

  const [caId, setCaId] = useState(id || null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Modos de visualização (Editor, Lado a Lado, Preview) igual ao do RelatorioPreliminar
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
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().split('T')[0]);
  const [orientacoesGerais, setOrientacoesGerais] = useState(ORIENTACOES_PADRAO);

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
    const loadCa = async () => {
      setLoading(true);
      try {
        let currentCa;
        if (caId) {
          currentCa = await getComunicacaoById(caId);
        } else {
          currentCa = await createEmptyComunicacao();
          setCaId(currentCa.id);
          const paramsToPass = new URLSearchParams(searchParams);
          const queryStr = paramsToPass.toString() ? `?${paramsToPass.toString()}` : '';
          navigate(`/comunicacao/${currentCa.id}${queryStr}`, { replace: true });
        }

        if (currentCa) {
          setAno(currentCa.ano || new Date().getFullYear());
          setNumero(currentCa.numero || '');
          setDataInicial(currentCa.dataInicial || '');
          setDataFinal(currentCa.dataFinal || '');
          setDataEmissao(currentCa.dataEmissao || new Date().toISOString().split('T')[0]);
          setOrientacoesGerais(currentCa.orientacoesGerais || ORIENTACOES_PADRAO);
          setGerenciasDestinatarias(currentCa.gerenciasDestinatarias || []);

          if (currentCa.itemTrabalho) {
            setSelectedItemTrabalhoId(currentCa.itemTrabalho.id);
            const res = await getItemTrabalhoById(currentCa.itemTrabalho.id);
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
        toast.error("Erro ao carregar Comunicação de Auditoria.");
      } finally {
        setLoading(false);
      }
    };
    loadCa();
  }, [caId, navigate]);

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

  // Auto-save com debounce (igual ao RelatorioPreliminar)
  const debouncedSave = useCallback(
    debounce(async (id, payload, itemId) => {
      if (!id) return;

      if (!(await validateNumero(payload.numero, payload.ano, id, itemId))) return;
      try {
        await updateComunicacaoById(id, payload, itemId || null);
        console.log('Autosaved Comunicação de Auditoria', payload);
      } catch (e) {
        console.error('Falha no auto-save da Comunicação de Auditoria', e);
      }
    }, 3000),
    []
  );

  useEffect(() => {
    if (caId && !loading) {
      debouncedSave(caId, {
        ano: ano ? parseInt(ano, 10) : null,
        numero: numero ? parseInt(numero, 10) : null,
        dataInicial: dataInicial || null,
        dataFinal: dataFinal || null,
        dataEmissao: dataEmissao || null,
        orientacoesGerais: orientacoesGerais || ORIENTACOES_PADRAO,
        gerenciasDestinatarias: gerenciasDestinatarias.map(g => ({ id: g.id, nome: g.nome || g }))
      }, selectedItemTrabalhoId);
    }
  }, [ano, numero, dataInicial, dataFinal, dataEmissao, orientacoesGerais, gerenciasDestinatarias, selectedItemTrabalhoId, caId, debouncedSave, loading]);

  const handleSaveManual = async () => {
    if (!caId) return;

    if (!(await validateNumero(numero, ano, caId, selectedItemTrabalhoId))) { setLoading(false); return; }
    setSaving(true);
    try {
      const payload = {
        ano: ano ? parseInt(ano, 10) : null,
        numero: numero ? parseInt(numero, 10) : null,
        dataInicial: dataInicial || null,
        dataFinal: dataFinal || null,
        dataEmissao: dataEmissao || null,
        orientacoesGerais: orientacoesGerais || ORIENTACOES_PADRAO,
        gerenciasDestinatarias: gerenciasDestinatarias.map(g => ({ id: g.id, nome: g.nome || g }))
      };

      await updateComunicacaoById(caId, payload, selectedItemTrabalhoId || null);
      toast.success("Comunicação de Auditoria salva com sucesso!");
    } catch (err) {
      toast.error("Erro ao salvar Comunicação de Auditoria.");
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

      const docNameStr = `Comunicação de Auditoria nº ${numero ? String(numero).padStart(2, '0') : '01'}/${ano}`;
      
      const response = await api.post('/pdf/gerar-sem-sumario', { 
        html: htmlContent, docName: docNameStr, docVersion: '' 
      }, { responseType: 'blob' });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Comunicacao_${numero ? String(numero).padStart(2, '0') : '01'}_${ano}.pdf`;
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

  const handlePrint = () => {
    window.print();
  };

  const handleResetOrientacoes = () => {
    setOrientacoesGerais(ORIENTACOES_PADRAO);
    toast.info("Orientações gerais restauradas para o texto padrão.");
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
        <span className="ml-3 text-gray-600 font-medium">Carregando Comunicação de Auditoria...</span>
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
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Comunicação de Auditoria #{caId}</h1>
              <p className="text-xs text-gray-500">Auditoria Interna - GHC</p>
            </div>
          </div>
          
          <div className="hidden md:block h-8 w-px bg-gray-300"></div>
          
          <Status statusInicial="NOVO" onChangeStatus={handleStatusChange} />
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

      {/* =========================================
          ÁREA DE CONTEÚDO (FLEX ROW RESPONSIVA)
      ========================================= */}
      <div className="flex flex-1 overflow-hidden print:block print:overflow-visible">
        
        {/* =========================================
            COLUNA 1: O EDITOR DE COMUNICAÇÃO DE AUDITORIA
        ========================================= */}
        <div className={`overflow-y-auto p-4 md:p-8 flex-1 transition-all duration-300 print:hidden ${layoutMode === 'preview' ? 'hidden' : 'block'}`}>
          <div className="max-w-4xl mx-auto pb-20">
            <header className="mb-8 border-b-2 border-[#00767d] pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900 whitespace-nowrap">Preenchimento da Comunicação de Auditoria</h2>
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
                  onClick={() => navigate('/comunicacoes')}
                  className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg border border-gray-200"
                >
                  <FileText size={18} className="mr-1.5" />
                  Ir para Lista de Comunicações
                </button>
              </div>
            </header>

            {/* Painel de Controle do Ciclo de Vida do Documento (Checklists e Status) */}
            <DocumentLifecyclePanel
              tipoDocumento="comunicacao"
              documentoId={caId}
              onStatusChange={(novo) => handleStatusChange(novo)}
            />

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
                        disabled={!!itemTrabalhoIdParam || (!!selectedItemTrabalhoId && !!caId)}
                      />

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                          placeholder="9"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Emissão</label>
                        <input
                          type="date"
                          value={dataEmissao}
                          onChange={(e) => setDataEmissao(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#00767d] focus:outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Data Inicial</label>
                        <input
                          type="date"
                          value={dataInicial}
                          onChange={(e) => setDataInicial(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#00767d] focus:outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Data Final</label>
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
                        Gerências Destinatárias do Documento
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
                            <span className="font-medium text-gray-800">Nível de Risco: </span>
                            {selectedItemData.nivelRisco?.nome || selectedItemData.nivelRisco || '-'}
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

            {/* CARD 2: ORIENTAÇÕES GERAIS - COM RICHTEXTEDITOR E TOPO DE ACORDEÃO */}
            <section className="mb-10">
              <div className="relative">
                <div className="absolute top-4 right-14 z-20">
                  <button
                    onClick={handleResetOrientacoes}
                    className="inline-flex items-center px-2.5 py-1 text-xs bg-white hover:bg-gray-100 text-gray-700 rounded-md border border-gray-300 transition-colors font-medium shadow-sm"
                    title="Restaurar o texto padrão das orientações"
                  >
                    <RefreshCw size={12} className="mr-1" />
                    Restaurar Padrão
                  </button>
                </div>

                <RichTextEditor
                  title="1. ORIENTAÇÕES GERAIS"
                  subtitle="Salvo automaticamente após 3 segundos de inatividade."
                  initialContent={orientacoesGerais}
                  onChange={setOrientacoesGerais}
                  globalCollapseAction={globalCollapseAction}
                />
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
              <button 
                onClick={handleGerarPdfServidor}
                disabled={isGeneratingPdf}
                className={`flex items-center gap-2 text-white px-4 py-2 rounded-lg shadow-sm transition-colors font-medium ${isGeneratingPdf ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                title="Gera o PDF nativo no servidor (Playwright)"
              >
                {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                <span>{isGeneratingPdf ? 'Gerando...' : 'Gerar PDF no Servidor'}</span>
              </button>
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
                <span>Imprimir Comunicação de Auditoria</span>
              </button>*/}              
            </div>

            <style>{`
              @page {
                margin: 0;
              }
              @media print {
                html, body, #root {
                  height: auto !important;
                  min-height: auto !important;
                  overflow: visible !important;
                }
                body * {
                  visibility: hidden;
                }
                .comunicacao-preview, .comunicacao-preview * {
                  visibility: visible;
                }
                .comunicacao-preview {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  margin: 0;
                  padding: 15mm 15mm !important;
                  background: white !important;
                  overflow: visible !important;
                }
              }
            `}</style>

            <div id="document-preview-container" className="comunicacao-preview bg-white p-10 min-h-[1100px] flex flex-col justify-between text-gray-900 font-serif w-full">
              
              {/* CABEÇALHO COM LOGO GHC */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <img src={imgCabecalho} alt="GHC Cabeçalho" style={{ maxWidth: '100%', height: 'auto', maxHeight: '100px' }} />
                </div>

                {/* TÍTULO PRINCIPAL (Em verde esmeralda conforme anexo PDF) */}
                <div className="text-center my-6">
                  <h1 className="text-2xl font-bold text-[#14532d] tracking-wide m-0">
                    Comunicação de Auditoria <br/>Apresentação de Equipe nº {numero ? String(numero).padStart(2, '0') : '09'}/{ano || new Date().getFullYear()}
                  </h1>
                </div>

                {/* LINHA VERDE E DADOS DE EMISSÃO */}
                <hr className="border-0 border-t-2 border-[#14532d] my-3" />
                <div className="flex justify-between items-center text-sm mb-8 font-sans">
                  <div>
                    <span className="font-bold text-gray-700">Data de Emissão: </span>
                    <span className="text-gray-900">{formatDataBr(dataEmissao)}</span>
                  </div>
                  <div className="font-bold text-[#14532d]">
                    Gerência de Auditoria Interna
                  </div>
                </div>

                {/* I. DESTINATÁRIO(S) */}
                <div className="mb-5">
                  <div className="bg-[#14532d] text-white px-3 py-1.5 font-bold uppercase text-sm tracking-wide font-sans mb-2">
                    I. DESTINATÁRIO(S)
                  </div>
                  <table className="w-full text-sm border-collapse font-serif">
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 pr-4 font-bold text-[#14532d] w-48 align-top">
                          Destinatário(s)
                        </td>
                        <td className="py-2 text-gray-800">
                          {gerenciasDestinatarias.length > 0 ? (
                            gerenciasDestinatarias.map((g, idx) => (
                              <div key={idx} className="mb-0.5">
                                {g.nome || g}
                              </div>
                            ))
                          ) : (
                            <span className="italic text-gray-400 font-sans">Nenhuma gerência destinatária selecionada.</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
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

                {/* III. CRONOGRAMA PROPOSTO */}
                <div className="mb-5">
                  <div className="bg-[#14532d] text-white px-3 py-1.5 font-bold uppercase text-sm tracking-wide font-sans mb-2">
                    III. CRONOGRAMA PROPOSTO
                  </div>
                  <table className="w-full text-sm border-collapse font-serif">
                    <tbody>
                      <tr>
                        <td className="py-1.5 pr-4 font-bold text-[#14532d] w-48">Prazo Previsto</td>
                        <td className="py-1.5 text-gray-800">
                          {`${formatDataBr(dataInicial)} a ${formatDataBr(dataFinal)}`}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* IV. RESPONSÁVEIS PELO TRABALHO */}
                <div className="mb-5">
                  <div className="bg-[#14532d] text-white px-3 py-1.5 font-bold uppercase text-sm tracking-wide font-sans mb-2">
                    IV. RESPONSÁVEIS PELO TRABALHO
                  </div>
                  <table className="w-full text-sm border-collapse font-serif">
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 pr-4 font-bold text-[#14532d] w-48 align-top">
                          Equipe de Auditoria
                        </td>
                        <td className="py-2 text-gray-800">
                          {selectedItemData.equipe?.map(e => e.nome).join(', ') || '-'}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 pr-4 font-bold text-[#14532d] align-top">
                          Responsável
                        </td>
                        <td className="py-2 text-gray-800">
                          {selectedItemData.responsavel?.nome || '-'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-bold text-[#14532d] align-top">
                          Supervisor
                        </td>
                        <td className="py-2 text-gray-800">
                          {selectedItemData?.supervisor?.nome || selectedItemData?.supervisor}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* V. ORIENTAÇÕES GERAIS */}
                <div className="mb-8">
                  <div className="bg-[#14532d] text-white px-3 py-1.5 font-bold uppercase text-sm tracking-wide font-sans mb-3">
                    V. ORIENTAÇÕES GERAIS
                  </div>
                  <div 
                    className="text-sm leading-relaxed text-gray-800 whitespace-pre-line text-justify font-serif"
                    dangerouslySetInnerHTML={{ __html: orientacoesGerais || ORIENTACOES_PADRAO }}
                  />
                </div>

                {/* ASSINATURA GERENTE (CONFORME PRINT PDF) */}
                <div className="mt-12 text-center text-sm font-serif">
                  <div className="font-bold text-gray-900">
                    {selectedItemData?.supervisor?.nome }
                  </div>
                  <div className="text-gray-700">Gerente</div>
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
        docTitle={`Comunicação de Auditoria nº ${numero ? String(numero).padStart(2, '0') : '00'}/${ano}`}
      />
    </div>
  );
}
