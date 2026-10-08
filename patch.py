import re

with open('frontend/src/pages/NotaTecnica.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove constatações states
content = re.sub(r'\s*const \[constatacoes, setConstatacoes\] = useState\(\[\]\);', '', content)
content = re.sub(r'\s*const \[constatacoesTextoInicial, setConstatacoesTextoInicial\] = useState\(\'\'\);', '', content)

# 1.1 Remove constatacoes from the useEffect that calculates pages
content = re.sub(r'constatacoes, ', '', content)
content = re.sub(r'constatacoesTextoInicial, ', '', content)

# 2. Add AnaliseFatos section in the editor
analise_fatos_html = '''
            <section className="mb-10">
              <div className="relative">
                <RichTextEditor readOnly={isReadOnly}
                  title="2. ANÁLISE DE FATOS"
                  subtitle="Salvo automaticamente após 3 segundos de inatividade."
                  initialContent={analiseFatos}
                  onChange={setAnaliseFatos}
                  onSave={(content) => handleAutoSave('2. ANÁLISE DE FATOS', content)}
                  onFocus={() => { setActiveSectionId('analiseFatos'); }}
                  globalCollapseAction={globalCollapseAction}
                  renderAttachments={() => <FileAttachmentManager files={getAnexosBySecao('2. ANÁLISE DE FATOS')} onUpload={(file) => handleUploadAnexo(file, '2. ANÁLISE DE FATOS')} onDelete={handleDeleteAnexo} globalCollapseAction={globalCollapseAction} />}
                />
              </div>
            </section>
'''
# Replace the old Constatações editor block with Analise Fatos
content = re.sub(r'<section className="mb-10">\s*<div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b-2 border-blue-900 pb-3">\s*<h2 className="text-xl font-bold text-blue-900">4\. CONSTATAÇÕES E RECOMENDAÇÕES</h2>.*?</section>', analise_fatos_html, content, flags=re.DOTALL)

# 3. Update TOC in Preview
# Replace preview-intro toc to also include analiseFatos
toc_analise = '''<li className="toc-item"><a href="#preview-analise" className="toc-link" style={{ textDecoration: 'none', color: 'inherit' }}><span className="toc-title">2. ANÁLISE DE FATOS</span><span className="toc-dots"></span><span className="toc-page-num">{pageNumbers['preview-analise'] || 4}</span></a></li>'''
content = re.sub(r'(<li className="toc-item"><a href="#preview-intro".*?</li>)', r'\1\n                    ' + toc_analise, content)

# 4. Remove Constatações preview block and add Analise de Fatos
# We search for the hidden preview section and remove it
content = re.sub(r'\{\/\* === PÁGINA 5: INFORMAÇÕES PRELIMINARES E CONSTATAÇÕES === \*\/\}.*?<h2 id="preview-consideracoes">', '''{/* === PÁGINA 5: ANÁLISE DE FATOS === */}
            <div className="page portrait relative" id="page-analise" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>
                <h2 id="preview-analise">2. ANÁLISE DE FATOS</h2>
                <div className="texto-comum" dangerouslySetInnerHTML={{ __html: analiseFatos || '<p class="text-gray-400 italic">Preencha a análise de fatos no editor...</p>' }} />
            </div>

            <h2 id="preview-consideracoes">''', content, flags=re.DOTALL)

# 5. Fix handleAutoSave payload and debouncedSave payload
content = re.sub(r'constatacoesTextoInicial: constatacoesTextoInicial \|\| \'\',\s*constatacoes: constatacoes\.map.*?\]\)\s*\}\),', '', content, flags=re.DOTALL)


with open('frontend/src/pages/NotaTecnica.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
