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

  // Disable inputs, selects, textareas
  const tags = ['input', 'select', 'textarea', 'SearchableSelect'];
  tags.forEach(tag => {
    // Note: [^>]*? ensures we don't cross tag boundaries
    const regex = new RegExp(`<${tag}([^>]*?)\\/?>`, 'gi');
    content = content.replace(regex, (match, attributes) => {
      // Don't modify if it already has isReadOnly
      if (attributes.includes('isReadOnly')) return match;
      
      const disabledRegex = /disabled=\{([^}]+)\}/;
      if (disabledRegex.test(attributes)) {
        const replacedAttrs = attributes.replace(disabledRegex, (m, p1) => {
          return `disabled={isReadOnly || (${p1})}`;
        });
        const isSelfClosing = match.endsWith('/>');
        return `<${tag}${replacedAttrs}${isSelfClosing ? ' />' : '>'}`;
      } else if (attributes.includes('disabled')) {
        // Just standard HTML disabled
        return match.replace('disabled', 'disabled={isReadOnly || true}');
      } else {
        const isSelfClosing = match.endsWith('/>');
        return `<${tag}${attributes} disabled={isReadOnly}${isSelfClosing ? ' />' : '>'}`;
      }
    });
  });

  // RichTextEditor readOnly
  const rteRegex = /<RichTextEditor([^>]*?)\/?>/gi;
  content = content.replace(rteRegex, (match, attributes) => {
      if (attributes.includes('isReadOnly')) return match;
      
      const readOnlyRegex = /readOnly=\{([^}]+)\}/;
      if (readOnlyRegex.test(attributes)) {
        const replacedAttrs = attributes.replace(readOnlyRegex, (m, p1) => {
          return `readOnly={isReadOnly || (${p1})}`;
        });
        const isSelfClosing = match.endsWith('/>');
        return `<RichTextEditor${replacedAttrs}${isSelfClosing ? ' />' : '>'}`;
      } else {
        const isSelfClosing = match.endsWith('/>');
        return `<RichTextEditor${attributes} readOnly={isReadOnly}${isSelfClosing ? ' />' : '>'}`;
      }
  });

  // Disable "Salvar" buttons
  // Look for buttons that have "Salvar" inside them, or onClick handlers that save
  const btnRegex = /<button([^>]*?)>([\s\S]*?)<\/button>/gi;
  content = content.replace(btnRegex, (match, attributes, innerHTML) => {
      if (innerHTML.includes('Salvar') || attributes.includes('Salvar')) {
          if (!attributes.includes('isReadOnly')) {
              if (attributes.includes('disabled={')) {
                  attributes = attributes.replace(/disabled=\{([^}]+)\}/, (m, p1) => `disabled={isReadOnly || (${p1})}`);
              } else {
                  attributes += ` disabled={isReadOnly}`;
              }
              // Add opacity-50 if it doesn't exist so it visually looks disabled
              if (attributes.includes('className="')) {
                  attributes = attributes.replace(/className="([^"]+)"/, (m, p1) => {
                      if (!p1.includes('disabled:opacity-50')) {
                          return `className="${p1} disabled:opacity-50 disabled:cursor-not-allowed"`;
                      }
                      return m;
                  });
              }
              return `<button${attributes}>${innerHTML}</button>`;
          }
      }
      return match;
  });

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Successfully updated isReadOnly for all fields.');
