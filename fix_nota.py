import re

def fix_nota(filepath, cod_var, doc_title, doc_version):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove the malformed logic
    start_str = "const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);"
    end_str = "setIsGeneratingPdf(false);\n      }\n  };"
    
    start_idx = content.find(start_str)
    if start_idx != -1:
        end_idx = content.find(end_str, start_idx) + len(end_str)
        content = content[:start_idx] + content[end_idx:]

    # Remove the button from the end
    btn_start_str = '<button \n                onClick={handleGerarPdfServidor}'
    btn_start_idx = content.rfind(btn_start_str)
    if btn_start_idx != -1:
        btn_end_str = 'Gerar PDF no Servidor}</span>\n              </button>'
        btn_end_idx = content.find(btn_end_str, btn_start_idx) + len(btn_end_str)
        content = content[:btn_start_idx] + content[btn_end_idx:]

    # Now inject logic correctly: before `const footerTitleStr` or `return (\n      <div className="flex flex-col`
    inject_logic = f"""
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const handleGerarPdfServidor = async () => {{
      const previewEl = document.getElementById('document-preview-container');
      if (!previewEl) {{
        toast.error('Erro: visualização não encontrada.');
        return;
      }}
      setIsGeneratingPdf(true);
      try {{
        const clone = previewEl.cloneNode(true);
        const images = clone.querySelectorAll('img');
        images.forEach(img => {{ img.src = img.src; }});
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>{doc_title}</title>
            <style>
               :root {{ --ghc-primary: #00767d; --ghc-secondary: #84c9bd; --paper-color: #ffffff; --text-color: #2d3748; --border-color: #cbd5e0; }}
               body {{ background: white; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }}
               .preview-container {{ color: var(--text-color); font-size: 10pt; line-height: 1.5; display: flex; flex-direction: column; align-items: center; }}
               .preview-container .page {{ background-color: var(--paper-color); box-sizing: border-box; position: relative; margin-bottom: 20px; display: flex; flex-direction: column; width: 100%; }}
               .preview-container h2 {{ color: var(--ghc-primary); padding: 6px 12px; margin-top: 25px; margin-bottom: 15px; font-size: 12pt; font-weight: bold; text-transform: uppercase; border-left: 5px solid var(--ghc-primary); background: linear-gradient(90deg, rgba(132, 201, 189, 0.20) 0%, rgba(255, 255, 255, 0) 100%); }} 
               .preview-container h2.center-title {{ text-align: center; border-left: none; background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(132, 201, 189, 0.20) 50%, rgba(255,255,255,0) 100%); }}
               .preview-container h3 {{ color: var(--ghc-primary); font-size: 10pt; font-weight: bold; text-transform: uppercase; margin-top: 18px; margin-bottom: 10px; border-bottom: 1px solid var(--border-color); padding-bottom: 4px; }}
               .texto-comum {{ text-align: justify; font-size: 12pt; }}
               .texto-comum * {{ font-family: 'Calibri', sans-serif !important; font-size: 14pt; color: #000; line-height: 1.5; text-align: justify; }}
               .texto-comum p {{ margin-bottom: 10px; }}
               table {{ width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 9pt; }}
               table th, table td {{ border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: top; }}
               table th {{ background-color: #f1f5f9; font-weight: bold; text-align: left; }}
               .toc-list {{ list-style: none; padding: 0; width: 100%; }} 
               .toc-item {{ margin-bottom: 6px; }} 
               .toc-link {{ display: flex; align-items: baseline; text-decoration: none; color: var(--text-color); font-size: 10pt; }} 
               .toc-dots {{ flex: 1; border-bottom: 1px dotted var(--border-color); margin: 0 6px; }} 
               .toc-page-num {{ font-weight: bold; color: var(--ghc-primary); }}
               .matriz-container {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 10px; margin-bottom: 15px; }} 
               .matriz-box {{ border: 1px solid #cbd5e0; border-radius: 4px; padding: 8px 10px; }} 
               .matriz-header {{ font-size: 8pt; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; padding-bottom: 2px; }} 
               .matriz-text {{ font-size: 9pt; text-align: justify; line-height: 1.3; }}
               .box-fato {{ border-left: 3px solid var(--ghc-primary); }} 
               .box-fato .matriz-header {{ color: var(--ghc-primary); border-bottom: 1px solid var(--ghc-primary); }} 
               .box-criterio {{ border-left: 3px solid var(--ghc-primary); }} 
               .box-criterio .matriz-header {{ color: var(--ghc-primary); border-bottom: 1px solid var(--ghc-primary); }} 
               .box-causa {{ border-left: 3px solid var(--ghc-primary); }} 
               .box-causa .matriz-header {{ color: var(--ghc-primary); border-bottom: 1px solid var(--ghc-primary); }} 
               .box-impacto {{ border-left: 3px solid var(--ghc-primary); }} 
               .box-impacto .matriz-header {{ color: var(--ghc-primary); border-bottom: 1px solid var(--ghc-primary); }}
               .action-plan-table th {{ background-color: var(--ghc-primary); color: white; border: 1px solid var(--ghc-primary); }}
               .tabela-capa td {{ border: none !important; padding: 4px 0 !important; }}
            </style>
          </head>
          <body>
            ${{clone.outerHTML}}
          </body>
          </html>
        `;
        const response = await api.post('/pdf/gerar', {{ html: htmlContent, docName: {cod_var}, docVersion: '{doc_version}' }}, {{ responseType: 'blob' }});
        const blob = new Blob([response.data], {{ type: 'application/pdf' }});
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${{{cod_var}.replace(/\\//g, '_').replace(/ /g, '_')}}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("PDF gerado com sucesso no servidor!");
      }} catch (err) {{
        console.error(err);
        toast.error("Erro ao gerar PDF no servidor.");
      }} finally {{
        setIsGeneratingPdf(false);
      }}
  }};
"""
    search_main_return = '  const footerTitleStr'
    idx = content.find(search_main_return)
    if idx == -1:
        # Fallback
        idx = content.find('  return (\n      <div className="flex flex-col')

    if idx != -1:
        content = content[:idx] + inject_logic + '\n' + content[idx:]

    button_jsx = """
              <button 
                onClick={handleGerarPdfServidor}
                disabled={isGeneratingPdf}
                className={`flex items-center gap-2 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors ${isGeneratingPdf ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                title="Gera o PDF com paginação automática no Sumário (Playwright)"
              >
                {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                <span>{isGeneratingPdf ? 'Gerando...' : 'Gerar PDF no Servidor'}</span>
              </button>
"""
    # Now put the button before window.print() or <Printer
    btn_inserted = False
    
    printer_idx = content.find('<Printer size={18} />')
    if printer_idx != -1:
        btn_start = content.rfind('<button', 0, printer_idx)
        content = content[:btn_start] + button_jsx + content[btn_start:]
        btn_inserted = True
    else:
        window_print_idx = content.find('window.print()')
        if window_print_idx != -1:
            btn_start = content.rfind('<button', 0, window_print_idx)
            content = content[:btn_start] + button_jsx + content[btn_start:]
            btn_inserted = True

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed {filepath}")

fix_nota('frontend/src/pages/Nota.jsx', 'codNotaStr', 'Nota de Auditoria', 'Versão Preliminar')
fix_nota('frontend/src/pages/NotaFinal.jsx', 'codNotaStr', 'Nota de Auditoria', 'Versão Final')
fix_nota('frontend/src/pages/NotaTecnica.jsx', 'codNotaTecnicaStr', 'Nota Técnica', '')
fix_nota('frontend/src/pages/Parecer.jsx', 'codParecerStr', 'Parecer', '')
