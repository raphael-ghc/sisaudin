const fs = require('fs');

const fixFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove the bad declaration
    content = content.replace(/const \[isGeneratingPdf, setIsGeneratingPdf\] = useState\(false\);\n?/g, '');
    
    // Insert it safely at the top state block
    if (!content.includes('const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);')) {
        content = content.replace(
            /const \[isVinculoOpen, setIsVinculoOpen\] = useState\(true\);/,
            "const [isVinculoOpen, setIsVinculoOpen] = useState(true);\n  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);"
        );
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Moved isGeneratingPdf in ${filePath}`);
    }
};

fixFile('C:/Users/usuario/amanda/ghc/_Sisaudin2026/sisaudin/frontend/src/pages/NotaFinal.jsx');
fixFile('C:/Users/usuario/amanda/ghc/_Sisaudin2026/sisaudin/frontend/src/pages/Nota.jsx');
