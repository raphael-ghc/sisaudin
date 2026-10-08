import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getAllPlanejamentos, deletePlanejamento, createEmptyPlanejamento } from '../api/planejamentoApi';
import { Plus, Search, Edit, Trash2, Filter, AlertTriangle, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../components/Pagination';

export default function PlanejamentoList() {
  const [planejamentos, setPlanejamentos] = useState([]);
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

  const fetchPlanejamentos = async () => {
    setLoading(true);
    try {
      const response = await getAllPlanejamentos();
      setPlanejamentos(response || []);
    } catch (error) {
      toast.error("Erro ao carregar Planejamentos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanejamentos();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [busca, filtroCampo]);

  const planejamentosFiltrados = planejamentos.filter(plan => {
    const item = plan.itemTrabalho || {};
    const nome = (item.nome || '').toLowerCase();
    const sigla = (item.sigla || '').toLowerCase();
    const ano = (item.anoReferencia || plan.ano || '').toString();
    const numRef = (item.numeroReferencia || plan.numero || '').toString().toLowerCase();
    const anoRefCombo = ano ? `${ano}/${numRef || '-'}` : '-';
    const tipo = (item.tipoItem?.nome || item.tipoItem?.descricao || plan.tipoAuditoria || '').toLowerCase();
    const status = (plan.status || '').toLowerCase();

    const term = busca.toLowerCase();

    if (filtroCampo === 'nome') return nome.includes(term);
    if (filtroCampo === 'sigla') return sigla.includes(term);
    if (filtroCampo === 'ano') return anoRefCombo.includes(term);
    if (filtroCampo === 'tipo') return tipo.includes(term);
    if (filtroCampo === 'status') return status.includes(term);

    return (
      nome.includes(term) ||
      sigla.includes(term) ||
      numRef.includes(term) ||
      ano.includes(term) ||
      tipo.includes(term) ||
      status.includes(term)
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = planejamentosFiltrados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(planejamentosFiltrados.length / itemsPerPage);

  const handleCreateNew = async () => {
    setLoading(true);
    try {
      const novoPlan = await createEmptyPlanejamento();
      toast.success("Novo Planejamento criado!");
      navigate(`/planejamento/${novoPlan.id}`);
    } catch (error) {
      toast.error("Erro ao criar Planejamento.");
      setLoading(false);
    }
  };

  const handleDeleteClick = (plan) => {
    setItemToDelete(plan);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await deletePlanejamento(itemToDelete.id);
        toast.success("Planejamento excluído com sucesso!");
        fetchPlanejamentos();
      } catch (error) {
        toast.error("Erro ao excluir Planejamento.");
        console.error(error);
      } finally {
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
      }
    }
  };

  const handleEdit = (plan) => {
    navigate(`/planejamento/${plan.id}`);
  };

  const handleView = (plan) => {
    navigate(`/planejamento/${plan.id}?view=true`);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Carregando Planejamentos de Auditoria...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Planejamentos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie os documentos de Planejamento das auditorias.
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus size={18} />
          <span>Novo Planejamento</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar por Item de Trabalho, Tipo, Status, Ano/Número..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400 hidden sm:block" />
            <select
              value={filtroCampo}
              onChange={(e) => setFiltroCampo(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="todos">Todos os campos</option>
              <option value="nome">Item de Trabalho</option>
              <option value="sigla">Sigla</option>
              <option value="ano">Ano / Número</option>
              <option value="tipo">Tipo</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              <th className="py-3 px-4">ANO/Nº</th>
              <th className="py-3 px-4">Item de Trabalho</th>
              <th className="py-3 px-4">Tipo de Auditoria</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-gray-400">
                  Nenhum planejamento encontrado.
                </td>
              </tr>
            ) : (
              currentItems.map((plan) => {
                const item = plan.itemTrabalho || {};
                const sigla = item.sigla || '';
                const anoRef = item.anoReferencia || plan.ano || '';
                const numRef = item.numeroReferencia || plan.numero || '';
                const idRef = item.id ? `#${item.id}` : '';
                const tituloItem = `${sigla} ${anoRef}/${numRef}`.trim() || idRef || 'Sem vínculo';
                
                const tipoNome = plan.tipoAuditoria || item.tipoItem?.nome || item.tipoItem?.descricao || 'Não informado';
                const statusName = plan.status || 'Minuta';

                return (
                  <tr key={plan.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {plan.ano && plan.numero ? `${plan.numero}/${plan.ano}` : `PLAN-${plan.id}`}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-800">{tituloItem}</div>
                      {item.nome && <div className="text-xs text-gray-500">{item.nome}</div>}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {tipoNome}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-blue-200 bg-blue-50 text-blue-700">
                        {statusName}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        {/*<button
                          onClick={() => handleView(plan)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Visualizar em PDF"
                        >
                          <Eye size={18} />
                        </button>*/}
                        <button
                          onClick={() => handleEdit(plan)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(plan)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Excluir"
                        >
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

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={planejamentosFiltrados.length}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {/* Modal de Exclusão */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl animate-scaleUp">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-3 bg-red-50 rounded-full">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Confirmar Exclusão
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Tem certeza que deseja excluir este Planejamento? Esta ação não poderá ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
