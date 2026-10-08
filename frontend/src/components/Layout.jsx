import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react"; // Ícone para o menu mobile

const Layout = ({ children }) => {
  // Estado para controlar o menu no celular
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // Estado para controlar o menu no desktop (recolhido/expandido)
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const toggleDesktopMenu = () => setIsDesktopCollapsed(!isDesktopCollapsed);

  const fullPagePaths = [
    '/relatorioauditoriapreliminar',
    '/ordem-servico',
    '/comunicacao',
    '/solicitacao',
    '/nota',
    '/nota-tecnica',
    '/parecer',
    '/reuniao-busca-conjunta',
    '/plano-acao',
    '/reuniao',
    '/visita',
    '/planejamento',
    '/matriz-planejamento',
    '/matriz-achados'
  ];
  const isFullPage = fullPagePaths.some(path => {
    const p = location.pathname.toLowerCase();
    if (path === '/planejamento' && p.startsWith('/planejamentos')) return false;
    return p.startsWith(path.toLowerCase());
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 print:block print:h-auto print:w-auto print:overflow-visible print:bg-white">
      
      {/* 1. Menu Lateral (Sidebar) */}
      <Sidebar 
        isMobileMenuOpen={isMobileMenuOpen} 
        toggleMenu={toggleMenu} 
        isDesktopCollapsed={isDesktopCollapsed}
        toggleDesktopMenu={toggleDesktopMenu}
      />

      {/* 2. Área do Conteúdo Principal */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden print:block print:h-auto print:overflow-visible print:bg-white">
        
        {/* Barra superior (Topbar) - Visível APENAS no Mobile */}
        <header className="md:hidden flex items-center justify-between p-4 bg-[#00767d] text-white shadow-md z-40 print:hidden">
          <span className="font-bold text-lg">SisAudin</span>
          <button onClick={toggleMenu} className="p-1 rounded-md hover:bg-white/10 transition">
            <Menu size={24} />
          </button>
        </header>

        {/* Conteúdo Dinâmico das Páginas (Dashboard, Profile, etc) */}
        <main className={`flex-1 flex flex-col ${isFullPage ? 'overflow-hidden' : 'overflow-y-auto p-4 md:p-8'} print:block print:p-0 print:overflow-visible`}>
          {children}
        </main>

      </div>

      {/* 3. Fundo escuro no mobile (Overlay) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden print:hidden"
          onClick={toggleMenu}
        ></div>
      )}
    </div>
  );
};

export default Layout;