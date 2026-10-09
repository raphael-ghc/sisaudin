# Relatório de alterações — 08/10/2026

Alterações feitas no repositório de teste do Sisaudin em 08/10/2026, para serem levadas ao código de produção.

> **Atenção (09/10/2026):** a regra "qualquer item aceita RAI ou REAI" (itens 1, 2 e 6 da seção 1) foi corrigida. RAI só pode ser gerado em item PAINT e REAI só em item EXTRA. A correção está em `docs/alteracoes-2026-10-09/` e deve ser aplicada logo depois desta entrega.

Há duas entregas independentes:

| Entrega | O que é | Situação no repositório de teste |
|---|---|---|
| **A. Endereço da API configurável** | O front deixa de ter a URL de produção fixa no código | Commit `78000e4` |
| **B. REAI como tipo de relatório** | Relatório Especial de Auditoria (REAI-P e REAI-F) criável em qualquer item, com numeração própria | Alterações ainda não commitadas |

A entrega B depende de um arquivo da entrega A (`frontend/src/api/config.js`).

Documentos desta pasta:

- `RELATORIO-ALTERACOES.md` — este relatório.
- `PROMPTS-PRODUCAO.md` — prompts para refazer as alterações no código de produção com um assistente de código.
- `SUBSTITUICAO-DE-ARQUIVOS.md` — como aplicar copiando apenas os arquivos modificados.
- `reai.patch` e `rota-api-configuravel.patch` — as diferenças exatas, no formato do git.
- `pacote-reai-2026-10-08.zip` — tudo acima, mais os arquivos antes/depois e o script de verificação.

---

## 1. Novas regras de negócio (RAI e REAI)

1. **REAI é um tipo de relatório, não uma consequência do item.** Cada relatório preliminar ou final guarda se é comum (RAI) ou especial (REAI). A sigla do item de trabalho não define mais nada.
2. **Qualquer item aceita RAI ou REAI.** Vale para itens PAINT e EXTRA. O tipo é escolhido no menu "Criar Documento".
3. **Um relatório preliminar por item.** O item tem RAI **ou** REAI, nunca os dois.
4. **O tipo não muda depois de criado.** Para trocar, exclui-se o relatório e cria-se outro.
5. **O final segue o preliminar.** Se o item tem REAI-P, só é possível criar REAI-F (e o mesmo para RAI). O final herda tipo, número e ano do preliminar.
6. **Final sem preliminar.** Continua permitido (com justificativa no fluxo). Nesse caso o usuário escolhe o tipo e o relatório recebe o próximo número da sequência; antes ficava sem número.
7. **Estrutura idêntica.** RAI e REAI usam as mesmas tabelas, telas e regras de fluxo. Mudam só a sigla, o título e a sequência de numeração.

### Numeração

- **Duas sequências independentes por ano:** `RAI nn/aaaa` e `REAI nn/aaaa`. Cada uma recomeça em 01 a cada ano.
- **Preliminar e final do mesmo item compartilham o número.**
- **Próximo número** = maior número já usado naquele tipo e ano (somando preliminares e finais) + 1.
- **O número é editável.** O sistema recusa um número já usado por outro item no mesmo tipo e ano e sugere o próximo livre. Um REAI pode usar um número que só exista em RAI, e vice-versa.
- **Lacunas não são preenchidas.** Excluir um relatório do meio deixa o número vago; excluir o último libera o número.
- **Criações simultâneas** são feitas uma por vez dentro do backend, para dois usuários não receberem o mesmo número. Essa proteção só vale com uma única instância do backend rodando.

### Relatórios que já existiam

Na primeira inicialização após a implantação, os relatórios antigos são classificados pela regra anterior: item com "EXTRA" na sigla vira REAI, os demais viram RAI. Os números não mudam. Depois disso a rotina não altera mais nada.

---

## 2. Entrega B — o que mudou no código

### Backend

| Arquivo | Mudança |
|---|---|
| `model/cadastroBasico/RelatorioPreliminar.java` e `RelatorioFinal.java` | Novo campo `especial` (`Boolean`, padrão `false`) |
| `service/cadastroBasico/DocumentoNumeroService.java` | Sequência escolhida pelo campo `especial` em vez de `sigla LIKE '%EXTRA%'`; novo `resolveEspecial`; novo `executarComNumeroReservado` (criação sem concorrência) |
| `controller/cadastroBasico/DocumentoNumeroController.java` | `next-number` e `check-number` aceitam `especial` |
| `service/cadastroBasico/RelatorioPreliminarService.java` | Criação recebe o tipo; se o item já tem relatório final, segue o tipo dele |
| `service/cadastroBasico/RelatorioFinalService.java` | Final herda tipo e número do preliminar; sem preliminar, recebe o próximo número |
| `controller/cadastroBasico/RelatorioPreliminarController.java` e `RelatorioFinalController.java` | Parâmetro opcional `especial` nas rotas de criação |
| `service/cadastroBasico/FluxoDocumentoService.java` | Quatro opções no menu (RAI-P, REAI-P, RAI-F, REAI-F) e nomes distintos na lista de documentos criados |
| `config/RelatorioEspecialMigration.java` (novo) | Classifica os relatórios antigos na inicialização |
| `repository/cadastroBasico/PlanejamentoRepository.java` | Correção de erro antigo (ver seção 4) |

