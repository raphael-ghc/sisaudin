# Sisaudin — versão 2026.10

Data de implantação em produção: **[preencher]** · Responsável: **[preencher]** · Commit/JAR: **[preencher]**

Reúne as entregas de 08/10 a 26/10/2026 (`docs/alteracoes-2026-10-08` a `docs/alteracoes-2026-10-26`). Roteiro de implantação: `docs/alteracoes-2026-10-27/CHECKLIST-PRODUCAO.html`. Testes de aceite: `docs/alteracoes-2026-10-27/TESTES-SISTEMA.html`.

## Novidades

- **REAI (Relatório Especial de Auditoria Interna).** Mesma estrutura e mesmas tabelas do RAI; o campo `especial` (`true` = REAI) define o tipo. Capa e título próprios, numeração separada por ano (preliminar e final com o mesmo número). — 08/10
- **Regra do tipo de relatório:** item PAINT gera só RAI; item EXTRA gera só REAI; item sem tipo não gera relatório. O menu "Criar Documento" bloqueia a opção errada e mostra o motivo. O seletor de item do relatório lista só itens compatíveis. — 09/10
- **Parecer reestruturado** conforme o modelo oficial (decisão da área): Introdução, Objetivo, Escopo de Avaliação, Análise dos Fatos (opcional), Conclusão e Anexos. Saíram Constatações e Recomendações, o Anexo A – Plano de Ação e o glossário. Os anexos já enviados continuam ligados. — 23/10
- **Planejamento grava as gerências destinatárias** (tabela nova `planejamento_gerencia_destinataria`). — 23/10

## Correções

- Salvamento automático do RAI-P, RAI-F, das notas preliminar, final e técnica e do Parecer não gravava. O botão Salvar travava quando aparecia o aviso de número repetido. — 22/10
- Exclusão pela lista de itens falhava no RAI-P/REAI-P, Comunicação, Solicitação, Nota Final, Reunião e Visita ("Não foi possível identificar o tipo do documento"). — 22/10
- Depois de criado, o RAI-F/REAI-F abria uma página 404. As notas preliminar, final e técnica abriam uma tela genérica. — 23/10
- Os textos iniciais das notas preliminar e final ("Informações Preliminares" e "Constatações e Recomendações") não eram gravados. — 23/10
- O Planejamento perdia parte do que era digitado e salvava sem parar com a tela parada. — 23/10
- O Parecer abria com Objetivo e Escopo vazios e, ao salvar, apagava esses campos. — 23/10
- Depois de alguém salvar um item de trabalho, criar ou salvar Planejamento, Matriz de Achados e Reunião de Busca Conjunta dava erro 400 até o backend ser reiniciado (`allowSetters` em `Documento.itemTrabalho`). — 23/10

## Dados (executados uma vez, na implantação)

- Todos os relatórios de itens EXTRA passam a REAI, inclusive os criados como RAI. A sequência REAI de cada ano é renumerada na ordem de criação. Relatórios de itens PAINT não mudam. Scripts: `docs/alteracoes-2026-10-26/reai-1-previa.sql` e `reai-2-aplicar.sql`. — 26/10
- Renumeração calculada com a cópia do banco de produção de 21/10 (confirmar com a prévia no dia):

  | Item | Antes | Depois |
  |---|---|---|
  | IT-51 | RAI | REAI 01/2025 |
  | IT-52 | RAI | REAI 02/2025 |
  | IT-79 (preliminar e final) | RAI | REAI 01/2026 |
  | IT-91 | RAI 11/2026 | REAI 02/2026 |
  | IT-89 | RAI 12/2026 | REAI 03/2026 |

  Próximos números: REAI 03/2025, REAI 04/2026 e RAI 11/2026.

## Infraestrutura e configuração

- O front passa a ser servido pelo nginx, e o backend roda como JAR separado, só com a API. O nginx repassa `/api` e `/uploads` e aceita anexos de até 50 MB (`client_max_body_size 50m`). — 15/10 e 21/10
- O endereço da API é configurável (`frontend/src/api/config.js`, modos `nginx` e `unificado`). O build de produção é `vite build --mode nginx`, não `npm run build`. — 08/10 e 15/10
- JAR unificado (front dentro do JAR) disponível como opção, pelo perfil Maven `com-front`. — 15/10
- `application.properties` externo ao lado do JAR (`sisaudin.link`, `app.seeder.enabled=false`).

## Banco de dados

A primeira subida, com `ddl-auto=update`, faz só adições:

- coluna `especial` em `relatorio_preliminar` e `relatorio_final`;
- tabela `planejamento_gerencia_destinataria`, com sua chave estrangeira.

Na subida, a `RelatorioEspecialMigration` preenche o `especial` vazio. O usuário do banco precisa da permissão `CREATE`.

## Pendências conhecidas (não incluídas nesta versão)

- Um PATCH de relatório ou nota sem as listas apaga as constatações e recomendações. As telas sempre mandam as listas; o risco existe em chamadas manuais ou integrações.
- `findByItemTrabalhoId` continua quebrado nos repositórios de Matriz de Achados, Visita, Reunião, Plano de Ação e Documento.
- A numeração sem repetição de relatórios só é garantida com uma instância do backend.
- Segurança: trocar os segredos JWT padrão, deixar de usar o usuário `root` no banco e definir um remetente de e-mail institucional.
- Parecer: limpar as variáveis de constatações que ficaram sem uso na tela.

## Como voltar à versão anterior

Voltar o JAR, o `nginx.conf` e a pasta `html` anteriores. A coluna e a tabela novas não atrapalham o código antigo. Restaurar o backup do banco só se for preciso desfazer a reclassificação REAI (seção 10 do checklist de produção).
