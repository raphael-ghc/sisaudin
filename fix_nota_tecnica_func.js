const fs = require('fs');

const missingFunction = `
  const extractItemData = (res) => {
    if (!res) return null;
    if (res.data) return res.data.data || res.data;
    return res;
  };
`;

const fixFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (!content.includes('const extractItemData =')) {
        content = content.replace(
            /const \[itensTrabalho, setItensTrabalho\] = useState\(\[\]\);/,
            "const [itensTrabalho, setItensTrabalho] = useState([]);\n" + missingFunction
        );
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed extractItemData in ${filePath}`);
    }
};

fixFile('C:/Users/usuario/amanda/ghc/_Sisaudin2026/sisaudin/frontend/src/pages/NotaTecnica.jsx');
