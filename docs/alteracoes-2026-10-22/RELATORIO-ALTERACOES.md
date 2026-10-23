# Relatório de alterações — 22/10/2026

Correção de dois defeitos encontrados na homologação: **documentos não salvavam as alterações** (salvamento automático) e **o RAI-P/REAI-P não era excluído** pela lista de itens de trabalho ("Não foi possível identificar o tipo do documento para exclusão").

Só o frontend muda. Backend e banco não mudam. Aplicar depois das entregas de 08/10, 09/10 e 15/10.

Documentos desta pasta:

- `RELATORIO-ALTERACOES.md` — este relatório.
- `salvar-excluir-documentos.patch` — as diferenças exatas, no formato do git.

---

## 1. Salvamento automático não gravava

### Causa

Em seis telas, a função de salvamento automático (`debouncedSave`) validava o número com variáveis que não existem nela:

```js
// antes
if (!(await validateNumero(payload.numero, payload.ano, id, itemId))) return;
```

Os parâmetros da função se chamam `dataToSave` e `itemTrabId`. A linha gerava um `ReferenceError` a cada tentativa, **antes** de enviar os dados ao backend; o erro ficava só no console do navegador e nada era gravado. Por isso o log do backend não mostrava erro algum.

No salvamento manual (botão Salvar) das mesmas telas, quando o número aparecia como repetido, a tela chamava `setLoading(false)`, que também não existe nelas, e quebrava depois de mostrar o aviso.

### Correção

```js
// depois
if (!(await validateNumero(dataToSave.numero, dataToSave.ano, id, itemTrabId))) return;
// e, no salvamento manual: { setLoading(false); return; }  ->  { return; }
```

Telas: `RelatorioPreliminar.jsx`, `RelatorioFinal.jsx`, `NotaPreliminar.jsx`, `NotaFinal.jsx`, `NotaTecnica.jsx`, `Parecer.jsx`.

`OrdemServico.jsx`, `Comunicacao.jsx` e `Solicitacao.jsx` usam o mesmo trecho, mas lá `payload`, `itemId` e `setLoading` existem; não tinham o defeito e não mudaram.

---

## 2. Exclusão de documento pela lista de itens

### Causa

`ItemTrabalhoList.jsx` escolhia a rota de exclusão procurando trechos de texto na rota de edição do documento (`rotaEditar`, montada pelo backend em `FluxoDocumentoService`). Vários trechos não batiam:

| Documento | Rota de edição (backend) | A tela procurava / chamava | Rota real de exclusão |
|---|---|---|---|
| RAI-P / REAI-P | `/RelatorioPreliminar/{id}` | `/relatorio-preliminar/` → não reconhecia | `/api/relatorios-preliminar/{id}` |
| Comunicação (CA) | `/comunicacao/{id}` | chamava `/comunicacoes-auditoria/` (não existe) | `/api/comunicacoes/{id}` |
| Solicitação (SAI) | `/solicitacao/{id}` | chamava `/solicitacoes-auditoria/` (não existe) | `/api/solicitacoes/{id}` |
| Nota de Auditoria Final | `/nota-final/{id}` | chamava `/notas-finais/` (não existe) | `/api/notas-final/{id}` |
| Reunião, Visita | `/reuniao/{id}`, `/visita/{id}` | não reconhecia | `/api/reunioes/{id}`, `/api/visitas/{id}` |

RAI-F, OS, Planejamento, Matriz de Achados, Nota Técnica, Nota Preliminar, Parecer e Reunião de Busca Conjunta já funcionavam.

### Correção

A rota passa a ser escolhida pelo campo `tipo` do documento, que o backend envia com valores fixos (`RELATORIO_PRELIMINAR`, `NOTA_AUDITORIA_FINAL` etc.), apontando para as rotas reais dos controllers.

---

## 3. O que foi testado

Numa cópia descartável do banco `sisaudin_homolog_v4`, com uma segunda instância do backend da homologação (porta 8094). A cópia foi apagada ao final; a homologação não foi tocada.

| Teste | Resultado |
|---|---|
| Salvar RAI-P (PATCH `/relatorios-preliminar/{id}?itemTrabalhoId=`) e reler | Gravou |
| Salvar RAI-F (PATCH `/relatorios-final/{id}?itemTrabalhoId=`) e reler | Gravou |
| Excluir RAI-P (DELETE `/relatorios-preliminar/{id}`) | 204; relatório, constatações, recomendações e gerências destinatárias removidos |
| RAI-F do mesmo item após excluir o RAI-P | Intacto (8 constatações, 9 recomendações) |
| Validação de número (`check-number`) dos 28 relatórios existentes | Nenhum bloqueado indevidamente |
| Build do front (`vite build --mode nginx`) | Compila |

**Não testado:** as telas no navegador (salvamento automático, botão Salvar e exclusão pela lista de itens). Conferir na homologação depois de publicar o front.

---

## 4. Ponto de atenção encontrado no teste (não corrigido)

Um PATCH de relatório **sem** as listas (`constatacoes`, `preliminares`, `anexosFinais`) apaga as filhas existentes: o backend recebe listas vazias (valores padrão da entidade) e as trata como "remover tudo". As telas sempre enviam as listas completas, então isso não ocorre no uso normal; mas qualquer outra chamada parcial (script, integração, tela nova) apagaria constatações e recomendações. Corrigir exige distinguir "lista ausente" de "lista vazia" no backend (`RelatorioPreliminarService`, `RelatorioFinalService` e serviços das notas).

---

## 5. Implantação

1. Aplicar o patch (ou copiar os sete arquivos) no código.
2. Gerar o front: `npx.cmd vite build --mode nginx` em `frontend/`.
3. Publicar: `robocopy frontend\dist C:\sisaudin-homolog\frontend /MIR` (homologação) — não precisa reiniciar backend nem nginx.
4. No navegador, recarregar a página com Ctrl+F5 e conferir:
   - editar um RAI-P e um RAI-F, esperar o indicador "Salvo", recarregar e ver o texto mantido;
   - excluir um RAI-P de teste pela lista de itens de trabalho.

### Como desfazer

```powershell
git apply -R docs/alteracoes-2026-10-22/salvar-excluir-documentos.patch
```
