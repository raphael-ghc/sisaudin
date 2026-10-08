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
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Check if isReadOnly is defined. If not, we need to inject it.
  if (!content.includes('const isReadOnly = (isVisitante || (!isSisAdminOrGestor && !isInEquipe()))')) {
    // Inject just before 'return (' or somewhere inside the main component body.
    // However, Comunicacao.jsx might not even have isVisitante or isInEquipe defined.
    console.log(`${file} is missing isReadOnly definition! We should manually patch it.`);
  }

  // 2. Add disabled={isReadOnly} to input, select, textarea
  const tags = ['input', 'select', 'textarea'];
  tags.forEach(tag => {
    const regex = new RegExp(`<${tag}([^>]*?)\\/?>`, 'gi');
    content = content.replace(regex, (match, attributes) => {
      // If it already contains disabled={isReadOnly}, skip
      if (attributes.includes('disabled={isReadOnly}')) return match;
      if (attributes.includes('disabled={isReadOnly ||')) return match;
      
      // If it contains disabled={something}, replace it with disabled={isReadOnly || something}
      const disabledRegex = /disabled=\{([^}]+)\}/;
      if (disabledRegex.test(attributes)) {
        // Skip if it's already updated manually in some ways, but let's be safe
        const replacedAttrs = attributes.replace(disabledRegex, (m, p1) => {
          if (p1.includes('isReadOnly')) return m;
          return `disabled={isReadOnly || (${p1})}`;
        });
        const isSelfClosing = match.endsWith('/>');
        return `<${tag}${replacedAttrs}${isSelfClosing ? ' />' : '>'}`;
      } else if (attributes.includes('disabled')) {
        // has disabled boolean attribute, we can replace with disabled={isReadOnly || true} which is true, so leave it.
        return match; 
      } else {
        // no disabled attribute
        const isSelfClosing = match.endsWith('/>');
        return `<${tag}${attributes} disabled={isReadOnly}${isSelfClosing ? ' />' : '>'}`;
      }
    });
  });

  // 3. SearchableSelect
  const searchSelectRegex = /<SearchableSelect([^>]*?)\/?>/gi;
  content = content.replace(searchSelectRegex, (match, attributes) => {
      if (attributes.includes('disabled={isReadOnly}')) return match;
      if (attributes.includes('disabled={isReadOnly ||')) return match;
      
      const disabledRegex = /disabled=\{([^}]+)\}/;
      if (disabledRegex.test(attributes)) {
        const replacedAttrs = attributes.replace(disabledRegex, (m, p1) => {
          if (p1.includes('isReadOnly')) return m;
          return `disabled={isReadOnly || (${p1})}`;
        });
        const isSelfClosing = match.endsWith('/>');
        return `<SearchableSelect${replacedAttrs}${isSelfClosing ? ' />' : '>'}`;
      } else {
        const isSelfClosing = match.endsWith('/>');
        return `<SearchableSelect${attributes} disabled={isReadOnly}${isSelfClosing ? ' />' : '>'}`;
      }
  });

  // 4. RichTextEditor
  const rteRegex = /<RichTextEditor([^>]*?)\/?>/gi;
  content = content.replace(rteRegex, (match, attributes) => {
      if (attributes.includes('readOnly={isReadOnly}')) return match;
      if (attributes.includes('readOnly={isReadOnly ||')) return match;
      
      const readOnlyRegex = /readOnly=\{([^}]+)\}/;
      if (readOnlyRegex.test(attributes)) {
        const replacedAttrs = attributes.replace(readOnlyRegex, (m, p1) => {
          if (p1.includes('isReadOnly')) return m;
          return `readOnly={isReadOnly || (${p1})}`;
        });
        const isSelfClosing = match.endsWith('/>');
        return `<RichTextEditor${replacedAttrs}${isSelfClosing ? ' />' : '>'}`;
      } else {
        const isSelfClosing = match.endsWith('/>');
        return `<RichTextEditor${attributes} readOnly={isReadOnly}${isSelfClosing ? ' />' : '>'}`;
      }
  });

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Script completed.');
