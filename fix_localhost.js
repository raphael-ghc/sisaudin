const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'api/axiosInstance.js',
  'api/refreshAxiosInstance.js',
  'api/relatorioFinalApi.js',
  'api/relatorioPreliminarApi.js',
  'components/FileAttachmentManager.jsx',
  'pages/RelatorioFinal.jsx',
  'pages/RelatorioPreliminar.jsx'
];

const srcDir = path.join(__dirname, 'frontend', 'src');

filesToProcess.forEach(file => {
  const filePath = path.join(srcDir, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace localhost:8080 with https://sisaudin.ghc.com.br:8080
  // First, temporarily replace https://sisaudin.ghc.com.br:8080 with a placeholder to avoid double http://
  content = content.replace(/http:\/\/localhost:8080/g, '__TMP_localhost__');
  content = content.replace(/localhost:8080/g, 'https://sisaudin.ghc.com.br:8080');
  content = content.replace(/__TMP_localhost__/g, 'https://sisaudin.ghc.com.br:8080');
  
  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Fixed localhost protocol issues.');
