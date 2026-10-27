# Relatório de alterações — 09/10/2026

Correção feita no repositório de teste do Sisaudin em 09/10/2026, para ser levada ao código de produção.

**Esta entrega corrige uma regra da entrega B de 08/10/2026 (REAI) e é aplicada por cima dela.** O ponto de partida é o commit `7cd2305` do repositório de teste, que já contém as entregas de 08/10. Se produção ainda não recebeu `docs/alteracoes-2026-10-08/`, aplique aquela primeiro e esta em seguida; as duas podem ser publicadas juntas.

| O que é | Situação no repositório de teste |
|---|---|
| RAI só em item PAINT, REAI só em item EXTRA | Alterações ainda não commitadas, sobre o commit `7cd2305` |

Documentos desta pasta:

- `RELATORIO-ALTERACOES.md` — este relatório.
- `PROMPTS-PRODUCAO.md` — prompts para refazer a correção no código de produção com um assistente de código.
- `SUBSTITUICAO-DE-ARQUIVOS.md` — como aplicar copiando apenas os arquivos modificados.
- `tipo-relatorio-por-item.patch` — as diferenças exatas, no formato do git.
- `pacote-tipo-relatorio-2026-10-09.zip` — tudo acima, mais os arquivos antes/depois e o script de verificação.

---

## 1. Regra de negócio

### O que mudou

1. **RAI só pode ser gerado em item de trabalho PAINT. REAI só pode ser gerado em item de trabalho EXTRA.** Deixa de valer a regra de 08/10 de que qualquer item aceitava os dois tipos.
2. **O tipo do item vem do cadastro "Tipo de Item"** (campo `tipoItem` do item de trabalho), não da sigla do item. Nome de tipo contendo "EXTRA" é EXTRA (inclusive "EXTRA PAINT"); senão, contendo "PAINT" é PAINT. Maiúsculas e minúsculas não importam.
3. **Item sem tipo, ou com um tipo que não seja PAINT nem EXTRA, não gera relatório.** As opções ficam bloqueadas no menu com o aviso "Defina o tipo do item de trabalho (PAINT ou EXTRA)".
4. **O usuário não escolhe mais o tipo.** O menu "Criar Documento" continua mostrando as quatro opções (RAI-P, REAI-P, RAI-F, REAI-F), mas só as do tipo do item ficam habilitadas; as outras aparecem bloqueadas com o motivo.
5. **Relatório avulso** (criado sem item e vinculado depois na tela) só pode ser vinculado a um item do tipo correspondente.

### O que continua valendo da entrega de 08/10

- RAI e REAI têm a mesma estrutura, as mesmas tabelas e o campo `especial` (`true` = REAI).
- Um relatório preliminar por item.
- O tipo não muda depois de criado.
- O relatório final herda tipo, número e ano do preliminar do mesmo item.
- Final sem preliminar continua permitido e recebe o próximo número da sequência; o tipo agora vem do item, não da escolha do usuário.
- Numeração: duas sequências por ano (RAI e REAI), preliminar e final compartilham o número, criações simultâneas feitas uma por vez.

### Relatórios que já existem

> **Atualizado em 26/10/2026:** a área decidiu que os relatórios antigos de itens EXTRA passam a REAI, com a sequência REAI renumerada por ano na ordem de criação. Ver `docs/alteracoes-2026-10-26/`. O que segue descreve o comportamento desta entrega (o código), que não mudou.

- **Nenhum relatório existente é reclassificado ou renumerado por esta entrega.**
- Relatórios que estejam fora da regra (por exemplo, um RAI em item EXTRA) continuam abrindo e sendo salvos normalmente.
- **O par preliminar/final segue o relatório que já existe no item**, mesmo que ele esteja fora da regra. Um item EXTRA com um RAI-P antigo gera RAI-F com o mesmo número, em vez de ficar sem poder emitir o final.

---

## 2. O que mudou no código

### Backend (4 arquivos)

