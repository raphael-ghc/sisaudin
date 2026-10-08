import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="app-container">
      {/* Overlay escuro de fundo */}
      {isMobileMenuOpen && (
        <div className="overlay" onClick={toggleMenu}></div>
      )}

      {/* Menu Lateral (Sidebar) */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span>SisAudin</span>
          {/* Botão para fechar o menu no Mobile */}
          <button className="close-menu-btn" onClick={toggleMenu} aria-label="Fechar menu">
            <X size={24} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/painel" className="nav-item" onClick={() => setIsMobileMenuOpen(false)}>
            Painel Principal
          </NavLink>
          <NavLink to="/matriz" className="nav-item" onClick={() => setIsMobileMenuOpen(false)}>
            Matriz de Riscos
          </NavLink>
          <NavLink to="/checklists" className="nav-item" onClick={() => setIsMobileMenuOpen(false)}>
            Checklists de Auditoria
          </NavLink>
          <NavLink to="/relatorios" className="nav-item" onClick={() => setIsMobileMenuOpen(false)}>
            Relatórios
          </NavLink>
        </nav>

        {/* Rodapé do Menu */}
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">A</div>
            <span style={{ fontWeight: 500 }}>Auditor</span>
          </div>
          <button className="logout-btn">
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="main-content">
        {/* Barra Superior (Apenas no Mobile) */}
        <header className="topbar">
          <button className="menu-toggle" onClick={toggleMenu} aria-label="Abrir menu">
            <Menu size={24} />
          </button>
          <h2>SisAudin</h2>
          <div style={{ width: '24px' }}></div>
        </header>

        {/* Conteúdo Dinâmico */}
        <div className="content-area">
          <h1>Bem-vindo ao Sistema</h1>
          <p style={{ marginTop: '16px', color: '#555' }}>
            Selecione uma opção no menu lateral para iniciar suas análises.
          </p>
        </div>
      </main>
    </div>
  );
}
