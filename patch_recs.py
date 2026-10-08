import sys

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    broken_str = '''  const excluirRecomendacao = (constatacaoId, recomendacaoId) => {
    if (isReadOnly) return;
    setConstatacoes(constatacoes.map(c => c.id === constatacaoId ? { ...c, recomendacoes: c.recomendacoes.filter(r => r.id !== recomendacaoId) } : c));
  };
  const atualizarAnexosRecomendacao = (constatacaoId, recomendacaoId, newFiles) => {
    if (isReadOnly) return;
    setConstatacoes(constatacoes.map(c => c.id === constatacaoId ? {
      ...c, recomendacoes: c.recomendacoes.map(r => r.id === recomendacaoId ? { ...r, anexos: newFiles } : r)
    } : c));
  };
  const atualizarRecomendacao = (constatacaoId, recomendacaoId, field, value) => {
    if (isReadOnly) return;
    setConstatacoes(constatacoes.map(c => {
      if (c.id === constatacaoId) {
        return {
          ...c, recomendacoes: c.recomendacoes.map(r => {
            if (r.id === recomendacaoId) {
              if (field === 'tipoBeneficio' && r.tipoBeneficio !== value) return { ...r, [field]: value, detalheBeneficio: '' };
              return { ...r, [field]: value };
            }
            return r;
          })
        };
      }
      return c;
    }));
  };'''

    correct_str = '''  const excluirRecomendacao = (constatacaoId, recomendacaoId) => {
    if (isReadOnly) return;
    
    let gerenciaRemovida = null;
    constatacoes.forEach(c => {
      if (c.id === constatacaoId) {
        const rec = c.recomendacoes.find(r => r.id === recomendacaoId);
        if (rec && rec.gerencia) gerenciaRemovida = rec.gerencia;
      }
    });

    const newConstatacoes = constatacoes.map(c => c.id === constatacaoId ? { ...c, recomendacoes: c.recomendacoes.filter(r => r.id !== recomendacaoId) } : c);
    setConstatacoes(newConstatacoes);

    if (gerenciaRemovida) {
      const stillUsed = newConstatacoes.some(c => c.recomendacoes && c.recomendacoes.some(r => r.gerencia === gerenciaRemovida));
      if (!stillUsed) {
        setGerenciasDestinatarias(prev => prev.filter(g => (g.nome || g) !== gerenciaRemovida));
      }
    }
  };

  const atualizarAnexosRecomendacao = (constatacaoId, recomendacaoId, newFiles) => {
    if (isReadOnly) return;
    setConstatacoes(constatacoes.map(c => c.id === constatacaoId ? {
      ...c, recomendacoes: c.recomendacoes.map(r => r.id === recomendacaoId ? { ...r, anexos: newFiles } : r)
    } : c));
  };

  const atualizarRecomendacao = (constatacaoId, recomendacaoId, field, value) => {
    if (isReadOnly) return;
    
    let gerenciaAntiga = null;
    
    const newConstatacoes = constatacoes.map(c => {
      if (c.id === constatacaoId) {
        return {
          ...c, recomendacoes: c.recomendacoes.map(r => {
            if (r.id === recomendacaoId) {
              if (field === 'gerencia') gerenciaAntiga = r.gerencia;
              if (field === 'tipoBeneficio' && r.tipoBeneficio !== value) return { ...r, [field]: value, detalheBeneficio: '' };
              return { ...r, [field]: value };
            }
            return r;
          })
        };
      }
      return c;
    });
    
    setConstatacoes(newConstatacoes);

    if (field === 'gerencia') {
      const novaGerencia = value;
      
      setGerenciasDestinatarias(prev => {
        let updated = [...prev];
        
        if (novaGerencia) {
          const exists = updated.some(g => (g.nome || g) === novaGerencia);
          if (!exists) {
            const gerenciaObj = gerenciasFullList.find(g => (g.nome || g) === novaGerencia) || { id: Date.now() + Math.random(), nome: novaGerencia };
            updated.push(gerenciaObj);
          }
        }
        
        if (gerenciaAntiga && gerenciaAntiga !== novaGerencia) {
          const stillUsed = newConstatacoes.some(c => c.recomendacoes && c.recomendacoes.some(r => r.gerencia === gerenciaAntiga));
          if (!stillUsed) {
            updated = updated.filter(g => (g.nome || g) !== gerenciaAntiga);
          }
        }
        
        return updated;
      });
    }
  };'''

    if broken_str in content:
        content = content.replace(broken_str, correct_str)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Patched {filepath} successfully.")
    else:
        print(f"Failed to find target string in {filepath}.")

patch_file('frontend/src/pages/RelatorioFinal.jsx')
patch_file('frontend/src/pages/RelatorioPreliminar.jsx')
