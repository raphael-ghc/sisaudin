import os

def insert_button(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'Gerar PDF no Servidor' in content:
        print(f"Button already in {filepath}")
        return
        
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
    
    # In these files, we want to put it before <Printer size={18} />
    search_btn = '<Printer size={18} />'
    btn_idx = content.find(search_btn)
    if btn_idx != -1:
        btn_start = content.rfind('<button', 0, btn_idx)
        content = content[:btn_start] + button_jsx + content[btn_start:]
    else:
        # try window.print
        search_btn = 'window.print()'
        btn_idx = content.find(search_btn)
        if btn_idx != -1:
            btn_start = content.rfind('<button', 0, btn_idx)
            content = content[:btn_start] + button_jsx + content[btn_start:]
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Added button to {filepath}")

insert_button('frontend/src/pages/NotaFinal.jsx')
insert_button('frontend/src/pages/NotaTecnica.jsx')
insert_button('frontend/src/pages/Parecer.jsx')