### Frontend

| Arquivo | Mudança |
|---|---|
| `components/CriarDocumentoDropdown.jsx` | Rotas das duas novas opções (`RELATORIO_ESPECIAL_PRELIMINAR`, `RELATORIO_ESPECIAL_FINAL`) |
| `api/relatorioPreliminarApi.js` e `relatorioFinalApi.js` | Funções de criação aceitam `especial` |
| `pages/RelatorioPreliminar.jsx` e `RelatorioFinal.jsx` | Leem `?especial=true` na criação; cabeçalho, capa, rodapé do PDF, nome do arquivo e aba do navegador mostram RAI ou REAI conforme o relatório |
| `pages/ItemTrabalhoList.jsx` | Sigla do documento (RAI-P/REAI-P…) vem do nome do documento, não da sigla do item |
| `pages/NotaPreliminar.jsx` | Aba do navegador de uma Nota de Auditoria deixava "REAI" em item EXTRA; agora "NA" |

### Contrato da API

Todos os parâmetros novos são opcionais; chamadas antigas continuam funcionando e resultam em RAI.

| Rota | Novo |
|---|---|
| `GET /api/relatorios-preliminar/item/{itemId}` | `?especial=true` cria REAI-P se o item ainda não tem relatório |
| `POST /api/relatorios-preliminar` | `?especial=true` |
| `GET /api/relatorios-final/item/{itemId}` | `?especial=true`, usado só quando não há preliminar |
| `POST /api/relatorios-final` e `POST /api/relatorios-final/create-from-preliminar/{itemId}` | `?especial=true` |
| `GET /api/documentos/next-number` e `/check-number` | `&especial=true|false`; sem ele, o tipo é lido do próprio relatório ou do item |
| `GET /api/fluxo-documentos/item/{itemId}` | Devolve também `RELATORIO_ESPECIAL_PRELIMINAR` e `RELATORIO_ESPECIAL_FINAL` |
| Relatórios (JSON) | Novo atributo `especial` |

### Banco de dados

- Nova coluna `especial` (`bit(1)`, aceita nulo, sem valor padrão) em `relatorio_preliminar` e `relatorio_final`.
- Com `spring.jpa.hibernate.ddl-auto=update` (configuração atual), o Hibernate cria a coluna sozinho na inicialização.
- Se produção não usar `update`, criar antes de subir o backend:

```sql
ALTER TABLE relatorio_preliminar ADD COLUMN especial BIT(1) NULL;
ALTER TABLE relatorio_final      ADD COLUMN especial BIT(1) NULL;
```

- **Não foi criada restrição de unicidade** (tipo + ano + número). O banco de teste já tem números duplicados, o que impediria a criação. Ver seção 5.

---

## 3. Entrega A — endereço da API configurável (commit `78000e4`)

- Novo `frontend/src/api/config.js`: lê `VITE_API_BASE` e `VITE_API_URL`; sem elas, usa os endereços de produção de sempre.
- Novo `frontend/.env.development`: aponta para `http://localhost:8080`, só no `npm run dev`.
- `axiosInstance.js` e `refreshAxiosInstance.js` passam a usar o `config.js`.
- Anexos em `NotaFinal`, `NotaPreliminar`, `NotaTecnica`, `Parecer`, `RelatorioFinal`, `RelatorioPreliminar` e `FileAttachmentManager` deixam de chamar a URL de produção fixa.

**Efeito em produção: nenhum.** No build de produção as variáveis não mudam e os endereços finais são os mesmos de antes.

O mesmo commit tem duas mudanças de backend feitas à parte, que **não estão neste pacote** e devem ser avaliadas separadamente: em `PessoaSeeder.java` foi removida a criação automática do usuário Admin quando a tabela já tem pessoas, e em `AuthService.java` foi removido um `printStackTrace`.

---

## 4. Erro antigo corrigido

Criar relatório preliminar a partir do item de trabalho **sempre falhava com erro 500**, também no backend sem as alterações. A consulta `PlanejamentoRepository.findByItemTrabalhoId` era resolvida pelo Spring Data sobre o campo transiente `Documento.itemTrabalhoId`, que não existe no banco. A tela, ao receber o erro, criava em silêncio um relatório sem item de trabalho.

Correção: consulta explícita com `@Query` no repositório. Sem ela, RAI-P e REAI-P continuam não sendo criados pelo item.

Vale conferir em produção se há relatórios órfãos gerados por esse erro (consulta 4 da seção 6).

---

## 5. O que foi testado e o que não foi

**Testado** em uma cópia do backend alterado, contra o banco MySQL local:

