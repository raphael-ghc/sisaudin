import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getAllRelatorios, deleteRelatorio, createEmptyRelatorio } from '../api/relatorioFinalApi';
import { Search, Edit, Trash2, Filter, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../components/Pagination';

export default function RelatorioFinalList() {
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroCampo, setFiltroCampo] = useState('todos');
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const navigate = useNavigate();

  // Exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchRelatorios = async () => {
    setLoading(true);
    try {
      const response = await getAllRelatorios();
      setRelatorios(response || []);
    } catch (error) {
      toast.error("Erro ao carregar Relatórios Finais de Auditoria.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRelatorios();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [busca, filtroCampo]);

  const relatoriosFiltrados = relatorios.filter(relatorio => {
    const item = relatorio.itemTrabalho || {};
    const nome = (item.nome || '').toLowerCase();
    const sigla = (item.sigla || '').toLowerCase();
    const ano = (item.anoReferencia || '').toString();
    const numRef = (item.numeroReferencia || '').toLowerCase();
    const anoRefCombo = ano ? `${ano}/${numRef || '-'}` : '-';
    const tipo = (item.tipoItem?.nome || item.tipoItem?.descricao || '').toLowerCase();
    
    const term = busca.toLowerCase();

    if (filtroCampo === 'nome') return nome.includes(term);
    if (filtroCampo === 'sigla') return sigla.includes(term);
    if (filtroCampo === 'ano') return anoRefCombo.includes(term);
    if (filtroCampo === 'tipo') return tipo.includes(term);

    // 'todos'
    return nome.includes(term) || sigla.includes(term) || numRef.includes(term) || ano.includes(term) || tipo.includes(term);
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = relatoriosFiltrados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(relatoriosFiltrados.length / itemsPerPage);

  const handleDeleteClick = (relatorio) => {
    setItemToDelete(relatorio);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await deleteRelatorio(itemToDelete.id);
        toast.success('Relatório excluído com sucesso!');
        fetchRelatorios(); 
      } catch (err) {
        toast.error('Erro ao excluir o Relatório.');
        console.error(err);
      } finally {
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
      }
    }
  };

  const handleEdit = (relatorio) => {
    // RelatorioFinal typically expects to find data by itemTrabalhoId or it takes id as param
    if (relatorio.itemTrabalho?.id) {
        navigate(`/relatorio-final/${relatorio.itemTrabalho.id}`);
    } else {
        navigate(`/relatorio-final`, { state: { relatorioId: relatorio.id } });
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Carregando dados de Relatório Final de Auditoria...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-6 min-h-full h-fit w-full flex flex-col">
      
      {/* Cabeçalho Dinâmico */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#00767d]">Relatório Final de Auditoria</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie os registros de Relatório Final de Auditoria. A criação de novos documentos é realizada a partir de um Item de Trabalho.</p>
        </div>
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
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select 
            value={filtroCampo}
            onChange={(e) => setFiltroCampo(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 appearance-none border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00767d]/50 bg-gray-50 text-gray-700 cursor-pointer font-medium"
          >
            <option value="todos">Todos os campos</option>
            <option value="nome">Nome do Item</option>
            <option value="sigla">Sigla</option>
            <option value="ano">Ano/Ref</option>
            <option value="tipo">Tipo</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="flex-1 overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead className="hidden md:table-header-group">
            <tr className="bg-gray-50 text-gray-600 text-sm border-y border-gray-200">
              <th className="py-3 px-4 font-semibold w-1/3">Vínculo (Item de Trabalho)</th>
              <th className="py-3 px-4 font-semibold w-1/4">Ref/Ano</th>
              <th className="py-3 px-4 font-semibold w-1/4">Tipo</th>
              <th className="py-3 px-4 font-semibold text-center w-32">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          
          <tbody className="block md:table-row-group">
            {relatoriosFiltrados.length === 0 ? (
              <tr className="block md:table-row">
                <td colSpan="5" className="block md:table-cell py-8 text-center text-gray-500">
                  Nenhum resultado encontrado para a sua busca.
                </td>
              </tr>
            ) : (
              currentItems.map((relatorio) => {
                const item = relatorio.itemTrabalho || {};
                const tipoNome = item.tipoItem?.nome || item.tipoItem?.descricao || '-';
                
                return (
                  <tr key={relatorio.id} className="block md:table-row bg-white md:bg-transparent border border-gray-200 md:border-0 md:border-b md:border-gray-100 rounded-lg mb-4 md:mb-0 p-4 md:p-0 hover:bg-gray-50/50 transition-colors shadow-sm md:shadow-none">
                    <td className="block md:table-cell py-2 md:py-3 md:px-4 font-medium text-gray-800">
                      <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Vínculo</span>
                      {item.sigla || '-'}
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-1 font-normal" title={item.nome}>{item.nome || '-'}</div>
                    </td>
                    
                    <td className="block md:table-cell py-2 md:py-3 md:px-4 text-gray-500 text-sm">
                      <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Ref/Ano</span>
                      {item.numeroReferencia || '-'}/{item.anoReferencia || '-'}
                    </td>
                    
                    <td className="block md:table-cell py-2 md:py-3 md:px-4 text-gray-500 text-sm">
                      <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Tipo</span>
                      {tipoNome}
                    </td>
                                       
                    <td className="flex justify-between md:table-cell items-center py-3 md:px-4 text-center border-t border-gray-100 md:border-t-0 mt-3 md:mt-0 pt-3 md:pt-3">
                      <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-blue-200 bg-blue-50 text-blue-700">
                        Em Edição
                      </span>
                    </td>
                    
                    <td className="flex justify-between md:table-cell items-center py-2 md:py-3 md:px-4 border-t border-gray-50 md:border-t-0 pt-2 md:pt-3">
                      <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</span>
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(relatorio)} className="p-2 md:p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="Editar">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDeleteClick(relatorio)} className="p-2 md:p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Excluir">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
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
        totalItems={relatoriosFiltrados.length}
      />

      {/* Modal de Exclusão */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Excluir Relatório Final?</h2>
            <p className="text-gray-500 mb-6">
              Tem certeza que deseja excluir o Relatório vinculado ao Item <strong>{itemToDelete?.itemTrabalho?.sigla}</strong>? Esta ação não poderá ser desfeita.
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
    </div>
  );
}
