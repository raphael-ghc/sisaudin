import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getAllItensTrabalho, deleteItemTrabalho } from '../api/itemTrabalhoApi';
import api from '../api/axiosInstance';
import { useAppContext } from '../contexts/AppContext';
import { Plus, Search, FileText, Edit, Trash2, Filter, X, SlidersHorizontal, FolderSearch, ChevronUp, ChevronDown } from 'lucide-react';
import Spinner from '../components/Spinner';
import ItemTrabalho from './ItemTrabalho';
import Pagination from '../components/Pagination';
import CriarDocumentoDropdown from '../components/CriarDocumentoDropdown';
import DocumentosCriadosModal from '../components/DocumentosCriadosModal';

const getSiglaDocumento = (str, itemSigla = '') => {
    if (!str) return 'DOC';
    const s = str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const isPaint = (itemSigla || '').toUpperCase().includes('PAINT');
    const isExtra = (itemSigla || '').toUpperCase().includes('EXTRA');
    
    if (s.includes('ordem de servico') || s === 'ordemdeservico') return 'OS';
    if (s.includes('comunicacao de auditoria') || s === 'comunicacaoauditoria') return 'CA';
    if (s.includes('solicitacao de auditoria') || s === 'solicitacaoauditoria') return 'SAI';
    if (s.includes('matriz de planejamento') || s === 'matrizplanejamento') return 'MPLAN';
    if (s.includes('planejamento')) return 'PLAN';
    if (s.includes('matriz de achados') || s === 'matrizachados') return 'MAC';
    
    const isPreliminar = s.includes('preliminar');
    const isFinal = s.includes('final');
    const isRelatorio = s.includes('relatorio');
    
    if (isRelatorio) {
      let prefix = 'RAI';
      if (s.includes('especial')) {
        prefix = 'REAI';
      }
      if (isPreliminar) return `${prefix}-P`;
      if (isFinal) return `${prefix}-F`;
      return prefix;
    }
    
    if (s.includes('busca conjunta') || s === 'buscaconjunta') return 'RBC';
    
    const isNotaAuditoria = s.includes('nota de auditoria') || s.startsWith('notaauditoria');
    if (isNotaAuditoria) {
      if (isFinal) return 'NA-F';
      return 'NA-P';
    }
    
    if (s.includes('nota tecnica') || s === 'notatecnica') return 'NT';
    if (s.includes('parecer')) return 'PAR';
    if (s.includes('plano de acao') || s === 'planoacao') return 'PA';
    
    return str.substring(0, 4).toUpperCase();
  };

