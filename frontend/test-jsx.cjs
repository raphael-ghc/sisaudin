const fs = require('fs');
const parser = require('@babel/parser');
const code = fs.readFileSync('c:/Users/usuario/amanda/ghc/_Sisaudin2026/sisaudin/frontend/src/pages/RelatorioPreliminar.jsx', 'utf8');

function test(startStr, endStr) {
  const chunk = code.substring(code.indexOf(startStr), code.indexOf(endStr));
  // Wrap with plenty of closing tags to handle any open ones, plus a catch-all fragment just in case
  const wrapped = 'export default function T() { ' + chunk + '</div></div></div></div></div></div></div></div></div></div></div></div></div></div></div></>)}</div>); }';
  
  try {
    parser.parse(wrapped, { sourceType: 'module', plugins: ['jsx'] });
    console.log('Parsed successfully up to', endStr);
  } catch (e) {
    console.log('Failed up to', endStr, ':', e.message);
  }
}

test('return (', 'id="page-capa"');
test('return (', 'id="document-preview-container"');
test('return (', 'id="page-intro-plan"');
test('return (', 'id="page-preliminares-constatacoes"');
test('return (', 'id="page-anexo-a"');
test('return (', 'anexosFinais.map');
