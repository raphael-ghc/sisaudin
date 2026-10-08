const fs = require('fs');
const code = fs.readFileSync('c:/Users/usuario/amanda/ghc/_Sisaudin2026/sisaudin/frontend/src/pages/RelatorioPreliminar.jsx', 'utf8');

const lines = code.split('\n');

let stack = [];
for (let i = 1312; i < 2870; i++) {
  let line = lines[i];
  
  // Remove self-closing tags first
  // Note: we can't just use regex if they span multiple lines, 
  // but for our purpose, we just want to find <div and </div.
  
  // Let's just find <div and </div in the raw string, ignoring everything else.
  // Wait, dangerouslySetInnerHTML has <div.../>. We need to ignore <div.../>
  // Also remove strings that might contain tags
  line = line.replace(/`[^`]*`/g, '');
  line = line.replace(/'[^']*'/g, '');
  line = line.replace(/"[^"]*"/g, '');

  line = line.replace(/<[a-zA-Z0-9]+[^>]*\/>/g, ''); // single line self-closing
  
  const opens = [...line.matchAll(/<div(?=[\s>])/g)];
  const closes = [...line.matchAll(/<\/div>/g)];
  
  for(let j=0; j<opens.length; j++) stack.push(i+1);
  for(let j=0; j<closes.length; j++) {
     if(stack.length > 0) stack.pop();
     else console.log('EXTRA CLOSING DIV AT LINE', i+1);
  }
}

console.log('Unclosed divs opened at:', stack);
