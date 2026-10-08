const fs = require('fs');
const files = [
    'frontend/src/pages/Comunicacao.jsx',
    'frontend/src/pages/Nota.jsx',
    'frontend/src/pages/NotaFinal.jsx',
    'frontend/src/pages/NotaTecnica.jsx',
    'frontend/src/pages/OrdemServico.jsx',
    'frontend/src/pages/Parecer.jsx',
    'frontend/src/pages/Planejamento.jsx',
    'frontend/src/pages/RelatorioFinal.jsx',
    'frontend/src/pages/RelatorioPreliminar.jsx',
    'frontend/src/pages/Solicitacao.jsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  const oldLoop = /const images = clone\.querySelectorAll\('img'\);\s*images\.forEach\(img => {\s*img\.src = img\.src;\s*}\);/g;
  const oldLoop2 = /const images = clone\.querySelectorAll\('img'\);\s*images\.forEach\(img => img\.src = img\.src\);/g;
  
  const newLoop = `const images = clone.querySelectorAll('img');
        
        const convertImageToBase64 = async (imgEl) => {
            try {
                if (imgEl.src.startsWith('data:')) return;
                
                const response = await fetch(imgEl.src);
                const blob = await response.blob();
                
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        imgEl.src = reader.result;
                        resolve();
                    };
                    reader.onerror = resolve;
                    reader.readAsDataURL(blob);
                });
            } catch (e) {
                console.error('Failed to convert image to base64:', e);
            }
        };
        
        const imagePromises = Array.from(images).map(convertImageToBase64);
        await Promise.all(imagePromises);`;
        
  if (content.match(oldLoop)) {
      content = content.replace(oldLoop, newLoop);
      fs.writeFileSync(file, content);
      console.log('Fixed', file);
  } else if (content.match(oldLoop2)) {
      content = content.replace(oldLoop2, newLoop);
      fs.writeFileSync(file, content);
      console.log('Fixed', file);
  } else {
      console.log('Could not find pattern in', file);
  }
});