| Arquivo | Mudança |
|---|---|
| `service/cadastroBasico/DocumentoNumeroService.java` | Três métodos novos: `tipoRelatorioDoItem` (EXTRA → REAI, PAINT → RAI, sem tipo → nenhum), `exigirTipoRelatorioDoItem` (recusa item sem tipo) e `validarVinculoRelatorio` (recusa vínculo incompatível). `resolveEspecial` passa a usar o tipo do item quando ele ainda não tem relatório. |
| `service/cadastroBasico/FluxoDocumentoService.java` | No menu, cada opção de relatório só é habilitada se o tipo corresponder ao do item; a outra recebe o motivo do bloqueio. |
| `service/cadastroBasico/RelatorioPreliminarService.java` | Na criação pelo item, o tipo vem do item. Em `updateById`, vincular o relatório a um item de tipo incompatível é recusado. |
| `service/cadastroBasico/RelatorioFinalService.java` | Na criação sem preliminar, o tipo vem do item. Mesma validação de vínculo em `updateById`. |

### Frontend (2 arquivos)

| Arquivo | Mudança |
|---|---|
| `pages/RelatorioPreliminar.jsx` e `pages/RelatorioFinal.jsx` | O seletor "Item de Trabalho Base" lista apenas os itens compatíveis com o tipo do relatório, mais o item já vinculado. |

### O que não mudou

Entidades, controllers, rotas, `RelatorioEspecialMigration`, `CriarDocumentoDropdown.jsx`, as funções de API do front e `ItemTrabalhoList.jsx`.

### Contrato da API

Nenhuma rota nova e nenhum parâmetro novo. Mudou o comportamento de rotas existentes:

| Rota | Antes (08/10) | Agora |
|---|---|---|
| `GET /api/fluxo-documentos/item/{itemId}` | RAI e REAI habilitados em qualquer item | Só o tipo do item vem habilitado; o outro vem com `habilitado=false` e `motivoInabilitado` |
| `GET /api/relatorios-preliminar/item/{itemId}` | `?especial=true` criava REAI-P | O parâmetro é aceito, mas não decide: o tipo vem do item. Item sem tipo e sem relatório: erro 500 |
| `GET /api/relatorios-final/item/{itemId}` e `POST /api/relatorios-final/create-from-preliminar/{itemId}` | Sem preliminar, `?especial=true` criava REAI-F | Sem preliminar, o tipo vem do item |
| `PATCH /api/relatorios-preliminar/{id}?itemTrabalhoId=` e `PATCH /api/relatorios-final/{id}?itemTrabalhoId=` | Aceitava qualquer item | Erro 500 se o item for diferente do atual e de tipo incompatível |
| `GET /api/documentos/next-number` e `/check-number` | Sem `especial` e sem relatório no item: sequência do RAI | Sem `especial` e sem relatório no item: sequência do tipo do item |
| `POST /api/relatorios-preliminar` e `POST /api/relatorios-final` (avulsos) | `?especial=true` cria REAI | Sem mudança |

O parâmetro `especial` é ignorado em vez de recusado de propósito: a tela de relatório, ao receber erro na criação pelo item, cria em silêncio um relatório sem item (comportamento antigo, descrito na seção 4 do relatório de 08/10).

### Banco de dados

Nenhuma mudança de estrutura. Nenhum dado é alterado na inicialização.

---

## 3. Fluxo de execução

1. **Menu.** `ItemTrabalhoList` → `CriarDocumentoDropdown` → `GET /api/fluxo-documentos/item/{id}` → `FluxoDocumentoService.getStatusFluxo`.
   - O tipo do item sai de `DocumentoNumeroService.tipoRelatorioDoItem(item)`.
   - Preliminar: o tipo permitido é o do item. Se o item já tem relatório final, é o tipo desse final.
   - Final: o tipo permitido é o do preliminar do item. Sem preliminar, é o do item.
   - Motivos de bloqueio: "RAI só pode ser gerado em item de trabalho PAINT", "REAI só pode ser gerado em item de trabalho EXTRA", "Defina o tipo do item de trabalho (PAINT ou EXTRA)", além dos que já existiam.
