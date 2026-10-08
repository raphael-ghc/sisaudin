import sys

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    broken_str = '''  const removeRecomendacao = (constatacaoIndex, recIndex) => {
    const updated = [...constatacoes];
    updated[constatacaoIndex].recomendacoes = updated[constatacaoIndex].recomendacoes.filter((_, i) => i !== recIndex);
    setConstatacoes(updated);
  };

  const saveRecomendacaoModal = () => {
    if (!recForm.content.trim()) {
      toast.warning("Descreva o conteúdo da recomendação.");
      return;
    }
    const updated = [...constatacoes];
    const recs = updated[activeConstatacaoIndex].recomendacoes || [];
    if (editingRecIndex !== null) {
      recs[editingRecIndex] = { ...recs[editingRecIndex], ...recForm };
    } else {
      recs.push({ ...recForm });
    }
    updated[activeConstatacaoIndex].recomendacoes = recs;
    setConstatacoes(updated);
    setIsRecModalOpen(false);
  };'''

    correct_str = '''  const removeRecomendacao = (constatacaoIndex, recIndex) => {
    const updated = [...constatacoes];
    const recToRemove = updated[constatacaoIndex].recomendacoes[recIndex];
    const gerenciaRemovida = recToRemove?.gerencia;

    updated[constatacaoIndex].recomendacoes = updated[constatacaoIndex].recomendacoes.filter((_, i) => i !== recIndex);
    setConstatacoes(updated);

    if (gerenciaRemovida) {
      const stillUsed = updated.some(c => c.recomendacoes && c.recomendacoes.some(r => r.gerencia === gerenciaRemovida));
      if (!stillUsed) {
        setGerenciasDestinatarias(prev => prev.filter(g => (g.nome || g) !== gerenciaRemovida));
      }
    }
  };

  const saveRecomendacaoModal = () => {
    if (!recForm.content.trim()) {
      toast.warning("Descreva o conteúdo da recomendação.");
      return;
    }
    const updated = [...constatacoes];
    const recs = updated[activeConstatacaoIndex].recomendacoes || [];
    
    let gerenciaAntiga = null;
    if (editingRecIndex !== null) {
      gerenciaAntiga = recs[editingRecIndex].gerencia;
      recs[editingRecIndex] = { ...recs[editingRecIndex], ...recForm };
    } else {
      recs.push({ ...recForm });
    }
    updated[activeConstatacaoIndex].recomendacoes = recs;
    setConstatacoes(updated);
    setIsRecModalOpen(false);

    const novaGerencia = recForm.gerencia;
    
    setGerenciasDestinatarias(prev => {
      let updatedGerencias = [...prev];
      
      if (novaGerencia) {
        const exists = updatedGerencias.some(g => (g.nome || g) === novaGerencia);
        if (!exists) {
          const gerenciaObj = gerenciasFullList.find(g => (g.nome || g) === novaGerencia) || { id: Date.now() + Math.random(), nome: novaGerencia };
          updatedGerencias.push(gerenciaObj);
        }
      }
      
      if (gerenciaAntiga && gerenciaAntiga !== novaGerencia) {
        const stillUsed = updated.some(c => c.recomendacoes && c.recomendacoes.some(r => r.gerencia === gerenciaAntiga));
        if (!stillUsed) {
          updatedGerencias = updatedGerencias.filter(g => (g.nome || g) !== gerenciaAntiga);
        }
      }
      
      return updatedGerencias;
    });
  };'''

    if broken_str in content:
        content = content.replace(broken_str, correct_str)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Patched {filepath} successfully.")
    else:
        print(f"Failed to find target string in {filepath}.")

patch_file('frontend/src/pages/NotaFinal.jsx')
patch_file('frontend/src/pages/Nota.jsx')
