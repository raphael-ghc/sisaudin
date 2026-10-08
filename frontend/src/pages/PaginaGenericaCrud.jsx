import { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; // IMPORTANTE: Captura a rota
import { toast } from "react-toastify";
import { useAppContext } from "../contexts/AppContext";
import { Plus, Edit, Trash2, X, Search, CheckCircle2, XCircle, AlertTriangle, Ban, Filter } from 'lucide-react';
import Pagination from '../components/Pagination';

// IMPORTANTE: Importamos um arquivo centralizador de requisições ou mantemos as originais mapeadas
import * as api from "../api/genericApi"; 
// DICA: Se você preferir usar o seu arquivo atual, mude para: import * as api from "../../api/macroprocessoApi";
// Mas lembre-se de que dentro dele precisaremos de funções que aceitem o nome da rota.

const PaginaGenericaCrud = () => {
  const { entidade } = useParams(); // Ex: 'macroprocessos', 'processos', 'riscos'
  const { accessToken } = useAppContext();
  
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroCampo, setFiltroCampo] = useState('todos');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); 
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({ id: null, nome: '', descricao: '', status: 'ACTIVE', trabalhosAssociados: 0 });

  // Função auxiliar para capitalizar e ajustar nomes na tela de forma amigável
const obterNomeExibicao = () => {
  if (!entidade) return "";

  // 1. Substitui todos os hífens por espaços (ex: "tipo-de-risco" vira "tipo de risco")
  let nomeFormatado = entidade.replace(/-/g, ' ');

  // 2. Transforma em singular se terminar com 's' (mantendo sua regra original)
  if (nomeFormatado.endsWith('s')) {
    nomeFormatado = nomeFormatado.substring(0, nomeFormatado.length - 1);
  }

  // 3. Capitaliza a primeira letra de cada palavra (opcional, fica excelente para títulos)
  // Se quiser capitalizar APENAS a primeira letra da frase, use a linha comentada abaixo:
  // return nomeFormatado.charAt(0).toUpperCase() + nomeFormatado.slice(1);  
  return nomeFormatado
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

  const fetchItens = async () => {
    setLoading(true);
    try {
      // Passamos a 'entidade' como parâmetro para a API saber qual endpoint chamar (/api/macroprocesso, /api/riscos, etc)
      const res = await api.getAllGeneric(entidade);
      setItens((res.data?.data?.content || res.data?.content || (res.data?._embedded ? Object.values(res.data._embedded)[0] : res.data?.data) || []) || res.data); 
    } catch (err) {
      toast.error(`Falha ao carregar ${entidade}`);
    } finally {
      setLoading(false);
    }
  };

  // Recarrega os dados SEMPRE que o usuário mudar de tela (mudar a entidade na URL)
  useEffect(() => {
    fetchItens();
    setBusca(''); // Limpa a busca ao trocar de tela
  }, [entidade]);

  useEffect(() => {
    setCurrentPage(1);
  }, [busca, filtroCampo]);

  // LÓGICA DE FILTRAGEM DINÂMICA
  const listaFiltrada = itens.filter(item => {
    const termoBusca = busca.toLowerCase();
    
    if (filtroCampo === 'statuss') {
      return item.status === 'ACTIVE' && (item.nome.toLowerCase().includes(termoBusca) || item.descricao.toLowerCase().includes(termoBusca));
    }
    if (filtroCampo === 'instatuss') {
      return item.status !== 'ACTIVE' && (item.nome.toLowerCase().includes(termoBusca) || item.descricao.toLowerCase().includes(termoBusca));
    }
    if (filtroCampo === 'nome') {
      return item.nome.toLowerCase().includes(termoBusca);
    }
    if (filtroCampo === 'descricao') {
      return item.descricao.toLowerCase().includes(termoBusca);
    }

    return item.nome.toLowerCase().includes(termoBusca) || item.descricao.toLowerCase().includes(termoBusca);
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = listaFiltrada.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(listaFiltrada.length / itemsPerPage);

  const handleAdd = () => {
    setFormData({ id: null, nome: '', descricao: '', status: 'ACTIVE', trabalhosAssociados: 0 });
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setFormData(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await api.updateGeneric(entidade, formData.id, formData);
        toast.success(`${obterNomeExibicao()} atualizado com sucesso!`);
      } else {
        const { id, ...dataToCreate } = formData; 
        await api.createGeneric(entidade, dataToCreate);
        toast.success(`Novo ${obterNomeExibicao()} criado com sucesso!`);
      }
      
      setIsModalOpen(false);
      fetchItens();
    } catch (error) {
      toast.error(error.response?.data?.message || `Erro ao salvar o ${obterNomeExibicao()}.`);
      console.error(error);
    }
  };

  const handleToggleStatus = async (id) => {
    const itemTarget = itens.find(item => item.id === id);
    if (!itemTarget) return;

    const novoStatus = itemTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      const payloadCompleto = { ...itemTarget, status: novoStatus };
      await api.updateGeneric(entidade, id, payloadCompleto);
      toast.success("Status atualizado com sucesso!");
      fetchItens();
    } catch (error) {
      fetchItens();
      toast.error("Erro ao atualizar o status no servidor.");
      console.error(error);
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    if (item.trabalhosAssociados > 0) {
      setIsBlockedModalOpen(true);
    } else {
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await api.deleteGeneric(entidade, itemToDelete.id);
        toast.success(`${obterNomeExibicao()} excluído com sucesso!`);
        fetchItens(); 
      } catch (err) {
        const mensagemErro = err.response?.data?.error || `Erro ao excluir o ${obterNomeExibicao()}.`;
        toast.error(mensagemErro);
        console.error(err);
      } finally {
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Carregando dados de {obterNomeExibicao()}...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-6 min-h-full flex flex-col">
      
      {/* Cabeçalho Dinâmico */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{obterNomeExibicao()}</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie os registros de {obterNomeExibicao()}.</p>
        </div>
        {!(
          [
            'reunioes', 'visitas', 'planejamentos', 'matrizes-planejamento', 
            'matrizes-achados', 'reunioes-busca-conjunta', 'planos-acao', 
            'planos-acao-preliminar', 'planos-acao-final'
          ].includes(entidade)
        ) && (
          <button 
            onClick={handleAdd}
            className="w-full md:w-auto bg-[#00767d] hover:bg-[#005f64] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={20} />
            <span>Novo {obterNomeExibicao()}</span>
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder={filtroCampo === 'todos' ? "Buscar por nome ou descrição..." : "Digite para buscar..."}
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
            <option value="descricao">Apenas Descrição</option>
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
              <th className="py-3 px-4 font-semibold w-2/5">Descrição</th>
              <th className="py-3 px-4 font-semibold text-center w-32">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          
          <tbody className="block md:table-row-group">
            {listaFiltrada.length === 0 ? (
              <tr className="block md:table-row">
                <td colSpan="4" className="block md:table-cell py-8 text-center text-gray-500">
                  Nenhum resultado encontrado para a sua busca.
                </td>
              </tr>
            ) : (
              currentItems.map((item) => (
                <tr key={item.id} className="block md:table-row bg-white md:bg-transparent border border-gray-200 md:border-0 md:border-b md:border-gray-100 rounded-lg mb-4 md:mb-0 p-4 md:p-0 hover:bg-gray-50/50 transition-colors shadow-sm md:shadow-none">
                  <td className="block md:table-cell py-2 md:py-3 md:px-4 font-medium text-gray-800">
                    <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Nome</span>
                    <div className="group relative md:max-w-xs cursor-default">
                        <div className="line-clamp-2 md:line-clamp-2">{item.nome}</div>
                        <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 absolute z-50 left-0 top-full mt-1 w-[280px] sm:w-[350px] p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl pointer-events-none whitespace-normal leading-relaxed">
                          {item.nome}
                        </div>
                    </div>
                  </td>
                  
                  <td className="block md:table-cell py-2 md:py-3 md:px-4 text-gray-500 text-sm">
                    <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Descrição</span>
                    <div className="group relative md:max-w-xs cursor-default">
                        <div className="md:truncate">{item.descricao}</div>
                        <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 absolute z-50 left-0 top-full mt-1 w-[280px] sm:w-[350px] p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl pointer-events-none whitespace-normal leading-relaxed">
                          {item.descricao}
                        </div>
                    </div>
                  </td>
                                     
                  <td className="flex justify-between md:table-cell items-center py-3 md:px-4 text-center border-t border-gray-100 md:border-t-0 mt-3 md:mt-0 pt-3 md:pt-3">
                    <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</span>
                    <button 
                      onClick={() => handleToggleStatus(item.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                        item.status === 'ACTIVE' 
                          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                          : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      {item.status === 'ACTIVE' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      <span>{item.status === 'ACTIVE' ? 'Habilitado' : 'Desabilitado'}</span>
                    </button>
                  </td>
                  
                  <td className="flex justify-between md:table-cell items-center py-2 md:py-3 md:px-4 border-t border-gray-50 md:border-t-0 pt-2 md:pt-3">
                    <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</span>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(item)} className="p-2 md:p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="Editar">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDeleteClick(item)} className="p-2 md:p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Excluir">
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-800">
                {formData.id ? `Editar ${obterNomeExibicao()}` : `Novo ${obterNomeExibicao()}`}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-200 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do {obterNomeExibicao()}</label>
                <input 
                  type="text" 
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00767d]/50 focus:border-[#00767d]"
                  placeholder="Digite o nome..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea 
                  required
                  rows="3"
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00767d]/50 focus:border-[#00767d] resize-none"
                  placeholder="Breve descrição..."
                ></textarea>
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
                  {obterNomeExibicao()} Habilitado (status)
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

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Excluir {obterNomeExibicao()}?</h2>
            <p className="text-gray-500 mb-6">
              Tem certeza que deseja excluir <strong>{itemToDelete?.nome}</strong>? Esta ação não poderá ser desfeita.
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-center gap-3">
              <button 
                onClick={() => { setIsDeleteModalOpen(false); setItemToDelete(null); }}
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

      {/* MODAL DE BLOQUEIO DE EXCLUSÃO */}
      {isBlockedModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ban size={32} className="text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Ação Não Permitida</h2>
            <p className="text-gray-500 mb-6 text-sm md:text-base">
              Não é possível excluir <strong>{itemToDelete?.nome}</strong> pois existem <strong className="text-amber-600">{itemToDelete?.trabalhosAssociados} trabalhos associados</strong>. Pode desabilitá-lo em vez de excluí-lo.
            </p>
            <button 
              onClick={() => { setIsBlockedModalOpen(false); setItemToDelete(null); }}
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

export default PaginaGenericaCrud;