2. **Criação do preliminar.** A tela chama `GET /api/relatorios-preliminar/item/{id}` → `RelatorioPreliminarService.getOrCreateByItemTrabalhoId` → `criarParaItemTrabalho`. Se o item já tem relatório final, segue o tipo dele; senão, `exigirTipoRelatorioDoItem(item)`. O número sai de `getNextAvailableNumber` com esse tipo.
3. **Criação do final.** `POST /api/relatorios-final/create-from-preliminar/{id}` → `RelatorioFinalService.criarParaItemTrabalho`. Com preliminar, herda tipo, número e ano. Sem preliminar, `exigirTipoRelatorioDoItem(item)` e o próximo número do tipo.
4. **Relatório avulso.** Criado por `POST /api/relatorios-*` sem item. Na tela, o seletor de item só oferece itens compatíveis. Ao salvar, `PATCH /api/relatorios-*/{id}?itemTrabalhoId=` → `updateById` → `validarVinculoRelatorio`, que só é chamada quando o item do relatório muda.
5. **Numeração.** `DocumentoNumeroService.resolveEspecial` decide a sequência: pelo parâmetro, pelo próprio relatório, por um relatório do item e, por fim, pelo tipo do item.

---

## 4. O que foi testado e o que não foi

**Testado** em uma cópia do backend alterado, na porta 8091, contra o banco MySQL local. Os relatórios criados nos testes foram excluídos ao final.

| Cenário | Resultado |
|---|---|
| Menu de item PAINT sem relatório | RAI-P e RAI-F habilitados; REAI-P e REAI-F bloqueados com motivo |
| Menu de item EXTRA sem relatório | REAI-P e REAI-F habilitados; RAI-P e RAI-F bloqueados com motivo |
| Menu de item EXTRA com RAI-P antigo | RAI-F liberado, REAI-F bloqueado |
| Menu de item sem tipo com REAI-P antigo | REAI-F liberado, RAI-F bloqueado |
| Preliminar em item PAINT pedindo `especial=true` | Criou RAI, número da sequência RAI |
| Preliminar em item EXTRA sem parâmetro, depois o final | REAI nos dois, mesmo número |
| Final sem preliminar em item PAINT pedindo `especial=true` | Criou RAI-F |
| Final sem preliminar em item EXTRA pedindo `especial=false` | Criou REAI-F |
| `next-number` para item PAINT e para item EXTRA, sem `especial` | Sequência RAI e sequência REAI, respectivamente |
| Vincular RAI avulso a item EXTRA; REAI-F avulso a item PAINT | Recusado |
| Vincular os mesmos avulsos ao item do tipo certo | Aceito |
| Salvar relatório antigo (RAI em item EXTRA) sem trocar o item | Aceito |

Backend e frontend compilam.

**Não testado:**

- As telas no navegador (menu com as opções bloqueadas e o seletor de item filtrado).
- Criação de relatório em item sem tipo e sem relatório: o único item sem tipo do banco local já tem relatório. O bloqueio no menu e a recusa no backend para esse caso foram conferidos só pela leitura do código.

**Pontos em aberto, não tratados nesta entrega:**

- **Trocar o tipo de um item que já tem relatório não é bloqueado.** Editar um item PAINT com RAI para EXTRA deixa um RAI em item EXTRA. Bloquear exige alterar `ItemTrabalhoService`.
- **`RelatorioEspecialMigration` (entrega de 08/10) classifica os relatórios antigos pela sigla do item**, não pelo tipo. Isso preserva o que o sistema mostrava antes do REAI, mas relatórios antigos de itens EXTRA cuja sigla não contenha "EXTRA" ficam como RAI. A consulta 3 da seção 5 mostra quantos são. Reclassificá-los muda o rótulo e pode gerar números repetidos na sequência REAI; é decisão a tomar caso a caso.
- **A recusa de vínculo aparece na tela como "Erro ao salvar Relatório de Auditoria."**, sem o motivo. O seletor filtrado evita chegar a esse erro pelo uso normal.
- **Abrir a URL de criação de relatório, digitada à mão, para um item sem tipo** cai no comportamento antigo de criar um relatório sem item. Pelo menu isso não acontece, porque as opções ficam bloqueadas.
- Continuam valendo as pendências listadas na seção 5 do relatório de 08/10.

---

## 5. Roteiro de implantação em produção

### Antes

1. Fazer backup do banco.
2. Rodar as consultas abaixo e guardar o resultado.

