# Relatório de alterações — 29/10/2026 (versão 2026.10.1.0.1)

Correção (só front) no documento de **Planejamento**:

1. A **Equipe de Auditoria** aparecia como "Não informado" ao abrir um Planejamento já criado.
2. As **Horas de Trabalho** mostravam sempre **420**, e não as horas do item.

Na mesma entrega, a Ordem de Serviço deixa de mostrar 420 quando o item não tem horas previstas.

Backend, banco e regras de documentos não mudam. Aplicar depois das entregas anteriores (até 27/10).

Documentos desta pasta:

- `RELATORIO-ALTERACOES.md` — este relatório.
- `CONTROLE-VERSAO.md` — notas da versão 2026.10.1.0.1.
- `COMMIT.txt` — mensagem do commit.
- `planejamento-equipe-horas.patch` — as diferenças exatas de `Planejamento.jsx` e `OrdemServico.jsx`, no formato do git (a partir do commit `9150af8`).

---

## 1. Regra

Confirmada pela área em 29/10: **Horas de Trabalho do Planejamento = "Horas Previstas" do item de trabalho**, que já é o total da equipe (o responsável faz parte da equipe). O Planejamento não soma nem multiplica nada.

## 2. Causas

### Equipe

Ao abrir um Planejamento existente, a tela usava o item que vem dentro do Planejamento (`plan.itemTrabalho`). O backend omite a `equipe` desse item em todos os documentos (`@JsonIgnoreProperties` em `Documento.itemTrabalho`). Daí a lista vazia e "Não informado".

Só ao criar um Planejamento novo a tela buscava o item pela rota própria (`GET /api/item-trabalho/{id}`), que traz a equipe. Por isso o defeito aparecia só depois de o Planejamento existir.

### Horas

A tela lia `itemTrabalho.horasTrabalho`, um campo que não existe (o item tem `horasPrevistas`). O valor vinha vazio e entrava o padrão fixo `'420'`. Exemplos do banco local:

| Item | Horas previstas | Pessoas na equipe | Planejamento mostrava |
|---|---|---|---|
| IT-73 | 1620 | 2 | 420 |
| IT-68 | 1240 | 3 | 420 |
| IT-43 | 840 | 2 | 420 |

## 3. Correção

`frontend/src/pages/Planejamento.jsx`:

- Nova função `carregarItemCompleto(itemId)`: busca o item pela rota própria e substitui o item da tela. Chamada nos dois pontos em que um Planejamento existente é aberto (por `id` e por `itemTrabalhoId`). Se a busca falhar, a tela fica com o item que veio no Planejamento, como antes.
- "Horas de Trabalho": `itemTrabalho?.horasPrevistas ?? 'Não informado'`.

`frontend/src/pages/OrdemServico.jsx`:

- "Horas de Trabalho": `selectedItemData?.horasPrevistas ?? 'Não informado'` (antes, `|| '420'`).

O PDF do Planejamento é gerado a partir da pré-visualização da tela, então ele também passa a mostrar a equipe e as horas.

### Por que não há efeito colateral

- O item completo só é usado para exibir. O salvamento continua mandando apenas `itemTrabalho: { id }`, e o estado do formulário não muda, então o salvamento automático não é disparado.
- `Documento.java` não muda: os demais documentos continuam recebendo o item como antes.
- A rota do item é a mesma que a tela já usava para um Planejamento novo e que a tela do item usa.

## 4. O que foi testado

- Build do front (`vite build --mode nginx`).
- Dados do banco local: horas e equipe dos itens com Planejamento (tabela acima).

**Não testado no navegador** (o backend local estava parado). Conferir na homologação com os casos **PLA-09** e **PLA-10** de `docs/alteracoes-2026-10-27/TESTES-SISTEMA.html`.

## 5. Implantação

1. Aplicar o patch (ou copiar `Planejamento.jsx` e `OrdemServico.jsx` de `frontend/src/pages/`).
2. `npx.cmd vite build --mode nginx` em `frontend/`.
3. Substituir o `dist` publicado pelo nginx (ex.: `robocopy frontend\dist C:\sisaudin-homolog\frontend /MIR`). Não precisa reiniciar backend nem nginx.
4. No navegador, Ctrl+F5 e os testes PLA-09 e PLA-10.

### Como desfazer

```powershell
git apply -R docs/alteracoes-2026-10-29/planejamento-equipe-horas.patch
```

Depois, gerar o `dist` de novo e republicar.
