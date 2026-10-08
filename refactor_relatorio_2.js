const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'RelatorioPreliminar.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace the header title with buttons
const headerSearch = /<div className="flex items-center gap-3">\s*<FileText className="text-blue-900" size=\{24\} \/>\s*<div>\s*<h1 className="text-xl font-bold text-gray-900 leading-tight">Auditoria Interna - GHC<\/h1>\s*<p className="text-xs text-gray-500 font-semibold text-blue-800 bg-blue-50 inline-block px-1\.5 py-0\.5 rounded mt-0\.5">Relatório de Auditoria Interna - Preliminar<\/p>\s*<\/div>\s*<\/div>/;

const buttonsHTML = `<div className="flex items-center gap-3 whitespace-nowrap">
              <button
                type="button"
                onClick={() => navigate((selectedItemTrabalhoId || itemTrabalhoIdParam) ? \`/itens-trabalho?targetItemId=\${selectedItemTrabalhoId || itemTrabalhoIdParam}\` : '/itens-trabalho')}
                className="inline-flex items-center text-[#00767d] hover:text-[#005f64] transition-colors font-semibold text-sm bg-[#00767d]/10 hover:bg-[#00767d]/20 px-3 py-1.5 rounded-lg"
              >
                <ArrowLeft size={18} className="mr-1.5" />
                Voltar para Itens de Trabalho
              </button>
              <button
                type="button"
                onClick={() => navigate('/relatorios')}
                className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg border border-gray-200"
              >
                <FileText size={18} className="mr-1.5" />
                Ir para Lista de Relatórios
              </button>
            </div>`;

content = content.replace(headerSearch, buttonsHTML);

// 2. Remove the buttons from the Preenchimento do Relatório header
// Using string replace for the exact block from the task output
const oldHeader = `<header className="mb-8 border-b-2 border-blue-900 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900 whitespace-nowrap">Preenchimento do Relatório</h2>
              <div className="flex items-center gap-3 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => navigate((selectedItemTrabalhoId || itemTrabalhoIdParam) ? \`/itens-trabalho?targetItemId=\${selectedItemTrabalhoId || itemTrabalhoIdParam}\` : '/itens-trabalho')}
                  className="inline-flex items-center text-[#00767d] hover:text-[#005f64] transition-colors font-semibold text-sm bg-[#00767d]/10 hover:bg-[#00767d]/20 px-3 py-1.5 rounded-lg"
                >

                  <ArrowLeft size={18} className="mr-1.5" />
                  Voltar para Itens de Trabalho
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/relatorios')}
                  className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg border border-gray-200"
                >
                  <FileText size={18} className="mr-1.5" />
                  Ir para Lista de Relatórios
                </button>
              </div>
            </header>`;

const newHeader = `<header className="mb-8 border-b-2 border-blue-900 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900 whitespace-nowrap">Preenchimento do Relatório</h2>
            </header>`;

content = content.replace(oldHeader, newHeader);

// 3. Remove Navegador button
const navegadorRegex = /<button\s+onClick=\{\(\) => setShowPdfModal\(true\)\}\s+className="flex items-center gap-2 bg-\[#00767d\] hover:bg-\[#005f64\] text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors"\s+title="Abrir janela para visualizar o documento em PDF nativo"\s*>\s*<FileText size=\{18\} \/>\s*<span>Navegador<\/span>\s*<\/button>/;

content = content.replace(navegadorRegex, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully refactored RelatorioPreliminar.jsx');
