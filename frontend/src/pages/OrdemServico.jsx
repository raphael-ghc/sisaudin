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
import { getOrdemServicoById, updateOrdemServicoById, createEmptyOrdemServico } from '../api/ordemServicoApi';
import api from '../api/axiosInstance';
import { useAppContext } from '../contexts/AppContext';
import Status from '../components/Status';
import DocumentLifecyclePanel from '../components/DocumentLifecyclePanel';
import RichTextEditor from '../components/RichTextEditor';
import imgCabecalho from '../img/ghc_cabecalho.png';
import imgRodape from '../img/ghc_rodape.png';
import DocumentPdfViewerModal from '../components/DocumentPdfViewerModal';

const ORIENTACOES_PADRAO = 
  "<ul>"+
    "<li>1. Qualquer prejuízo à independência e à objetividade deverá ser imediatamente informado à Gerência da AUDIN;</li>" +
    "<li>2. Caso haja alguma contingência, a Gerência da AUDIN deverá ser informada, com antecedência, para avaliar possibilidades, tais como alteração de escopo ou prorrogação do prazo;</li>" +
    "<li>3. O planejamento deverá ser documentado em papéis de trabalho;</li>" +
    "<li>4. Todos os fatos relatados devem ser evidenciados em papéis de trabalho;</li>" +
    "<li>5. As recomendações devem estar focadas nas causas e consequências factuais dos riscos trabalhados;</li>" +
    "<li>6. Os papéis de trabalho devem ser organizados e devidamente arquivados; e</li>" +
    "<li>7. Este trabalho será supervisionado durante todas as suas fases.</li>" +
  "</ul>";

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

