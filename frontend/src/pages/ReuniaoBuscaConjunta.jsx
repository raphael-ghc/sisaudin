import React, { useState, useEffect, useRef, useCallback } from 'react';
import DuplicateNumberModal from '../components/DuplicateNumberModal';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Save, Upload, Plus, Trash2, Printer, Layout, Columns, FileText, Lock, Info, Calendar, Clock, MapPin, Users, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import RichTextEditor from '../components/RichTextEditor';
import SearchableSelect from '../components/SearchableSelect';
import { useAppContext } from '../contexts/AppContext';
import { getReuniaoByItemTrabalho, getReuniaoById, createReuniao, updateReuniao } from '../api/reuniaoBuscaConjuntaApi';
import { getAllItensTrabalho, getItemTrabalhoById } from '../api/itemTrabalhoApi';
import { getAllGerencias } from '../api/gerenciaApi';
import debounce from 'lodash.debounce';

const ACAO_OPTIONS = [
  "Nenhuma ação",
  "Alterar",
  "Cancelar",
  "Aguardar evidências para marcar como Atendida",
  "Enviar para outra gerência",
  "Outra Ação"
];

export default function ReuniaoBuscaConjunta() {

  const [showDuplicateModal, setShowDuplicateModal] = useState({ isOpen: false });

  const acceptSuggestion = (newNumero, newAno) => {
    setNumero(newNumero);
    setAno(newAno);
    setShowDuplicateModal({ isOpen: false });
  };

  const validateNumero = async (numeroToCheck, anoToCheck, currentId, itemId) => {
      if (!numeroToCheck || !anoToCheck) return true;
      try {
          const valRes = await api.get(`/documentos/check-number?entityName=ReuniaoBuscaConjunta&ano=${anoToCheck}&numero=${numeroToCheck}&itemTrabalhoId=${itemId || ''}&currentEntityId=${currentId || ''}`);
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
  const [layoutMode, setLayoutMode] = useState('split');
  const previewContainerRef = useRef(null);

  const { id } = useParams();
  const navigate = useNavigate();

  const [reuniaoId, setReuniaoId] = useState(null);
  const [itemTrabalhoId, setItemTrabalhoId] = useState(null);
  const [itensTrabalho, setItensTrabalho] = useState([]);
  const [selectedItemData, setSelectedItemData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { jwtPayload } = useAppContext();

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [gerencias, setGerencias] = useState([]);
  const [gerenciasDestinatarias, setGerenciasDestinatarias] = useState([]);
  const [constatacoes, setConstatacoes] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [ano, setAno] = useState('');
  const [numero, setNumero] = useState('');
  const [dataEmissao, setDataEmissao] = useState('');

  const [filtroGerencia, setFiltroGerencia] = useState('');
  const [filtroReuniao, setFiltroReuniao] = useState('');

  const [openSections, setOpenSections] = useState({
    dadosIniciais: true,
    reunioes: true,
    planoAcao: true
  });

  useEffect(() => {
    carregarDadosBase();
  }, []);

  const carregarDadosBase = async () => {
    try {
      let itensResponse = await getAllItensTrabalho(0, 1000);
      let items = itensResponse.content || itensResponse;
      if (!id) {
         items = items.filter(it => it.status === 'APROVADO' || it.status === 'Aprovado' || String(it.id) === String(itemTrabalhoIdParam));
      }
      setItensTrabalho(items);
      const gerenciasResponse = await getAllGerencias(0, 1000);
      let gData = gerenciasResponse.data || gerenciasResponse.content || gerenciasResponse;
      if (gData && Array.isArray(gData.data)) gData = gData.data;
      if (gData && Array.isArray(gData.content)) gData = gData.content;
      setGerencias(Array.isArray(gData) ? gData : []);

      if (id) {
        setItemTrabalhoId(id);
        const item = await getItemTrabalhoById(id);
        setSelectedItemData(item);
        carregarReuniaoByItemTrabalho(id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Erro ao carregar dados base', error);
      toast.error('Erro ao carregar dados. Verifique a conexão.');
      setLoading(false);
    }
  };

  const carregarReuniaoByItemTrabalho = async (itemId) => {
    setLoading(true);
    try {
      let dadosReuniao = await getReuniaoByItemTrabalho(itemId);
      if (dadosReuniao && dadosReuniao.length > 0) {
        preencherFormulario(dadosReuniao[0]);
      } else {
        const novaReuniao = await createReuniao({ itemTrabalho: { id: itemId } });
        preencherFormulario(novaReuniao);
      }
    } catch (error) {
      console.error('Erro ao carregar ou criar reunião', error);
      toast.error('Erro ao inicializar documento da reunião.');
    } finally {
      setLoading(false);
    }
  };

  const preencherFormulario = (data) => {
    setReuniaoId(data.id);
    setNome(data.nome || '');
    setDescricao(data.descricao || '');
    setConteudo(data.conteudo || '');
    setAno(data.ano || data.anoReferencia || '');
    setNumero(data.numero || data.numeroReferencia || '');
    setDataEmissao(data.dataCriacao ? data.dataCriacao.substring(0,10) : '');
    
    if (data.gerenciasDestinatarias) {
      setGerenciasDestinatarias(data.gerenciasDestinatarias.map(g => g.id));
    }
    if (data.constatacoes) {
      setConstatacoes(data.constatacoes);
    }
    if (data.agendamentos) {
      setAgendamentos(data.agendamentos);
    }
  };

  const handleAutoSave = useCallback(
    debounce(async (secao, currentData, readOnlyMode = false) => {
      if (!reuniaoId || readOnlyMode) return;
      try {
        setSaving(true);
        const payload = {
          nome,
          descricao,
          conteudo,
          numero,
          ano,
          gerenciasDestinatarias: gerenciasDestinatarias.map(id => ({ id })),
          constatacoes,
          agendamentos: agendamentos.map(ag => ({
             ...ag,
             gerencias: ag.gerencias ? ag.gerencias.map(gId => ({ id: gId })) : []
          }))
        };
        await updateReuniao(reuniaoId, payload);
        console.log(`Auto-save concluído: ${secao}`);
      } catch (error) {
        console.error('Erro no auto-save', error);
        toast.error(`Falha ao salvar ${secao}.`);
      } finally {
        setSaving(false);
      }
    }, 2000),
    [reuniaoId, nome, descricao, conteudo, numero, ano, gerenciasDestinatarias, constatacoes, agendamentos]
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
    if (reuniaoId && !loading && !isReadOnly) {
      handleAutoSave('Geral', {}, isReadOnly);
    }
  }, [nome, descricao, conteudo, numero, ano, gerenciasDestinatarias, constatacoes, agendamentos, isReadOnly, handleAutoSave]);

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleRecomendacaoChange = (cId, rId, field, value) => {
    if (isReadOnly) return;
    setConstatacoes(prev => prev.map(c => {
      if (c.id === cId) {
        return {
          ...c,
          recomendacoes: c.recomendacoes.map(r => r.id === rId ? { ...r, [field]: value } : r)
        };
      }
      return c;
    }));
  };

  // Funções de Agendamento
  const addAgendamento = () => {
    if (isReadOnly) return;
    setAgendamentos(prev => [...prev, {
      id: null,
      tempId: Date.now(),
      dataHora: '',
      local: '',
      gerencias: [],
      pessoas: '' // JSON map de gerencia_id -> str
    }]);
  };

  const removeAgendamento = (idx) => {
    if (isReadOnly) return;
    if(window.confirm('Remover esta reunião?')) {
      setAgendamentos(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const updateAgendamento = (idx, field, value) => {
    if (isReadOnly) return;
    setAgendamentos(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const toggleAgendamentoGerencia = (idx, gId) => {
    if (isReadOnly) return;
    setAgendamentos(prev => {
      const next = [...prev];
      const ag = next[idx];
      const gerenciasList = ag.gerencias ? ag.gerencias.map(g => typeof g === "object" ? g.id : g) : [];
      if (gerenciasList.includes(gId)) {
        ag.gerencias = gerenciasList.filter(id => id !== gId);
      } else {
        ag.gerencias = [...gerenciasList, gId];
      }
      return next;
    });
  };

  // Helpers
  const getItemTrabalhoDesc = () => {
    if (!selectedItemData) return "Selecione um item...";
    return `RAI ${selectedItemData.numeroReferencia ? String(selectedItemData.numeroReferencia).padStart(2, '0') : '00'}/${selectedItemData.anoReferencia || '0000'} - ${selectedItemData.nome || selectedItemData.objetoAuditado || 'Sem Nome'}`;
  };

  const getGerenciasWithRecomendacoes = () => {
    const gerenciasNomes = new Set();
    constatacoes.forEach(c => {
      if(c.recomendacoes) {
        c.recomendacoes.forEach(r => {
          if (r.gerencia) gerenciasNomes.add(r.gerencia);
        });
      }
    });
    return gerencias.filter(g => gerenciasNomes.has(g.sigla) || gerenciasNomes.has(g.nome));
  };

  const gerenciasComRecomendacoes = getGerenciasWithRecomendacoes();

  const renderEditor = () => (
    <div className="flex-1 bg-slate-50 overflow-y-auto p-6" style={{ scrollBehavior: 'smooth' }}>
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        
        {/* SANFONA 1: DADOS INICIAIS E VÍNCULO */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-blue-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center cursor-pointer" onClick={() => toggleSection('dadosIniciais')}>
            <div className="flex items-center gap-3">
              {openSections.dadosIniciais ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
              <Info className="text-blue-700" size={20} />
              <h3 className="font-bold text-gray-900">1. Vínculo com Item de Trabalho</h3>
            </div>
          </div>
          {openSections.dadosIniciais && (
            <div className="p-6 space-y-6">
              <div className="bg-gray-50 border border-gray-300 rounded-xl p-5 relative">
                <div className="flex items-center gap-2 mb-4">
                  <Lock size={16} className="text-gray-500" />
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Vínculo com Item de Trabalho</span>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Item de trabalho referenciado</label>
                    <div className="relative">
                      <input type="text" disabled className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 pr-24" value={getItemTrabalhoDesc()} />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className="text-[10px] bg-gray-200 text-gray-600 font-bold px-2 py-0.5 rounded uppercase border border-gray-300 shadow-sm">Travado</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                 <div>
                   <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Ano do Documento</label>
                   <input type="number" value={ano} onChange={e => setAno(e.target.value)} disabled={isReadOnly} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:border-blue-500" placeholder="Ex: 2026" />
                 </div>
                 <div>
                   <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Número do Documento</label>
                   <input type="number" value={numero} onChange={e => setNumero(e.target.value)} disabled={isReadOnly} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:border-blue-500" placeholder="Ex: 12" />
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* SANFONA 2: CADASTRO DE REUNIÕES */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-blue-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center cursor-pointer" onClick={() => toggleSection('reunioes')}>
            <div className="flex items-center gap-3">
              {openSections.reunioes ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
              <Calendar className="text-blue-700" size={20} />
              <h3 className="font-bold text-gray-900">2. Cadastro de Reuniões</h3>
            </div>
          </div>
          {openSections.reunioes && (
            <div className="p-6 space-y-6">
              {agendamentos.map((ag, idx) => {
                const agGerenciasIds = ag.gerencias ? ag.gerencias.map(g => typeof g === "object" ? g.id : g) : [];
                let pessoasMap = {};
                try { pessoasMap = ag.pessoas ? JSON.parse(ag.pessoas) : {}; } catch(e) {}

                return (
                  <div key={ag.id || ag.tempId || idx} className="border border-gray-200 rounded-xl p-5 bg-gray-50 relative">
                    {!isReadOnly && <button type="button" onClick={() => removeAgendamento(idx)} className="absolute top-4 right-4 text-red-500 hover:bg-red-100 p-1.5 rounded-lg" title="Remover Reunião"><Trash2 size={16} /></button>}
                    <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Reunião #{idx + 1}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1 flex items-center gap-1"><Clock size={14}/> Data e Hora</label>
                        <input type="datetime-local" value={ag.dataHora || ''} onChange={e => updateAgendamento(idx, 'dataHora', e.target.value)} disabled={isReadOnly} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:border-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1 flex items-center gap-1"><MapPin size={14}/> Local</label>
                        <input type="text" value={ag.local || ''} onChange={e => updateAgendamento(idx, 'local', e.target.value)} disabled={isReadOnly} placeholder="Ex: Sala 302..." className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:border-blue-500 outline-none" />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-2 flex items-center gap-1"><Users size={14}/> Gerências Participantes</label>
                      <div className="flex flex-wrap gap-2 p-3 bg-white border border-gray-200 rounded-lg">
                        {gerenciasComRecomendacoes.length === 0 ? <span className="text-xs text-gray-400">Nenhuma gerência encontrada nas recomendações do documento referenciado.</span> : null}
                        {gerenciasComRecomendacoes.map(g => (
                          <label key={g.id} className="inline-flex items-center gap-1.5 cursor-pointer text-sm bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">
                            <input type="checkbox" checked={agGerenciasIds.includes(g.id)} onChange={() => toggleAgendamentoGerencia(idx, g.id)} disabled={isReadOnly} className="rounded text-blue-600" />
                            {g.sigla}
                          </label>
                        ))}
                      </div>
                    </div>

                    {agGerenciasIds.length > 0 && (
                      <div className="space-y-3 mt-4">
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Pessoas por Gerência Selecionada</label>
                        {agGerenciasIds.map(gId => {
                          const gObj = gerencias.find(g => g.id === gId);
                          return (
                            <div key={gId} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
                              <span className="font-bold text-sm text-gray-700 w-32">{gObj?.sigla || 'Gerência'}</span>
                              <input 
                                type="text" 
                                placeholder="Digite o nome das pessoas (separados por vírgula)..."
                                value={pessoasMap[gId] || ''}
                                disabled={isReadOnly}
                                onChange={e => {
                                  const newVal = e.target.value;
                                  const newMap = { ...pessoasMap, [gId]: newVal };
                                  updateAgendamento(idx, 'pessoas', JSON.stringify(newMap));
                                }}
                                className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              
              <button onClick={addAgendamento} disabled={isReadOnly} className="w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors flex justify-center items-center gap-2">
                <Plus size={18} /> Adicionar Reunião
              </button>
            </div>
          )}
        </div>

        {/* SANFONA 3: PLANO DE AÇÃO (Leitura/Ajuste) */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-blue-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center cursor-pointer" onClick={() => toggleSection('planoAcao')}>
            <div className="flex items-center gap-3">
              {openSections.planoAcao ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
              <FileText className="text-blue-700" size={20} />
              <h3 className="font-bold text-gray-900">3. Plano de Ação Base</h3>
            </div>
          </div>
          {openSections.planoAcao && (
            <div className="p-6">
              {constatacoes.length === 0 ? (
                <p className="text-gray-500 italic text-sm">Nenhuma recomendação carregada do documento base.</p>
              ) : (
                <div className="space-y-6">
                  {constatacoes.map((c, idx) => (
                    <div key={c.id} className="border border-blue-100 rounded-lg bg-blue-50/30 overflow-hidden">
                      <div className="bg-blue-100/50 p-3 border-b border-blue-100 font-semibold text-blue-900 text-sm">
                        Constatação {idx + 1}: {c.titulo}
                      </div>
                      <div className="p-4 space-y-4">
                        {c.recomendacoes && c.recomendacoes.map((r, rIdx) => (
                           <div key={r.id} className="bg-white border border-gray-200 rounded p-3">
                             <div className="font-bold text-xs text-gray-500 mb-1">Recomendação {idx+1}.{rIdx+1} - {r.gerencia}</div>
                             <div className="text-sm text-gray-800 mb-3" dangerouslySetInnerHTML={{ __html: r.content }} />
                             
                             <label className="block text-xs font-bold text-gray-600 mb-1 mt-3">Ação Definida</label>
                             <select value={r.acao || 'Nenhuma ação'} disabled={isReadOnly} onChange={e => handleRecomendacaoChange(c.id, r.id, 'acao', e.target.value)} className="w-full p-2 text-sm border rounded">
                               {ACAO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                             </select>
                           </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );

  const getRecomendacoesFiltradas = () => {
    let filtered = [];
    // Flatten constatacoes -> recomendacoes
    constatacoes.forEach(c => {
      if (c.recomendacoes) {
        c.recomendacoes.forEach(r => {
          filtered.push({ ...r, constatacaoTitulo: c.titulo });
        });
      }
    });

    if (filtroGerencia) {
      filtered = filtered.filter(r => r.gerencia === filtroGerencia);
    }
    
    if (filtroReuniao) {
      // Find the reuniao
      const ag = agendamentos.find(a => String(a.id || a.tempId) === String(filtroReuniao));
      if (ag) {
        const agGerenciasIds = ag.gerencias ? ag.gerencias.map(g => typeof g === "object" ? g.id : g) : [];
        const siglasParticipantes = gerencias.filter(g => agGerenciasIds.includes(g.id)).map(g => g.sigla);
        filtered = filtered.filter(r => siglasParticipantes.includes(r.gerencia));
      }
    }

    return filtered;
  };

  const renderPreview = () => {
    const recomendacoesExibir = getRecomendacoesFiltradas();

    return (
      <div className="flex-1 bg-gray-200 overflow-y-auto p-8 flex flex-col items-center" ref={previewContainerRef}>
        
        {/* Barra de Filtros */}
        <div className="w-[210mm] mb-4 bg-white p-4 rounded shadow-sm border border-gray-300 flex items-center gap-4">
          <Search size={18} className="text-gray-400" />
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-gray-500 uppercase">Filtrar por Reunião</label>
            <select value={filtroReuniao} onChange={e => setFiltroReuniao(e.target.value)} className="w-full p-1.5 text-sm border-b border-gray-300 focus:border-blue-500 outline-none bg-white">
              <option value="">Todas as Reuniões</option>
              {agendamentos.map((ag, i) => (
                <option key={ag.id || ag.tempId} value={ag.id || ag.tempId}>Reunião #{i+1} ({ag.dataHora ? new Date(ag.dataHora).toLocaleString('pt-BR') : 'Sem data'})</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-gray-500 uppercase">Filtrar por Gerência</label>
            <select value={filtroGerencia} onChange={e => setFiltroGerencia(e.target.value)} className="w-full p-1.5 text-sm border-b border-gray-300 focus:border-blue-500 outline-none bg-white">
              <option value="">Todas as Gerências</option>
              {gerenciasComRecomendacoes.map(g => <option key={g.id} value={g.sigla}>{g.sigla}</option>)}
            </select>
          </div>
        </div>

        {/* Pagina Documento */}
        <div className="bg-white shadow-xl rounded-sm p-12" style={{ width: '210mm', minHeight: '297mm', position: 'relative', fontFamily: '"Times New Roman", Times, serif', color: '#000' }}>
          
          {/* Cabeçalho GHC */}
          <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-8">
            <img src="/logo_ghc.png" alt="Logo GHC" className="h-16 object-contain" />
            <div className="text-right">
              <h1 className="text-xl font-bold uppercase">Resultado de Reunião de Busca Conjunta</h1>
              <p className="text-md font-semibold mt-1">Nº {numero ? String(numero).padStart(2, '0') : '00'}/{ano || '0000'}</p>
              <p className="text-sm mt-1 text-gray-600">Emissão: {dataEmissao ? new Date(dataEmissao).toLocaleDateString('pt-BR') : '__/__/____'}</p>
            </div>
          </div>

          <div className="mb-8">
             <h2 className="text-lg font-bold border-b border-gray-300 mb-3">1. Dados do Item de Trabalho</h2>
             <p className="mb-1"><strong>Item:</strong> {getItemTrabalhoDesc()}</p>
             <p><strong>Objeto:</strong> {selectedItemData?.objetoAuditado || '-'}</p>
          </div>

          <div className="mb-8">
             <h2 className="text-lg font-bold border-b border-gray-300 mb-3">2. Reuniões Realizadas</h2>
             {agendamentos.length === 0 ? <p className="italic text-gray-600">Nenhuma reunião registrada.</p> : (
               <div className="space-y-4">
                 {agendamentos.map((ag, i) => {
                   let pessoasMap = {};
                   try { pessoasMap = ag.pessoas ? JSON.parse(ag.pessoas) : {}; } catch(e){}
                   const agGerencias = gerencias.filter(g => (ag.gerencias ? ag.gerencias.map(x=>typeof x==='object'?x.id:x) : []).includes(g.id));
                   
                   return (
                     <div key={ag.id||ag.tempId} className="border border-gray-300 p-3 bg-gray-50">
                       <p className="font-bold mb-2">Reunião #{i+1}</p>
                       <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                         <p><strong>Data/Hora:</strong> {ag.dataHora ? new Date(ag.dataHora).toLocaleString('pt-BR') : '-'}</p>
                         <p><strong>Local:</strong> {ag.local || '-'}</p>
                       </div>
                       <div>
                         <p className="text-sm font-bold mb-1">Participantes:</p>
                         {agGerencias.length === 0 ? <p className="text-sm italic text-gray-500">Nenhum participante registrado.</p> : (
                           <ul className="list-disc pl-5 text-sm">
                             {agGerencias.map(g => (
                               <li key={g.id}><strong>{g.sigla}:</strong> {pessoasMap[g.id] || 'Ninguém informado'}</li>
                             ))}
                           </ul>
                         )}
                       </div>
                     </div>
                   );
                 })}
               </div>
             )}
          </div>

          <div>
            <h2 className="text-lg font-bold border-b border-gray-300 mb-3">3. Recomendações ({recomendacoesExibir.length})</h2>
            {recomendacoesExibir.length === 0 ? <p className="italic text-gray-600">Nenhuma recomendação para os filtros selecionados.</p> : (
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-black p-2 w-1/5 text-left">Gerência</th>
                    <th className="border border-black p-2 w-2/5 text-left">Recomendação</th>
                    <th className="border border-black p-2 w-1/5 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {recomendacoesExibir.map((r, i) => (
                    <tr key={i}>
                      <td className="border border-black p-2 font-bold align-top">{r.gerencia}</td>
                      <td className="border border-black p-2 align-top">
                        <div dangerouslySetInnerHTML={{__html: r.content}} />
                      </td>
                      <td className="border border-black p-2 text-center align-top font-semibold">{r.acao || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 flex items-center justify-center flex-col gap-4">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p>Carregando documento...</p>
    </div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-100">
      <div className="h-14 border-b bg-white flex items-center justify-between px-4 shadow-sm z-10 shrink-0">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700 text-sm font-medium">Voltar</button>
          <div className="h-4 w-px bg-gray-300"></div>
          <h1 className="text-lg font-bold text-gray-800">Resultado de Reunião de Busca Conjunta</h1>
          {saving && <span className="text-xs text-blue-600 font-bold ml-2">Salvando...</span>}
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-gray-100 p-1 rounded-md flex">
            <button onClick={() => setLayoutMode('editor')} className={`p-1.5 rounded ${layoutMode === 'editor' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><FileText size={18}/></button>
            <button onClick={() => setLayoutMode('split')} className={`p-1.5 rounded ${layoutMode === 'split' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Columns size={18}/></button>
            <button onClick={() => setLayoutMode('preview')} className={`p-1.5 rounded ${layoutMode === 'preview' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Layout size={18}/></button>
          </div>
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          <button onClick={() => window.print()} className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm">
            <Printer size={16} /> <span>Imprimir</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {layoutMode !== 'preview' && (
          <div className={`${layoutMode === 'split' ? 'w-1/2 border-r border-gray-300' : 'w-full'} flex flex-col relative`}>
            {renderEditor()}
          </div>
        )}
        
        {layoutMode !== 'editor' && (
          <div className={`${layoutMode === 'split' ? 'w-1/2' : 'w-full'} relative flex flex-col`}>
            {renderPreview()}
          </div>
        )}
      </div>
    </div>
  );
}
