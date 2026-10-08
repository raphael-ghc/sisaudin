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

  content = content.replace(/=\s*readOnly=\{isReadOnly(\|\|[^}]*)?\}\s*>/g, '=>');
  
  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Fixed all remaining arrow function readOnly typos.');
