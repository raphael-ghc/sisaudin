// src/components/Sidebar.jsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  X, LogOut, LayoutDashboard, AlertTriangle, CheckSquare, 
  FileText, ChevronDown, Settings, Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

// 1. Item de Navegação Padrão
function NavItem({ icon, label, to, isCollapsed }) {
  return (
    <NavLink to={to} title={isCollapsed ? label : ""} className={({ isActive }) => `
      flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} w-full px-3 py-3 rounded-lg transition-all duration-300
      ${isActive ? 'bg-white/20 text-white font-medium' : 'text-white/90 hover:bg-white/10 hover:text-white'}
    `}>
      {({ isActive }) => (
        <>
          <span className={isActive ? "opacity-100" : "opacity-80"}>{icon}</span>
          {!isCollapsed && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );
}

// 2. Item de Navegação Secundário (Sub-menu)
function NavSubItem({ label, to, isCollapsed }) {
  return (
    <NavLink to={to} title={isCollapsed ? label : ""} className={({ isActive }) => `
      block w-full px-3 py-2 rounded-md transition-colors text-sm
      border-l-2 border-transparent
      ${isCollapsed ? 'text-center pl-0' : 'text-left'}
      ${isActive 
        ? 'border-white bg-white/10 text-white font-medium' 
        : 'text-white/70 hover:text-white hover:border-white/50 hover:bg-white/5'}
    `}>
      {isCollapsed ? label.charAt(0) : label}
    </NavLink>
  );
}

// 3. Grupo Expansível (Gaveta)
function NavGroup({ icon, label, children, isCollapsed, toggleDesktopMenu }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col w-full">
      <button
        onClick={() => {
          if (isCollapsed && toggleDesktopMenu) {
            toggleDesktopMenu();
            setIsOpen(true);
          } else {
            setIsOpen(!isOpen);
          }
        }}
        title={isCollapsed ? label : ""}
        className={`
          flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} w-full px-3 py-3 rounded-lg transition-all duration-300
          ${isOpen ? 'bg-white/10 text-white' : 'text-white/90 hover:bg-white/10 hover:text-white'}
        `}
      >
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} ${isCollapsed ? 'w-full' : ''}`}>
          <span className="opacity-80">{icon}</span>
          {!isCollapsed && <span className="truncate">{label}</span>}
        </div>
        {!isCollapsed && (
          <ChevronDown 
            size={16} 
            className={`transition-transform duration-200 opacity-70 ${isOpen ? 'rotate-180' : ''}`} 
          />
        )}
      </button>

      <div className={`
        overflow-hidden transition-all duration-300 ease-in-out
        ${isOpen && !isCollapsed ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'}
      `}>
        <div className="pl-10 pr-2 pb-2 flex flex-col gap-1">
          {/* Inject isCollapsed prop into children (NavSubItem) */}
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, { isCollapsed });
            }
            return child;
          })}
        </div>
      </div>
    </div>
  );
}

// 4. Componente Principal da Sidebar
export default function Sidebar({ isMobileMenuOpen, toggleMenu, isDesktopCollapsed, toggleDesktopMenu }) {
  const navigate = useNavigate();
  const { setAccessToken, jwtPayload } = useAppContext(); 

  const userName = jwtPayload?.nome || jwtPayload?.name || 'Usuário Logado';
  const userEmail = jwtPayload?.email || jwtPayload?.sub || '';
  const userInitials = userName.charAt(0).toUpperCase();

  const isSisAdminOrGestor = ['SISTEMA', 'GESTOR'].includes(jwtPayload?.role);

  const handleLogout = () => {
    if (setAccessToken) {
      setAccessToken(null); 
    }
    localStorage.removeItem("accessToken"); 
    navigate('/login');
  };

  return (
    <aside
      className={`
        fixed md:static inset-y-0 left-0 z-50
        ${isDesktopCollapsed ? 'md:w-20' : 'md:w-64'} w-64 bg-[#00767d] text-white flex flex-col
        transition-all duration-300 ease-in-out shadow-xl md:shadow-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        print:hidden
      `}
    >
      {/* Topo do Menu */}
      <div className={`p-4 md:p-6 h-[72px] text-2xl font-bold border-b border-white/10 flex ${isDesktopCollapsed ? 'justify-center' : 'justify-between'} items-center`}>
        {!isDesktopCollapsed && (
          <span 
            onClick={() => navigate('/profile')} 
            className="truncate cursor-pointer hover:text-white/80 transition-colors"
            title="Ir para o Perfil"
          >
            SisAudin
          </span>
        )}
        
        {/* Mobile close button */}
        <button 
          className="md:hidden text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors" 
          onClick={toggleMenu}
        >
          <X size={24} />
        </button>

        {/* Desktop toggle button */}
        <button 
          className="hidden md:flex text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors" 
          onClick={toggleDesktopMenu}
          title={isDesktopCollapsed ? "Expandir Menu" : "Recolher Menu"}
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Links de Navegação */}
      {/*<nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3">*/}
      <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3
        scrollbar-thin 
        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-track]:bg-[#00767d]
        [&::-webkit-scrollbar-thumb]:bg-white/40
        hover:[&::-webkit-scrollbar-thumb]:bg-white/70
        [&::-webkit-scrollbar-thumb]:rounded-md"
      >
        
        {/* Menu Expansível de Administração 
        {isSisAdminOrGestor && (
          <NavGroup icon={<Settings size={20} />} label="Administração" isCollapsed={isDesktopCollapsed} toggleDesktopMenu={toggleDesktopMenu}>
            <NavSubItem to="/admin/usuarios" label="Gerir Utilizadores" />
            <NavSubItem to="/admin/permissoes" label="Perfis de Acesso" />
          </NavGroup>
        )}
          */}

        {/* Menu Cadastro Básico */}
        {isSisAdminOrGestor && (
          <NavGroup icon={<Settings size={20} />} label="Instituição" isCollapsed={isDesktopCollapsed} toggleDesktopMenu={toggleDesktopMenu}>
            <NavSubItem to="/unidade" label="Gerir Unidades" />
            <NavSubItem to="/gerencia" label="Gerir Gerências" />
            <NavSubItem to="/cargo" label="Gerir Cargos" />
            <NavSubItem to="/pessoa" label="Gerir Pessoas" />
            {/*<NavSubItem to="/auditWorkflow" label="AuditWorkflow" /> */}
          </NavGroup>
        )}

         {/* Menu Expansível de Auditoria */}
         {isSisAdminOrGestor && (
        <NavGroup icon={<Settings size={20} />} label="Auditoria" isCollapsed={isDesktopCollapsed} toggleDesktopMenu={toggleDesktopMenu}>
          {/*<NavSubItem to="/auditoria/macroprocesso" label="Gerir Macroprocessos" />
          <NavSubItem to="/auditoria/origem-da-demanda" label="Gerir Origem da Demanda" />*/}
          {/* Rota genérica para produto descomentada e atualizada: */}
          {/*<NavSubItem to="/produto" label="Gerir Produtos" /> */}
          <NavSubItem to="/macroprocesso" label="Gerir Macroprocessos" /> 
          <NavSubItem to="/tipo-de-servico" label="Gerir Tipos de Serviços" /> 
          <NavSubItem to="/origem-da-demanda" label="Gerir Origens de Demanda" /> 
          <NavSubItem to="/tipo-de-risco" label="Gerir Tipos de Risco" /> 
          <NavSubItem to="/nivel-de-risco" label="Gerir Níveis de Risco" /> 
          <NavSubItem to="/tipo-de-auditoria" label="Gerir Tipos de Auditoria" /> 
          <NavSubItem to="/tecnica-de-auditoria" label="Gerir Técnicas de Auditoria" /> 
          <NavSubItem to="/classe-financeira" label="Gerir Classes Financeiras" />      
          <NavSubItem to="/classe-qualitativa" label="Gerir Classes Qualitativas" />
        </NavGroup>
      )}

        <NavGroup icon={<Settings size={20} />} label="Itens de Trabalho" isCollapsed={isDesktopCollapsed} toggleDesktopMenu={toggleDesktopMenu}>
          <NavSubItem to="/itens-trabalho" label="Gerir Itens de Trabalho" /> 
        </NavGroup>
        
         {/* Menu Expansível de Auditoria */}
        <NavGroup icon={<Settings size={20} />} label="Documentos" isCollapsed={isDesktopCollapsed} toggleDesktopMenu={toggleDesktopMenu}>
          {/*<NavSubItem to="/auditoria/macroprocesso" label="Gerir Macroprocessos" />
          <NavSubItem to="/auditoria/origem-da-demanda" label="Gerir Origem da Demanda" />*/}
          <NavSubItem to="/relatorios" label="Gerir Relatórios Preliminares de Auditoria" />      
          <NavSubItem to="/relatorios-finais" label="Gerir Relatórios Finais de Auditoria" />      
          <NavSubItem to="/reunioes-busca-conjunta" label="Gerir Reuniões de Busca Conjunta" />      
          <NavSubItem to="/notas" label="Gerir Notas de Auditoria" />      
          <NavSubItem to="/notas-tecnicas" label="Gerir Notas Técnicas" />      
          <NavSubItem to="/pareceres" label="Gerir Pareceres" />      
          <NavSubItem to="/ordens-servico" label="Gerir Ordens de Serviço" />      
          <NavSubItem to="/comunicacoes" label="Gerir Comunicações de Auditoria" />      
          <NavSubItem to="/solicitacoes" label="Gerir Solicitações de Auditoria" />      
          <NavSubItem to="/planejamentos" label="Gerir Planejamentos" />      
        </NavGroup>
      </nav>
      
      {/* Rodapé do Menu */}
      <div className={`p-5 border-t border-white/10 flex flex-col gap-4 ${isDesktopCollapsed ? 'items-center px-2' : ''}`}>
        <div 
          onClick={() => navigate('/profile')}
          className={`flex items-center ${isDesktopCollapsed ? 'justify-center' : 'gap-3'} cursor-pointer hover:bg-white/10 p-2 -mx-2 rounded-lg transition-colors`}
          title="Ir para o Perfil"
        >
          {jwtPayload?.foto ? (
            <img 
              src={jwtPayload.foto} 
              alt="Foto do usuário" 
              className="w-10 h-10 shrink-0 rounded-full object-cover shadow-sm bg-white border border-gray-200"
            />
          ) : (
            <div className="w-10 h-10 shrink-0 rounded-full bg-white text-[#00767d] flex items-center justify-center font-bold text-lg shadow-sm uppercase">
              {userInitials}
            </div>
          )}
          {!isDesktopCollapsed && (
            <div className="flex flex-col overflow-hidden leading-tight">
              <span className="font-bold text-sm truncate w-full text-white" title={userName}>{userName}</span>
              <span className="text-xs truncate w-full text-white/80" title={userEmail}>{userEmail}</span>
              <span className="text-xs truncate w-full text-white font-semibold mt-0.5" title={jwtPayload?.role || 'Sem Perfil'}>{jwtPayload?.role || 'Sem Perfil'}</span>
            </div>
          )}
        </div>
        
        {/* Botão de Logout Corrigido sem duplicar atributos */}
        <button 
          onClick={handleLogout}
          title={isDesktopCollapsed ? "Sair do Sistema" : ""}
          className={`w-full flex items-center justify-center ${isDesktopCollapsed ? 'p-2' : 'gap-2 py-2.5 px-4'} bg-transparent border border-white/40 hover:bg-white hover:text-[#00767d] text-white rounded-lg transition-all font-medium text-sm cursor-pointer`}
        >
          <LogOut size={18} />
          {!isDesktopCollapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}