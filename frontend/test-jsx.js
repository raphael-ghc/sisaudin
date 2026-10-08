const fs = require('fs');
const parser = require('@babel/parser');
const code = fs.readFileSync('c:/Users/usuario/amanda/ghc/_Sisaudin2026/sisaudin/frontend/src/pages/RelatorioPreliminar.jsx', 'utf8');

// Try to parse just the Coluna 2 to see if it's there
const col2 = code.substring(code.indexOf('<div className={`bg-gray-300 overflow-y-auto'), code.lastIndexOf('</div> {/* This closes bg-gray-300 */}'));
// Wrap in a function to make it valid JSX
const testCode = `export default function Test() { return ( ${col2}</div></div></div> ); }`;

try {
  parser.parse(testCode, { sourceType: 'module', plugins: ['jsx'] });
  console.log('Coluna 2 parsed successfully!');
} catch (e) {
  console.log('Error in Coluna 2:', e.message);
}
