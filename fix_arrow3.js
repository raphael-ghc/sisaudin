const fs = require('fs');
const filePath = 'c:\\Users\\usuario\\amanda\\ghc\\_Sisaudin2026\\sisaudin\\frontend\\src\\pages\\RelatorioFinal.jsx';
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace(/=\s*disabled=\{isReadOnly\}\s*>/g, '=>');
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed RelatorioFinal.jsx');
