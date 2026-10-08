const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'Comunicacao.jsx',
  'Solicitacao.jsx',
  'Nota.jsx',
  'NotaFinal.jsx',
  'RelatorioFinal.jsx',
  'OrdemServico.jsx',
  'NotaTecnica.jsx',
  'Parecer.jsx'
];

const pagesDir = path.join(__dirname, 'frontend', 'src', 'pages');

filesToProcess.forEach(file => {
  const filePath = path.join(pagesDir, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Ensure useAppContext is imported
  if (!content.includes('useAppContext')) {
      content = content.replace(/import React/, "import { useAppContext } from '../contexts/AppContext';\nimport React");
  } else {
      // Sometimes it was imported from '../context/AppContext' (typo)
      content = content.replace(/'\.\.\/context\/AppContext'/, "'../contexts/AppContext'");
      content = content.replace(/"\.\.\/context\/AppContext"/, '"../contexts/AppContext"');
  }

  // Ensure jwtPayload and isReadOnly are defined in the component
  const componentNameMatch = content.match(/export default function\s+([A-Za-z0-9_]+)\s*\(/);
  if (componentNameMatch) {
      const funcName = componentNameMatch[1];
      const funcRegex = new RegExp(`export default function\\s+${funcName}\\s*\\([^)]*\\)\\s*\\{`);
      
      content = content.replace(funcRegex, (match) => {
          let insertion = '';
          if (!content.includes('jwtPayload } = useAppContext()')) {
              insertion += `\n  const { jwtPayload } = useAppContext();\n`;
          }
          if (!content.includes('const isReadOnly =')) {
              insertion += `  const isReadOnly = (jwtPayload?.perfilAcesso === 'Leitor' || jwtPayload?.role === 'Leitor');\n`;
          }
          return match + insertion;
      });
  }

  // Also show the "Somente Leitura" badge if isReadOnly is true
  if (!content.includes('Somente Leitura')) {
      // Find a good place for the badge, usually inside the header div.
      // Usually there's a div with "Voltar para Itens de Trabalho" or similar.
      // Just inject it after the main title if possible, or before the "Salvar" button.
      // Easiest is to find `<div className="flex justify-between items-center mb-6">` 
      // or similar header container.
      const headerRegex = /<div className="flex justify-between items-center[^>]*>/;
      content = content.replace(headerRegex, (match) => {
          return match + `\n        {isReadOnly && (<div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded font-semibold ml-4">Somente Leitura</div>)}`;
      });
  }

  fs.writeFileSync(filePath, content, 'utf8');
});
console.log('Injected isReadOnly definition.');
