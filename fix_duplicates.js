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

  // Fix duplicate readOnly={isReadOnly} in RichTextEditor
  content = content.replace(/<RichTextEditor\s+readOnly={isReadOnly}([\s\S]*?)readOnly={isReadOnly}([\s\S]*?)>/gi, '<RichTextEditor readOnly={isReadOnly}$1$2>');
  // And the reverse case if readOnly was already at the end and we added it at the beginning
  content = content.replace(/<RichTextEditor([\s\S]*?)readOnly={isReadOnly}([\s\S]*?)readOnly={isReadOnly}([\s\S]*?)>/gi, '<RichTextEditor$1readOnly={isReadOnly}$2$3>');

  // Fix duplicate disabled={isReadOnly} in inputs, selects, textareas
  const tags = ['input', 'select', 'textarea', 'SearchableSelect'];
  tags.forEach(tag => {
    const regex1 = new RegExp(`<${tag}\\s+disabled={isReadOnly}([\\s\\S]*?)disabled={isReadOnly}([\\s\\S]*?)>`, 'gi');
    content = content.replace(regex1, `<${tag} disabled={isReadOnly}$1$2>`);
    
    const regex2 = new RegExp(`<${tag}([\\s\\S]*?)disabled={isReadOnly}([\\s\\S]*?)disabled={isReadOnly}([\\s\\S]*?)>`, 'gi');
    content = content.replace(regex2, `<${tag}$1disabled={isReadOnly}$2$3>`);
  });

  fs.writeFileSync(filePath, content, 'utf8');
});
console.log('Fixed duplicate attributes.');
