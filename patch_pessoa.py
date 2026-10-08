import sys
import re

file_path = r"C:\Users\usuario\amanda\ghc\_Sisaudin2026\sisaudin\frontend\src\pages\Pessoa.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add import
if 'import { getAllGeneric }' not in content:
    content = content.replace(
        'import { getAllGerencias } from "../api/gerenciaApi";',
        'import { getAllGerencias } from "../api/gerenciaApi";\nimport { getAllGeneric } from "../api/genericApi";'
    )

# 2. Add state
if 'const [cargos, setCargos] = useState([]);' not in content:
    content = content.replace(
        'const [gerencias, setGerencias] = useState([]);',
        'const [gerencias, setGerencias] = useState([]);\n  const [cargos, setCargos] = useState([]);'
    )

# 3. Add cargosOptions
if 'const cargosOptions =' not in content:
    content = content.replace(
        '''  const gerenciasOptions = gerencias.map(g => ({
    value: g.id,
    label: `${g.nome} ${g.sigla ? `(${g.sigla})` : ''}`
  }));''',
        '''  const gerenciasOptions = gerencias.map(g => ({
    value: g.id,
    label: `${g.nome} ${g.sigla ? `(${g.sigla})` : ''}`
  }));
  
  const cargosOptions = cargos.map(c => ({
    value: c.id,
    label: c.nome
  }));'''
    )

# 4. Update fetchData Promise.all
content = content.replace(
    '''      const [resPessoas, resGerencias] = await Promise.all([
        getAllPessoas(),
        getAllGerencias() 
      ]);''',
    '''      const [resPessoas, resGerencias, resCargos] = await Promise.all([
        getAllPessoas(),
        getAllGerencias(),
        getAllGeneric('cargo')
      ]);'''
)

# 5. Set cargos in fetchData
content = content.replace(
    '''      setGerencias(resGerencias.data?.data?.content || resGerencias.data?.data || []);''',
    '''      setGerencias(resGerencias.data?.data?.content || resGerencias.data?.data || []);
      setCargos(resCargos.data?.data?.content || resCargos.data?.data || []);'''
)

# 6. Initial formData
content = content.replace(
    '''    cargo: '',''',
    '''    cargo: null,'''
)

# 7. Update payload logic (2 occurrences)
content = content.replace(
    '''        cargo: formData.cargo,''',
    '''        cargo: formData.cargo ? { id: formData.cargo.id } : null,'''
)

# 8. Update table cell
content = content.replace(
    '''                    {p.cargo || '-'}''',
    '''                    {p.cargo?.nome || '-'}'''
)

# 9. Update Form input to SearchableSelect
input_html = '''                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                <input 
                  type="text" 
                  value={formData.cargo || ''}
                  onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00767d]/50 focus:border-[#00767d]"
                  placeholder="Ex: Auditor(a)"
                />'''

select_html = '''                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                <SearchableSelect
                  options={cargosOptions}
                  value={formData.cargo ? cargosOptions.find(opt => opt.value === formData.cargo.id) : null}
                  onChange={(selected) => setFormData({ ...formData, cargo: selected ? { id: selected.value } : null })}
                  placeholder="Selecione um Cargo..."
                />'''

content = content.replace(input_html, select_html)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Pessoa.jsx patched.")
