import os
import glob

missing_styles = """
               .rec-block { background-color: #f7fafc; border: 1px solid var(--border-color); border-left: 4px solid var(--ghc-secondary); border-radius: 4px; padding: 10px 15px; margin-top: 10px; margin-bottom: 15px; }
               .rec-gerencia { font-weight: bold; color: var(--ghc-primary); text-transform: uppercase; font-size: 9pt; margin-bottom: 10px; border-bottom: 1px dashed var(--border-color); padding-bottom: 5px; }
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
        if '.rec-block {' not in style_block:
            if style_end_idx != -1:
                content = content[:style_end_idx] + missing_styles + content[style_end_idx:]
                with open(file, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Patched {file}")
            else:
                print(f"Could not find </style> in {file}")
        else:
            print(f"Already patched {file}")
