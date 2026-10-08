const fs = require('fs');

const missingStates = `
  const { jwtPayload } = useAppContext();
  const [saveStatus, setSaveStatus] = useState('');
  const [isVinculoOpen, setIsVinculoOpen] = useState(true);
  const [collapsedReportes, setCollapsedReportes] = useState({});
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [globalCollapseAction, setGlobalCollapseAction] = useState(null);

  const toggleReportes = (itemId) => {
    setCollapsedReportes(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };
`;

const fixFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Ensure we don't insert multiple times
    if (!content.includes('const [isVinculoOpen')) {
        content = content.replace(
            /const \[layoutMode, setLayoutMode\] = useState\('split'\);/,
            "const [layoutMode, setLayoutMode] = useState('split');\n" + missingStates
        );
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed missing states in ${filePath}`);
    } else {
        console.log(`${filePath} already has missing states`);
    }
};

fixFile('C:/Users/usuario/amanda/ghc/_Sisaudin2026/sisaudin/frontend/src/pages/NotaFinal.jsx');
fixFile('C:/Users/usuario/amanda/ghc/_Sisaudin2026/sisaudin/frontend/src/pages/Nota.jsx');
