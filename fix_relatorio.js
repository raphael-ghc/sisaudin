const fs = require('fs');

const fixRelatorioFinal = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Remove bad isGeneratingPdf
    content = content.replace(/const \[isGeneratingPdf, setIsGeneratingPdf\] = useState\(false\);\n?/g, '');
    
    // 2. Remove bad handleGerarPdfServidor
    const regex = /const handleGerarPdfServidor = async \(\) => \{[\s\S]*?finally \{\s*setIsGeneratingPdf\(false\);\s*\}\s*\};\s*/g;
    content = content.replace(regex, '');

    // 3. Inject states and function at the top (after const [saving, setSaving] = useState(false);)
    const topInjection = `
  const [gerenciasFullList, setGerenciasFullList] = useState([]);
  const [activeEditors, setActiveEditors] = useState({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleGerarPdfServidor = async () => {
      const previewEl = document.getElementById('document-preview-container');
      if (!previewEl) {
        toast.error('Erro: visualiza\\u00e7\\u00e3o n\\u00e3o encontrada.');
        return;
      }
      setIsGeneratingPdf(true);
      try {
        const clone = previewEl.cloneNode(true);
        const images = clone.querySelectorAll('img');
        images.forEach(img => { img.src = img.src; });
        const htmlContent = \`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Relat\\u00f3rio Final</title>
            <style>
               body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2d3748; font-size: 10pt; line-height: 1.5; }
               .page { margin-bottom: 20px; page-break-after: always; position: relative; }
               .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #00767d; padding-bottom: 10px; }
               .header img { max-width: 100%; height: auto; }
               .footer { position: absolute; bottom: 0; left: 0; width: 100%; text-align: center; font-size: 8pt; color: #718096; border-top: 1px solid #e2e8f0; padding-top: 5px; }
               .title { font-size: 14pt; font-weight: bold; color: #00767d; margin-bottom: 15px; text-align: center; }
               .section-title { font-size: 12pt; font-weight: bold; color: #00767d; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
               .text-content { text-align: justify; margin-bottom: 15px; }
               .bold { font-weight: bold; }
               .italic { font-style: italic; }
               table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
               th, td { border: 1px solid #cbd5e0; padding: 8px; text-align: left; font-size: 9pt; }
               th { background-color: #f7fafc; font-weight: bold; color: #4a5568; }
               .action-plan-table th { background-color: #00767d; color: white; border: 1px solid #00767d; }
               .matriz-table th { background-color: #00767d; color: white; border: 1px solid #00767d; }
               .matriz-text { font-size: 9pt; text-align: justify; line-height: 1.3; }
               .box-fato { border-left: 3px solid #00767d; padding-left: 10px; margin-bottom: 10px; } 
               .box-fato .matriz-header { color: #00767d; border-bottom: 1px solid #00767d; font-weight: bold; margin-bottom: 5px; } 
               .box-criterio { border-left: 3px solid #00767d; padding-left: 10px; margin-bottom: 10px; } 
               .box-criterio .matriz-header { color: #00767d; border-bottom: 1px solid #00767d; font-weight: bold; margin-bottom: 5px; } 
               .box-causa { border-left: 3px solid #00767d; padding-left: 10px; margin-bottom: 10px; } 
               .box-causa .matriz-header { color: #00767d; border-bottom: 1px solid #00767d; font-weight: bold; margin-bottom: 5px; } 
               .box-impacto { border-left: 3px solid #00767d; padding-left: 10px; margin-bottom: 10px; } 
               .box-impacto .matriz-header { color: #00767d; border-bottom: 1px solid #00767d; font-weight: bold; margin-bottom: 5px; }
               .tabela-capa td { border: none !important; padding: 4px 0 !important; }
               .rec-block { background-color: #f7fafc; border: 1px solid #cbd5e0; border-left: 4px solid #84c9bd; border-radius: 4px; padding: 10px 15px; margin-top: 10px; margin-bottom: 15px; }
               .rec-gerencia { font-weight: bold; color: #00767d; text-transform: uppercase; font-size: 9pt; margin-bottom: 10px; border-bottom: 1px dashed #cbd5e0; padding-bottom: 5px; }
               .rec-item { margin-bottom: 12px; font-size: 9.5pt; text-align: justify; }
               .rec-item:last-child { margin-bottom: 0; }
               .rec-meta { display: flex; gap: 20px; margin-top: 6px; font-size: 8.5pt; color: #4a5568; background: #fff; padding: 4px 8px; border-radius: 3px; border: 1px solid #e2e8f0; }
               .rec-beneficio-inline { margin-top: 6px; font-size: 8.5pt; color: #2d3748; background: #fff; padding: 4px 8px; border-radius: 3px; border: 1px solid #e2e8f0; }
               .badge-risco { padding: 2px 6px; border-radius: 4px; font-weight: bold; color: white; font-size: 8pt; text-transform: uppercase; }
               .bg-critico { background-color: #742a2a; }
               .bg-alto { background-color: #e53e3e; }
               .bg-medio { background-color: #dd6b20; }
               .bg-baixo { background-color: #3182ce; }
               .beneficio-tag { background-color: #e6fffa; color: #234e52; border: 1px solid #b2f5ea; padding: 1px 4px; border-radius: 3px; font-size: 7.5pt; font-weight: bold; }
               @page { size: A4 portrait; margin: 10mm; }
               @page landscape_page { size: A4 landscape; margin: 10mm; }
               .landscape-page { page: landscape_page; page-break-before: always; }
               .texto-comum p, .editor-content p { text-indent: 1.25cm; }
            </style>
          </head>
          <body>
            \${clone.outerHTML}
          </body>
          </html>
        \`;
        const response = await api.post('/pdf/gerar', { html: htmlContent, docName: codRelatorioStr, docVersion: 'Vers\\u00e3o Final' }, { responseType: 'blob' });
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = \`\${codRelatorioStr.replace(/\\//g, '_').replace(/ /g, '_')}.pdf\`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("PDF gerado com sucesso no servidor!");
      } catch (err) {
        console.error(err);
        toast.error("Erro ao gerar PDF no servidor.");
      } finally {
        setIsGeneratingPdf(false);
      }
  };
`;

    if (content.includes('const [saving, setSaving] = useState(false);')) {
        content = content.replace(
            /const \[saving, setSaving\] = useState\(false\);/,
            "const [saving, setSaving] = useState(false);\n" + topInjection
        );
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Successfully fixed RelatorioFinal.jsx!");
    } else {
        console.log("Could not find insertion point.");
    }
};

fixRelatorioFinal('C:/Users/usuario/amanda/ghc/_Sisaudin2026/sisaudin/frontend/src/pages/RelatorioFinal.jsx');
