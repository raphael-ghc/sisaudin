import React, { useState, useEffect } from 'react';
import { Save, AlertTriangle, ArrowLeft, Calendar, FileText, Trash2, X, ChevronDown } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import DocumentLifecyclePanel from '../components/DocumentLifecyclePanel';
import { useAppContext } from '../contexts/AppContext';
import { getAllGeneric } from '../api/genericApi';
import { createItemTrabalho, updateItemTrabalho, getItemTrabalhoById, deleteItemTrabalho } from '../api/itemTrabalhoApi';
import { toast } from 'react-toastify';

// O Nível de risco não usa mais constante, busca da API

const getRiscoColor = (risco) => {
  if (!risco) return 'text-gray-800 bg-gray-100 border-gray-300';
  const r = risco.toLowerCase();
  if (r.includes('crítico')) return 'text-red-800 bg-red-100 border-red-300';
  if (r.includes('alto')) return 'text-orange-800 bg-orange-100 border-orange-300';
  if (r.includes('médio')) return 'text-yellow-800 bg-yellow-100 border-yellow-300';
  if (r.includes('baixo')) return 'text-green-800 bg-green-100 border-green-300';
  return 'text-gray-800 bg-gray-100 border-gray-300';
};

// Componente simples de Combo Pesquisável (Custom Select com Busca)
const SearchableSelect = ({ value, onChange, options, placeholder, id }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      {/* Gatilho (Trigger) */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm cursor-pointer flex justify-between items-center bg-white hover:border-gray-400 transition-colors"
      >
        <span className={value ? "text-gray-800" : "text-gray-400"}>
          {value || placeholder || 'Selecione'}
        </span>
        <ChevronDown size={16} className="text-gray-400" />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Overlay invisível para fechar ao clicar fora */}
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
                filteredOptions.map((opt, idx) => (
                  <div 
                    key={idx}
                    className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                  >
                    {opt}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};


export default function ItemTrabalho({ propId, onClose, onSuccess }) {
  const params = useParams();
  const id = propId || params.id;
  const navigate = useNavigate();
  const { jwtPayload } = useAppContext();

  const [formData, setFormData] = useState({
    nome: '',
    sigla: '',
    tipoItem: '',
    anoReferencia: new Date().getFullYear(),
    numeroReferencia: '',
    objetoAuditado: '',
    objetivoAuditado: '',
    tipoServico: '',
    macroprocesso: '',
    origemDemanda: '',
    nivelRisco: '',
    dataInicialPrevista: '',
    dataFinalPrevista: '',
    horasPrevistas: '',
    status: 'NOVO',
    responsavel: '',
    supervisor: '',
    supervisorTecnico: '',
    equipe: []
  });

  const [originalData, setOriginalData] = useState(null);

  const handleStatusChange = (novoStatus) => {
    setFormData(prev => ({ ...prev, status: novoStatus }));
  };

  const isGestorOuSistema = ['GESTOR', 'SISTEMA'].includes(jwtPayload?.role);
  const isReadOnly = id && formData.status !== 'Minuta' && formData.status !== 'NOVO' && formData.status !== 'RETORNADO' && formData.status !== 'Retornado' && !isGestorOuSistema;

  const [macroprocessos, setMacroprocessos] = useState([]);
  const [tiposItem, setTiposItem] = useState([]);
  const [tiposServico, setTiposServico] = useState([]);
  const [origensDemanda, setOrigensDemanda] = useState([]);
  const [niveisRisco, setNiveisRisco] = useState([]);

  const [rawDados, setRawDados] = useState({
    macroprocessos: [],
    tiposItem: [],
    tiposServico: [],
    origensDemanda: [],
    niveisRisco: [],
    pessoas: []
  });

  const [pessoasOptions, setPessoasOptions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchRaw = async (endpoint) => {
          const response = await getAllGeneric(endpoint);
          if (response.data) {
             const baseData = response.data.data || response.data;
             return Array.isArray(baseData) ? baseData : (baseData.content || []);
          }
          return [];
        };

        const [
          resMacro, 
          resTipoItem, 
          resTipoServico, 
          resOrigem, 
          resRisco,
          resPessoas
        ] = await Promise.all([
          fetchRaw('macroprocesso'),
          fetchRaw('tipo-de-item'),
          fetchRaw('tipo-de-servico'),
          fetchRaw('origem-da-demanda'),
          fetchRaw('nivel-de-risco'),
          fetchRaw('pessoa')
        ]);

        setRawDados({
          macroprocessos: resMacro,
          tiposItem: resTipoItem,
          tiposServico: resTipoServico,
          origensDemanda: resOrigem,
          niveisRisco: resRisco,
          pessoas: resPessoas
        });

        setMacroprocessos(resMacro.map(item => item.nome || item.descricao));
        setTiposItem(resTipoItem.map(item => item.nome || item.descricao));
        setTiposServico(resTipoServico.map(item => item.nome || item.descricao));
        setOrigensDemanda(resOrigem.map(item => item.nome || item.descricao));
        setNiveisRisco(resRisco.map(item => item.nome || item.descricao));
        
        const pessoasAuditoria = resPessoas.filter(p => 
          p.gerencia && p.gerencia.nome && p.gerencia.nome.toLowerCase().includes('auditoria interna')
        );
        setPessoasOptions(pessoasAuditoria.map(p => `${p.nome} (Cartão: ${p.cartaoPonto}) (Cargo: ${p.cargo?.nome || '-'})`));

        if (id) {
          const res = await getItemTrabalhoById(id);
          if (res.data && res.data.success) {
             const item = res.data.data;
             const formatPessoaStr = p => p ? `${p.nome} (Cartão: ${p.cartaoPonto}) (Cargo: ${p.cargo?.nome || '-'})` : '';
             
             const loadedData = {
                nome: item.nome || '',
                sigla: item.sigla || '',
                tipoItem: item.tipoItem?.nome || item.tipoItem?.descricao || '',
                anoReferencia: item.anoReferencia || new Date().getFullYear(),
                numeroReferencia: item.numeroReferencia || '',
                objetoAuditado: item.objetoAuditado || '',
                objetivoAuditado: item.objetivoAuditoria || '',
                tipoServico: item.tipoServico?.nome || item.tipoServico?.descricao || '',
                macroprocesso: item.macroprocesso?.nome || item.macroprocesso?.descricao || '',
                origemDemanda: item.origem?.nome || item.origem?.descricao || '',
                nivelRisco: item.nivelRisco?.nome || item.nivelRisco?.descricao || '',
                dataInicialPrevista: item.dataInicialPrevista ? item.dataInicialPrevista.split('T')[0] : '',
                dataFinalPrevista: item.dataFinalPrevista ? item.dataFinalPrevista.split('T')[0] : '',
                horasPrevistas: item.horasPrevistas || '',
                status: item.status || 'NOVO',
                responsavel: formatPessoaStr(item.responsavel),
                supervisor: formatPessoaStr(item.supervisor),
                supervisorTecnico: formatPessoaStr(item.supervisorTecnico),
                equipe: item.equipe ? item.equipe.map(formatPessoaStr) : []
             };
             setFormData(loadedData);
             setOriginalData(loadedData);

              // Historico agora é carregado pelo DocumentLifecyclePanel
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados da API:', error);
        toast.error('Erro ao carregar os dados.');
      }
    };
    fetchData();
  }, [id]);

  const [errors, setErrors] = useState({});
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  // Simulação de banco de dados para checar duplicidade (deveria buscar no backend)
  const itensExistentesMock = ['2026-001', '2026-002']; 

  const handleChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      
      // Validação de Datas
      if (field === 'dataInicialPrevista' || field === 'dataFinalPrevista') {
        if (next.dataInicialPrevista && next.dataFinalPrevista) {
          if (new Date(next.dataInicialPrevista) > new Date(next.dataFinalPrevista)) {
            setErrors(e => ({ ...e, datas: 'A Data Final deve ser maior ou igual à Data Inicial.' }));
          } else {
            setErrors(e => ({ ...e, datas: null }));
          }
        }
      }

      // Checagem de duplicidade Ano/Numero
      if (field === 'anoReferencia' || field === 'numeroReferencia') {
        const chave = `${next.anoReferencia}-${String(next.numeroReferencia).padStart(3, '0')}`;
        if (itensExistentesMock.includes(chave)) {
          setDuplicateWarning(true);
        } else {
          setDuplicateWarning(false);
        }
      }

      return next;
    });
  };

  const handleSave = async () => {
    if (errors.datas) {
      toast.error('Corrija os erros antes de salvar.');
      return;
    }
    
    if (!formData.nome || !formData.sigla) {
      toast.error('Os campos Nome e Sigla são obrigatórios.');
      return;
    }

    try {
      const getObj = (list, nomeStr) => {
         if (!nomeStr) return null;
         const obj = list.find(r => (r.nome === nomeStr || r.descricao === nomeStr));
         return obj ? { id: obj.id } : null;
      };

      const getObjPessoa = (str) => {
         if (!str) return null;
         const p = rawDados.pessoas.find(r => `${r.nome} (Cartão: ${r.cartaoPonto}) (Cargo: ${r.cargo?.nome || '-'})` === str);
         return p ? { id: p.id } : null;
      };

      const payload = {
        nome: formData.nome,
        sigla: formData.sigla,
        status: formData.status,
        anoReferencia: String(formData.anoReferencia),
        numeroReferencia: String(formData.numeroReferencia),
        objetoAuditado: formData.objetoAuditado,
        objetivoAuditoria: formData.objetivoAuditado,
        dataInicialPrevista: formData.dataInicialPrevista ? new Date(formData.dataInicialPrevista).toISOString() : null,
        dataFinalPrevista: formData.dataFinalPrevista ? new Date(formData.dataFinalPrevista).toISOString() : null,
        horasPrevistas: formData.horasPrevistas ? parseInt(formData.horasPrevistas) : null,
        tipoItem: getObj(rawDados.tiposItem, formData.tipoItem),
        tipoServico: getObj(rawDados.tiposServico, formData.tipoServico),
        macroprocesso: getObj(rawDados.macroprocessos, formData.macroprocesso),
        origem: getObj(rawDados.origensDemanda, formData.origemDemanda),
        nivelRisco: getObj(rawDados.niveisRisco, formData.nivelRisco),
        responsavel: getObjPessoa(formData.responsavel),
        supervisor: getObjPessoa(formData.supervisor),
        supervisorTecnico: getObjPessoa(formData.supervisorTecnico),
        equipe: formData.equipe ? formData.equipe.map(getObjPessoa).filter(Boolean) : []
      };

      if (id) {
        await updateItemTrabalho(id, payload);
        
        // O historico é gerado automaticamente pelo backend no DocumentLifecyclePanel

        toast.success('Item de Trabalho atualizado com sucesso!');
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      } else {
        const res = await createItemTrabalho(payload);
        
        // Não salva mais no localStorage

        toast.success('Item de Trabalho salvo com sucesso!');
        if (onSuccess) onSuccess();
        if (onClose) onClose();
        else if (res.data && res.data.data && res.data.data.id) {
           navigate(`/ItemTrabalho/${res.data.data.id}`);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar o Item de Trabalho.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Deseja realmente excluir este Item de Trabalho?")) {
      try {
        await deleteItemTrabalho(id);
        toast.success('Item de Trabalho excluído com sucesso!');
        if (onSuccess) onSuccess();
        if (onClose) onClose();
        else navigate('/itens-trabalho');
      } catch (error) {
        console.error(error);
        toast.error('Erro ao excluir o Item de Trabalho.');
      }
    }
  };

  const content = (
    <div className={`flex flex-col bg-white font-sans overflow-hidden ${onClose ? 'w-full h-full' : 'h-screen'}`}>
      
      {/* CABEÇALHO DO MODAL */}
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-white shadow-sm shrink-0">
        <div className="flex items-center gap-4 sm:gap-6">
          <h2 className="text-xl font-semibold text-[#00767d]">
            {id ? 'Editar Item de Trabalho' : 'Novo Item de Trabalho'}
          </h2>
          <div className="hidden sm:block h-6 w-px bg-gray-200"></div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
            {formData.status}
          </span>
        </div>
        <button 
          onClick={() => onClose ? onClose() : navigate(-1)} 
          className="text-gray-400 hover:text-gray-600 p-1.5 rounded-md hover:bg-gray-100 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* CORPO DO FORMULÁRIO */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nome *</label>
            <input 
                type="text" 
                disabled={isReadOnly}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#00767d]/50 ${isReadOnly ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`} 
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                placeholder="Nome do Item de Trabalho"
              />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Sigla *</label>
            <input 
                type="text" 
                disabled={isReadOnly}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#00767d]/50 uppercase ${isReadOnly ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`} 
                value={formData.sigla}
                onChange={(e) => handleChange('sigla', e.target.value)}
                placeholder="Ex: IT-01"
              />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo do Item</label>
            <SearchableSelect 
              id="list-tipo-item"
              disabled={isReadOnly}
              options={tiposItem} 
              value={formData.tipoItem} 
              onChange={(v) => handleChange('tipoItem', v)} 
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Ano de Ref.</label>
              <input 
                type="number" 
                disabled={isReadOnly}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#00767d]/50 ${isReadOnly ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`} 
                value={formData.anoReferencia}
                onChange={(e) => handleChange('anoReferencia', e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Núm. Ref.</label>
              <input 
                type="text" 
                disabled={isReadOnly}
                className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 ${duplicateWarning ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-[#00767d]/50'} ${isReadOnly ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`} 
                value={formData.numeroReferencia}
                onChange={(e) => handleChange('numeroReferencia', e.target.value)}
                placeholder="Ex: 001"
              />
            </div>
          </div>
        </div>

        {duplicateWarning && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            <AlertTriangle size={18} />
            <span>Atenção: Já existe um Item de Trabalho cadastrado com este <strong>Ano e Número de Referência</strong>.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Serviço</label>
            <SearchableSelect 
              id="list-tipo-servico"
              disabled={isReadOnly}
              options={tiposServico} 
              value={formData.tipoServico} 
              onChange={(v) => handleChange('tipoServico', v)} 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Macroprocesso</label>
            <SearchableSelect 
              id="list-macroprocesso"
              disabled={isReadOnly}
              options={macroprocessos} 
              value={formData.macroprocesso} 
              onChange={(v) => handleChange('macroprocesso', v)} 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Origem da Demanda</label>
            <SearchableSelect 
              id="list-origem"
              disabled={isReadOnly}
              options={origensDemanda} 
              value={formData.origemDemanda} 
              onChange={(v) => handleChange('origemDemanda', v)} 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nível de Risco</label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SearchableSelect 
                  id="list-risco"
                  disabled={isReadOnly}
                  options={niveisRisco} 
                  value={formData.nivelRisco} 
                  onChange={(v) => handleChange('nivelRisco', v)} 
                  placeholder="Selecione..."
                />
              </div>
              {formData.nivelRisco && niveisRisco.includes(formData.nivelRisco) && (
                <span className={`px-3 py-2 border rounded-md text-sm font-bold shadow-sm flex items-center justify-center ${getRiscoColor(formData.nivelRisco)}`}>
                  {formData.nivelRisco.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Data Inicial Prevista</label>
            <input 
              type="date" 
              disabled={isReadOnly}
              className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 ${errors.datas ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-[#00767d]/50'} ${isReadOnly ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
              value={formData.dataInicialPrevista}
              onChange={(e) => handleChange('dataInicialPrevista', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Data Final Prevista</label>
            <input 
              type="date" 
              disabled={isReadOnly}
              className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 ${errors.datas ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-[#00767d]/50'} ${isReadOnly ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
              value={formData.dataFinalPrevista}
              onChange={(e) => handleChange('dataFinalPrevista', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Horas Previstas</label>
            <input 
              type="number" 
              disabled={isReadOnly}
              className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#00767d]/50 ${isReadOnly ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
              value={formData.horasPrevistas}
              onChange={(e) => handleChange('horasPrevistas', e.target.value)}
              placeholder="Ex: 120"
            />
          </div>
        </div>
        
        {errors.datas && (
          <div className="-mt-4 text-red-600 text-sm flex items-center gap-1 font-medium">
            <AlertTriangle size={14} /> {errors.datas}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Objeto Auditado</label>
          <textarea 
            disabled={isReadOnly}
            className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#00767d]/50 min-h-[80px] resize-y ${isReadOnly ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
            placeholder="Descreva o objeto..."
            value={formData.objetoAuditado}
            onChange={(e) => handleChange('objetoAuditado', e.target.value)}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Objetivo da Auditoria</label>
          <textarea 
            disabled={isReadOnly}
            className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#00767d]/50 min-h-[80px] resize-y ${isReadOnly ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
            placeholder="Descreva os objetivos..."
            value={formData.objetivoAuditado}
            onChange={(e) => handleChange('objetivoAuditado', e.target.value)}
          />
        </div>

        {/* EQUIPE E RESPONSÁVEIS */}
        <div className="pt-6 border-t border-gray-100">
           <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">Equipe e Responsáveis</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Responsável</label>
                <SearchableSelect 
                  id="list-responsavel"
                  disabled={isReadOnly}
                  options={pessoasOptions} 
                  value={formData.responsavel} 
                  onChange={(v) => handleChange('responsavel', v)} 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Equipe</label>
                <div className="border border-gray-300 rounded-md p-3 bg-white shadow-sm">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.equipe && formData.equipe.length > 0 ? (
                      formData.equipe.map((pId, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 shadow-sm"
                        >
                          {pId}
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => {
                                handleChange('equipe', formData.equipe.filter(id => id !== pId));
                              }}
                              className="text-teal-600 hover:text-teal-900 font-bold focus:outline-none"
                              title="Remover"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic py-1">
                        Nenhuma pessoa selecionada para a equipe.
                      </span>
                    )}
                  </div>
                  {!isReadOnly && (
                    <div className="flex items-center gap-2 border-t border-gray-100 pt-2">
                      <div className="flex-1">
                        <SearchableSelect
                          placeholder="+ Selecionar e Adicionar Membro à Equipe..."
                          value=""
                          options={pessoasOptions.filter(opt => !(formData.equipe || []).includes(opt))}
                          onChange={(val) => {
                            if (!val) return;
                            handleChange('equipe', [...(formData.equipe || []), val]);
                          }}
                        />
                      </div>
                      {formData.equipe && formData.equipe.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleChange('equipe', [])}
                          className="text-xs font-semibold text-red-600 hover:text-red-800 whitespace-nowrap"
                        >
                          Limpar Todas
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Supervisor</label>
                <SearchableSelect 
                  id="list-supervisor"
                  disabled={isReadOnly}
                  options={pessoasOptions} 
                  value={formData.supervisor} 
                  onChange={(v) => handleChange('supervisor', v)} 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Supervisor Técnico</label>
                <SearchableSelect 
                  id="list-supervisor-tecnico"
                  disabled={isReadOnly}
                  options={pessoasOptions} 
                  value={formData.supervisorTecnico} 
                  onChange={(v) => handleChange('supervisorTecnico', v)} 
                />
              </div>
           </div>
        </div>

        {/* FLUXO DE STATUS */}
        {id && (
          <div className="pt-4 border-t border-gray-100">
             <DocumentLifecyclePanel
                tipoDocumento="item-trabalho"
                documentoId={id}
                onStatusChange={handleStatusChange}
             />
          </div>
        )}
      </div>

      {/* RODAPÉ DO MODAL */}
      <div className="p-5 border-t border-gray-100 bg-white flex justify-between items-center shrink-0">
        <div>
          {id && (
            <button 
              onClick={handleDelete} 
              className="flex items-center gap-2 bg-white border border-red-200 hover:bg-red-50 text-red-600 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              <Trash2 size={16} /> Excluir
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => onClose ? onClose() : navigate(-1)} 
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm"
          >
            {isReadOnly ? 'Fechar' : 'Cancelar'}
          </button>
          {!isReadOnly && (
            <button 
              onClick={handleSave} 
              className="px-5 py-2 bg-[#00767d] hover:bg-[#005a60] text-white rounded-lg font-medium transition-colors text-sm"
            >
              Salvar
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (onClose) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
