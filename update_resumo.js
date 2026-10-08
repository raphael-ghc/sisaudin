const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'RelatorioPreliminar.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// replace <ResumoConstatacaoSection with <ResumoConstatacaoSection isReadOnly={isReadOnly}
const newContent = content.replace(/<ResumoConstatacaoSection\b(?!.*\bisReadOnly)/g, '<ResumoConstatacaoSection isReadOnly={isReadOnly}');

if (newContent !== content) {
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log('Updated ResumoConstatacaoSection in RelatorioPreliminar.jsx');
} else {
  console.log('No changes made to ResumoConstatacaoSection');
}
