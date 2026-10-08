import React, { useState, useEffect } from 'react';

export default function BaseConhecimento() {
    const [activeAccordion, setActiveAccordion] = useState(0);
    const [videoUrl, setVideoUrl] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        // Load FontAwesome and Google Fonts dynamically
        const faLink = document.createElement('link');
        faLink.rel = 'stylesheet';
        faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        document.head.appendChild(faLink);

        const gfLink = document.createElement('link');
        gfLink.rel = 'stylesheet';
        gfLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap';
        document.head.appendChild(gfLink);

        return () => {
            document.head.removeChild(faLink);
            document.head.removeChild(gfLink);
        };
    }, []);

    const toggleAccordion = (index) => {
        setActiveAccordion(activeAccordion === index ? null : index);
    };

    const openVideo = (url) => {
        setVideoUrl(url + "?autoplay=1");
        setIsModalOpen(true);
    };

    const closeVideo = () => {
        setIsModalOpen(false);
        setTimeout(() => setVideoUrl(''), 300);
    };

    // Close modal on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isModalOpen) {
                closeVideo();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen]);

    return (
        <div className="base-conhecimento-container">
            <style dangerouslySetInnerHTML={{__html: `
                /* Paleta de Cores Institucionais e Variáveis */
                .base-conhecimento-container {
                    --brand-primary: #4f46e5; /* Indigo 600 - Alinhado com o React */
                    --brand-primary-hover: #4338ca; /* Indigo 700 */
                    --brand-secondary: #0ea5e9; /* Indigo 500 */
                    --brand-accent: #f59e0b; /* Amber 500 */
                    --brand-success: #10b981; /* Emerald 500 */
                    
                    --bg-body: #f8fafc; /* Slate 50 */
                    --bg-card: #ffffff;
                    --bg-subtle: #f1f5f9; /* Slate 100 */
                    
                    --text-main: #0f172a; /* Slate 900 */
                    --text-muted: #64748b; /* Slate 500 */
                    
                    --border-color: #e2e8f0; /* Slate 200 */
                    
                    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
                    
                    --radius-md: 0.5rem;
                    --radius-lg: 0.75rem;
                    --radius-xl: 1rem;
                    
                    background-color: var(--bg-body);
                    color: var(--text-main);
                    line-height: 1.5;
                    padding: 40px 20px;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                    -webkit-font-smoothing: antialiased;
                    min-height: 100vh;
                }

                .base-conhecimento-container * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }

                .bc-container {
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .bc-header {
                    text-align: center;
                    margin-bottom: 40px;
                }

                .bc-header-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 64px;
                    height: 64px;
                    background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
                    color: white;
                    border-radius: var(--radius-xl);
                    font-size: 28px;
                    margin-bottom: 20px;
                    box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
                }

                .bc-header-title {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: var(--text-main);
                    letter-spacing: -0.025em;
                    margin-bottom: 15px;
                }

                .bc-header-title span {
                    color: var(--brand-primary);
                }

                .bc-main-intro {
                    max-width: 800px;
                    margin: 0 auto;
                    text-align: center;
                    font-size: 1.1rem;
                    color: var(--text-muted);
                    background-color: var(--bg-card);
                    padding: 30px;
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--border-color);
                    box-shadow: var(--shadow-sm);
                }

                .bc-main-intro p {
                    margin-bottom: 15px;
                }
                .bc-main-intro p:last-child {
                    margin-bottom: 0;
                }
                .bc-main-intro strong {
                    color: var(--brand-primary);
                }

                .bc-tutorial-section {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    margin-top: 40px;
                }

                .bc-accordion-item {
                    background-color: var(--bg-card);
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--border-color);
                    box-shadow: var(--shadow-sm);
                    overflow: hidden;
                    transition: box-shadow 0.3s ease;
                }

                .bc-accordion-item:hover {
                    box-shadow: var(--shadow-md);
                }

                .bc-accordion-header {
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 24px;
                    background-color: transparent;
                    border: none;
                    cursor: pointer;
                    text-align: left;
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--text-main);
                    transition: all 0.2s ease;
                }

                .bc-accordion-header:hover {
                    background-color: var(--bg-subtle);
                }

                .bc-accordion-header-content {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .bc-accordion-icon-bg {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    background-color: var(--bg-subtle);
                    color: var(--brand-primary);
                    border-radius: var(--radius-md);
                    font-size: 1.1rem;
                }

                .bc-accordion-header .chevron {
                    color: var(--text-muted);
                    transition: transform 0.3s ease;
                }

                .bc-accordion-item.active .bc-accordion-header .chevron {
                    transform: rotate(180deg);
                    color: var(--brand-primary);
                }
                
                .bc-accordion-item.active .bc-accordion-header {
                    border-bottom: 1px solid var(--border-color);
                    background-color: #f8fafc;
                }

                .bc-accordion-content {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .bc-accordion-item.active .bc-accordion-content {
                    max-height: 2000px; /* Suficiente para expandir */
                }

                .bc-content-wrapper {
                    padding: 24px;
                }

                .bc-section-text-block {
                    margin-bottom: 30px;
                    color: var(--text-muted);
                    font-size: 1rem;
                }
                
                .bc-section-text-block h3 {
                    color: var(--text-main);
                    font-size: 1.15rem;
                    font-weight: 700;
                    margin-bottom: 12px;
                    margin-top: 24px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .bc-section-text-block h3::before {
                    content: '';
                    display: block;
                    width: 6px;
                    height: 6px;
                    background-color: var(--brand-primary);
                    border-radius: 50%;
                }

                .bc-section-text-block h3:first-child {
                    margin-top: 0;
                }

                .bc-section-text-block p {
                    margin-bottom: 16px;
                    line-height: 1.6;
                }

                .bc-section-text-block ul {
                    list-style-type: none;
                    margin-bottom: 24px;
                    display: grid;
                    gap: 12px;
                }

                .bc-section-text-block li {
                    position: relative;
                    padding-left: 24px;
                    line-height: 1.5;
                }

                .bc-section-text-block li::before {
                    content: '\\f00c';
                    font-family: 'Font Awesome 6 Free';
                    font-weight: 900;
                    position: absolute;
                    left: 0;
                    top: 2px;
                    color: var(--brand-success);
                    font-size: 0.85rem;
                }

                .bc-section-text-block strong {
                    color: var(--text-main);
                    font-weight: 600;
                }

                .bc-table-container {
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                    margin-top: 20px;
                }

                .bc-styled-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.95rem;
                }

                .bc-styled-table thead tr {
                    background-color: var(--bg-subtle);
                    color: var(--text-main);
                    text-align: left;
                }

                .bc-styled-table th {
                    padding: 16px 20px;
                    font-weight: 600;
                    border-bottom: 1px solid var(--border-color);
                    text-transform: uppercase;
                    font-size: 0.75rem;
                    letter-spacing: 0.05em;
                }

                .bc-styled-table td {
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--border-color);
                    color: var(--text-muted);
                    vertical-align: top;
                }

                .bc-styled-table tbody tr:last-child td {
                    border-bottom: none;
                }

                .bc-styled-table tbody tr:hover {
                    background-color: #f8fafc;
                }

                .bc-styled-table td strong {
                    color: var(--text-main);
                }

                .bc-cards-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 20px;
                }

                .bc-card {
                    background: var(--bg-card);
                    border-radius: var(--radius-lg);
                    padding: 20px;
                    border: 1px solid var(--border-color);
                    display: flex;
                    flex-direction: column;
                    transition: all 0.2s ease;
                    position: relative;
                    overflow: hidden;
                }

                .bc-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 4px;
                    background: transparent;
                    transition: background 0.3s ease;
                }

                .bc-card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                    border-color: #cbd5e1;
                }

                .bc-card:hover::before {
                    background: linear-gradient(90deg, var(--brand-primary), var(--brand-secondary));
                }

                .bc-card-header {
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                    margin-bottom: 16px;
                }

                .bc-card-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: var(--radius-md);
                    background-color: #eef2ff; /* Indigo 50 */
                    color: var(--brand-primary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                    flex-shrink: 0;
                }

                .bc-card-title-group {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .bc-card-subtitle {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--text-muted);
                    font-weight: 600;
                }

                .bc-card-title {
                    font-size: 1.05rem;
                    font-weight: 700;
                    color: var(--text-main);
                    line-height: 1.3;
                }

                .bc-card-desc {
                    font-size: 0.9rem;
                    color: var(--text-muted);
                    line-height: 1.5;
                    margin-bottom: 20px;
                    flex-grow: 1;
                }

                .bc-card-desc p { margin-bottom: 8px; }
                .bc-card-desc p:last-child { margin-bottom: 0; }
                
                .bc-card-badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 4px 8px;
                    background-color: #f1f5f9;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--text-main);
                    margin-top: 10px;
                }

                .bc-card-badge i {
                    margin-right: 6px;
                    color: var(--text-muted);
                }

                .bc-btn-video {
                    background: #ffffff;
                    color: var(--brand-primary);
                    border: 1px solid var(--brand-primary);
                    padding: 10px 16px;
                    border-radius: var(--radius-md);
                    font-size: 0.875rem;
                    font-weight: 600;
                    cursor: pointer;
                    width: 100%;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .bc-btn-video:hover {
                    background: var(--brand-primary);
                    color: #ffffff;
                    box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
                }

                .bc-modal {
                    display: none;
                    position: fixed;
                    z-index: 1000;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(15, 23, 42, 0.85); /* Slate 900 */
                    backdrop-filter: blur(4px);
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .bc-modal.show {
                    display: flex;
                    opacity: 1;
                }

                .bc-modal-content {
                    background: #000;
                    padding: 0;
                    border-radius: var(--radius-lg);
                    width: 90%;
                    max-width: 1000px;
                    position: relative;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
                    aspect-ratio: 16 / 9;
                    transform: scale(0.95);
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .bc-modal.show .bc-modal-content {
                    transform: scale(1);
                }

                .bc-close-modal {
                    position: absolute;
                    top: -40px;
                    right: 0;
                    color: white;
                    font-size: 30px;
                    font-weight: 300;
                    cursor: pointer;
                    transition: color 0.2s ease;
                }
                
                .bc-close-modal:hover {
                    color: var(--brand-accent);
                }

                .bc-modal iframe {
                    width: 100%;
                    height: 100%;
                    border-radius: var(--radius-lg);
                    border: none;
                }
                
                @media (max-width: 768px) {
                    .base-conhecimento-container { padding: 20px 10px; }
                    .bc-header-title { font-size: 2rem; }
                    .bc-accordion-header { font-size: 1.1rem; padding: 16px; }
                    .bc-content-wrapper { padding: 16px; }
                    .bc-cards-grid { grid-template-columns: 1fr; }
                }
            `}} />

            <div className="bc-container">
                <header className="bc-header">
                    <div className="bc-header-icon">
                        <i className="fa-solid fa-graduation-cap"></i>
                    </div>
                    <h1 className="bc-header-title">Tutoriais <span>SisAudin</span></h1>
                    <div className="bc-main-intro">
                        <p>A apresentação detalha a transição de processos manuais para o uso do <strong>SisAudin</strong>, o sistema digital de auditoria interna. O conteúdo demonstra o fluxo operacional, desde o registro inicial de itens de trabalho até o acompanhamento via dashboards.</p>
                        <p>Estão documentadas etapas fundamentais como a elaboração de ordens de serviço, matrizes de planejamento e relatórios. O objetivo central é ilustrar como a tecnologia otimiza a governança e a transparência nas atividades de controle.</p>
                    </div>
                </header>

                <div className="bc-tutorial-section">
                    
                    <div className={`bc-accordion-item ${activeAccordion === 0 ? 'active' : ''}`}>
                        <button className="bc-accordion-header" onClick={() => toggleAccordion(0)}>
                            <div className="bc-accordion-header-content">
                                <div className="bc-accordion-icon-bg"><i className="fa-solid fa-building"></i></div>
                                1. Cadastros Institucionais
                            </div>
                            <i className="fa-solid fa-chevron-down chevron"></i>
                        </button>
                        <div className="bc-accordion-content">
                            <div className="bc-content-wrapper">
                                <div className="bc-section-text-block">
                                    <h3>Base Estrutural</h3>
                                    <p>Os Cadastros Iniciais compreendem as parametrizações do sistema, englobando os dados institucionais e as configurações da auditoria interna. Eles funcionam como uma pré-condição operacional.</p>
                                    
                                    <h3>Vantagens da Parametrização</h3>
                                    <ul>
                                        <li><strong>Padronização:</strong> Garante validação segundo requisitos regulatórios.</li>
                                        <li><strong>Prevenção de Falhas:</strong> Elimina documentos com campos ausentes.</li>
                                        <li><strong>Rastreabilidade:</strong> Vincula processos a um escopo institucional definido.</li>
                                    </ul>
                                </div>
                                <div className="bc-cards-grid">
                                    <div className="bc-card">
                                        <div className="bc-card-header">
                                            <div className="bc-card-icon"><i className="fa-solid fa-sitemap"></i></div>
                                            <div className="bc-card-title-group">
                                                <span className="bc-card-subtitle">Cadastro 1.1</span>
                                                <h4 className="bc-card-title">Unidade</h4>
                                            </div>
                                        </div>
                                        <div className="bc-card-desc">
                                            <p>Cadastro das grandes áreas ou diretorias da instituição.</p>
                                            <div className="bc-card-badge"><i className="fa-solid fa-lock"></i> Administrador</div>
                                        </div>
                                        <button className="bc-btn-video" onClick={() => openVideo('https://www.youtube.com/embed/ScMzIvxBSi4')}><i className="fa-solid fa-play"></i> Assistir Vídeo</button>
                                    </div>
                                    
                                    <div className="bc-card">
                                        <div className="bc-card-header">
                                            <div className="bc-card-icon"><i className="fa-solid fa-building-user"></i></div>
                                            <div className="bc-card-title-group">
                                                <span className="bc-card-subtitle">Cadastro 1.2</span>
                                                <h4 className="bc-card-title">Gerência</h4>
                                            </div>
                                        </div>
                                        <div className="bc-card-desc">
                                            <p>Subdivisões estruturais das unidades (coordenações, gerências locais).</p>
                                            <div className="bc-card-badge"><i className="fa-solid fa-lock"></i> Admin / Auditor-Chefe</div>
                                        </div>
                                        <button className="bc-btn-video" onClick={() => openVideo('https://www.youtube.com/embed/ScMzIvxBSi4')}><i className="fa-solid fa-play"></i> Assistir Vídeo</button>
                                    </div>

                                    <div className="bc-card">
                                        <div className="bc-card-header">
                                            <div className="bc-card-icon"><i className="fa-solid fa-id-badge"></i></div>
                                            <div className="bc-card-title-group">
                                                <span className="bc-card-subtitle">Cadastro 1.3</span>
                                                <h4 className="bc-card-title">Cargo</h4>
                                            </div>
                                        </div>
                                        <div className="bc-card-desc">
                                            <p>Registro das funções e posições hierárquicas no quadro de pessoal.</p>
                                            <div className="bc-card-badge"><i className="fa-solid fa-lock"></i> Administrador</div>
                                        </div>
                                        <button className="bc-btn-video" onClick={() => openVideo('https://www.youtube.com/embed/ScMzIvxBSi4')}><i className="fa-solid fa-play"></i> Assistir Vídeo</button>
                                    </div>

                                    <div className="bc-card">
                                        <div className="bc-card-header">
                                            <div className="bc-card-icon"><i className="fa-solid fa-user-tie"></i></div>
                                            <div className="bc-card-title-group">
                                                <span className="bc-card-subtitle">Cadastro 1.4</span>
                                                <h4 className="bc-card-title">Pessoa</h4>
                                            </div>
                                        </div>
                                        <div className="bc-card-desc">
                                            <p>Inserção de colaboradores e gerenciamento de perfis vinculando-os aos cargos.</p>
                                            <div className="bc-card-badge"><i className="fa-solid fa-lock"></i> Administrador</div>
                                        </div>
                                        <button className="bc-btn-video" onClick={() => openVideo('https://www.youtube.com/embed/ScMzIvxBSi4')}><i className="fa-solid fa-play"></i> Assistir Vídeo</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`bc-accordion-item ${activeAccordion === 1 ? 'active' : ''}`}>
                        <button className="bc-accordion-header" onClick={() => toggleAccordion(1)}>
                            <div className="bc-accordion-header-content">
                                <div className="bc-accordion-icon-bg"><i className="fa-solid fa-list-check"></i></div>
                                2. Cadastros da Auditoria
                            </div>
                            <i className="fa-solid fa-chevron-down chevron"></i>
                        </button>
                        <div className="bc-accordion-content">
                            <div className="bc-content-wrapper">
                                <div className="bc-section-text-block">
                                    <h3>Itens de Trabalho (PAINT e EXTRA)</h3>
                                    <p>Atua como a ponte de ligação entre o planejamento estratégico da auditoria e a sua execução operacional diária.</p>
                                    <ul>
                                        <li><strong>Itens do PAINT:</strong> Ações previamente planejadas no Plano Anual.</li>
                                        <li><strong>Itens EXTRA:</strong> Demandas extraordinárias e não programadas.</li>
                                        <li><strong>Avaliação de Desempenho:</strong> Permite acompanhar a execução via Dashboards, medindo a taxa de cumprimento.</li>
                                    </ul>
                                </div>
                                <div className="bc-cards-grid">
                                    <div className="bc-card">
                                        <div className="bc-card-header">
                                            <div className="bc-card-icon"><i className="fa-solid fa-briefcase"></i></div>
                                            <div className="bc-card-title-group">
                                                <span className="bc-card-subtitle">Configuração 2.1</span>
                                                <h4 className="bc-card-title">Tipo de Serviços</h4>
                                            </div>
                                        </div>
                                        <div className="bc-card-desc">
                                            <p>Classificação principal dos serviços (ex: Auditoria, Consultoria, Acompanhamento).</p>
                                        </div>
                                        <button className="bc-btn-video" onClick={() => openVideo('https://www.youtube.com/embed/ScMzIvxBSi4')}><i className="fa-solid fa-play"></i> Assistir Vídeo</button>
                                    </div>
                                    
                                    <div className="bc-card">
                                        <div className="bc-card-header">
                                            <div className="bc-card-icon"><i className="fa-solid fa-triangle-exclamation"></i></div>
                                            <div className="bc-card-title-group">
                                                <span className="bc-card-subtitle">Configuração 2.2</span>
                                                <h4 className="bc-card-title">Risco e Nível</h4>
                                            </div>
                                        </div>
                                        <div className="bc-card-desc">
                                            <p>Banco de dados de eventos mapeados e parametrização baseada na matriz de impacto.</p>
                                        </div>
                                        <button className="bc-btn-video" onClick={() => openVideo('https://www.youtube.com/embed/ScMzIvxBSi4')}><i className="fa-solid fa-play"></i> Assistir Vídeo</button>
                                    </div>

                                    <div className="bc-card">
                                        <div className="bc-card-header">
                                            <div className="bc-card-icon"><i className="fa-solid fa-diagram-project"></i></div>
                                            <div className="bc-card-title-group">
                                                <span className="bc-card-subtitle">Configuração 2.3</span>
                                                <h4 className="bc-card-title">Macroprocesso</h4>
                                            </div>
                                        </div>
                                        <div className="bc-card-desc">
                                            <p>Agrupamento de processos institucionais correlatos para organização temática.</p>
                                        </div>
                                        <button className="bc-btn-video" onClick={() => openVideo('https://www.youtube.com/embed/ScMzIvxBSi4')}><i className="fa-solid fa-play"></i> Assistir Vídeo</button>
                                    </div>

                                    <div className="bc-card">
                                        <div className="bc-card-header">
                                            <div className="bc-card-icon"><i className="fa-solid fa-coins"></i></div>
                                            <div className="bc-card-title-group">
                                                <span className="bc-card-subtitle">Configuração 2.4</span>
                                                <h4 className="bc-card-title">Classes de Achado</h4>
                                            </div>
                                        </div>
                                        <div className="bc-card-desc">
                                            <p>Parâmetros para categorizar achados com impacto financeiro ou qualitativo.</p>
                                        </div>
                                        <button className="bc-btn-video" onClick={() => openVideo('https://www.youtube.com/embed/ScMzIvxBSi4')}><i className="fa-solid fa-play"></i> Assistir Vídeo</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`bc-accordion-item ${activeAccordion === 2 ? 'active' : ''}`}>
                        <button className="bc-accordion-header" onClick={() => toggleAccordion(2)}>
                            <div className="bc-accordion-header-content">
                                <div className="bc-accordion-icon-bg"><i className="fa-solid fa-file-signature"></i></div>
                                3 a 7. Documentos e Execução
                            </div>
                            <i className="fa-solid fa-chevron-down chevron"></i>
                        </button>
                        <div className="bc-accordion-content">
                            <div className="bc-content-wrapper">
                                <div className="bc-section-text-block">
                                    <h3>Ciclo de Vida da Auditoria</h3>
                                    <p>Do planejamento ao relatório final, o sistema estrutura cada fase metodológica.</p>
                                    <ul>
                                        <li><strong>Ordem de Serviço (OS):</strong> Documento formal que autoriza e delimita o início da ação, com rastreabilidade da origem.</li>
                                        <li><strong>Matriz de Planejamento:</strong> Ferramenta que conecta as questões de auditoria aos seus respectivos achados e evidências.</li>
                                        <li><strong>Relatórios (Preliminar e Final):</strong> Peças documentais com as constatações. O sistema exige supervisão formal para conclusão e gerencia as <em>Recomendações</em>.</li>
                                    </ul>
                                </div>
                                <div className="bc-cards-grid">
                                    <div className="bc-card">
                                        <div className="bc-card-header">
                                            <div className="bc-card-icon"><i className="fa-solid fa-file-contract"></i></div>
                                            <div className="bc-card-title-group">
                                                <span className="bc-card-subtitle">Fase Inicial</span>
                                                <h4 className="bc-card-title">Ordem de Serviço</h4>
                                            </div>
                                        </div>
                                        <div className="bc-card-desc">
                                            <p>Documento de autorização e carta de apresentação formal aos gestores auditados.</p>
                                        </div>
                                        <button className="bc-btn-video" onClick={() => openVideo('https://www.youtube.com/embed/ScMzIvxBSi4')}><i className="fa-solid fa-play"></i> Assistir Vídeo</button>
                                    </div>

                                    <div className="bc-card">
                                        <div className="bc-card-header">
                                            <div className="bc-card-icon"><i className="fa-solid fa-table-columns"></i></div>
                                            <div className="bc-card-title-group">
                                                <span className="bc-card-subtitle">Trabalho de Campo</span>
                                                <h4 className="bc-card-title">Matrizes</h4>
                                            </div>
                                        </div>
                                        <div className="bc-card-desc">
                                            <p>Estruturação técnica (planejamento) e registro estruturado de causas, efeitos e evidências (achados).</p>
                                        </div>
                                        <button className="bc-btn-video" onClick={() => openVideo('https://www.youtube.com/embed/ScMzIvxBSi4')}><i className="fa-solid fa-play"></i> Assistir Vídeo</button>
                                    </div>

                                    <div className="bc-card">
                                        <div className="bc-card-header">
                                            <div className="bc-card-icon"><i className="fa-solid fa-users-viewfinder"></i></div>
                                            <div className="bc-card-title-group">
                                                <span className="bc-card-subtitle">Validação</span>
                                                <h4 className="bc-card-title">Busca Conjunta</h4>
                                            </div>
                                        </div>
                                        <div className="bc-card-desc">
                                            <p>Ata da reunião com gestores sobre os achados preliminares e pactuação do Plano de Ação.</p>
                                        </div>
                                        <button className="bc-btn-video" onClick={() => openVideo('https://www.youtube.com/embed/ScMzIvxBSi4')}><i className="fa-solid fa-play"></i> Assistir Vídeo</button>
                                    </div>

                                    <div className="bc-card">
                                        <div className="bc-card-header">
                                            <div className="bc-card-icon"><i className="fa-solid fa-check-double"></i></div>
                                            <div className="bc-card-title-group">
                                                <span className="bc-card-subtitle">Conclusão</span>
                                                <h4 className="bc-card-title">Relatório Final</h4>
                                            </div>
                                        </div>
                                        <div className="bc-card-desc">
                                            <p>Documento definitivo consolidando os apontamentos, pareceres e recomendações ativas.</p>
                                        </div>
                                        <button className="bc-btn-video" onClick={() => openVideo('https://www.youtube.com/embed/ScMzIvxBSi4')}><i className="fa-solid fa-play"></i> Assistir Vídeo</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`bc-accordion-item ${activeAccordion === 3 ? 'active' : ''}`}>
                        <button className="bc-accordion-header" onClick={() => toggleAccordion(3)}>
                            <div className="bc-accordion-header-content">
                                <div className="bc-accordion-icon-bg"><i className="fa-solid fa-chart-line"></i></div>
                                8. Fluxos e Monitoramento
                            </div>
                            <i className="fa-solid fa-chevron-down chevron"></i>
                        </button>
                        <div className="bc-accordion-content">
                            <div className="bc-content-wrapper">
                                <div className="bc-section-text-block">
                                    <h3>Controle e Inteligência</h3>
                                    <p>As etapas de Supervisão e Monitoramento atuam como pilares de qualidade, garantindo rigor metodológico e acompanhamento contínuo.</p>
                                    <ul>
                                        <li><strong>Acompanhamento em Tempo Real:</strong> Conecta as recomendações às respostas das áreas, eliminando controles paralelos.</li>
                                        <li><strong>Dashboard Gerencial:</strong> Camada de inteligência executiva, consolidando indicadores de desempenho e apoiando a alta gestão.</li>
                                    </ul>
                                </div>
                                
                                <div className="bc-table-container">
                                    <table className="bc-styled-table">
                                        <thead>
                                            <tr>
                                                <th>Fase</th>
                                                <th>Módulo do Sistema</th>
                                                <th>Impacto Operacional</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td><strong>Planejamento</strong></td>
                                                <td>Gestão de Itens (PAINT/Extra)</td>
                                                <td>Padronização desde a origem e rastreabilidade de justificativas.</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Autorização</strong></td>
                                                <td>Workflow de OS</td>
                                                <td>Emissão automatizada de comunicações e cartas de apresentação.</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Execução</strong></td>
                                                <td>Matrizes e Relatório Preliminar</td>
                                                <td>Rigor na vinculação de evidências e checkpoint de supervisão obrigatória.</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Acompanhamento</strong></td>
                                                <td>Dashboards e Alertas</td>
                                                <td>Cobrança efetiva de prazos e visão executiva para tomada de decisão.</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Modal */}
            <div 
                className={`bc-modal ${isModalOpen ? 'show' : ''}`} 
                onClick={(e) => { if(e.target.classList.contains('bc-modal')) closeVideo(); }}
            >
                <div className="bc-modal-content">
                    <span className="bc-close-modal" onClick={closeVideo}>&times;</span>
                    {videoUrl && (
                        <iframe 
                            src={videoUrl} 
                            allow="autoplay; encrypted-media" 
                            allowFullScreen
                            title="Vídeo Tutorial"
                        ></iframe>
                    )}
                </div>
            </div>
        </div>
    );
}
