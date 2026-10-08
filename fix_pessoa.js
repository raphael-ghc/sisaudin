const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'Pessoa.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const sortBlockRegex = /\s*\/\/\s*Ordena[ç\ufffd]?[a-z]*[^\n]*\n\s*const \[sortConfig.*?\}\s*return <div.*?<\/div>;\n\s*\};\n+/s;

const match = content.match(sortBlockRegex);
if (match) {
    let sortBlock = match[0];
    content = content.replace(sortBlockRegex, '\n\n'); // Remove from inside filter
    
    // Insert sort block before listaFiltrada
    content = content.replace('const listaFiltrada = pessoas.filter(p => {', sortBlock + '\n  const listaFiltrada = pessoas.filter(p => {');
    
    // Add sorting logic at the end of filter
    const sortLogic = `.sort((a, b) => {
    if (sortConfig.key) {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      if (sortConfig.key === 'gerencia') {
        aValue = a.gerencia?.nome || '';
        bValue = b.gerencia?.nome || '';
      }
      
      aValue = (aValue || '').toString().toLowerCase();
      bValue = (bValue || '').toString().toLowerCase();
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    }
    return 0;
  });`;

    content = content.replace('return nomeMatch || emailMatch || cartaoMatch || gerenciaMatch;\n  });', `return nomeMatch || emailMatch || cartaoMatch || gerenciaMatch;\n  })${sortLogic}`);
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed Pessoa.jsx sorting logic.');
} else {
    console.log('Sort block not found. Regex failed.');
}
