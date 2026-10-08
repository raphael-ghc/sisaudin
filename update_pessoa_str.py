import os
import glob

frontend_pages_dir = r"C:\Users\usuario\amanda\ghc\_Sisaudin2026\sisaudin\frontend\src\pages"
jsx_files = glob.glob(os.path.join(frontend_pages_dir, "*.jsx"))

for file_path in jsx_files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 1. Replace the setPessoasOptions map
    content = content.replace(
        "p => `${p.nome} (Cartão: ${p.cartaoPonto})`",
        "p => `${p.nome} (Cartão: ${p.cartaoPonto}) (Cargo: ${p.cargo || '-'})`"
    )
    
    # 2. Replace the formatPessoaStr function
    content = content.replace(
        "p => p ? `${p.nome} (Cartão: ${p.cartaoPonto})` : ''",
        "p => p ? `${p.nome} (Cartão: ${p.cartaoPonto}) (Cargo: ${p.cargo || '-'})` : ''"
    )

    # 3. Replace in Gerencia.jsx mapping
    content = content.replace(
        "label: `${p.nome} (Cartão: ${p.cartaoPonto})`",
        "label: `${p.nome} (Cartão: ${p.cartaoPonto}) (Cargo: ${p.cargo || '-'})`"
    )

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Replacement complete.")
