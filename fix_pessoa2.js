const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'Pessoa.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// The block ends at the closing brace of SortIcon
const lines = content.split('\n');

let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('// Ordena') && lines[i+1].includes('const [sortConfig')) {
    startIndex = i;
  }
  if (startIndex !== -1 && i > startIndex && lines[i].includes('const SortIcon =')) {
    // Find the end of SortIcon
    for (let j = i; j < lines.length; j++) {
      if (lines[j].trim() === '};' && lines[j-1].includes('ChevronDown')) {
        endIndex = j;
        break;
      }
    }
    if (endIndex !== -1) break;
  }
}

if (startIndex !== -1 && endIndex !== -1) {
  const sortBlockLines = lines.slice(startIndex, endIndex + 1);
  const sortBlockString = sortBlockLines.join('\n');
  
  // Remove it from current position
  lines.splice(startIndex, endIndex - startIndex + 1);
  content = lines.join('\n');
  
  // Insert before listaFiltrada
  content = content.replace('const listaFiltrada = pessoas.filter(p => {', sortBlockString + '\n\n  const listaFiltrada = pessoas.filter(p => {');
  
  // Append sort
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

  // Find the end of filter
  content = content.replace(/return nomeMatch \|\| emailMatch \|\| cartaoMatch \|\| gerenciaMatch;\n\s*\});/g, `return nomeMatch || emailMatch || cartaoMatch || gerenciaMatch;\n  })${sortLogic}`);
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully fixed layout of Pessoa.jsx');
} else {
  console.log('Could not find sort block', startIndex, endIndex);
}
