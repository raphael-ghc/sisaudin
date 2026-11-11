# Sisaudin — versão 2026.11.1

Primeira versão de novembro, sobre a **2026.10.1** (tag `v2026.10.1`, 28/10/2026) e a correção **2026.10.1.0.1** (29/10/2026). São melhorias nas funcionalidades do Planejamento e da Matriz de Achados.

| | |
|---|---|
| Versão | 2026.11.1 |
| Tag | `v2026.11.1` |
| Entregas | 06/11, 10/11 e 11/11/2026 |
| Data de implantação em produção | **[preencher]** |
| Responsável | **[preencher]** |
| Commit | **[preencher]** |
| Tipo | Melhorias (backend, front e banco) |

- **Detalhes técnicos:** `docs/alteracoes-2026-11-06/RELATORIO-ALTERACOES.md` e `docs/alteracoes-2026-11-10/RELATORIO-ALTERACOES.md`.
- **Roteiro de implantação:** `docs/alteracoes-2026-11-10/CHECKLIST-PRODUCAO.html`.
- **Testes de aceite:** PLA-07, PLA-11 a PLA-22 e MAT-01 a MAT-09 de `docs/alteracoes-2026-10-27/TESTES-SISTEMA.html`.

## Planejamento

- **Formulário na ordem do documento.**
  - Ordem: I–II Vínculo e dados gerais, III Cronograma Proposto, IV Aspectos Gerais das Gerências Auditadas, V Aspectos Gerais do Objeto Auditado (começa pelo Escopo), VI Trabalhos Anteriores, VII Amostra, VIII Orçamento e, por fim, a Matriz de Planejamento.
  - Antes, o Cronograma ficava no fim do formulário e no início do documento.
- **Número do Planejamento.**
  - Atribuído ao criar, com o próximo da sequência do ano, e mostrado no formulário, onde pode ser trocado.
  - Sem número, o documento mostra "Planejamento s/n"; antes mostrava "02" fixo.
  - Os Planejamentos antigos sem número ficam "s/n", para numerar à mão.
- **Gerências destinatárias.**
  - Ligadas ao cadastro de gerências; antes eram gravadas como nomes.
  - Ao criar o Planejamento, vêm preenchidas com as gerências do item de trabalho. O botão "Carregar gerências do item de trabalho" acrescenta as que faltarem.
- **Questões da Matriz de Planejamento.**
  - Cada questão pode ter **mais de uma gerência**. A questão nova começa com as gerências destinatárias do documento.
  - Técnicas e riscos são escolhidos nos cadastros; só aparecem itens ativos.
  - A ordem das questões, ao arrastar, continua depois de recarregar.
  - Os anexos de cada questão ficam presos a ela e não trocam de questão ao reordenar ou excluir.
- **Serviço de Auditoria.** É o tipo de serviço do item de trabalho (Avaliação, Consultoria, Auditoria Contínua). O Planejamento só mostra, travado; para trocar, edita-se o item.
- **Tipo de Auditoria.**
  - Novo campo, abaixo do Serviço, com uma ou mais opções: Desempenho, Financeira e Conformidade.
  - O campo antigo misturava serviço e tipo, e o Planejamento novo gravava nele, por engano, o tipo do item (PAINT/EXTRA).
- **Lista de Planejamentos.** A coluna passa a "Serviço / Tipo de Auditoria" (ex.: "Avaliação — Desempenho, Conformidade").
- **Documento (tela e PDF).** "II. Dados Gerais" mostra Serviço e Tipo de Auditoria. A matriz de planejamento lista todas as gerências de cada questão.

## Matriz de Achados

- **Só com Planejamento.** Sem Planejamento no item, "Criar Documento → Matriz de Achados" fica desabilitado, com o motivo.
- **Importação do Planejamento.**
  - Ao criar, a Matriz já vem com as questões do Planejamento.
  - Número, gerências, conteúdo, critérios, técnicas e riscos vêm do Planejamento e aparecem só para leitura, sem precisar preencher de novo.
- **Fatos e evidências.** Na Matriz só se preenchem fatos encontrados e evidências. Cada questão pode ter **vários fatos**, cada um com sua evidência e seus anexos, e é possível incluir, excluir e reordenar.
- **Atualização.**
  - Questões incluídas ou alteradas no Planejamento aparecem na Matriz, sem perder os fatos já preenchidos.
  - Isso acontece ao salvar o Planejamento, ao abrir a Matriz ou pelo botão "Atualizar do Planejamento".
- **Exclusões bloqueadas.**
  - Questão com fatos na Matriz não pode ser excluída do Planejamento.
  - Planejamento com Matriz não pode ser excluído.
  - A tela mostra o motivo.
