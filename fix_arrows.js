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

  // Fix => that was replaced by = disabled={isReadOnly}>
  content = content.replace(/=\s*disabled=\{isReadOnly\}\s*>/g, '=>');
  // Just in case it was disabled={isReadOnly || ...}
  content = content.replace(/=\s*disabled=\{isReadOnly[\s\S]*?\}\s*>/g, '=>');

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Fixed arrow functions.');
