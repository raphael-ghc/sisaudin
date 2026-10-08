import re

with open('frontend/src/index.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Add print color adjust
print_adjust_css = '''
@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
'''
if '-webkit-print-color-adjust: exact' not in css:
    css = css.replace('@media print {', print_adjust_css)

# Add capa font size
capa_font_css = '''
/* Override font size for cover table */
.preview-container table.tabela-capa td,
.preview-container table.tabela-capa th,
.preview-container .capa-page table td,
.preview-container .capa-page table th,
.pdf-page table.tabela-capa td,
.pdf-page table.tabela-capa th,
.pdf-cloned-content table.tabela-capa td,
.pdf-cloned-content table.tabela-capa th {
    font-size: 12pt !important;
}
'''
if 'Override font size for cover table' not in css:
    css += capa_font_css

with open('frontend/src/index.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("index.css updated.")