```sql
-- 1. Nomes dos tipos de item. Cada nome precisa conter "PAINT" ou "EXTRA";
--    um nome fora disso bloqueia a criação de relatório nos itens daquele tipo.
SELECT t.id, t.nome, t.status, COUNT(i.id) AS itens
FROM tipo_item t LEFT JOIN item_trabalho i ON i.tipo_item_id = t.id
GROUP BY t.id, t.nome, t.status;

-- 2. Itens que não poderão gerar relatório (sem tipo, ou tipo que não é PAINT nem EXTRA)
SELECT i.id, i.sigla, i.nome, t.nome AS tipo
FROM item_trabalho i LEFT JOIN tipo_item t ON t.id = i.tipo_item_id
WHERE t.nome IS NULL
   OR (UPPER(t.nome) NOT LIKE '%EXTRA%' AND UPPER(t.nome) NOT LIKE '%PAINT%');

-- 3. Relatórios de itens EXTRA que a classificação de 08/10 marca (ou já marcou) como RAI,
--    porque a sigla do item não contém "EXTRA"
SELECT 'preliminar' AS tabela, r.id, r.item_trabalho_id, i.sigla, r.ano, r.numero
FROM relatorio_preliminar r
JOIN item_trabalho i ON i.id = r.item_trabalho_id
JOIN tipo_item t ON t.id = i.tipo_item_id
WHERE UPPER(t.nome) LIKE '%EXTRA%' AND UPPER(i.sigla) NOT LIKE '%EXTRA%'
UNION ALL
SELECT 'final', r.id, r.item_trabalho_id, i.sigla, r.ano, r.numero
FROM relatorio_final r
JOIN item_trabalho i ON i.id = r.item_trabalho_id
JOIN tipo_item t ON t.id = i.tipo_item_id
WHERE UPPER(t.nome) LIKE '%EXTRA%' AND UPPER(i.sigla) NOT LIKE '%EXTRA%';
```

Se a consulta 2 trouxer itens que precisam emitir relatório, definir o tipo deles no cadastro do item antes ou logo depois da implantação. Os relatórios da consulta 3 não impedem a implantação: continuam funcionando como RAI.

### Implantação

1. Se a entrega de 08/10 ainda não foi aplicada, aplicá-la primeiro (ver `docs/alteracoes-2026-10-08/`).
2. Aplicar esta correção (por substituição de arquivos, patch ou prompts).
3. Compilar o backend e gerar o build do front (`npm run build`).
4. Publicar backend e front juntos e reiniciar o backend. Esta correção não acrescenta nenhuma mensagem ao log de inicialização.

### Depois

```sql
-- Relatórios fora da regra (tipo do relatório diferente do tipo do item).
-- Exige a coluna "especial", criada pela entrega de 08/10.
SELECT 'preliminar' AS tabela, r.id, r.item_trabalho_id, t.nome AS tipo_item,
       IF(COALESCE(r.especial, 0) = 1, 'REAI', 'RAI') AS tipo_relatorio, r.ano, r.numero
FROM relatorio_preliminar r
JOIN item_trabalho i ON i.id = r.item_trabalho_id
LEFT JOIN tipo_item t ON t.id = i.tipo_item_id
WHERE COALESCE(r.especial, 0) <> (UPPER(COALESCE(t.nome, '')) LIKE '%EXTRA%')
UNION ALL
SELECT 'final', r.id, r.item_trabalho_id, t.nome,
       IF(COALESCE(r.especial, 0) = 1, 'REAI', 'RAI'), r.ano, r.numero
FROM relatorio_final r
JOIN item_trabalho i ON i.id = r.item_trabalho_id
LEFT JOIN tipo_item t ON t.id = i.tipo_item_id
WHERE COALESCE(r.especial, 0) <> (UPPER(COALESCE(t.nome, '')) LIKE '%EXTRA%');
```

O resultado deve conter apenas relatórios que já existiam antes da implantação. Guardar a lista: nenhum relatório novo pode aparecer nela depois.

Em seguida, conferir no sistema:

1. Em um item PAINT sem relatório, o menu "Criar Documento" mostra RAI-P liberado e REAI-P bloqueado com o motivo.
2. Em um item EXTRA sem relatório, o inverso.
3. Criar um relatório de teste em cada um, conferir sigla e número, e excluí-los.

### Como desfazer

Voltar os seis arquivos para a versão anterior (a de 08/10). Não há nada a desfazer no banco.
