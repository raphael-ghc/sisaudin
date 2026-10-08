import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAppContext } from "../contexts/AppContext";
import Spinner from "../components/Spinner";
import { Plus, Edit, Trash2, X, Search, CheckCircle2, XCircle, AlertTriangle, Filter, Briefcase, UploadCloud, Image as ImageIcon, Loader2, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import Pagination from '../components/Pagination';

// IMPORTANTE: Ajuste os caminhos de importação conforme a estrutura do seu projeto
import { getAllPessoas, createPessoa, updatePessoa, deletePessoa } from "../api/pessoaApi";
import { getAllGerencias } from "../api/gerenciaApi";
import { getAllGeneric } from "../api/genericApi"; 
import api from '../api/axiosInstance';

import SearchableSelect from 'react-select'; 

const Pessoa = () => {
  const { accessToken, jwtPayload } = useAppContext();
  const [showPassword, setShowPassword] = useState(false);
  const [originalUsuario, setOriginalUsuario] = useState(false);
  const [isConfirmEmailOpen, setIsConfirmEmailOpen] = useState(false);
  
  const [pessoas, setPessoas] = useState([]);
  const [gerencias, setGerencias] = useState([]);
  const [cargos, setCargos] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const gerenciasOptions = gerencias.map(g => ({
    value: g.id,
    label: `${g.nome} ${g.sigla ? `(${g.sigla})` : ''}`
  }));
  
  const cargosOptions = cargos.map(c => ({
    value: c.id,
    label: c.nome
  }));

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resPessoas, resGerencias, resCargos] = await Promise.all([
        getAllPessoas(),
        getAllGerencias(),
        getAllGeneric('cargo')
      ]);
      
      setPessoas(resPessoas.data?.data?.content || resPessoas.data?.data || []);
      setGerencias(resGerencias.data?.data?.content || resGerencias.data?.data || []);
      setCargos(resCargos.data?.data?.content || resCargos.data?.data || []); 
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
  const [itemToDelete, setItemToDelete] = useState(null); 
  
  const [formData, setFormData] = useState({ 
    id: null, 
    nome: '', 
    cargo: null,
    email: '',
    status: 'ACTIVE',
    gerencia: null,
    isGerente: false,
    role: 'VISITANTE',
    usuario: false,
    password: '',
    foto: ''
  });
  
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (columnName) => {
    if (sortConfig.key !== columnName) {
      return <ChevronDown size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    if (sortConfig.direction === 'asc') {
      return <ChevronUp size={14} className="text-[#00767d]" />;
    }
    return <ChevronDown size={14} className="text-[#00767d]" />;
  };

  

  const listaFiltrada = pessoas.filter(p => {
    const termoBusca = busca.toLowerCase();
    
    const nomeMatch = p.nome ? p.nome.toLowerCase().includes(termoBusca) : false;
    const emailMatch = p.email ? p.email.toLowerCase().includes(termoBusca) : false;
    const cartaoMatch = p.cartaoPonto ? p.cartaoPonto.toLowerCase().includes(termoBusca) : false;
    const gerenciaMatch = p.gerencia?.nome ? p.gerencia.nome.toLowerCase().includes(termoBusca) : false;







    if (filtroCampo === 'statuss') {
      return p.status === 'ACTIVE' && (nomeMatch || emailMatch || cartaoMatch || gerenciaMatch);
    }
    if (filtroCampo === 'instatuss') {
      return p.status !== 'ACTIVE' && (nomeMatch || emailMatch || cartaoMatch || gerenciaMatch);
    }
    if (filtroCampo === 'nome') return nomeMatch;
    if (filtroCampo === 'email') return emailMatch;
    if (filtroCampo === 'cartaoPonto') return cartaoMatch;
    if (filtroCampo === 'gerencia') return gerenciaMatch;

    return nomeMatch || emailMatch || cartaoMatch || gerenciaMatch;
  }).sort((a, b) => {
    if (sortConfig.key) {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      if (sortConfig.key === 'gerencia') {
        aValue = a.gerencia?.nome || '';
        bValue = b.gerencia?.nome || '';
      }
      aValue = (aValue || '').toString().toLowerCase();
      bValue = (bValue || '').toString().toLowerCase();
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    }
    return 0;
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
      email: '',
      cartaoPonto: '',
      cargo: null,
      status: 'ACTIVE', 
      gerencia: null,
      isGerente: false,
      role: 'VISITANTE',
      usuario: false,
      password: '',
      foto: ''
    });
    setOriginalUsuario(false);
    setIsModalOpen(true);
  };

  /*const handleEdit = (p) => {
    setFormData({
      id: p.id,
      nome: p.nome || '',
      email: p.email || '',
      cartaoPonto: p.cartaoPonto || '',
      status: p.status || 'ACTIVE',
      gerencia: p.gerencia || null,
      isGerente: p.isGerente || false
    });
    setIsModalOpen(true);
  };*/

  const handleEdit = (p) => {
    //try {
      setFormData({
        id: p.id,
        nome: p.nome || '',
        email: p.email || '',
        cartaoPonto: p.cartaoPonto || '',
        cargo: p.cargo ? { ...p.cargo } : null,
        status: p.status || 'ACTIVE',
        // Garanta que o objeto gerencia seja exatamente o que veio da API
        gerencia: p.gerencia ? { ...p.gerencia } : null,
        // Garanta que seja booleano (evite null/undefined)
        isGerente: !!p.isGerente,
        role: p.role || 'VISITANTE',
        usuario: !!p.usuario,
        password: '',
        foto: p.foto || ''
      });
      setOriginalUsuario(!!p.usuario);
      setIsModalOpen(true);

      // 2. Recarrega os dados e atualiza o estado
      //  const res = getAllPessoas(accessToken);
      //  const novosDados = res.data?.data?.content || res.data?.data || [];
      //  setPessoas(novosDados);

    //} catch (error) {
    //  toast.error(error.response?.data?.message || "Erro ao tentar editar a pessoa.");
    //  console.error(error);
    //}
};

  /*const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        nome: formData.nome,
        cargo: formData.cargo ? { id: formData.cargo.id } : null,
        email: formData.email,
        cartaoPonto: formData.cartaoPonto,
        status: formData.status,
        gerencia: formData.gerencia ? { id: formData.gerencia.id } : null,
        isGerente: formData.isGerente
      };

      if (formData.id) {
        await updatePessoa(formData.id, payload);
        toast.success("Pessoa atualizada com sucesso!");
      } else {
        await createPessoa(payload);
        toast.success("Nova pessoa cadastrada com sucesso!");
      }
      
      setIsModalOpen(false);
      const res = await getAllPessoas(accessToken);
      setPessoas(res.data?.data?.content || res.data?.data);
      
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao salvar a pessoa.");
      console.error(error);
    }
  };*/

  const handleSave = (e) => {
    e.preventDefault();
    if (!originalUsuario && formData.usuario) {
      setIsConfirmEmailOpen(true);
    } else {
      executeSave();
    }
  };

  const executeSave = async () => {
    try {
      const payload = {
        nome: formData.nome,
        cargo: formData.cargo ? { id: formData.cargo.id } : null,
        email: formData.email,
        cartaoPonto: formData.cartaoPonto,
        status: formData.status,
        gerencia: formData.gerencia && formData.gerencia.id ? { id: formData.gerencia.id } : null,
        isGerente: !!formData.isGerente,
        role: formData.role,
        usuario: formData.usuario,
        password: formData.password,
        foto: formData.foto
      };

      if (formData.id) {
        await updatePessoa(formData.id, payload);
        toast.success("Pessoa atualizada com sucesso!");
      } else {
        await createPessoa(payload);
        toast.success("Nova pessoa cadastrada com sucesso!");
      }
      
      // 1. Fecha o modal primeiro
      setIsModalOpen(false);
      setIsConfirmEmailOpen(false);
      
      // 2. Recarrega os dados e atualiza o estado
      const res = await getAllPessoas();
      const novosDados = res.data?.data?.content || res.data?.data || [];
      setPessoas(novosDados);
      
    } catch (error) {
      toast.error(error.response?.data?.message || "Erro ao salvar a pessoa.");
      console.error(error);
      setIsConfirmEmailOpen(false);
    }
  };

  const handleToggleStatus = async (id) => {
    const pessoaTarget = pessoas.find(p => p.id === id);
    if (!pessoaTarget) return;

    const novoStatus = pessoaTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      const payloadCompleto = { ...pessoaTarget, status: novoStatus };
      await updatePessoa(id, payloadCompleto);
      toast.success("Status atualizado com sucesso!");
      
      const res = await getAllPessoas();
      setPessoas(res.data?.data?.content || res.data?.data);
    } catch (error) {
      toast.error("Erro ao atualizar o status no servidor.");
      console.error(error);
    }
  };

  const handleDeleteClick = (p) => {
    setItemToDelete(p);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await deletePessoa(itemToDelete.id);
        toast.success("Pessoa excluída com sucesso!");
        const res = await getAllPessoas();
        setPessoas(res.data?.data?.content || res.data?.data);
      } catch (err) {
        toast.error(err.response?.data?.error || "Erro ao excluir a pessoa.");
      } finally {
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem.');
      return;
    }
    
    const formDataFile = new FormData();
    formDataFile.append('file', file);
    
    setUploadingFoto(true);
    try {
      const res = await api.post('/upload/foto', formDataFile, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData({...formData, foto: res.data.url});
      toast.success("Foto enviada com sucesso!");
    } catch (error) {
      console.error("Erro no upload", error);
      toast.error("Falha ao enviar a foto.");
    } finally {
      setUploadingFoto(false);
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const selectedGerenciaOption = formData.gerencia 
    ? gerenciasOptions.find(opt => opt.value === formData.gerencia.id)
    : null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-6 min-h-full flex flex-col">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pessoas</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie os cadastros de pessoas e seus vínculos.</p>
        </div>
        <button 
          onClick={handleAdd}
          className="w-full md:w-auto bg-[#00767d] hover:bg-[#005f64] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>Nova Pessoa</span>
        </button>
      </div>

      {/* Busca e Filtros */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder={filtroCampo === 'todos' ? "Buscar por nome, e-mail, cartão ponto ou gerência..." : "Digite para buscar..."}
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
            <option value="email">Apenas E-mail</option>
            <option value="cartaoPonto">Apenas Cartão Ponto</option>
            <option value="gerencia">Apenas Gerência</option>
            <hr />
            <option value="statuss">Status: Habilitados</option>
            <option value="instatuss">Status: Desabilitados</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="hidden md:table-header-group">
            <tr className="bg-gray-50 text-gray-600 text-sm border-y border-gray-200 select-none">
              <th className="py-3 px-4 font-semibold w-1/4 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('nome')}>
                <div className="flex items-center justify-between">Nome {renderSortIcon('nome')}</div>
              </th>
              <th className="py-3 px-4 font-semibold w-1/4 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('email')}>
                <div className="flex items-center justify-between">E-mail {renderSortIcon('email')}</div>
              </th>
              <th className="py-3 px-4 font-semibold w-1/6 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('cartaoPonto')}>
                <div className="flex items-center justify-between">Cartão Ponto {renderSortIcon('cartaoPonto')}</div>
              </th>
              <th className="py-3 px-4 font-semibold w-1/6 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('cargo')}>
                <div className="flex items-center justify-between">Cargo {renderSortIcon('cargo')}</div>
              </th>
              <th className="py-3 px-4 font-semibold w-1/4 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('gerencia')}>
                <div className="flex items-center justify-between">Gerência {renderSortIcon('gerencia')}</div>
              </th>
              <th className="py-3 px-4 font-semibold w-1/6 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('role')}>
                <div className="flex items-center justify-between">Perfil {renderSortIcon('role')}</div>
              </th>
              <th className="py-3 px-4 font-semibold text-center w-28 cursor-pointer hover:bg-gray-100 group" onClick={() => requestSort('status')}>
                <div className="flex items-center justify-center gap-1">Status {renderSortIcon('status')}</div>
              </th>
              <th className="py-3 px-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          
          <tbody className="block md:table-row-group">
            {listaFiltrada.length === 0 ? (
              <tr className="block md:table-row">
                <td colSpan="6" className="block md:table-cell py-8 text-center text-gray-500">
                  Nenhum resultado encontrado para a sua busca.
                </td>
              </tr>
            ) : (
              currentItems.map((p) => (
                <tr key={p.id} className="block md:table-row bg-white md:bg-transparent border border-gray-200 md:border-0 md:border-b md:border-gray-100 rounded-lg mb-4 md:mb-0 p-4 md:p-0 hover:bg-gray-50/50 transition-colors shadow-sm md:shadow-none">
                  
                  <td className="block md:table-cell py-2 md:py-3 md:px-4 font-medium text-gray-800">
                    <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Nome</span>
                    {p.nome}
                  </td>
                  
                  <td className="block md:table-cell py-2 md:py-3 md:px-4 text-gray-500 text-sm">
                    <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">E-mail</span>
                    {p.email}
                  </td>

                  <td className="block md:table-cell py-2 md:py-3 md:px-4 text-gray-500 text-sm">
                    <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Cartão Ponto</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">{p.cartaoPonto}</span>
                  </td>

                  <td className="block md:table-cell py-2 md:py-3 md:px-4 text-gray-500 text-sm">
                    <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Cargo</span>
                    {p.cargo?.nome || '-'}
                  </td>

                  {/* COLUNA DE GERÊNCIA COM A TAG DE CHEFIA */}
                  <td className="block md:table-cell py-2 md:py-3 md:px-4 text-sm">
                    <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Gerência</span>
                    {p.gerencia ? (
                      <div className="flex items-center gap-2">
                        <Briefcase size={14} className="text-[#00767d]" />
                        <span className="font-medium text-gray-700">{p.gerencia.nome}</span>
                        {/* Tag de Gerente contextualizada */}
                        {p.isGerente && (
                          <span className="bg-[#00767d]/10 text-[#00767d] border border-[#00767d]/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Chefe
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Sem gerência</span>
                    )}
                  </td>
                  
                  <td className="block md:table-cell py-2 md:py-3 md:px-4 text-sm">
                    <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Perfil</span>
                    <span className="bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {p.role || 'VISITANTE'}
                    </span>
                  </td>
                                    
                  <td className="flex justify-between md:table-cell items-center py-3 md:px-4 text-center border-t border-gray-100 md:border-t-0 mt-3 md:mt-0 pt-3 md:pt-3">
                    <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</span>
                    <button onClick={() => handleToggleStatus(p.id)} className="focus:outline-none">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity ${
                        p.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {p.status === 'ACTIVE' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        <span>{p.status === 'ACTIVE' ? 'Habilitado' : 'Desabilitado'}</span>
                      </span>
                    </button>
                  </td>
                  
                  <td className="flex justify-between md:table-cell items-center py-2 md:py-3 md:px-4 border-t border-gray-50 md:border-t-0 pt-2 md:pt-3">
                    <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</span>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(p)} className="p-2 md:p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="Editar">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDeleteClick(p)} className="p-2 md:p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Excluir">
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
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50 rounded-t-xl">
              <h2 className="text-xl font-semibold text-gray-800">
                {formData.id ? 'Editar Pessoa' : 'Nova Pessoa'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-200 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
              
              {/* DRAG AND DROP FOTO */}
              <div className="flex flex-col items-center">
                <div 
                  className={`w-32 h-32 rounded-full border-2 border-dashed flex flex-col items-center justify-center overflow-hidden relative transition-colors cursor-pointer ${
                    isDragging ? 'border-[#00767d] bg-[#00767d]/10' : 'border-gray-300 hover:border-[#00767d] hover:bg-gray-50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('fotoUploadInput').click()}
                >
                  {uploadingFoto ? (
                    <div className="flex flex-col items-center text-[#00767d]">
                      <Loader2 size={28} className="animate-spin mb-1" />
                      <span className="text-[10px] font-medium">Enviando...</span>
                    </div>
                  ) : formData.foto ? (
                    <>
                      <img src={formData.foto} alt="Perfil" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <UploadCloud className="text-white" size={24} />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-gray-400 p-2 text-center">
                      <ImageIcon size={28} className="mb-1" />
                      <span className="text-[10px] leading-tight">Arraste ou clique</span>
                    </div>
                  )}
                  <input 
                    id="fotoUploadInput" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                </div>
                <label className="text-xs text-gray-500 mt-2 font-medium">Foto de Perfil</label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  value={formData.nome || ''}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00767d]/50 focus:border-[#00767d]"
                  placeholder="Ex: João da Silva"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input 
                  type="email" 
                  required
                  value={formData.email || ''}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00767d]/50 focus:border-[#00767d]"
                  placeholder="Ex: joao.silva@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cartão Ponto</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  required
                  value={formData.cartaoPonto || ''}
                  onChange={(e) => {
                    const apenasNumeros = e.target.value.replace(/\D/g, '');
                    setFormData({...formData, cartaoPonto: apenasNumeros});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00767d]/50 focus:border-[#00767d]"
                  placeholder="Ex: 123456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                <SearchableSelect
                  options={cargosOptions}
                  value={formData.cargo ? cargosOptions.find(opt => opt.value === formData.cargo.id) : null}
                  onChange={(selected) => setFormData({ ...formData, cargo: selected ? { id: selected.value } : null })}
                  placeholder="Selecione um Cargo..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gerência Atual</label>
                <SearchableSelect
                  options={gerenciasOptions}
                  value={selectedGerenciaOption}
                  placeholder="Buscar gerência..."
                  isClearable
                  noOptionsMessage={() => "Nenhuma gerência encontrada"}
                  onChange={(selectedOption) => {
                    if (!selectedOption) {
                      setFormData({ ...formData, gerencia: null, isGerente: false });
                    } else {
                      const selectedGerencia = gerencias.find(g => g.id === selectedOption.value);
                      setFormData({ ...formData, gerencia: selectedGerencia });
                    }
                  }}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={{
                    control: (baseStyles, state) => ({
                      ...baseStyles,
                      borderColor: state.isFocused ? '#00767d' : '#D1D5DB',
                      boxShadow: state.isFocused ? '0 0 0 2px rgba(0, 118, 125, 0.5)' : 'none',
                      borderRadius: '0.5rem',
                      '&:hover': {
                        borderColor: '#00767d'
                      }
                    })
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">Selecione a gerência de lotação desta pessoa.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil (Role)</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00767d]/50 focus:border-[#00767d]"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="SISTEMA">Sistema (Admin)</option>
                  <option value="GESTOR">Gestor</option>
                  <option value="AUDITOR">Auditor</option>
                  <option value="VISITANTE">Visitante</option>
                </select>
              </div>

              {/* CHECKBOX: IS GERENTE */}
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="isGerenteToggle"
                  checked={formData.isGerente}
                  disabled={!formData.gerencia} // Só habilita se tiver gerência
                  onChange={(e) => setFormData({...formData, isGerente: e.target.checked})}
                  className="w-4 h-4 text-[#00767d] border-gray-300 rounded focus:ring-[#00767d] disabled:opacity-50"
                />
                <label htmlFor="isGerenteToggle" className={`text-sm font-medium ${formData.gerencia ? 'text-gray-700 cursor-pointer' : 'text-gray-400'}`}>
                  Designar como Chefe/Gerente da referida Gerência
                </label>
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
                  Cadastro Ativo (status)
                </label>
              </div>

              {/*<div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="usuarioToggle"
                  checked={formData.usuario}
                  onChange={(e) => setFormData({...formData, usuario: e.target.checked})}
                  className="w-4 h-4 text-[#00767d] border-gray-300 rounded focus:ring-[#00767d]"
                />
                <label htmlFor="usuarioToggle" className="text-sm font-medium text-gray-700 cursor-pointer">
                  É usuário do sistema?
                </label>
              </div>*/}

              {formData.usuario && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha (opcional para editar)</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={formData.password || ''}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      disabled={!(jwtPayload?.role === 'SISTEMA' || jwtPayload?.sub === formData.email || !formData.id)}
                      className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00767d]/50 focus:border-[#00767d] disabled:bg-gray-100 disabled:text-gray-400"
                      placeholder="Deixe em branco para manter a senha atual"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={!(jwtPayload?.role === 'SISTEMA' || jwtPayload?.sub === formData.email || !formData.id)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none disabled:opacity-50"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {!(jwtPayload?.role === 'SISTEMA' || jwtPayload?.sub === formData.email || !formData.id) && (
                    <p className="text-xs text-red-500 mt-1">Apenas o próprio usuário ou perfil SISTEMA podem alterar a senha.</p>
                  )}
                </div>
              )}

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

      {/* MODAL DE EXCLUSÃO */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Excluir Pessoa?</h2>
            <p className="text-gray-500 mb-6">
              Tem certeza que deseja excluir o cadastro de <strong>{itemToDelete?.nome}</strong>? Esta ação não poderá ser desfeita.
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-center gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
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

      {/* MODAL DE CONFIRMAÇÃO DE EMAIL */}
      {isConfirmEmailOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Enviar Boas-vindas?</h2>
            <p className="text-gray-500 mb-6">
              A pessoa <strong>{formData.nome}</strong> receberá um e-mail com instruções e dados de acesso. Deseja confirmar?
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-center gap-3">
              <button 
                onClick={() => setIsConfirmEmailOpen(false)}
                className="w-full sm:flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={executeSave}
                className="w-full sm:flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Sim, confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pessoa;