export default function ItemTrabalhoList() {
  const { jwtPayload } = useAppContext();
  const isSisAdminOrGestor = ['SISTEMA', 'GESTOR'].includes(jwtPayload?.role);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const targetItemId = searchParams.get('targetItemId') || searchParams.get('itemTrabalhoId');

  const [itens, setItens] = useState([]);

  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroCampo, setFiltroCampo] = useState('todos');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Ordenação
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <div className="ml-1 opacity-0 group-hover:opacity-40 inline-flex flex-col"><ChevronUp size={12} className="-mb-1" /><ChevronDown size={12} /></div>;
    }
    if (sortConfig.direction === 'asc') {
      return <div className="ml-1 text-[#00767d] inline-flex"><ChevronUp size={14} /></div>;
    }
    return <div className="ml-1 text-[#00767d] inline-flex"><ChevronDown size={14} /></div>;
  };

  // Filtros Avançados - Item de Trabalho
  const [filtroItemTipo, setFiltroItemTipo] = useState('todos');
  const [filtroItemNumero, setFiltroItemNumero] = useState('');
  const [filtroItemAno, setFiltroItemAno] = useState('');
  const [filtroItemObjeto, setFiltroItemObjeto] = useState('');
  const [filtroItemObjetivo, setFiltroItemObjetivo] = useState('');
  const [filtroItemFase, setFiltroItemFase] = useState('todos');
  const [filtroItemStatus, setFiltroItemStatus] = useState('todos');
  const [filtroItemPessoa, setFiltroItemPessoa] = useState('');

  // Filtros Avançados - Documentos do Trabalho
  const [filtroDocTipo, setFiltroDocTipo] = useState('todos');
  const [filtroDocStatus, setFiltroDocStatus] = useState('todos');
  const [filtroDocNumero, setFiltroDocNumero] = useState('');
  const [filtroDocAno, setFiltroDocAno] = useState('');
  const [filtroDocData, setFiltroDocData] = useState('');

  const uniqueTiposItem = React.useMemo(() => {
    const set = new Set();
    itens.forEach(i => {
      const t = i.tipoItem?.nome || i.tipoItem?.descricao;
      if (t) set.add(t);
    });
    return Array.from(set).sort();
  }, [itens]);


  const activeFiltersCount = [
    filtroItemTipo !== 'todos' && filtroItemTipo !== '',
    filtroItemNumero.trim() !== '',
    filtroItemAno.trim() !== '',
    filtroItemObjeto.trim() !== '',
    filtroItemObjetivo.trim() !== '',
    filtroItemPessoa.trim() !== '',
    filtroDocTipo !== 'todos' && filtroDocTipo !== '',
    filtroDocStatus !== 'todos' && filtroDocStatus !== '',
    filtroDocNumero.trim() !== '',
    filtroDocAno.trim() !== '',
    filtroDocData.trim() !== '',
    busca.trim() !== ''
  ].filter(Boolean).length;

  const limparTodosFiltros = () => {
    setBusca('');
    setFiltroCampo('todos');
    setFiltroItemTipo('todos');
    setFiltroItemNumero('');
    setFiltroItemAno('');
    setFiltroItemObjeto('');
    setFiltroItemObjetivo('');
    setFiltroItemFase('todos');
    setFiltroItemStatus('todos');
    setFiltroItemPessoa('');
    setFiltroDocTipo('todos');
    setFiltroDocStatus('todos');
    setFiltroDocNumero('');
    setFiltroDocAno('');
    setFiltroDocData('');
  };
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [modalDocumentosCriadosId, setModalDocumentosCriadosId] = useState(null);
  const [modalDocumentosCriadosNome, setModalDocumentosCriadosNome] = useState('');

  // Paginação
  const savedPage = parseInt(sessionStorage.getItem('itemTrabalhoList_currentPage'), 10) || 1;

  const [currentPage, setCurrentPage] = useState(savedPage);
  const itemsPerPage = 10;
  const isMountedRef = React.useRef(false);

  useEffect(() => {
    sessionStorage.setItem('itemTrabalhoList_currentPage', currentPage);
  }, [currentPage]);

  // Exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [isDeleteDocModalOpen, setIsDeleteDocModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

  const fetchItens = async () => {
    setLoading(true);
    try {
      const response = await getAllItensTrabalho();
      if (response.data && response.data.success) {
        const content = response.data.data.content || response.data.data;
        setItens(content);
      }
    } catch (error) {
      toast.error("Erro ao carregar Itens de Trabalho.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItens();
  }, []);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    setCurrentPage(1);
  }, [
    busca, filtroCampo,
    filtroItemTipo, filtroItemNumero, filtroItemAno, 
    filtroItemObjeto, filtroItemObjetivo, filtroItemFase, filtroItemStatus,
    filtroDocTipo, filtroDocStatus, filtroDocNumero, filtroDocAno, filtroDocData
  ]);

  const itensFiltrados = itens.filter(item => {
    // 1. Busca textual rápida
    const term = busca.toLowerCase();
    if (term) {
      const nome = (item.nome || '').toLowerCase();
      const sigla = (item.sigla || '').toLowerCase();
      const ano = (item.anoReferencia || '').toString();
      const numRef = (item.numeroReferencia || '').toLowerCase();
      const anoRefCombo = ano ? `${ano}/${numRef || '-'}` : '-';
      const tipo = (item.tipoItem?.nome || item.tipoItem?.descricao || '').toLowerCase();

      const objeto = (item.objetoAuditado || '').toLowerCase();
      const objetivo = (item.objetivoAuditoria || '').toLowerCase();
      const fase = (item.faseAuditoria || '').toLowerCase();

      const status = (item.status || '').toLowerCase();

      const checkName = (p, termToFind) => {
        if (!p) return false;
        if (typeof p === 'string') return p.toLowerCase().includes(termToFind);
        return p.nome && p.nome.toLowerCase().includes(termToFind);
      };
      const matchPessoa = (t) => {
        if (checkName(item.responsavel, t)) return true;
        if (checkName(item.supervisor, t)) return true;
        if (checkName(item.supervisorTecnico, t)) return true;
        if (item.equipe && Array.isArray(item.equipe)) {
          if (item.equipe.some(p => checkName(p, t))) return true;
        }
        return false;
      };


      if (filtroCampo === 'nome' && !nome.includes(term)) return false;
      if (filtroCampo === 'objeto' && !objeto.includes(term)) return false;
      if (filtroCampo === 'objetivo' && !objetivo.includes(term)) return false;
      if (filtroCampo === 'ano' && !anoRefCombo.includes(term)) return false;
      if (filtroCampo === 'tipo' && !tipo.includes(term)) return false;
      if (filtroCampo === 'fase' && !fase.includes(term)) return false;
      if (filtroCampo === 'status' && !status.includes(term)) return false;
      if (filtroCampo === 'todos' && !(
        nome.includes(term) || objeto.includes(term) || objetivo.includes(term) || numRef.includes(term) || ano.includes(term) || tipo.includes(term) || fase.includes(term) || status.includes(term) || matchPessoa(term)
      )) return false;
    }

    // 2. Filtros Avançados - Item de Trabalho
    if (filtroItemTipo !== 'todos' && filtroItemTipo !== '') {
      const tItem = (item.tipoItem?.nome || item.tipoItem?.descricao || '').toLowerCase();
      if (tItem !== filtroItemTipo.toLowerCase()) return false;
    }
    if (filtroItemNumero.trim() !== '') {
      if (!String(item.numeroReferencia || '').toLowerCase().includes(filtroItemNumero.trim().toLowerCase())) return false;
    }
    if (filtroItemAno.trim() !== '') {
      if (!String(item.anoReferencia || '').toLowerCase().includes(filtroItemAno.trim().toLowerCase())) return false;
    }
    if (filtroItemObjeto.trim() !== '') {
      if (!(item.objetoAuditado || '').toLowerCase().includes(filtroItemObjeto.trim().toLowerCase())) return false;
    }
    if (filtroItemObjetivo.trim() !== '') {
      if (!(item.objetivoAuditoria || '').toLowerCase().includes(filtroItemObjetivo.trim().toLowerCase())) return false;
    }
    if (filtroItemFase !== 'todos' && filtroItemFase !== '') {
      if ((item.faseAuditoria || '').toLowerCase() !== filtroItemFase.toLowerCase()) return false;
    }

    if (filtroItemStatus !== 'todos' && filtroItemStatus !== '') {
      if ((item.status || 'NEUTRO').toLowerCase() !== filtroItemStatus.toLowerCase()) return false;
    }
    if (filtroItemPessoa.trim() !== '') {
      const termPessoa = filtroItemPessoa.trim().toLowerCase();
      const checkNameAdv = (p) => {
        if (!p) return false;
        if (typeof p === 'string') return p.toLowerCase().includes(termPessoa);
        return p.nome && p.nome.toLowerCase().includes(termPessoa);
      };
      const matched = checkNameAdv(item.responsavel) || checkNameAdv(item.supervisor) || checkNameAdv(item.supervisorTecnico) || (item.equipe && Array.isArray(item.equipe) && item.equipe.some(checkNameAdv));
      if (!matched) return false;
    }


    // 3. Filtros Avançados - Documentos do Trabalho
    const hasDocFilter = 
      (filtroDocTipo !== 'todos' && filtroDocTipo !== '') ||
      (filtroDocStatus !== 'todos' && filtroDocStatus !== '') ||
      (filtroDocNumero.trim() !== '') ||
      (filtroDocAno.trim() !== '') ||
      (filtroDocData.trim() !== '');

    if (hasDocFilter) {
      const docs = item.documentosCriados || [];
      const matchDoc = docs.some(doc => {
        if (filtroDocTipo !== 'todos' && filtroDocTipo !== '') {
          const s = (doc.nome || doc.nomeTipo || doc.tipo || '').toLowerCase();
          const sigla = getSiglaDocumento(doc.nome || doc.nomeTipo || doc.tipo, item.sigla);
          if (sigla.toUpperCase() !== filtroDocTipo.toUpperCase()) {
            return false;
          }
        }
        if (filtroDocStatus !== 'todos' && filtroDocStatus !== '') {
          if ((doc.status || 'Minuta').toLowerCase() !== filtroDocStatus.toLowerCase()) {
            return false;
          }
        }
        if (filtroDocNumero.trim() !== '') {
          const numTerm = filtroDocNumero.trim();
          const numStr = doc.numero !== undefined && doc.numero !== null ? String(doc.numero) : '';
          const numAnoStr = doc.numeroAno || '';
          if (numStr !== numTerm && !numAnoStr.startsWith(numTerm + '/') && !numAnoStr.split('/')[0].includes(numTerm)) {
            return false;
          }
        }
        if (filtroDocAno.trim() !== '') {
          const anoTerm = filtroDocAno.trim();
          const numAnoStr = doc.numeroAno || '';
          const anoCriacao = doc.dataCriacao ? String(new Date(doc.dataCriacao).getFullYear()) : '';
          if (!numAnoStr.endsWith('/' + anoTerm) && anoCriacao !== anoTerm) {
            return false;
          }
        }
        if (filtroDocData.trim() !== '') {
          const dataDoc = doc.dataCriacao ? doc.dataCriacao.substring(0, 10) : '';
          if (dataDoc !== filtroDocData.trim()) {
            return false;
          }
        }
        return true;
      });

      if (!matchDoc) return false;
    }

    return true;
  });

  const itensOrdenados = React.useMemo(() => {
    let sortableItems = [...itensFiltrados];
    if (sortConfig !== null && sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        if (sortConfig.key === 'anoReferencia') {
          aValue = `${a.anoReferencia || ''}/${a.numeroReferencia || ''}`;
          bValue = `${b.anoReferencia || ''}/${b.numeroReferencia || ''}`;
        } else if (sortConfig.key === 'tipoItem') {
          aValue = a.tipoItem?.nome || a.tipoItem?.descricao || '';
          bValue = b.tipoItem?.nome || b.tipoItem?.descricao || '';
        }
        
        if (aValue === null || aValue === undefined) aValue = '';
        if (bValue === null || bValue === undefined) bValue = '';
        
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [itensFiltrados, sortConfig]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = itensOrdenados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(itensOrdenados.length / itemsPerPage);

  useEffect(() => {
    if (targetItemId && itensOrdenados.length > 0) {
      const idx = itensOrdenados.findIndex(i => Number(i.id) === Number(targetItemId));
      if (idx !== -1) {
        const targetPage = Math.floor(idx / itemsPerPage) + 1;
        setCurrentPage(targetPage);
        // Ensure it scrolls into view after rendering
        setTimeout(() => {
          const row = document.getElementById(`row-${targetItemId}`);
          if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    }
  }, [targetItemId, itensOrdenados]);

  const handleDeleteClick = (item) => {

    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await deleteItemTrabalho(itemToDelete.id);
        toast.success('Item de Trabalho excluído com sucesso!');
        fetchItens(); 
      } catch (err) {
        const mensagemErro = err.response?.data?.error || `Erro ao excluir o Item de Trabalho.`;
        toast.error(mensagemErro);
        console.error(err);
      } finally {
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
      }
    }
  };

  const handleDeleteDocClick = (doc) => {
    setDocToDelete(doc);
    setIsDeleteDocModalOpen(true);
  };

  const confirmDeleteDocument = async () => {
    if (docToDelete) {
      try {
        // Rota de exclusão pelo tipo enviado pelo backend (FluxoDocumentoService.extrairDocumentosCriados)
        const rotasExclusao = {
          ORDEM_SERVICO: '/ordens-servico',
          COMUNICACAO_AUDITORIA: '/comunicacoes',
          SOLICITACAO_AUDITORIA: '/solicitacoes',
          NOTA_AUDITORIA_PRELIMINAR: '/notas-preliminar',
          NOTA_AUDITORIA_FINAL: '/notas-final',
          NOTA_TECNICA: '/notas-tecnicas',
          PARECER: '/pareceres',
          RELATORIO_PRELIMINAR: '/relatorios-preliminar',
          RELATORIO_FINAL: '/relatorios-final',
          REUNIAO: '/reunioes',
          VISITA: '/visitas',
          PLANEJAMENTO: '/planejamentos',
          MATRIZ_ACHADOS: '/matrizes-achados',
          REUNIAO_BUSCA_CONJUNTA: '/reunioes-busca-conjunta',
        };
        const base = rotasExclusao[docToDelete.tipo];
        const endpoint = base ? `${base}/${docToDelete.id}` : '';

        if (endpoint) {
          await api.delete(endpoint);
          toast.success('Documento excluído com sucesso!');
          fetchItens();
        } else {
          toast.error('Não foi possível identificar o tipo do documento para exclusão.');
        }
      } catch (error) {
        console.error('Erro ao excluir documento:', error);
        toast.error('Erro ao excluir documento. Tente novamente.');
      } finally {
        setIsDeleteDocModalOpen(false);
        setDocToDelete(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <Spinner />
        <p className="text-gray-500 ml-3">Carregando dados de Itens de Trabalho...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-6 min-h-full h-fit w-full flex flex-col">
      
      {/* Cabeçalho Dinâmico */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            Itens de Trabalho
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie os registros de Itens de Trabalho.</p>
        </div>
        <button 
          onClick={() => { setSelectedId(null); setIsModalOpen(true); }}
          className="w-full md:w-auto bg-[#00767d] hover:bg-[#005f64] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>Novo Item de Trabalho</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder={filtroCampo === 'todos' ? "Buscar por nome, sigla ou número..." : "Digite para buscar..."}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00767d]/50"
          />
        </div>
        
        <div className="relative md:w-56">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <select
            value={filtroCampo}
            onChange={(e) => setFiltroCampo(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 appearance-none border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00767d]/50 bg-gray-50 text-gray-700 cursor-pointer font-medium"
          >
            <option value="todos">Todos os campos</option>
            <option value="nome">Apenas Nome</option>
            <option value="objeto">Apenas Objeto</option>
            <option value="objetivo">Apenas Objetivo</option>
            <option value="ano">Apenas Ano/Ref</option>
            <option value="tipo">Apenas Tipo</option>
            <option value="fase">Apenas Fase</option>
            <option value="status">Apenas Status</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>

        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm border ${
            showAdvancedFilters || activeFiltersCount > 0
              ? 'bg-[#00767d] text-white border-[#00767d]'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
          title="Filtros Avançados e Combinados"
        >
          <SlidersHorizontal size={18} />
          <span>Filtros Avançados</span>
          {activeFiltersCount > 0 && (
            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
              showAdvancedFilters || activeFiltersCount > 0
                ? 'bg-white text-[#00767d]'
                : 'bg-[#00767d] text-white'
            }`}>
              {activeFiltersCount}
            </span>
          )}
        </button>

        {activeFiltersCount > 0 && (
          <button
            onClick={limparTodosFiltros}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
            title="Limpar todos os filtros"
          >
            <X size={16} />
            <span className="hidden sm:inline">Limpar</span>
          </button>
        )}
      </div>

      {/* Painel de Filtros Avançados e Combinados */}
      {showAdvancedFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-md transition-all">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FolderSearch size={20} className="text-[#00767d]" />
              <div>
                <h3 className="font-bold text-gray-800 text-base">Filtros Avançados e Combinados</h3>
                <p className="text-xs text-gray-500">Combine múltiplos critérios para filtrar por atributos do Item de Trabalho ou por Documentos gerados.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <button
                  onClick={limparTodosFiltros}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <X size={14} />
                  <span>Limpar ({activeFiltersCount})</span>
                </button>
              )}
              <button
                onClick={() => setShowAdvancedFilters(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Fechar painel"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* PARTE 1: FILTROS POR ITEM DE TRABALHO */}
          <div className="mb-6">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>Filtros do Item de Trabalho</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de Item</label>
                <select
                  value={filtroItemTipo}
                  onChange={(e) => setFiltroItemTipo(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00767d]/50 text-gray-800"
                >
                  <option value="todos">Todos os tipos</option>
                  {uniqueTiposItem.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Número do Item</label>
                <input
                  type="text"
                  placeholder="Ex: 01 ou 3"
                  value={filtroItemNumero}
                  onChange={(e) => setFiltroItemNumero(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00767d]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ano do Item</label>
                <input
                  type="text"
                  placeholder="Ex: 2026"
                  value={filtroItemAno}
                  onChange={(e) => setFiltroItemAno(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00767d]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Objeto de Auditoria</label>
                <input
                  type="text"
                  placeholder="Filtrar por objeto..."
                  value={filtroItemObjeto}
                  onChange={(e) => setFiltroItemObjeto(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00767d]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Objetivo de Auditoria</label>
                <input
                  type="text"
                  placeholder="Filtrar por objetivo..."
                  value={filtroItemObjetivo}
                  onChange={(e) => setFiltroItemObjetivo(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00767d]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Fase da Auditoria</label>
                <select
                  value={filtroItemFase}
                  onChange={(e) => setFiltroItemFase(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00767d]/50 text-gray-800"
                >
                  <option value="todos">Todas as fases</option>
                  <option value="PLANEJAMENTO">Planejamento</option>
                  <option value="EXECUÇÃO">Execução</option>
                  <option value="RELATÓRIO">Relatório</option>
                  <option value="MONITORAMENTO">Monitoramento</option>
                </select>
              </div>


              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Pessoas Envolvidas</label>
                <input
                  type="text"
                  placeholder="Nome do responsável, supervisor ou equipe..."
                  value={filtroItemPessoa}
                  onChange={(e) => setFiltroItemPessoa(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00767d]/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Status do Item</label>
                <select
                  value={filtroItemStatus}
                  onChange={(e) => setFiltroItemStatus(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00767d]/50 text-gray-800"
                >
                  <option value="todos">Todos os status</option>
                  <option value="NEUTRO">Neutro</option>
                  <option value="EM_ANDAMENTO">Em andamento</option>
                  <option value="CONCLUIDO">Concluído</option>
                  <option value="CANCELADO">Cancelado</option>
                  <option value="SUSPENSO">Suspenso</option>
                  <option value="ATRASADO">Atrasado</option>
                </select>
              </div>
            </div>
          </div>

          {/* PARTE 2: FILTROS POR DOCUMENTO DO TRABALHO */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-[#00767d]"></span>
              <span>Filtros dos Documentos do Trabalho (OS, CA, RAI, PA, etc.)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de Documento</label>
                <select
                  value={filtroDocTipo}
                  onChange={(e) => setFiltroDocTipo(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00767d]/50 text-gray-800"
                >
                  <option value="todos">Todos os documentos</option>
                  <option value="OS">OS - Ordem de Serviço</option>
                  <option value="CA">CA - Comunicação de Auditoria</option>
                  <option value="SAI">SAI - Solicitação de Auditoria</option>
                  <option value="PLAN">PLAN - Planejamento</option>
                  <option value="MPLAN">MPLAN - Matriz de Planej.</option>
                  <option value="MAC">MAC - Matriz de Achados</option>
                  <option value="RAI-P">RAI-P - Relatório Preliminar</option>
                  <option value="REAI-P">REAI-P - Relatório Especial Preliminar</option>
                  <option value="RAI-F">RAI-F - Relatório Final</option>
                  <option value="REAI-F">REAI-F - Relatório Especial Final</option>
                  <option value="RBC">RBC - Busca Conjunta</option>
                  <option value="NA-P">NA-P - Nota de Auditoria Preliminar</option>
                  <option value="NA-F">NA-F - Nota de Auditoria Final</option>
                  <option value="NT">NT - Nota Técnica</option>
                  <option value="PAR">PAR - Parecer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Status do Documento</label>
                <select
                  value={filtroDocStatus}
                  onChange={(e) => setFiltroDocStatus(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00767d]/50 text-gray-800"
                >
                  <option value="todos">Todos os status</option>
                  <option value="Minuta">Minuta</option>
                  <option value="Em revisão">Em revisão</option>
                  <option value="Revisado">Revisado</option>
                  <option value="Em aprovação">Em aprovação</option>
                  <option value="Aprovado">Aprovado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nº do Documento</label>
                <input
                  type="text"
                  placeholder="Ex: 3"
                  value={filtroDocNumero}
                  onChange={(e) => setFiltroDocNumero(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00767d]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ano do Documento</label>
                <input
                  type="text"
                  placeholder="Ex: 2026"
                  value={filtroDocAno}
                  onChange={(e) => setFiltroDocAno(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00767d]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Data de Emissão</label>
                <input
                  type="date"
                  value={filtroDocData}
                  onChange={(e) => setFiltroDocData(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00767d]/50 text-gray-800"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="flex-1 overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead className="hidden md:table-header-group">
            <tr className="bg-gray-50 text-gray-600 text-sm border-y border-gray-200">
              <th className="py-3 px-4 font-semibold w-auto">
                <div className="flex items-center cursor-pointer group" onClick={() => handleSort('nome')}>
                  Nome <SortIcon columnKey="nome" />
                </div>
              </th>
              <th className="py-3 px-4 font-semibold w-80">
                <div className="flex items-center cursor-pointer group" onClick={() => handleSort('objetoAuditado')}>
                  Objeto Auditado <SortIcon columnKey="objetoAuditado" />
                </div>
              </th>
              <th className="py-3 px-4 font-semibold w-90">
                <div className="flex items-center cursor-pointer group" onClick={() => handleSort('objetivoAuditoria')}>
                  Objetivo <SortIcon columnKey="objetivoAuditoria" />
                </div>
              </th>
              <th className="py-3 px-4 font-semibold w-24">
                <div className="flex items-center cursor-pointer group" onClick={() => handleSort('anoReferencia')}>
                  Ano/Ref <SortIcon columnKey="anoReferencia" />
                </div>
              </th>
              <th className="py-3 px-4 font-semibold w-24">
                <div className="flex items-center cursor-pointer group" onClick={() => handleSort('tipoItem')}>
                  Tipo <SortIcon columnKey="tipoItem" />
                </div>
              </th>
              <th className="py-3 px-4 font-semibold text-center w-24">
                <div className="flex items-center justify-center cursor-pointer group" onClick={() => handleSort('faseAuditoria')}>
                  Fase <SortIcon columnKey="faseAuditoria" />
                </div>
              </th>
              <th className="py-3 px-4 font-semibold text-center w-24">
                <div className="flex items-center justify-center cursor-pointer group" onClick={() => handleSort('status')}>
                  Status <SortIcon columnKey="status" />
                </div>
              </th>
              <th className="py-3 px-4 font-semibold w-64">Documentos do Trabalho</th>
              <th className="py-3 px-4 font-semibold text-right w-24">Ações</th>
            </tr>
          </thead>
          
          <tbody className="block md:table-row-group">
            {itensOrdenados.length === 0 ? (
              <tr className="block md:table-row">
                <td colSpan="9" className="block md:table-cell py-8 text-center text-gray-500">
                  Nenhum resultado encontrado para a sua busca.
                </td>
              </tr>
            ) : (
              currentItems.map((item) => (
                <tr id={`row-${item.id}`} key={item.id} className={`block md:table-row border border-gray-200 md:border-0 md:border-b md:border-gray-100 rounded-lg mb-4 md:mb-0 p-4 md:p-0 transition-colors shadow-sm md:shadow-none ${
                  Number(item.id) === Number(targetItemId)
                    ? 'bg-yellow-50 md:bg-yellow-100/60 border-yellow-300 ring-2 ring-yellow-400/50'
                    : 'bg-white md:bg-transparent hover:bg-gray-50/50'
                }`}>
                  <td className="block md:table-cell py-2 md:py-3 md:px-4 text-gray-700">
                    <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Nome</span>
                    <div className="group relative md:max-w-sm cursor-default">
                        <div className="font-medium text-gray-800 line-clamp-2 md:line-clamp-2">{item.nome || 'Sem Nome'}</div>
                        <div className="mt-2 text-xs text-gray-500 flex flex-col gap-0.5">
                          {item.responsavel && <div><span className="font-semibold text-gray-600">Resp:</span> {item.responsavel.nome || item.responsavel.email || item.responsavel}</div>}
                          {item.supervisor && <div><span className="font-semibold text-gray-600">Sup:</span> {item.supervisor.nome || item.supervisor.email || item.supervisor}</div>}
                          {item.supervisorTecnico && <div><span className="font-semibold text-gray-600">Sup. Téc:</span> {item.supervisorTecnico.nome || item.supervisorTecnico.email || item.supervisorTecnico}</div>}
                          {item.equipe && item.equipe.length > 0 && <div><span className="font-semibold text-gray-600">Equipe:</span> {item.equipe.map(p => p.nome || p.email || p).join(', ')}</div>}
                        </div>
                        <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 absolute z-50 left-0 top-full mt-1 w-[280px] sm:w-[350px] p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl pointer-events-none whitespace-normal leading-relaxed">
                          {item.nome || 'Sem Nome'}
                        </div>
                    </div>
                  </td>

                  <td className="block md:table-cell py-2 md:py-3 md:px-4 text-sm text-gray-600">
                    <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Objeto Auditado</span>
                    <div title={item.objetoAuditado}>{item.objetoAuditado || '-'}</div>
                  </td>

                  <td className="block md:table-cell py-2 md:py-3 md:px-4 text-sm text-gray-600">
                    <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Objetivo</span>
                    <div title={item.objetivoAuditoria}>{item.objetivoAuditoria || '-'}</div>
                  </td>

                  <td className="block md:table-cell py-2 md:py-3 md:px-4 text-sm text-gray-600">
                    <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Ano/Ref</span>
                    {item.anoReferencia ? `${item.anoReferencia}/${item.numeroReferencia || '-'}` : '-'}
                  </td>

                  <td className="block md:table-cell py-2 md:py-3 md:px-4 text-sm text-gray-600">
                    <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Tipo</span>
                    {item.tipoItem?.nome || item.tipoItem?.descricao || '-'}
                  </td>

                  <td className="block md:table-cell py-2 md:py-3 md:px-4 text-center">
                    <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Fase</span>
                    {(() => {
                      const fase = item.faseAuditoria || 'PLANEJAMENTO';
                      const corFase = 
                        fase === 'EXECUÇÃO' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        fase === 'RELATÓRIO' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                        fase === 'MONITORAMENTO' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        'bg-sky-100 text-sky-800 border-sky-200';
                      return (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${corFase}`}>
                          {fase}
                        </span>
                      );
                    })()}
                  </td>
                                     
                  <td className="flex justify-between md:table-cell items-center py-3 md:px-4 text-center border-t border-gray-100 md:border-t-0 mt-3 md:mt-0 pt-3 md:pt-3">
                    <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                        {item.status || 'NOVO'}
                    </span>
                  </td>

                  <td className="block md:table-cell py-3 md:px-4 text-xs text-gray-700">
                    <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Documentos do Trabalho</span>
                    {!item.documentosCriados || item.documentosCriados.length === 0 ? (
                      <span className="text-gray-400 italic">Nenhum documento</span>
                    ) : (
                      <div className="flex flex-col gap-1.5 max-w-md">
                        {[...item.documentosCriados].sort((a, b) => {
                          const dateA = a.dataCriacao ? new Date(a.dataCriacao).getTime() : 0;
                          const dateB = b.dataCriacao ? new Date(b.dataCriacao).getTime() : 0;
                          return dateA - dateB;
                        }).map((doc) => {
                          const getSiglaDocumento = (str, itemSigla = '') => {
    if (!str) return 'DOC';
    const s = str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const isPaint = (itemSigla || '').toUpperCase().includes('PAINT');
    const isExtra = (itemSigla || '').toUpperCase().includes('EXTRA');
    
    if (s.includes('ordem de servico') || s === 'ordemdeservico') return 'OS';
    if (s.includes('comunicacao de auditoria') || s === 'comunicacaoauditoria') return 'CA';
    if (s.includes('solicitacao de auditoria') || s === 'solicitacaoauditoria') return 'SAI';
    if (s.includes('matriz de planejamento') || s === 'matrizplanejamento') return 'MPLAN';
    if (s.includes('planejamento')) return 'PLAN';
    if (s.includes('matriz de achados') || s === 'matrizachados') return 'MAC';
    
    const isPreliminar = s.includes('preliminar');
    const isFinal = s.includes('final');
    const isRelatorio = s.includes('relatorio');
    
    if (isRelatorio) {
      let prefix = 'RAI';
      if (s.includes('especial')) {
        prefix = 'REAI';
      }
      if (isPreliminar) return `${prefix}-P`;
      if (isFinal) return `${prefix}-F`;
      return prefix;
    }
    
    if (s.includes('busca conjunta') || s === 'buscaconjunta') return 'RBC';
    
    const isNotaAuditoria = s.includes('nota de auditoria') || s.startsWith('notaauditoria');
    if (isNotaAuditoria) {
      if (isFinal) return 'NA-F';
      return 'NA-P';
    }
    
    if (s.includes('nota tecnica') || s === 'notatecnica') return 'NT';
    if (s.includes('parecer')) return 'PAR';
    if (s.includes('plano de acao') || s === 'planoacao') return 'PA';
    
    return str.substring(0, 4).toUpperCase();
  };

                          const siglaDoc = getSiglaDocumento(doc.nome || doc.nomeTipo || doc.tipo, item.sigla);

                          let numeroAnoStr = '-';
                          if (doc.numeroAno && doc.numeroAno !== '-') {
                            numeroAnoStr = doc.numeroAno;
                            if (!String(numeroAnoStr).includes('/')) {
                              const ano = doc.ano || (doc.dataCriacao ? new Date(doc.dataCriacao).getFullYear() : new Date().getFullYear());
                              numeroAnoStr = `${numeroAnoStr}/${ano}`;
                            }
                          } else if (doc.numero !== undefined && doc.numero !== null) {
                            const ano = doc.ano || (doc.dataCriacao ? new Date(doc.dataCriacao).getFullYear() : new Date().getFullYear());
                            numeroAnoStr = `${doc.numero}/${ano}`;
                          }

                          const statusLower = (doc.status || '').toLowerCase();
                          let statusColor = 'bg-gray-100 text-gray-700 border-gray-200';
                          if (statusLower.includes('aprovado')) statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                          else if (statusLower.includes('revisado')) statusColor = 'bg-blue-50 text-blue-700 border-blue-200';
                          else if (statusLower.includes('revisão') || statusLower.includes('aprovação')) statusColor = 'bg-amber-50 text-amber-700 border-amber-200';
                          else if (statusLower.includes('minuta')) statusColor = 'bg-slate-100 text-slate-700 border-slate-200';

                          return (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-gray-50/80 hover:bg-white border border-gray-200/80 rounded-md transition-all shadow-2xs"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="font-bold text-gray-800 shrink-0" title={doc.nome || doc.nomeTipo}>
                                  {siglaDoc}
                                </span>
                                <span className="text-gray-400 shrink-0">-</span>
                                <span className="text-gray-700 shrink-0 font-mono font-medium">
                                  {numeroAnoStr}
                                </span>
                                {doc.siglasGerencias && doc.siglasGerencias !== '-' && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0" title="Gerência(s) Destinatária(s)">
                                    {doc.siglasGerencias}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">                                
                                {isSisAdminOrGestor && (
                                  <button
                                    onClick={() => handleDeleteDocClick(doc)}
                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Excluir Documento"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}

                                {/*<span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                                  {doc.status || 'Minuta'}
                                </span>
                                <button
                                  onClick={() => navigate(doc.rotaVisualizar || doc.rotaEditar)}
                                  className="p-1 text-gray-400 hover:text-[#00767d] hover:bg-[#00767d]/10 rounded transition-colors"
                                  title="Visualizar"
                                >
                                <FileText size={13} />
                                </button>*/}

                                <button
                                  onClick={() => navigate(doc.rotaEditar)}
                                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Editar/Visualizar"
                                >
                                  <Edit size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </td>
                  
                  <td className="flex justify-between md:table-cell items-center py-2 md:py-3 md:px-4 border-t border-gray-50 md:border-t-0 pt-2 md:pt-3">
                    <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</span>
                    <div className="flex items-center justify-end gap-2">
                      <CriarDocumentoDropdown itemTrabalhoId={item.id} itemNome={item.nome} />
                      {/*<button onClick={() => { setSelectedId(item.id); setIsModalOpen(true); }} className="p-2 md:p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="Editar">
                        <Edit size={18} />
                      </button>*/}
                      
                      {isSisAdminOrGestor && (
                        <button onClick={() => { setSelectedId(item.id); setIsModalOpen(true); }} className="p-2 md:p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="Editar">
                          <Edit size={18} />
                        </button>
                      )}

                      {isSisAdminOrGestor && (
                        <button onClick={() => handleDeleteClick(item)} className="p-2 md:p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Excluir">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação UI */}
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        indexOfFirstItem={indexOfFirstItem}
        indexOfLastItem={indexOfLastItem}
        totalItems={itensFiltrados.length}
      />

      {/* Modal Cadastro/Edição */}
      {isModalOpen && (
        <ItemTrabalho 
          propId={selectedId}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchItens}
        />
      )}

      {/* Modal Documentos Criados */}
      {modalDocumentosCriadosId && (
        <DocumentosCriadosModal
          itemTrabalhoId={modalDocumentosCriadosId}
          itemNome={modalDocumentosCriadosNome}
          onClose={() => {
            setModalDocumentosCriadosId(null);
            setModalDocumentosCriadosNome('');
          }}
        />
      )}

      {/* Modal de Exclusão */}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Excluir Registro</h2>
              <p className="text-gray-500 mb-6">
                Tem certeza que deseja excluir este registro de Item de Trabalho? Esta ação não poderá ser desfeita.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exclusão de Documento */}
      {isDeleteDocModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Excluir Documento</h2>
              <p className="text-gray-500 mb-6">
                Tem certeza que deseja excluir o documento <strong>{docToDelete?.nome || docToDelete?.nomeTipo || docToDelete?.tipo}</strong>? Esta ação não poderá ser desfeita.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsDeleteDocModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDeleteDocument}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
