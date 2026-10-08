import re

with open('frontend/src/pages/NotaTecnica.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix typos
content = content.replace('Responsáveis por este trabalho Técnica:', 'Responsáveis por esta Nota Técnica:')
content = content.replace('aprovo a documentação Técnica que consubstancia o presente documento.', 'aprovo a documentação que consubstancia o presente documento.')

# 2. Remove page-anexo-a completely
content = re.sub(r'\{\/\* === PÁGINA 6: ANEXO A === \*\/\}.*?id="page-anexo-a">.*?(?=\{\/\* === PÁGINAS DE ANEXOS ADICIONAIS === \*\/\})', '', content, flags=re.DOTALL)

# 3. Update dynamic anexos letter and numbers
# 66 + i -> 65 + i
content = content.replace('String.fromCharCode(66 + i)', 'String.fromCharCode(65 + i)')
# 7+i -> 6+i
content = content.replace('{7+i}', '{6+i}')
# (7+i) -> (6+i)
content = content.replace('(7+i)', '(6+i)')

# 4. Remove TOC entry for Anexo A
content = re.sub(r'<li className="toc-item"><a href="#preview-anexoa".*?</li>\n', '', content)

# 5. Remove page-anexo-a calculation
content = re.sub(r'\s*const elAnexoA = document\.getElementById\(\'page-anexo-a\'\);.*?\s*currentStartPage \+= pagesAnexoA;\n', '', content, flags=re.DOTALL)

with open('frontend/src/pages/NotaTecnica.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done!")
