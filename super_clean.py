import re

def super_clean(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Remove all "const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);"
    content = content.replace("const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);", "")
    content = content.replace("  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);", "")

    # Remove all handleGerarPdfServidor functions
    while True:
        s = content.find("const handleGerarPdfServidor = async ()")
        if s == -1: break
        
        # We need to find the matching closing brace.
        # It ends after "finally {\n        setIsGeneratingPdf(false);\n      }\n  };"
        # Or maybe it doesn't have finally?
        # Let's just find "window.URL.revokeObjectURL(url);" and the next "};"
        
        # A simpler way: we know it ends with toast.success or error and then };
        # Let's count braces!
        idx = content.find('{', s)
        brace_count = 1
        i = idx + 1
        while brace_count > 0 and i < len(content):
            if content[i] == '{': brace_count += 1
            elif content[i] == '}': brace_count -= 1
            i += 1
            
        # Add the semicolon if present
        if i < len(content) and content[i] == ';':
            i += 1
            
        content = content[:s] + content[i:]

    # Remove the buttons
    while True:
        b = content.find('<button')
        if b == -1: break
        
        # We only want to remove it if it has onClick={handleGerarPdfServidor}
        # Let's find the next </button>
        e = content.find('</button>', b)
        if e == -1: break
        e += len('</button>')
        
        btn_content = content[b:e]
        if 'handleGerarPdfServidor' in btn_content:
            content = content[:b] + content[e:]
        else:
            # Not the button we want to remove, skip past it for the next find
            # Wait, since we are doing a while loop on content.find('<button'), this will infinite loop if we just `continue` without advancing the search index!
            break
            
    # To properly remove buttons without infinite loop:
    content = re.sub(r'<button[^>]*onClick=\{handleGerarPdfServidor\}[^>]*>.*?</button>', '', content, flags=re.DOTALL)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Cleaned {filepath}")

super_clean('frontend/src/pages/Parecer.jsx')
super_clean('frontend/src/pages/NotaTecnica.jsx')
super_clean('frontend/src/pages/NotaFinal.jsx')
super_clean('frontend/src/pages/Nota.jsx')
