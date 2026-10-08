import os
import glob
import re

frontend_pages_dir = r"C:\Users\usuario\amanda\ghc\_Sisaudin2026\sisaudin\frontend\src\pages"
jsx_files = glob.glob(os.path.join(frontend_pages_dir, "*.jsx"))

for file_path in jsx_files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 1. Replace the cargo formatting to use object property
    content = content.replace(
        "p => `${p.nome} (Cartão: ${p.cartaoPonto}) (Cargo: ${p.cargo || '-'})`",
        "p => `${p.nome} (Cartão: ${p.cartaoPonto}) (Cargo: ${p.cargo?.nome || '-'})`"
    )
    
    # 2. Replace the formatPessoaStr function
    content = content.replace(
        "p => p ? `${p.nome} (Cartão: ${p.cartaoPonto}) (Cargo: ${p.cargo || '-'})` : ''",
        "p => p ? `${p.nome} (Cartão: ${p.cartaoPonto}) (Cargo: ${p.cargo?.nome || '-'})` : ''"
    )

    # 3. Replace in Gerencia.jsx mapping
    content = content.replace(
        "label: `${p.nome} (Cartão: ${p.cartaoPonto}) (Cargo: ${p.cargo || '-'})`",
        "label: `${p.nome} (Cartão: ${p.cartaoPonto}) (Cargo: ${p.cargo?.nome || '-'})`"
    )

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Replacement complete.")
