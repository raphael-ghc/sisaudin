const fs = require('fs');
const path = require('path');

const preliminarPath = path.join(__dirname, 'frontend', 'src', 'pages', 'RelatorioPreliminar.jsx');
let content = fs.readFileSync(preliminarPath, 'utf8');

// Update codRelatorioStr to use baseSigla
const oldCod = `const codRelatorioStr = numero || ano 
    ? \`RAI \${numero ? String(numero).padStart(2, '0') : '00'}/\${ano || '0000'}\` 
    : (selectedItemData ? \`RAI \${selectedItemData.numeroReferencia ? String(selectedItemData.numeroReferencia).padStart(2, '0') : '00'}/\${selectedItemData.anoReferencia || '0000'}\` : 'RAI 00/0000');`;

const newCod = `const baseSigla = (selectedItemData?.sigla || '').toUpperCase().includes('EXTRA') ? 'REAI' : 'RAI';
    const codRelatorioStr = numero || ano 
    ? \`\${baseSigla} \${numero ? String(numero).padStart(2, '0') : '00'}/\${ano || '0000'}\` 
    : (selectedItemData ? \`\${baseSigla} \${selectedItemData.numeroReferencia ? String(selectedItemData.numeroReferencia).padStart(2, '0') : '00'}/\${selectedItemData.anoReferencia || '0000'}\` : \`\${baseSigla} 00/0000\`);`;

content = content.replace(oldCod, newCod);

// Update document.title
const oldTitle = "document.title = `RAI ${numero ? String(numero).padStart(2, '0') : '00'}/${ano} - Auditoria Interna`;";
const newTitle = "const titleSigla = (selectedItemData?.sigla || '').toUpperCase().includes('EXTRA') ? 'REAI' : 'RAI';\n      document.title = `${titleSigla} ${numero ? String(numero).padStart(2, '0') : '00'}/${ano} - Auditoria Interna`;";

content = content.replace(oldTitle, newTitle);

// Update cover page string: {numero || ano ? `RAI...
const oldCover = `{numero || ano ? \`RAI \${numero ? String(numero).padStart(2, '0') : '00'}/\${ano || '0000'}\` : (selectedItemData ? \`RAI \${selectedItemData.numeroReferencia ? String(selectedItemData.numeroReferencia).padStart(2, '0') : '00'}/\${selectedItemData.anoReferencia || '0000'}\` : 'RAI 00/0000')}`;

const newCover = `{codRelatorioStr}`;

content = content.replace(oldCover, newCover);

// Update api.post call
const oldApi = `const response = await api.post('/pdf/gerar', { html: htmlContent }, { responseType: 'blob' });`;
const newApi = `const response = await api.post('/pdf/gerar', { html: htmlContent, docName: codRelatorioStr, docVersion: 'Versão Preliminar' }, { responseType: 'blob' });`;

content = content.replace(oldApi, newApi);

fs.writeFileSync(preliminarPath, content, 'utf8');
console.log('Updated RelatorioPreliminar.jsx');
