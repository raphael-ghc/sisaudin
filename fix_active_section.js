const fs = require('fs');

const fixFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if activeSectionId is already defined
    if (!content.includes('const [activeSectionId, setActiveSectionId] = useState(null);')) {
        // Find a good place to insert it, e.g. after const [saving, setSaving] = useState(false);
        content = content.replace(
            /const \[saving, setSaving\] = useState\(false\);/,
            "const [saving, setSaving] = useState(false);\n  const [activeSectionId, setActiveSectionId] = useState(null);"
        );
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed ${filePath}`);
    } else {
        console.log(`${filePath} already has activeSectionId`);
    }
};

fixFile('C:/Users/usuario/amanda/ghc/_Sisaudin2026/sisaudin/frontend/src/pages/NotaFinal.jsx');
fixFile('C:/Users/usuario/amanda/ghc/_Sisaudin2026/sisaudin/frontend/src/pages/Nota.jsx');