| Cenário | Resultado |
|---|---|
| Próximo número em 2026 | RAI 12, REAI 1 (independentes) |
| Criar dois REAI seguidos | Receberam 1 e 2; o próximo RAI continuou 12 |
| REAI usar número já usado por outro REAI | Recusado, com sugestão do próximo livre |
| REAI usar número usado só por um RAI | Aceito |
| REAI-P criado pelo item e depois o final | Final herdou tipo e número |
| REAI-F em item sem preliminar | Recebeu número |
| Item com REAI-P | RAI-F bloqueado, REAI-F liberado |
| Item com RAI-P | REAI-F bloqueado, RAI-F liberado |
| Classificação dos relatórios antigos | 19 preliminares e 7 finais marcados como RAI |

Backend e frontend compilam.

**Não testado:**

- As telas no navegador (criação pelo menu, capa e PDF do REAI).
- A classificação de relatórios antigos como REAI: o banco local não tem item com "EXTRA" na sigla.
- Criação simultânea por dois usuários.

**Pendências conhecidas, não corrigidas:**

- O mesmo erro de consulta da seção 4 existe em `MatrizAchadosRepository`, `VisitaRepository`, `ReuniaoRepository`, `PlanoAcaoPreliminarRepository`, `PlanoAcaoFinalRepository` e `DocumentoRepository`.
- Nas telas de relatório, o salvamento automático valida o número com variáveis inexistentes (`payload`, `itemId`) e tende a falhar antes de salvar (`RelatorioPreliminar.jsx`, `RelatorioFinal.jsx`, função `debouncedSave`).
- Na capa do REAI a fonte do título foi reduzida de 56pt para 48pt para caber "Relatório Especial de"; falta conferir no PDF.
- Restrição de unicidade no banco, depois de resolvidos os números duplicados.

---

## 6. Roteiro de implantação em produção

### Antes

1. Fazer backup do banco.
2. Rodar as consultas abaixo e guardar o resultado.

```sql
-- 1. Como os relatórios existentes serão classificados
SELECT 'preliminar' AS tabela,
       IF(UPPER(COALESCE(i.sigla,'')) LIKE '%EXTRA%', 'REAI', 'RAI') AS tipo, COUNT(*) AS qtd
FROM relatorio_preliminar r LEFT JOIN item_trabalho i ON i.id = r.item_trabalho_id GROUP BY 2
UNION ALL
SELECT 'final', IF(UPPER(COALESCE(i.sigla,'')) LIKE '%EXTRA%', 'REAI', 'RAI'), COUNT(*)
FROM relatorio_final r LEFT JOIN item_trabalho i ON i.id = r.item_trabalho_id GROUP BY 2;

-- 2. Números repetidos no mesmo tipo e ano (deveria vir vazio)
SELECT IF(UPPER(COALESCE(i.sigla,'')) LIKE '%EXTRA%', 'REAI', 'RAI') AS tipo, r.ano, r.numero,
       COUNT(*) AS qtd, GROUP_CONCAT(r.id) AS ids
FROM relatorio_preliminar r LEFT JOIN item_trabalho i ON i.id = r.item_trabalho_id
WHERE r.numero IS NOT NULL GROUP BY 1, 2, 3 HAVING COUNT(*) > 1;

-- 3. Itens com mais de um relatório preliminar (deveria vir vazio)
SELECT item_trabalho_id, COUNT(*) AS qtd, GROUP_CONCAT(id) AS ids
FROM relatorio_preliminar WHERE item_trabalho_id IS NOT NULL
GROUP BY item_trabalho_id HAVING COUNT(*) > 1;

-- 4. Relatórios sem item de trabalho (órfãos do erro da seção 4)
SELECT 'preliminar' AS tabela, id, ano, numero FROM relatorio_preliminar WHERE item_trabalho_id IS NULL
UNION ALL
SELECT 'final', id, ano, numero FROM relatorio_final WHERE item_trabalho_id IS NULL;
```

Se a consulta 1 mostrar algum relatório classificado no tipo errado, corrigir depois da implantação com um `UPDATE` no campo `especial`. Um item com mais de um preliminar (consulta 3) faz a abertura do relatório por esse item falhar; isso já acontece hoje.

### Implantação

1. Aplicar as alterações no código (por substituição de arquivos ou pelos prompts).
2. Compilar o backend e gerar o build do front (`npm run build`).
3. **Publicar backend e front juntos.** Um front antigo com o backend novo mostra as opções REAI no menu, mas cria RAI.
4. Reiniciar o backend. No log deve aparecer, uma única vez:
   `[RelatorioEspecialMigration] RelatorioPreliminar: N marcados como REAI, M como RAI.`

### Depois

```sql
SELECT 'preliminar' AS tabela, especial + 0 AS especial, COUNT(*) FROM relatorio_preliminar GROUP BY especial
UNION ALL
SELECT 'final', especial + 0, COUNT(*) FROM relatorio_final GROUP BY especial;
```

Os totais devem bater com a consulta 1 e não pode haver `NULL`. Em seguida, criar um REAI-P de teste em um item, conferir número e capa, e excluí-lo.

### Como desfazer

Voltar backend e front para a versão anterior. A coluna `especial` pode ficar no banco: o código antigo a ignora.