export default function OrdemServico() {

  const [showDuplicateModal, setShowDuplicateModal] = useState({ isOpen: false });

  const acceptSuggestion = (newNumero, newAno) => {
    setNumero(newNumero);
    setAno(newAno);
    setShowDuplicateModal({ isOpen: false });
  };

  const validateNumero = async (numeroToCheck, anoToCheck, currentId, itemId) => {
      if (!numeroToCheck || !anoToCheck) return true;
      try {
          const valRes = await api.get(`/documentos/check-number?entityName=OrdemServico&ano=${anoToCheck}&numero=${numeroToCheck}&itemTrabalhoId=${itemId || ''}&currentEntityId=${currentId}`);
          if (!valRes.data.available) {
              setShowDuplicateModal({
                  isOpen: true,
                  message: `O número ${numeroToCheck}/${anoToCheck} já está em uso.`,
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

  const [osId, setOsId] = useState(id || null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { jwtPayload } = useAppContext();

  // Modos de visualização (Editor, Lado a Lado, Preview) igual RelatorioPreliminar
  const [layoutMode, setLayoutMode] = useState(searchParams.get('view') === 'true' ? 'preview' : 'split');
  const [showPdfModal, setShowPdfModal] = useState(searchParams.get('pdf') === 'true');
  const [globalCollapseAction, setGlobalCollapseAction] = useState(null);
  const [isVinculoOpen, setIsVinculoOpen] = useState(true);

  // Campos do Documento
  const [selectedItemTrabalhoId, setSelectedItemTrabalhoId] = useState('');
  const [selectedItemData, setSelectedItemData] = useState(null);
  const [itensTrabalho, setItensTrabalho] = useState([]);

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
    const fetchItens = async () => {
      try {
        const response = await getAllItensTrabalho();
        let items = [];
        if (response && response.data) {
          const dataObj = response.data.data || response.data;
          if (Array.isArray(dataObj)) items = dataObj;
          else if (dataObj.content) items = dataObj.content;
          else if (dataObj._embedded) items = Object.values(dataObj._embedded)[0] || [];
        } else if (Array.isArray(response)) {
          items = response;
        }
        if (!id) {
          items = items.filter(it => it.status === 'APROVADO' || it.status === 'Aprovado' || String(it.id) === String(itemTrabalhoIdParam));
        }
        setItensTrabalho(items);
      } catch (err) {
        toast.error("Erro ao carregar Itens de Trabalho.");
      }
    };
    fetchItens();
  }, []);

  useEffect(() => {
    const loadOs = async () => {
      setLoading(true);
      try {
        let currentOs;
        if (osId) {
          currentOs = await getOrdemServicoById(osId);
        } else {
          currentOs = await createEmptyOrdemServico();
          setOsId(currentOs.id);
          const paramsToPass = new URLSearchParams(searchParams);
          const queryStr = paramsToPass.toString() ? `?${paramsToPass.toString()}` : '';
          navigate(`/ordem-servico/${currentOs.id}${queryStr}`, { replace: true });
        }

        if (currentOs) {
          setAno(currentOs.ano || new Date().getFullYear());
          setNumero(currentOs.numero || '');
          setDataInicial(currentOs.dataInicial || '');
          setDataFinal(currentOs.dataFinal || '');
          setDataEmissao(currentOs.dataEmissao || new Date().toISOString().split('T')[0]);
          setOrientacoesGerais(currentOs.orientacoesGerais || ORIENTACOES_PADRAO);

          if (currentOs.itemTrabalho) {
            setSelectedItemTrabalhoId(currentOs.itemTrabalho.id);
            try {
              const res = await getItemTrabalhoById(currentOs.itemTrabalho.id);
              const itemFull = extractItemData(res);
              setSelectedItemData(itemFull);
            } catch (itemErr) {
              console.error("Erro ao carregar item de trabalho vinculado:", itemErr);
            }
          } else if (itemTrabalhoIdParam) {
            setSelectedItemTrabalhoId(Number(itemTrabalhoIdParam));
            try {
              const res = await getItemTrabalhoById(itemTrabalhoIdParam);
              const itemFull = extractItemData(res);
              setSelectedItemData(itemFull);
            } catch (itemErr) {
              console.error("Erro ao carregar item de trabalho da URL:", itemErr);
            }
          }

        }

      } catch (err) {
        toast.error("Erro ao carregar Ordem de Serviço.");
      } finally {
        setLoading(false);
      }
    };
    loadOs();
  }, [osId, navigate]);

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

  const debouncedSave = useCallback(
    debounce(async (id, payload, itemId, readOnlyMode = false) => {
      if (!id || readOnlyMode) return;

      if (!(await validateNumero(payload.numero, payload.ano, id, itemId))) return;
      try {
        await updateOrdemServicoById(id, payload, itemId || null);
        console.log('Autosaved Ordem de Serviço', payload);
      } catch (e) {
        console.error('Falha no auto-save da Ordem de Serviço', e);
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
    if (osId && !loading && !isReadOnly) {
      debouncedSave(osId, {
        ano: ano ? parseInt(ano, 10) : null,
        numero: numero ? parseInt(numero, 10) : null,
        dataInicial: dataInicial || null,
        dataFinal: dataFinal || null,
        dataEmissao: dataEmissao || null,
        orientacoesGerais: orientacoesGerais || ORIENTACOES_PADRAO
      }, selectedItemTrabalhoId, isReadOnly);
    }
  }, [ano, numero, dataInicial, dataFinal, dataEmissao, orientacoesGerais, selectedItemTrabalhoId, osId, debouncedSave, loading, isReadOnly]);

  const handleSaveManual = async () => {
    if (!osId || isReadOnly) return;

    if (!(await validateNumero(numero, ano, osId, selectedItemTrabalhoId))) { setLoading(false); return; }
    setSaving(true);
    try {
      const payload = {
        ano: ano ? parseInt(ano, 10) : null,
        numero: numero ? parseInt(numero, 10) : null,
        dataInicial: dataInicial || null,
        dataFinal: dataFinal || null,
        dataEmissao: dataEmissao || null,
        orientacoesGerais: orientacoesGerais || ORIENTACOES_PADRAO
      };

      await updateOrdemServicoById(osId, payload, selectedItemTrabalhoId || null);
      toast.success("Ordem de Serviço salva com sucesso!");
    } catch (err) {
      toast.error("Erro ao salvar Ordem de Serviço.");
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
        
        const docTitle = `Ordem de Servico n ${numero ? String(numero).padStart(2, '0') : '00'}_${ano || new Date().getFullYear()}`;

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
               .os-preview-page { color: var(--text-color); font-size: 10pt; line-height: 1.5; display: flex; flex-direction: column; align-items: center; }
               
               /* Add some global reset styles for the print */
               * {
                 box-sizing: border-box;
               }

               @page { margin: 15mm 0; }
            </style>
            <!-- Include Tailwind via CDN just in case classes are strictly needed, though inline styles are preferred -->
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body>
            ${clone.outerHTML}
          </body>
          </html>
        `;
        const response = await api.post('/pdf/gerar-sem-sumario', { html: htmlContent, docName: docTitle, docVersion: 'Ordem de Serviço' }, { responseType: 'blob' });
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
        toast.error("Erro ao gerar PDF no servidor.");
      } finally {
        setIsGeneratingPdf(false);
      }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderOsPreview = () => (
    <div className="os-preview-page bg-white rounded-xl shadow-xl border border-gray-200 p-10 min-h-[1100px] flex flex-col justify-between text-gray-900 font-serif">
      {/* CABEÇALHO COM LOGO GHC */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <img src={imgCabecalho} alt="GHC Cabeçalho" style="max-width: 100%; height: auto; max-height: 100px;" /> {/* className="max-h-16 w-auto" */}
        </div>

        {/* TÍTULO PRINCIPAL */}
        <div className="text-center my-6">
          <h1 className="text-2xl font-bold text-[#14532d] tracking-wide m-0">
            ORDEM DE SERVIÇO Nº {numero ? String(numero).padStart(2, '0') : '05'}/{ano} - AUDIN
          </h1>
        </div>

        {/* TELA DE VÍNCULOS COM O ITEM DE TRABALHO */}
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs font-sans">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-[#00767d] uppercase tracking-wider">
              Vínculo com Item de Trabalho
            </span>
            <span className="bg-[#00767d] text-white px-2 py-0.5 rounded font-mono font-bold">
              #{selectedItemTrabalhoId || '01'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700">
            <div>
              <span className="font-semibold text-gray-900">Objeto: </span>
              {selectedItemData?.objetoAuditoria?.nome || selectedItemData?.objeto || 'Não informado'}
            </div>
            <div>
              <span className="font-semibold text-gray-900">Objetivo: </span>
              {selectedItemData?.objetivoAuditoria?.nome || selectedItemData?.objetivo || 'Não informado'}
            </div>
            <div>
              <span className="font-semibold text-gray-900">Origem: </span>
              {selectedItemData?.origemDemanda?.nome || selectedItemData?.origem || 'Não informado'}
            </div>
            <div>
              <span className="font-semibold text-gray-900">Tipo: </span>
              {selectedItemData?.tipo || 'Não informado'}
            </div>
            <div className="col-span-1 md:col-span-2">
              <span className="font-semibold text-gray-900">Unidade: </span>
              {selectedItemData?.unidade?.nome || 'Não informada'}
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
        </div>

        {/* CORPO DO DOCUMENTO */}
        <div className="text-justify leading-relaxed text-base space-y-4 text-gray-800">
          <p>
            Em conformidade com o Plano Anual de Auditoria Interna ({ano}), determinamos a realização de{' '}
            <strong>{selectedItemData?.tipo || 'Auditoria Interna'}</strong> sob registro{' '}
            <strong>#{selectedItemTrabalhoId || '01'}</strong>, tendo como Objeto:{' '}
            <em>{selectedItemData?.objetoAuditoria?.nome || selectedItemData?.objeto || 'Nesta Unidade'}</em>.
          </p>

          <p>
            O objetivo principal dos trabalhos visa{' '}
            {selectedItemData?.objetivoAuditoria?.nome || selectedItemData?.objetivo || 'avaliar a regularidade e eficiência dos controles internos do macroprocesso avaliado'}.
          </p>

          <p>
            Os trabalhos serão conduzidos observando as normas técnicas e diretrizes de auditoria interna aplicáveis,{' '}
            iniciando-se no período entre <strong>{formatDataBr(dataInicial)}</strong> e{' '}
            <strong>{formatDataBr(dataFinal)}</strong>.
          </p>

          {orientacoesGerais && (
            <div className="my-4 p-4 border-l-4 border-[#14532d] bg-emerald-50/30 rounded-r text-sm">
              <span className="block font-bold text-[#14532d] mb-1">Orientações e Procedimentos da AUDIN:</span>
              <p className="whitespace-pre-line text-gray-700">{orientacoesGerais}</p>
            </div>
          )}
        </div>
      </div>

      {/* ASSINATURA / DATA */}
      <div className="mt-16 pt-8 border-t border-gray-300">
        <div className="text-center text-sm text-gray-600 mb-8">
          Porto Alegre, {new Date(dataEmissao + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>

        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-64 border-b border-gray-900 mb-2"></div>
          <span className="font-bold text-gray-900 block">
            {selectedItemData?.responsavel?.nome}
          </span>
          <span className="text-xs text-gray-500 uppercase font-sans">
            Auditor(a) Responsável / Coordenador(a) - AUDIN/GHC
          </span>
          <div className="mt-4 text-[11px] text-gray-400 font-mono">
            Documento eletrônico assinado por{' '}
            <span>
              {selectedItemData?.responsavel?.nome}
            </span>{' '}
            em <span>{formatDataBr(dataEmissao)}</span>
          </div>
        </div>

        {/* RODAPÉ COM LOGO GHC */}
        <div className="mt-12 pt-4 flex justify-end items-center">
          <img src={imgRodape} alt="GHC Rodapé" className="max-h-12 w-auto object-contain" />
        </div>
      </div>
    </div>
  );

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
        <span className="ml-3 text-gray-600 font-medium">Carregando Ordem de Serviço...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      
      {/* =========================================
          BARRA DE TOPO (HEADER FIXO) - IDENTICO A RELATORIOAUDITORIA
      ========================================= */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm print:hidden">
        
        {/* Esquerda: Logo/Título do Módulo + Componente Status / Ações */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <FileText className="text-[#00767d]" size={24} />
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Auditoria Interna - GHC</h1>
              <p className="text-xs text-gray-500">Módulo de Ordem de Serviço #{osId}</p>
            </div>
          </div>
          
          <div className="hidden md:block h-8 w-px bg-gray-300"></div>
          
          <Status statusInicial="NOVO" onChangeStatus={handleStatusChange} />
        </div>

        {isReadOnly && (
          <div className="flex bg-amber-50 text-amber-700 border border-amber-200 px-4 py-1.5 rounded-lg text-sm font-medium mx-4 items-center gap-2">
            <Info size={16} /> Somente Leitura
          </div>
        )}

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
            COLUNA 1: O EDITOR DE ORDEM DE SERVIÇO
        ========================================= */}
        <div className={`overflow-y-auto p-4 md:p-8 flex-1 transition-all duration-300 print:hidden ${layoutMode === 'preview' ? 'hidden' : 'block'}`}>
          <div className="max-w-4xl mx-auto pb-20">
             <header className="mb-8 border-b-2 border-blue-900 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">Preenchimento da Ordem de Serviço</h2>
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
                    onClick={() => navigate('/ordens-servico')}
                    className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg border border-gray-200"
                  >
                    <FileText size={18} className="mr-1.5" />
                    Ir para Lista de Ordens de Serviço
                  </button>
                </div>
              </header>
            
            
            

            {/* Painel de Controle do Ciclo de Vida do Documento (Checklists e Status) */}
            <DocumentLifecyclePanel
              tipoDocumento="ordemservico"
              documentoId={osId}
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
                        disabled={isReadOnly || !!itemTrabalhoIdParam || (!!selectedItemTrabalhoId && !!osId)}
                      />

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Ano da OS</label>
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
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Número da OS</label>
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
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Data Inicial</label>
                        <input
                          type="date"
                          value={dataInicial}
                          disabled={isReadOnly}
                          onChange={(e) => setDataInicial(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#00767d] focus:outline-none text-sm disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Data Final</label>
                        <input
                          type="date"
                          value={dataFinal}
                          disabled={isReadOnly}
                          onChange={(e) => setDataFinal(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#00767d] focus:outline-none text-sm disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* Informações Read-Only do Item de Trabalho selecionado (Estilo RelatorioPreliminar) */}
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
                  {!isReadOnly && (
                    <button
                      onClick={handleResetOrientacoes}
                      className="inline-flex items-center px-2.5 py-1 text-xs bg-white hover:bg-gray-100 text-gray-700 rounded-md border border-gray-300 transition-colors font-medium shadow-sm"
                      title="Restaurar o texto padrão das 7 orientações"
                    >
                      <RefreshCw size={12} className="mr-1" />
                      Restaurar Padrão
                    </button>
                  )}
                </div>

                <RichTextEditor
                  title="1. ORIENTAÇÕES GERAIS"
                  subtitle="Salvo automaticamente após 3 segundos de inatividade."
                  initialContent={orientacoesGerais}
                  onChange={setOrientacoesGerais}
                  globalCollapseAction={globalCollapseAction}
                 readOnly={isReadOnly} />
              </div>
            </section>
          </div>
        </div>

        {/* =========================================
            COLUNA 2: O PREVIEW E DOCUMENTO FINAL
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
              </button>
              <button 
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm font-medium"
              >
                <Printer size={18} />
                <span>Imprimir Ordem de Serviço</span>
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
                .os-preview-page, .os-preview-page * {
                  visibility: visible;
                }
                .os-preview-page {
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

            <div id="document-preview-container" className="os-preview-page bg-white w-full p-10 min-h-[1100px] flex flex-col justify-between text-gray-900 font-serif">
              
              {/* CABEÇALHO COM LOGO GHC */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <img src={imgCabecalho} alt="GHC Cabeçalho" style={{ maxWidth: '100%', height: 'auto', maxHeight: '100px' }} />
                </div>

                {/* TÍTULO PRINCIPAL */}
                <div className="text-center my-6">
                  <h1 className="text-2xl font-bold text-[#14532d] tracking-wide m-0">
                    Ordem de Serviço nº {numero ? String(numero).padStart(2, '0') : '00'}/{ano || new Date().getFullYear()}
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

                {/* I. DESTINATÁRIO(S) - RESPONSÁVEIS PELO TRABALHO */}
                <div className="mb-6">
                  <div className="bg-[#14532d] text-white px-3 py-1.5 font-bold uppercase text-sm tracking-wide font-sans mb-2">
                    I. DESTINATÁRIO(S) - RESPONSÁVEIS PELO TRABALHO
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
                          {selectedItemData?.responsavel
                            ? `${selectedItemData.responsavel.nome || selectedItemData.responsavel}${selectedItemData.responsavel.telefone ? ` (telefone: ${selectedItemData.responsavel.telefone})` : ''}${selectedItemData.responsavel.email ? ` (e-mail: ${selectedItemData.responsavel.email})` : ''}`
                            : '-'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-bold text-[#14532d] align-top">
                          Supervisor
                        </td>
                        <td className="py-2 text-gray-800">
                          {selectedItemData?.supervisor?.nome || selectedItemData?.supervisor || '-'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* II. DADOS GERAIS */}
                <div className="mb-6">
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
                            : 'PAINT'}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-1.5 pr-4 font-bold text-[#14532d]">Tipo de Serviço</td>
                        <td className="py-1.5 text-gray-800">
                          {selectedItemData?.tipoServico?.nome || (typeof selectedItemData?.tipoServico === 'string' ? selectedItemData?.tipoServico : null) || 'Avaliação'}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-1.5 pr-4 font-bold text-[#14532d]">Origem da Demanda</td>
                        <td className="py-1.5 text-gray-800">
                          {selectedItemData?.origem?.nome || (typeof selectedItemData?.origem === 'string' ? selectedItemData?.origem : null) || 'Obrigação Legal'}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-1.5 pr-4 font-bold text-[#14532d]">Macroprocesso</td>
                        <td className="py-1.5 text-gray-800">
                          {selectedItemData?.macroprocesso?.nome || (typeof selectedItemData?.macroprocesso === 'string' ? selectedItemData?.macroprocesso : null) || 'Planejamento e Gestão'}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-1.5 pr-4 font-bold text-[#14532d] align-top">Objeto Auditado</td>
                        <td className="py-1.5 text-gray-800">
                          {selectedItemData?.objetoAuditado || 'Parecer da Gerência de Auditoria Interna...'}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-1.5 pr-4 font-bold text-[#14532d] align-top">Objetivo da Auditoria</td>
                        <td className="py-1.5 text-gray-800">
                          {selectedItemData?.objetivoAuditoria || 'Análise e emissão de Parecer...'}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-1.5 pr-4 font-bold text-[#14532d]">Nível de Risco</td>
                        <td className="py-1.5 text-gray-800">
                          {selectedItemData?.nivelRisco?.nome || (typeof selectedItemData?.nivelRisco === 'string' ? selectedItemData?.nivelRisco : null) || 'Médio'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 pr-4 font-bold text-[#14532d]">Horas de Trabalho</td>
                        <td className="py-1.5 text-gray-800">
                          {selectedItemData?.horasPrevistas ?? 'Não informado'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* III. CRONOGRAMA PROPOSTO */}
                <div className="mb-6">
                  <div className="bg-[#14532d] text-white px-3 py-1.5 font-bold uppercase text-sm tracking-wide font-sans mb-2">
                    III. CRONOGRAMA PROPOSTO
                  </div>
                  <table className="w-full text-sm border-collapse font-serif">
                    <tbody>
                      <tr>
                        <td className="py-1.5 pr-4 font-bold text-[#14532d] w-48">Prazo Previsto</td>
                        <td className="py-1.5 text-gray-800">
                          {dataInicial || dataFinal
                            ? `${formatDataBr(dataInicial)} a ${formatDataBr(dataFinal)}`
                            : '21/01/2025 a 28/02/2025'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* IV. ORIENTAÇÕES GERAIS (Renderizando conteúdo com suporte a tags HTML/RichText) */}
                <div className="mb-8">
                  <div className="bg-[#14532d] text-white px-3 py-1.5 font-bold uppercase text-sm tracking-wide font-sans mb-3">
                    IV. ORIENTAÇÕES GERAIS
                  </div>
                    <div 
                      className="text-sm leading-relaxed text-gray-800 whitespace-pre-line text-justify font-serif"
                      dangerouslySetInnerHTML={{ __html: orientacoesGerais || ORIENTACOES_PADRAO }}
                    />
                  </div>

                {/* ASSINATURAS */}
                <div className="mt-12 text-center text-sm font-serif">
                  <div className="font-bold text-gray-900">
                    {selectedItemData?.supervisor?.nome}
                  </div>
                  <div className="text-gray-700">Gerente</div>
                  <div className="font-bold text-gray-900">
                    Gerência de Auditoria Interna (AUDIN)
                  </div>
                </div>

                {/*<div className="mt-10 text-xs text-gray-600 font-sans">
                  <span className="font-bold">Aprovado por: </span>
                  <span>
                    {selectedItemData?.responsavel?.nome }
                  </span>{' '}
                  em <span>{formatDataBr(dataEmissao)}</span>
                </div>*/}
              </div>

              {/* RODAPÉ COM LOGO GHC 
              <div className="mt-12 pt-4 flex justify-end items-center">
                <img src={imgRodape} alt="GHC Rodapé" className="max-h-12 w-auto object-contain" />
              </div>
              */}

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
        docTitle={`Ordem de Serviço nº ${numero ? String(numero).padStart(2, '0') : '05'}/${ano}`}
      />
    </div>
  );
}
