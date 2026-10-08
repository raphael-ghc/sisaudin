import os
import glob

new_styles = """
               @page { size: A4 portrait; margin: 10mm; }
               @page landscape_page { size: A4 landscape; margin: 10mm; }
               .landscape-page { page: landscape_page; page-break-before: always; }
               .texto-comum p, .editor-content p { text-indent: 1.25cm; }
"""

files = glob.glob('C:/Users/usuario/amanda/ghc/_Sisaudin2026/sisaudin/frontend/src/pages/*.jsx')

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
        
    func_sig = 'const handleGerarPdfServidor = async () => {'
    if func_sig in content:
        handle_idx = content.find(func_sig)
        style_end_idx = content.find('</style>', handle_idx)
        
        style_block = content[handle_idx:style_end_idx]
        if '@page landscape_page' not in style_block:
            if style_end_idx != -1:
                content = content[:style_end_idx] + new_styles + content[style_end_idx:]
                with open(file, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Patched {file}")
            else:
                print(f"Could not find </style> in {file}")
        else:
            print(f"Already patched {file}")
