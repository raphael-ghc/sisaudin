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

  // Fix space in arrow function
  content = content.replace(/=\s+>/g, '=>');
  
  // Just in case it was a different typo from my first script:
  // e.g., options={itensTrabalho.map(item = disabled={isReadOnly} > ({
  content = content.replace(/=\s*disabled=\{isReadOnly(\|\|[^}]*)?\}\s*>/g, '=>');
  
  fs.writeFileSync(filePath, content, 'utf8');
});
console.log('Fixed spaces in arrow functions.');
