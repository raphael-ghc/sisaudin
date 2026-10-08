const fs = require('fs');

const fixFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');

    // Pattern to match the bad block
    // We want to capture from `const [isGeneratingPdf` all the way down to `};` before `return (`
    const regex = /const \[isGeneratingPdf, setIsGeneratingPdf\] = useState\(false\);\s*const handleGerarPdfServidor = async \(\) => \{[\s\S]*?finally \{\s*setIsGeneratingPdf\(false\);\s*\}\s*\};\s*/;
    
    const match = content.match(regex);
    if (match) {
        let block = match[0];
        console.log("Found bad block!");
        
        // Remove it from its current location
        content = content.replace(regex, '');
        
        // Put it at the top, right after `const [saving, setSaving] = useState(false);`
        if (content.includes('const [saving, setSaving] = useState(false);')) {
            content = content.replace(
                /const \[saving, setSaving\] = useState\(false\);/,
                "const [saving, setSaving] = useState(false);\n" + block
            );
            fs.writeFileSync(filePath, content, 'utf8');
            console.log("Successfully moved handleGerarPdfServidor");
        } else {
            console.log("Could not find insertion point.");
        }
    } else {
        console.log("Could not find the bad block.");
    }
};

fixFile('C:/Users/usuario/amanda/ghc/_Sisaudin2026/sisaudin/frontend/src/pages/RelatorioFinal.jsx');
