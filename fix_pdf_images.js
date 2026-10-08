const fs = require('fs');
const files = ['frontend/src/pages/RelatorioFinal.jsx', 'frontend/src/pages/NotaTecnica.jsx'];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  const oldLoop = /const images = clone\.querySelectorAll\('img'\);\s*images\.forEach\(img => { img\.src = img\.src; }\);/g;
  
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
        
  content = content.replace(oldLoop, newLoop);
  fs.writeFileSync(file, content);
});