- **Documento.**
  - Uma linha por fato: a primeira linha da questão traz todos os dados; as seguintes, só o fato e a evidência.
  - Formulário e documento rolam de forma independente.
- **Correção.** A Matriz não era encontrada pelo item de trabalho, porque a consulta falhava.

## Demais telas

- O rótulo **"Tipo de Serviço" passa a "Serviço de Auditoria"** (mesmo dado: o serviço do item). Telas afetadas:
  - painel do item e documento gerado de OS, CA, SAI, Nota, Nota Preliminar, Nota Final, Nota Técnica, Parecer, RAI-P e RAI-F;
  - tela do item de trabalho;
  - menu ("Gerir Serviços de Auditoria");
  - Base de Conhecimento.
- A exclusão de documentos pela lista de itens e pela lista de Planejamentos mostra o motivo quando é recusada.

## Decisões da área

- 06/11:
  - formulário na ordem do documento;
  - Matriz só com Planejamento;
  - questão com fatos não sai do Planejamento;
  - técnicas e riscos ligados aos cadastros;
  - Planejamentos antigos sem número ficam "s/n";
  - a Matriz acompanha as questões novas do Planejamento.
- 10/11:
  - Serviço de Auditoria = serviço do item (só leitura no Planejamento);
  - "Auditoria Contínua" continua no cadastro de serviços;
  - Tipo de Auditoria com Desempenho, Financeira e Conformidade, mantendo as opções que já existam;
  - "Auditoria Operacional" antiga vira Desempenho;
  - Tipo de Auditoria só no Planejamento.

## Banco de dados

O backend cria a estrutura nova sozinho na primeira subida (`ddl-auto=update`) e converte os dados antigos (`PlanejamentoMatrizMigration`). Cada etapa da conversão roda uma vez e fica registrada em `sisaudin_migracao`. Nada é apagado; as colunas e a tabela antigas ficam sem uso.

| Tipo | Itens |
|---|---|
| Tabelas novas (Hibernate) | `planejamento_gerencia`, `planejamento_questao_gerencia`, `planejamento_questao_tecnica`, `planejamento_questao_tipo_risco`, `planejamento_tipo_auditoria`, `matriz_achados_fato` |
| Tabela nova (conversão) | `sisaudin_migracao` |
| Colunas novas | `planejamento_questao.ordem`, `matriz_achados_questao.questao_planejamento_id` |
| Cadastro | `tipo_auditoria`: Desempenho, Financeira e Conformidade, criados se faltarem |
| Sem uso | `planejamento_gerencia_destinataria`; em `planejamento_questao`: `gerencia`, `gerencia_destinataria`, `tecnicas`, `riscos`; em `matriz_achados_questao`: `fato_encontrado`, `evidencia`; `planejamento.tipo_auditoria` |

Nomes gravados como texto que não existem no cadastro não são ligados. Eles aparecem no resumo da conversão e nas prévias (`docs/alteracoes-2026-11-06/previa-conversao.sql` e `docs/alteracoes-2026-11-10/previa-tipo-auditoria.sql`), para acerto à mão.

## O que muda no servidor

| Parte | Muda? |
|---|---|
| Backend (JAR) | **Sim** |
| Front (pasta `html` do nginx) | **Sim**: novo `dist` |
| Banco de dados | **Sim**: estrutura nova e conversão automática na primeira subida |
| `application.properties` externo | Não (conferir `ddl-auto=update` e `app.seeder.enabled=false`) |
| `nginx.conf` | Não |

Depois da troca, todos os usuários precisam dar **Ctrl+F5**: com a tela antiga em cache, o Planejamento não salva.

## Implantação

Seguir `docs/alteracoes-2026-11-10/CHECKLIST-PRODUCAO.html`. Resumo:

1. Rodar as prévias.
2. Commit e tag `v2026.11.1`.
3. Gerar o front e o JAR.
4. Backup do banco e dos arquivos.
5. Subir o JAR gravando o console. Esperado: 6 tabelas, 2 colunas e 12 chaves novas, e 5 etapas de conversão.
6. Conferir `sisaudin_migracao`.
7. Publicar o front.
8. Testes.

## Como voltar à versão anterior

- **Arquivos:** JAR e pasta `html` do backup.
- **Banco:** a versão anterior volta a ler as colunas antigas. O que for gravado depois da subida existe só nas tabelas novas. Para voltar tudo, restaurar o backup do banco.
- **Código:** `git apply -R` dos patches `docs/alteracoes-2026-11-10/servico-tipo-auditoria.patch` e depois `docs/alteracoes-2026-11-06/planejamento-matriz.patch`; ou voltar à tag anterior.
