def count(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    c1 = content.count('handleGerarPdfServidor')
    print(f"{filepath}: {c1} occurrences")

count('frontend/src/pages/Parecer.jsx')
count('frontend/src/pages/NotaTecnica.jsx')
count('frontend/src/pages/NotaFinal.jsx')
count('frontend/src/pages/Nota.jsx')
