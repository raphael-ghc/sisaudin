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

  // Fix all corrupted arrows!
  // It could be = disabled={isReadOnly}> or = readOnly={isReadOnly}>
  // or = disabled={isReadOnly || ...}>
  content = content.replace(/=\s*disabled=\{isReadOnly([^}]*)?\}\s*>/g, '=>');
  content = content.replace(/=\s*readOnly=\{isReadOnly([^}]*)?\}\s*>/g, '=>');
  // Just in case it was corrupted with disabled={true}
  content = content.replace(/=\s*disabled=\{true\}\s*>/g, '=>');
  content = content.replace(/=\s*readOnly=\{true\}\s*>/g, '=>');

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Fixed all broken arrow functions.');
