const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'Pessoa.jsx');
let content = fs.readFileSync(filePath, 'utf8');

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

content = content.replace(/return nomeMatch \|\| emailMatch \|\| cartaoMatch \|\| gerenciaMatch;\s*\});/, `return nomeMatch || emailMatch || cartaoMatch || gerenciaMatch;\n  })${sortLogic}`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed sort append in Pessoa.jsx');
