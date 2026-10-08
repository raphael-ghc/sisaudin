const fs = require('fs');
const filePath = 'c:\\Users\\usuario\\amanda\\ghc\\_Sisaudin2026\\sisaudin\\frontend\\src\\pages\\Nota.jsx';
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace(/=\s*readOnly=\{isReadOnly(\|\|[^}]*)?\}\s*>/g, '=>');
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed Nota.jsx');
