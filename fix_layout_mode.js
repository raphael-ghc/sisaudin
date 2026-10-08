const fs = require('fs');

const fixFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if layoutMode is defined
    if (!content.includes('const [layoutMode, setLayoutMode] = useState')) {
        content = content.replace(
            /const \[activeSectionId, setActiveSectionId\] = useState\(null\);/,
            "const [activeSectionId, setActiveSectionId] = useState(null);\n  const [layoutMode, setLayoutMode] = useState('split');"
        );
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed layoutMode in ${filePath}`);
    } else {
        console.log(`${filePath} already has layoutMode`);
    }
};

fixFile('C:/Users/usuario/amanda/ghc/_Sisaudin2026/sisaudin/frontend/src/pages/NotaFinal.jsx');
fixFile('C:/Users/usuario/amanda/ghc/_Sisaudin2026/sisaudin/frontend/src/pages/Nota.jsx');
