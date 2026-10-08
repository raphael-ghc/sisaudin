const fs = require('fs');

const pathFinal = 'C:/Users/usuario/amanda/ghc/_Sisaudin2026/sisaudin/frontend/src/pages/NotaFinal.jsx';
const pathNota = 'C:/Users/usuario/amanda/ghc/_Sisaudin2026/sisaudin/frontend/src/pages/Nota.jsx';

let content = fs.readFileSync(pathFinal, 'utf8');

// Replacements
content = content.replace(/NotaFinal/g, 'Nota');
content = content.replace(/notaFinal/g, 'nota');
content = content.replace(/Nota Final/g, 'Nota de Auditoria');
content = content.replace(/notaApiApi/g, 'notaApi'); // just in case
content = content.replace(/getNotaById/g, 'getNotaById');
content = content.replace(/getAllNotasFinais/g, 'getAllNotas');

// Handle the title specifically based on searchParams if needed. 
// For now, let's just make it render "Nota de Auditoria".
content = content.replace(/<title>Nota de Auditoria<\/title>/g, '<title>Nota de Auditoria</title>');
content = content.replace(/'Nota de Auditoria'/g, "'Nota de Auditoria'");

fs.writeFileSync(pathNota, content, 'utf8');
console.log('Restored Nota.jsx');
