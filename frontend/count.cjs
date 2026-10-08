const fs = require('fs');
const code = fs.readFileSync('c:/Users/usuario/amanda/ghc/_Sisaudin2026/sisaudin/frontend/src/pages/RelatorioPreliminar.jsx', 'utf8');
const lines = code.split('\n');
let stack = [];
for (let i = 1399; i <= 2867; i++) {
  let line = lines[i];
  line = line.replace(/<[a-zA-Z0-9]+[^>]*\/>/g, '');
  line = line.replace(/`[^`]*`/g, '');
  line = line.replace(/'[^']*'/g, '');
  line = line.replace(/"[^"]*"/g, '');
  
  const opens = [...line.matchAll(/<div(?=[\s>])/g)];
  const closes = [...line.matchAll(/<\/div>/g)];
  
  for(let j=0; j<opens.length; j++) stack.push(i+1);
  for(let j=0; j<closes.length; j++) {
    if(stack.length > 0) stack.pop();
  }
}
console.log('UNCLOSED DIVS (excluding 1313 which is outside):');
stack.forEach(line => {
  console.log('Unclosed div opened at line', line, ':', lines[line-1].trim());
});
