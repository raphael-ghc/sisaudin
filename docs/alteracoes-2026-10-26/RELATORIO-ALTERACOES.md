# Relatório de alterações — 26/10/2026

**Nova regra para os relatórios antigos (RAI/REAI).** Só dados: dois scripts SQL, nenhuma mudança de código. Substitui o que a entrega de 09/10 dizia sobre relatórios existentes ("nenhum relatório existente é reclassificado ou renumerado").

Documentos desta pasta:

- `RELATORIO-ALTERACOES.md` — este relatório.
- `reai-1-previa.sql` — prévia: mostra o que vai mudar, sem alterar nada.
- `reai-2-aplicar.sql` — aplicação, em transação, com conferências; vem com `ROLLBACK` no fim.

---

## 1. Regra (decisão da área)

1. **Todo relatório (preliminar e final) de item do tipo EXTRA é REAI**, inclusive os que foram criados como RAI. Tipo do item pelo cadastro (`tipo_item`), não pela sigla — mesma regra de `DocumentoNumeroService.tipoRelatorioDoItem`.
2. **A sequência REAI de cada ano é renumerada na ordem de criação** dos relatórios:
   - ordem pela data de criação; relatórios sem data (vindos do sistema antigo) contam como mais antigos; desempate pelo id;
   - preliminar e final do mesmo item recebem o mesmo número, e o ano do preliminar.
3. **Relatórios de item PAINT não mudam** (tipo e número). A sequência RAI não é renumerada: os números que saem dela (ex.: RAI 11/2026) ficam livres, e o próximo RAI continua sendo o maior do ano + 1.
4. Não muda nada no comportamento do sistema: novos relatórios já seguem a regra desde 09/10.

## 2. Por que

A rotina de 08/10 (`RelatorioEspecialMigration`) classifica os relatórios antigos pela **sigla** do item ("EXTRA" na sigla = REAI). Na produção, as siglas são `IT-xx`, então **nenhum** relatório virou REAI — inclusive três que, no sistema antigo, eram "REAI 01/2025", "REAI 02/2025" e "REAI 01/2026". Além de errar o tipo, isso deixava números RAI repetidos (1/2025 e 2/2025 apareciam duas vezes).

## 3. Efeito, com os dados da produção (backup de 21/10)

| Item EXTRA | Antes | Status | Depois |
|---|---|---|---|
| IT-51 | RAI-P 1/2025 | NAO_ENVIAR | REAI-P 1/2025 (= "REAI 01/2025" do sistema antigo) |
| IT-52 | RAI-P 2/2025 | NAO_ENVIAR | REAI-P 2/2025 (= "REAI 02/2025") |
| IT-79 | RAI-P e RAI-F 1/2026 | CONCLUIDO | REAI-P e REAI-F 1/2026 (= "REAI 01/2026") |
| IT-91 | RAI-P 11/2026 | Minuta | REAI-P **2**/2026 |
| IT-89 | RAI-P 12/2026 | Minuta | REAI-P **3**/2026 |

- Nenhum relatório já emitido muda de número; só os dois rascunhos de 2026.
- Nenhuma citação de "RAI 11/2026" ou "RAI 12/2026" no texto de documentos (busca em todas as colunas de texto do backup).
- Próximos números depois da aplicação: REAI 3/2025, REAI 4/2026, RAI 11/2026.
- A prévia rodada no `sisaudin_homolog_v4` (somente leitura) dá o mesmo resultado.

A produção pode ter relatórios novos depois de 21/10: o script calcula tudo com os dados do momento em que roda. **Sempre rodar a prévia antes.**

## 4. Como os scripts funcionam

- Juntam preliminares e finais; agrupam por item (preliminar + final juntos; relatório sem item é grupo próprio).
- Entram na sequência REAI: relatórios de item EXTRA **e** REAIs que já existam em outros itens (para não repetir número). A consulta 3 da prévia lista estes últimos — na produção, nenhum.
- Numeram por ano com `ROW_NUMBER()` na ordem da regra e atualizam `especial`, `numero` e `ano`.
- `reai-2-aplicar.sql` roda numa transação e, antes de terminar, mostra as conferências:
  - **A.** relatório de item EXTRA que ainda não é REAI (vazio);
  - **B.** número REAI repetido no mesmo ano (vazio);
  - **C.** preliminar e final do mesmo item com tipo, número ou ano diferentes (vazio);
  - **D.** os números REAI por ano.
- Termina com `ROLLBACK`. Conferido, troca-se por `COMMIT` e roda-se de novo. Rodar mais de uma vez dá o mesmo resultado.

## 5. O que foi testado

Cópia do backup de produção de 21/10, depois da primeira subida do JAR atual (coluna `especial` criada; 19 preliminares e 9 finais classificados como RAI):

| Teste | Resultado |
|---|---|
| Prévia | 6 relatórios a mudar, como na tabela da seção 3; consultas 2 e 3 vazias |
| Aplicação com `ROLLBACK` | banco inalterado |
| Aplicação com `COMMIT` | alterou exatamente os 6 relatórios; conferências A, B e C vazias |
| Aplicação repetida | resultado idêntico |
| Próximo número pelo sistema (`/api/documentos/next-number`) | REAI 2026 = 4, REAI 2025 = 3, RAI 2026 = 11 |

Cópia apagada ao final. Nada foi executado nos bancos reais (produção, homologação ou desenvolvimento), exceto a prévia (somente leitura) no `sisaudin_homolog_v4`.

## 6. Implantação

Depois da implantação do backend (entregas até 23/10):

1. Backup do banco.
2. Subir a versão nova uma vez (cria a coluna `especial`; ver checklist da homologação, seção 7).
3. No Workbench, abrir `reai-1-previa.sql`, trocar `TROCAR_NOME_DO_BANCO` pelo nome do banco (produção: `sisaudin_novo_v10`) e executar. Conferir a lista com a área; a consulta 2 mostra relatórios **já emitidos** que mudariam de número (na data do backup, nenhum).
4. Abrir `reai-2-aplicar.sql`, trocar o nome do banco, executar. Conferir A, B e C (vazias) e D.
5. Trocar `ROLLBACK;` por `COMMIT;` na última linha e executar de novo.
6. No sistema: abrir um REAI reclassificado (ex.: IT-79) e conferir cabeçalho, capa e número; abrir o menu "Criar Documento" de um item EXTRA sem relatório e conferir que o próximo REAI do ano vem com o número esperado.
7. Avisar quem tiver cópias dos rascunhos IT-91 e IT-89 que eles passaram a REAI 2/2026 e 3/2026.

Não é preciso reiniciar o backend depois do script.

### Como desfazer

Restaurar o backup do passo 1 (o script altera só `especial`, `numero` e `ano` de relatórios de itens EXTRA; a prévia de antes da aplicação registra os valores antigos — guarde a saída dela).
