const fs = require('fs');

const missingStates = `
  const { jwtPayload } = useAppContext();
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [layoutMode, setLayoutMode] = useState('split');
  const [isVinculoOpen, setIsVinculoOpen] = useState(true);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [globalCollapseAction, setGlobalCollapseAction] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [selectedItemData, setSelectedItemData] = useState(null);
  const [selectedItemTrabalhoId, setSelectedItemTrabalhoId] = useState(itemTrabalhoIdParam ? Number(itemTrabalhoIdParam) : '');
  const [numero, setNumero] = useState('');
  const [ano, setAno] = useState('');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [introducao, setIntroducao] = useState('');
  const [analiseFatos, setAnaliseFatos] = useState('');
  const [consideracoesFinais, setConsideracoesFinais] = useState('');
  const [gerenciasDestinatarias, setGerenciasDestinatarias] = useState([]);
  const [gerenciasFullList, setGerenciasFullList] = useState([]);
  const [itensTrabalho, setItensTrabalho] = useState([]);
`;

const fixFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove the bad declaration of isGeneratingPdf if it's there
    content = content.replace(/const \[isGeneratingPdf, setIsGeneratingPdf\] = useState\(false\);\n?/g, '');
    
    // Check if we haven't already inserted
    if (!content.includes('const [selectedItemData, setSelectedItemData]')) {
        content = content.replace(
            /const \[saving, setSaving\] = useState\(false\);/,
            "const [saving, setSaving] = useState(false);\n  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);\n" + missingStates
        );
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed missing states in ${filePath}`);
    }
};

fixFile('C:/Users/usuario/amanda/ghc/_Sisaudin2026/sisaudin/frontend/src/pages/NotaTecnica.jsx');
