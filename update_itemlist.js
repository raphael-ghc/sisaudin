const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'ItemTrabalhoList.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace getSiglaDocumento definitions
const newSiglaCode = `const getSiglaDocumento = (str, itemSigla = '') => {
    if (!str) return 'DOC';
    const s = str.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
    const isPaint = (itemSigla || '').toUpperCase().includes('PAINT');
    const isExtra = (itemSigla || '').toUpperCase().includes('EXTRA');
    
    if (s.includes('ordem de servico') || s === 'ordemdeservico') return 'OS';
    if (s.includes('comunicacao de auditoria') || s === 'comunicacaoauditoria') return 'CA';
    if (s.includes('solicitacao de auditoria') || s === 'solicitacaoauditoria') return 'SAI';
    if (s.includes('matriz de planejamento') || s === 'matrizplanejamento') return 'MPLAN';
    if (s.includes('planejamento')) return 'PLAN';
    if (s.includes('matriz de achados') || s === 'matrizachados') return 'MAC';
    
    const isPreliminar = s.includes('preliminar');
    const isFinal = s.includes('final');
    const isRelatorio = s.includes('relatorio');
    
    if (isRelatorio) {
      let prefix = 'RAI';
      if (isExtra || s.includes('especial')) {
        prefix = 'REAI';
      }
      if (isPreliminar) return \`\${prefix}-P\`;
      if (isFinal) return \`\${prefix}-F\`;
      return prefix;
    }
    
    if (s.includes('busca conjunta') || s === 'buscaconjunta') return 'RBC';
    
    const isNotaAuditoria = s.includes('nota de auditoria') || s.startsWith('notaauditoria');
    if (isNotaAuditoria) {
      if (isFinal) return 'NA-F';
      return 'NA-P';
    }
    
    if (s.includes('nota tecnica') || s === 'notatecnica') return 'NT';
    if (s.includes('parecer')) return 'PAR';
    if (s.includes('plano de acao') || s === 'planoacao') return 'PA';
    
    return str.substring(0, 4).toUpperCase();
  };`;

// Using regex to replace the old function definitions
// The old functions start with `const getSiglaDocumento = (str) => {` and end with `return str.substring(0, 4).toUpperCase();\n  };`
// or `};` inside the map.
// Since it's multiline, I'll use string replacements manually

const functionRegex = /const getSiglaDocumento = \(str\) => \{[\s\S]*?return str\.substring\(0, 4\)\.toUpperCase\(\);\s*\n\s*\};/g;
content = content.replace(functionRegex, newSiglaCode);

// Also we need to update the calls:
// from `getSiglaDocumento(doc.nome || doc.nomeTipo || doc.tipo)` to `getSiglaDocumento(doc.nome || doc.nomeTipo || doc.tipo, item.sigla)`

// Call 1: inside the filter (where `item` is available)
// `const sigla = getSiglaDocumento(doc.nome || doc.nomeTipo || doc.tipo);`
content = content.replace(/const sigla = getSiglaDocumento\(doc\.nome \|\| doc\.nomeTipo \|\| doc\.tipo\);/g, 'const sigla = getSiglaDocumento(doc.nome || doc.nomeTipo || doc.tipo, item.sigla);');

// Call 2: inside the map 
// `const siglaDoc = getSiglaDocumento(doc.nome || doc.nomeTipo || doc.tipo);`
content = content.replace(/const siglaDoc = getSiglaDocumento\(doc\.nome \|\| doc\.nomeTipo \|\| doc\.tipo\);/g, 'const siglaDoc = getSiglaDocumento(doc.nome || doc.nomeTipo || doc.tipo, item.sigla);');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated ItemTrabalhoList.jsx');
