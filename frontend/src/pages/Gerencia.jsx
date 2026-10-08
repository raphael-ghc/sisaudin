import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { 
  getAllGerencias, 
  createGerencia, 
  updateGerencia, 
  deleteGerencia 
} from "../api/gerenciaApi";
import { getAllPessoas } from "../api/pessoaApi"; 
import { useAppContext } from "../contexts/AppContext";
import Spinner from "../components/Spinner";
import { Plus, Edit, Trash2, X, Search, CheckCircle2, XCircle, AlertTriangle, Ban, Filter, User } from 'lucide-react';
import Pagination from '../components/Pagination';

// NOVO: Importe o seu componente SearchableSelect. 
// Se estiver usando react-select direto, seria: import Select from 'react-select';
import SearchableSelect from 'react-select'; 

const Gerencias = () => {
  const { accessToken } = useAppContext();
  const [gerencias, setGerencias] = useState([]);
  const [pessoas, setPessoas] = useState([]); 
  const [loading, setLoading] = useState(true);

  // ALTERADO: A maioria dos componentes SearchableSelect (como o react-select) 
  // espera o formato { value, label } em vez de { id, label }
  const pessoasOptions = pessoas.map(p => ({ 
    value: p.id, 
    label: `${p.nome} (Cartão: ${p.cartaoPonto}) (Cargo: ${p.cargo?.nome || '-'})` 
  }));

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resGerencias, resPessoas] = await Promise.all([
        getAllGerencias(),
        getAllPessoas() 
      ]);
      
      setGerencias((resGerencias.data?.data?.content || resGerencias.data?.content || (resGerencias.data?._embedded ? Object.values(resGerencias.data._embedded)[0] : resGerencias.data?.data) || []));
      setPessoas((resPessoas.data?.data?.content || resPessoas.data?.content || (resPessoas.data?._embedded ? Object.values(resPessoas.data._embedded)[0] : resPessoas.data?.data) || [])); 
    } catch (err) {
      toast.error("Falha ao carregar os dados iniciais.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [busca, setBusca] = useState('');
  const [filtroCampo, setFiltroCampo] = useState('todos'); 
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); 
  
  const [formData, setFormData] = useState({ 
    id: null, 
    nome: '', 
    sigla: '', 
    status: 'ACTIVE',
    unidade: null,       
    gerenteAtual: null,  
    equipe: []           
  });

  const listaFiltrada = gerencias.filter(mp => {
    const termoBusca = busca.toLowerCase();
    
    const nomeMatch = mp.nome ? mp.nome.toLowerCase().includes(termoBusca) : false;
    const siglaMatch = mp.sigla ? mp.sigla.toLowerCase().includes(termoBusca) : false;
    const gerenteMatch = mp.gerenteAtual?.nome ? mp.gerenteAtual.nome.toLowerCase().includes(termoBusca) : false;

    if (filtroCampo === 'statuss') {
      return mp.status === 'ACTIVE' && (nomeMatch || siglaMatch || gerenteMatch);
    }
    if (filtroCampo === 'instatuss') {
      return mp.status !== 'ACTIVE' && (nomeMatch || siglaMatch || gerenteMatch);
    }
    if (filtroCampo === 'nome') return nomeMatch;
    if (filtroCampo === 'sigla') return siglaMatch;
    if (filtroCampo === 'gerente') return gerenteMatch; 

    return nomeMatch || siglaMatch || gerenteMatch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [busca, filtroCampo]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = listaFiltrada.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(listaFiltrada.length / itemsPerPage);

  const handleAdd = () => {
    setFormData({ 
      id: null, 
      nome: '', 
      sigla: '', 
      status: 'ACTIVE', 
      unidade: null, 
      gerenteAtual: null, 
      equipe: [] 
    });
    setIsModalOpen(true);
  };

  const handleEdit = (mp) => {
    setFormData({
      id: mp.id,
      nome: mp.nome || '',
      sigla: mp.sigla || '',
      status: mp.status || 'ACTIVE',
      unidade: mp.unidade || null,
      gerenteAtual: mp.gerenteAtual || null, 
      equipe: mp.equipe || [] 
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await updateGerencia(formData.id, formData);
        toast.success("Gerência atualizada com sucesso!");
      } else {
        const { id, ...dataToCreate } = formData; 
        await createGerencia(dataToCreate);
        toast.success("Nova gerência criada com sucesso!");
      }
      
      setIsModalOpen(false);
      const res = await getAllGerencias();
      setGerencias((res.data?.data?.content || res.data?.content || (res.data?._embedded ? Object.values(res.data._embedded)[0] : res.data?.data) || []));
      
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao salvar a gerência.");
      console.error(error);
    }
  };

  const handleToggleStatus = async (id) => {
    const gerenciaTarget = gerencias.find(mp => mp.id === id);
    if (!gerenciaTarget) return;

    const novoStatus = gerenciaTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      const payloadCompleto = { ...gerenciaTarget, status: novoStatus };
      await updateGerencia(id, payloadCompleto);
      toast.success("Status atualizado com sucesso!");
      
      const res = await getAllGerencias();
      setGerencias((res.data?.data?.content || res.data?.content || (res.data?._embedded ? Object.values(res.data._embedded)[0] : res.data?.data) || []));
    } catch (error) {
      toast.error("Erro ao atualizar o status no servidor.");
      console.error(error);
    }
  };

  const handleDeleteClick = (mp) => {
    setItemToDelete(mp);
    if (mp.equipe && mp.equipe.length > 0) {
      setIsBlockedModalOpen(true);
    } else {
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await deleteGerencia(itemToDelete.id);
        toast.success("Gerência excluída com sucesso!");
        const res = await getAllGerencias();
        setGerencias((res.data?.data?.content || res.data?.content || (res.data?._embedded ? Object.values(res.data._embedded)[0] : res.data?.data) || []));
      } catch (err) {
        toast.error(err.response?.data?.error || "Erro ao excluir a gerência.");
      } finally {
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
      }
    }
  };

  const cancelDelete = () => setIsDeleteModalOpen(false);
  const closeBlockedModal = () => setIsBlockedModalOpen(false);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  // Valor atual selecionado para o SearchableSelect
  // Precisamos encontrar o objeto correspondente na lista de opções
  const selectedGerenteOption = formData.gerenteAtual 
    ? pessoasOptions.find(opt => opt.value === formData.gerenteAtual.id)
    : null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-6 min-h-full flex flex-col">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gerência</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie as gerências institucionais.</p>
        </div>
        <button 
          onClick={handleAdd}
          className="w-full md:w-auto bg-[#00767d] hover:bg-[#005f64] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>Nova Gerência</span>
        </button>
      </div>

      {/* Busca e Filtros */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder={filtroCampo === 'todos' ? "Buscar por nome, sigla ou gerente..." : "Digite para buscar..."}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00767d]/50"
          />
        </div>
        
        <div className="relative md:w-64">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <select
            value={filtroCampo}
            onChange={(e) => setFiltroCampo(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 appearance-none border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00767d]/50 bg-gray-50 text-gray-700 cursor-pointer font-medium"
          >
            <option value="todos">Todos os campos</option>
            <option value="nome">Apenas Nome</option>
            <option value="sigla">Apenas Sigla</option>
            <option value="gerente">Apenas Gerente</option>
            <hr />
            <option value="statuss">Status: Habilitados</option>
            <option value="instatuss">Status: Desabilitados</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="flex-1">
        <table className="w-full text-left border-collapse">
          <thead className="hidden md:table-header-group">
            <tr className="bg-gray-50 text-gray-600 text-sm border-y border-gray-200">
              <th className="py-3 px-4 font-semibold w-1/3">Nome</th>
              <th className="py-3 px-4 font-semibold w-1/6">Sigla</th>
              <th className="py-3 px-4 font-semibold w-1/3">Gerente Atual</th>
              <th className="py-3 px-4 font-semibold text-center w-32">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          
          <tbody className="block md:table-row-group">
            {listaFiltrada.length === 0 ? (
              <tr className="block md:table-row">
                <td colSpan="5" className="block md:table-cell py-8 text-center text-gray-500">
                  Nenhum resultado encontrado para a sua busca.
                </td>
              </tr>
            ) : (
              currentItems.map((mp) => (
                <tr key={mp.id} className="block md:table-row bg-white md:bg-transparent border border-gray-200 md:border-0 md:border-b md:border-gray-100 rounded-lg mb-4 md:mb-0 p-4 md:p-0 hover:bg-gray-50/50 transition-colors shadow-sm md:shadow-none">
                  
                  <td className="block md:table-cell py-2 md:py-3 md:px-4 font-medium text-gray-800">
                    <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Nome</span>
                    {mp.nome}
                  </td>
                  
                  <td className="block md:table-cell py-2 md:py-3 md:px-4 text-gray-500 text-sm">
                    <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Sigla</span>
                    {mp.sigla || '-'}
                  </td>

                  <td className="block md:table-cell py-2 md:py-3 md:px-4 text-gray-500 text-sm">
                    <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Gerente Atual</span>
                    {mp.gerenteAtual ? (
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-[#00767d]" />
                        <span>{mp.gerenteAtual.nome}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Sem gerente vinculado</span>
                    )}
                  </td>
                                    
                  <td className="flex justify-between md:table-cell items-center py-3 md:px-4 text-center border-t border-gray-100 md:border-t-0 mt-3 md:mt-0 pt-3 md:pt-3">
                    <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</span>
                    <button 
                      onClick={() => handleToggleStatus(mp.id)}
                      className="focus:outline-none"
                    >
                      <span 
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity ${
                          mp.status === 'ACTIVE' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {mp.status === 'ACTIVE' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        <span>{mp.status === 'ACTIVE' ? 'Habilitado' : 'Desabilitado'}</span>
                      </span>
                    </button>
                  </td>
                  
                  <td className="flex justify-between md:table-cell items-center py-2 md:py-3 md:px-4 border-t border-gray-50 md:border-t-0 pt-2 md:pt-3">
                    <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</span>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(mp)} className="p-2 md:p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="Editar">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDeleteClick(mp)} className="p-2 md:p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Excluir">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        indexOfFirstItem={indexOfFirstItem}
        indexOfLastItem={indexOfLastItem}
        totalItems={listaFiltrada.length}
      />

      {/* MODAL DE FORMULÁRIO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-visible animate-in fade-in zoom-in-95 duration-200">
            {/* Adicionado overflow-visible acima para evitar que a lista de opções fique cortada */}
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50 rounded-t-xl">
              <h2 className="text-xl font-semibold text-gray-800">
                {formData.id ? 'Editar Gerência' : 'Nova Gerência'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-200 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Gerência</label>
                <input 
                  type="text" 
                  required
                  value={formData.nome || ''}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00767d]/50 focus:border-[#00767d]"
                  placeholder="Ex: Gestão Financeira"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sigla</label>
                <input 
                  type="text" 
                  required
                  value={formData.sigla || ''}
                  onChange={(e) => setFormData({...formData, sigla: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00767d]/50 focus:border-[#00767d]"
                  placeholder="Ex: GF"
                />
              </div>

              {/* ALTERADO: Implementação do SearchableSelect */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gerente Atual</label>
                {/*<SearchableSelect
                  options={pessoasOptions}
                  value={selectedGerenteOption}
                  placeholder="Buscar gerente..."
                  isClearable // Permite limpar o campo
                  noOptionsMessage={() => "Nenhuma pessoa encontrada"}
                  onChange={(selectedOption) => {
                    // Se o usuário limpar o select, selectedOption será null
                    if (!selectedOption) {
                      setFormData({ ...formData, gerenteAtual: null });
                    } else {
                      // Procura o objeto completo da pessoa selecionada na lista original
                      const selectedPessoa = pessoas.find(p => p.id === selectedOption.value);
                      setFormData({ ...formData, gerenteAtual: selectedPessoa });
                    }
                  }}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={{
                    control: (baseStyles, state) => ({
                      ...baseStyles,
                      borderColor: state.isFocused ? '#00767d' : '#D1D5DB', // border-gray-300
                      boxShadow: state.isFocused ? '0 0 0 2px rgba(0, 118, 125, 0.5)' : 'none',
                      borderRadius: '0.5rem', // rounded-lg
                      '&:hover': {
                        borderColor: '#00767d'
                      }
                    })
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">Selecione o profissional responsável por esta gerência.</p>*/}

                <input 
                  type="text" 
                  readOnly
                  value={formData.gerenteAtual || ''}
                  onChange={(e) => setFormData({...formData, gerenteAtual: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00767d]/50 focus:border-[#00767d]"
                  placeholder="Ex: GF"
                />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="statusToggle"
                  checked={formData.status === 'ACTIVE'}
                  onChange={(e) => setFormData({...formData, status: e.target.checked ? 'ACTIVE' : 'INACTIVE'})}
                  className="w-4 h-4 text-[#00767d] border-gray-300 rounded focus:ring-[#00767d]"
                />
                <label htmlFor="statusToggle" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Gerência Habilitada (status)
                </label>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-[#00767d] rounded-lg hover:bg-[#005f64] transition-colors shadow-sm"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAIS DE EXCLUSÃO E BLOQUEIO (MANTIDOS IGUAIS) */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Excluir Gerência?</h2>
            <p className="text-gray-500 mb-6">
              Tem certeza que deseja excluir <strong>{itemToDelete?.nome}</strong>? Esta ação não poderá ser desfeita.
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-center gap-3">
              <button 
                onClick={cancelDelete}
                className="w-full sm:flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="w-full sm:flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {isBlockedModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ban size={32} className="text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Ação Não Permitida</h2>
            <p className="text-gray-500 mb-6 text-sm md:text-base">
              Não é possível excluir <strong>{itemToDelete?.nome}</strong> pois existem <strong className="text-amber-600">{itemToDelete?.equipe?.length} pessoas associadas na equipe</strong>. Você pode desabilitá-la em vez de excluí-la.
            </p>
            <button 
              onClick={closeBlockedModal}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gerencias;
