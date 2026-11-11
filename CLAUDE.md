# Sisaudin

Sistema de auditoria interna do GHC. **Este repositório é uma cópia de teste**; o código de produção fica em outro lugar e pode divergir daqui.

## Estrutura

- `backend/` — Java 17, Spring Boot 4, JPA/Hibernate, MySQL. Pacote `sisaudin`. As entidades são usadas direto como corpo das requisições (não há DTOs para os documentos).
- `frontend/` — React 19 + Vite, Tailwind, Axios. Telas em `src/pages`, chamadas de API em `src/api`.
- Scripts soltos na raiz (`fix_*.js`, `patch_*.py`, `recover*.py` etc.) são remendos antigos de uso único. Não fazem parte do sistema; **não execute**.
- Arquivos com `copy` ou `_backup` no nome são cópias de segurança fora do build; não edite.

## Como rodar

- Backend: `mvnw.cmd spring-boot:run` em `backend/` (porta 8080). Banco: MySQL local `sisaudin_novo_v10`, com `ddl-auto=update`.
- Frontend: `npm run dev` em `frontend/` (porta 5173). Em desenvolvimento usa `frontend/.env.development`, que aponta para `http://localhost:8080`.
- Endereço da API: sempre por `frontend/src/api/config.js` (`API_URL`, `API_BASE`). Não escreva a URL de produção no código.
- Homologação (front no nginx, backend separado): `npx.cmd vite build --mode nginx` em `frontend/` (no PowerShell, `npx`/`npm` sem `.cmd` são bloqueados pela política de execução) gera o `dist` com `/api` relativo; `mvnw.cmd clean package -DskipTests` em `backend/` gera o JAR só com a API. O nginx serve o `dist` e repassa `/api` e `/uploads` ao backend (modelo em `docs/alteracoes-2026-10-15/nginx.homologacao.conf`). `npm run build` não serve para isso (aponta para produção).
- JAR unificado (opcional, front dentro do JAR): `--mode unificado` no front e `mvnw.cmd clean package -DskipTests -Pcom-front`. Sem o perfil `com-front`, o JAR não leva o front.
- O `git` não está no PATH desta máquina; há um em `%LOCALAPPDATA%\GitHubDesktop\app-*\resources\app\git\cmd\git.exe`.
- Para testar o backend sem derrubar o que está rodando, compile e suba uma cópia em outra porta. Não escreva em `backend/target` com a aplicação no ar.

## Documentos de um item de trabalho

Cada item de trabalho (PAINT ou EXTRA) recebe documentos: OS, CA, SAI, Planejamento, Matriz de Achados, Nota de Auditoria, Nota Técnica, Parecer, Relatório Preliminar e Final. As opções do menu "Criar Documento" e seus bloqueios vêm de `FluxoDocumentoService`.

### RAI e REAI

- RAI (Relatório de Auditoria Interna) e REAI (Relatório Especial) têm a mesma estrutura e as mesmas tabelas (`relatorio_preliminar`, `relatorio_final`). O campo `especial` do relatório define o tipo (`true` = REAI).
- O tipo depende do **tipo do item** (cadastro `tipoItem`, não a sigla): RAI só é gerado em item PAINT e REAI só em item EXTRA. Item sem tipo não gera relatório. Cada item tem só um relatório preliminar.
- A regra está em `DocumentoNumeroService.tipoRelatorioDoItem`. O parâmetro `especial` das rotas de criação por item não decide o tipo.
- O tipo é definido na criação e não muda depois pelo sistema.
- Relatórios antigos (decisão da área, 26/10): todo relatório de item EXTRA é REAI, inclusive os criados como RAI. A sequência REAI de cada ano é renumerada na ordem de criação (data de criação; vazia = mais antigo, desempate pelo id); preliminar e final do item ficam com o mesmo número e o ano do preliminar. Relatórios de item PAINT não mudam. Isso é feito pelos scripts `docs/alteracoes-2026-10-26/reai-1-previa.sql` e `reai-2-aplicar.sql`, rodados uma vez **depois** da primeira subida da versão nova — a `RelatorioEspecialMigration` só preenche `especial` vazio, ainda pela sigla do item.
- O relatório final herda tipo, número e ano do preliminar do mesmo item.
- Numeração em `DocumentoNumeroService`: sequências separadas para RAI e REAI, por ano; preliminar e final compartilham o número; próximo = maior do tipo no ano + 1.
- A criação de relatórios passa por `executarComNumeroReservado`, que evita números repetidos em criações simultâneas (só com uma instância do backend).

### Planejamento e Matriz de Achados (decisões da área, 06/11)

- Planejamento: número atribuído na criação (`PlanejamentoService`, mesma sequência da Matriz); sem número o documento mostra "Planejamento s/n". Formulário na ordem do documento (I–II, III Cronograma, IV Gerências, V Objeto com Escopo, VI, VII, VIII, Matriz de Planejamento).
- Gerências destinatárias do Planejamento e gerências, técnicas e riscos de cada questão são ligados aos cadastros (`planejamento_gerencia`, `planejamento_questao_gerencia`/`_tecnica`/`_tipo_risco`); o front envia `[{id}]`. Uma questão pode ter várias gerências. As colunas/tabela antigas de texto ficam no banco sem uso.
- A Matriz de Achados só existe com Planejamento e é criada por `POST /api/matriz-achados/item/{id}/importar-planejamento`. Cada questão da Matriz aponta para a questão do Planejamento (`questao_planejamento_id`) e mostra os dados dela; a Matriz só grava fatos e evidências (`matriz_achados_fato`, vários por questão). Salvar o Planejamento sincroniza a Matriz (questões novas e ordem).
- Questão com fatos na Matriz não pode ser excluída do Planejamento (409); Planejamento com Matriz não pode ser excluído (409). Erros de regra voltam como `{"error": "..."}` (`RegraDocumentoException`).
- Anexos: questões do Planejamento em `Questão Planejamento {id} - Conteúdo|Critérios`; fatos da Matriz em `Fato Matriz {id}` e `Evidência Matriz {id}`. Não use a posição da questão no nome da seção.
- A conversão dos dados antigos é a `PlanejamentoMatrizMigration` (roda uma vez por etapa na subida; registro em `sisaudin_migracao`).
- **Serviço de Auditoria** (decisão de 10/11) é o tipo de serviço do **item de trabalho** (`item_trabalho.tipo_servico_id`, cadastro `tipo_servico`); o Planejamento só o mostra, travado. Nas telas o rótulo é "Serviço de Auditoria" (era "Tipo de Serviço").
- **Tipo de Auditoria** é do Planejamento, vários por documento (`planejamento_tipo_auditoria`, cadastro `tipo_auditoria`: Desempenho, Financeira, Conformidade), e só aparece no Planejamento. A coluna de texto `planejamento.tipo_auditoria` ficou sem uso.

## Armadilhas conhecidas

- Em repositórios de entidades que estendem `Documento`, um método `findByItemTrabalhoId` falha em tempo de execução: o Spring Data resolve o campo transiente `Documento.itemTrabalhoId`. Use `findByItemTrabalho_Id` ou `@Query`. Corrigido em `PlanejamentoRepository` e `MatrizAchadosRepository`; ainda quebrado em `Visita`, `Reuniao`, `PlanoAcaoPreliminar`, `PlanoAcaoFinal` e `DocumentoRepository`.
- PATCH de relatório sem as listas (`constatacoes`, `preliminares`, `anexosFinais`) apaga as filhas: a entidade inicia as listas vazias e o serviço trata vazio como "remover tudo". As telas sempre mandam as listas completas; ao testar a API à mão, mande-as também.
- A exclusão de documentos pela lista de itens (`ItemTrabalhoList`) usa o campo `tipo` do documento para escolher a rota; a `rotaEditar` do backend não segue um padrão único (ex.: `/RelatorioPreliminar/{id}`).
- Após criar, as telas de documento trocam a URL para `{basePath}/{id}`. O `basePath` tem de ser a rota de edição da própria tela (a mesma `rotaEditar` do `FluxoDocumentoService`); calculá-lo por `location.pathname.startsWith(...)` mandava o RAI-F para `/relatorio/{id}` (404) e as notas para `/nota/{id}` (tela `Nota`). Corrigido em 23/10 nas quatro telas.
- O **Parecer** não tem constatações nem recomendações (decisão da área, 23/10): só introdução, objetivo, escopo de avaliação, análise dos fatos (opcional; nos pareceres existentes os itens I a IV ficam no escopo), conclusão (`consideracoes`) e anexos. Nos anexos e na conclusão, os nomes internos de seção (`'Anexo B'`…, `'5. CONSIDERAÇÕES FINAIS'`) ligam os arquivos já enviados: não renomeie.
- Ao salvar um documento, um campo novo precisa estar em três lugares: no envio da tela, na cópia do serviço (`updateById`/`saveOrUpdate`, que copiam campo a campo) e na entidade. O Planejamento grava o objeto inteiro: campo ausente no envio vira nulo (o `sanitizePayload` da tela monta o envio). A Matriz de Achados copia só cabeçalho e fatos (`MatrizAchadosService.atualizar`); questão ausente no envio não é apagada.
- `@JsonIgnoreProperties` em campo de entidade que recebe objeto na leitura (ex.: `Documento.itemTrabalho`) precisa de `allowSetters = true` quando a lista é só para a escrita. Sem isso, o Jackson perde o construtor do tipo se ele já tiver sido lido antes por outra rota (ex.: salvar um item de trabalho) e passa a recusar com 400 até reiniciar — o erro depende da ordem desde a subida. Para reproduzir, suba uma instância nova e faça as requisições na ordem certa.
- As telas de documento são grandes e muito parecidas entre si; uma mudança em uma costuma ter de ser repetida nas outras.
- O banco local tem números de RAI duplicados e um item (IT-81) com dois relatórios preliminares.

## Levar alterações para produção

Proposta de processo (ramos, versões, build, CI/CD), ainda não adotada: `docs/PROCESSO-GCS-DEVOPS.md`.

O histórico do que foi alterado aqui, com regras, roteiro de implantação, prompts e pacote de arquivos, fica em `docs/alteracoes-<data>/`. Entregas, na ordem em que devem ser aplicadas:

- `docs/alteracoes-2026-10-08/` — REAI e endereço da API configurável.
- `docs/alteracoes-2026-10-09/` — correção: RAI só em item PAINT, REAI só em item EXTRA. Parte do código já com a entrega de 08/10 e substitui a regra "qualquer item aceita RAI ou REAI" descrita lá.
- `docs/alteracoes-2026-10-15/` — homologação: front no nginx e backend separado (atualizado em 21/10; o JAR unificado ficou opcional), com modelos de `application.properties` e `nginx.conf` e o checklist.
- `docs/alteracoes-2026-10-22/` — correção (só front): salvamento automático de RAI-P, RAI-F, notas e parecer; exclusão de documentos pela lista de itens.
- `docs/alteracoes-2026-10-23/` — correção (só front): após criar, RAI-F/REAI-F ia para `/relatorio/{id}` (404) e as notas preliminar, final e técnica abriam a tela `Nota`. Na mesma pasta, `CAMPOS-NAO-SALVOS.md` (backend + front + tabela nova): textos iniciais das notas preliminar/final, perda de edições no Planejamento, gerências destinatárias do Planejamento gravadas e Parecer reestruturado (sem constatações; objetivo, escopo e análise editáveis e recarregados). E `PLANEJAMENTO-NAO-SALVA.md` (backend): 400 ao salvar Planejamento/Matriz/Reunião de Busca Conjunta depois de salvar um item de trabalho (`allowSetters` em `Documento.itemTrabalho`).
- `docs/alteracoes-2026-10-26/` — dados (script SQL, sem mudança de código): relatórios de itens EXTRA passam a REAI, com a sequência REAI renumerada por ano na ordem de criação. Substitui a regra de 09/10 de manter os relatórios antigos como estão. Rodar depois da primeira subida da versão nova.
- `docs/alteracoes-2026-10-27/CHECKLIST-PRODUCAO.html` — roteiro da implantação em produção (servidor 172.16.253.238, banco `sisaudin_novo_v10`): artefatos, configuração externa, backup, subida, scripts REAI, nginx, testes, conferências e plano de volta. Na mesma pasta, `TESTES-SISTEMA.html`: suítes de teste para o usuário validar as entregas de 08/10 a 06/11 no navegador (70 casos; os marcados "Homologação e produção" só consultam). Ao mudar uma regra coberta ali, atualize o caso correspondente. Também na pasta: `CONTROLE-VERSAO.md` (notas da versão 2026.10), `ORIENTACOES-USUARIOS.md` (guia para a equipe) e `MENSAGEM-WHATSAPP.txt` (aviso curto).
- `docs/alteracoes-2026-10-29/` — versão **2026.10.1.0.1** (sobre a 2026.10.1, tag `v2026.10.1`), correção (só front): o Planejamento existente não mostrava a equipe (o item dentro do documento vem sem `equipe`; a tela agora busca o item pela rota própria) e mostrava 420 fixo nas horas. Regra confirmada: Horas de Trabalho = `horasPrevistas` do item (já é o total da equipe). Testes PLA-09 e PLA-10.
- `docs/alteracoes-2026-11-06/` — Planejamento e Matriz de Achados (backend + front + tabelas novas + conversão automática na subida): número do Planejamento, formulário na ordem do documento, gerências/técnicas/riscos ligados aos cadastros, várias gerências por questão, Matriz importada do Planejamento com vários fatos por questão. Rodar `previa-conversao.sql` antes da subida. Testes PLA-07, PLA-11 a PLA-16 e MAT-01 a MAT-09.
- `docs/alteracoes-2026-11-10/` — versão **2026.11.1** (tag `v2026.11.1`, junto com a entrega de 06/11; notas em `CONTROLE-VERSAO.md`, mensagem de commit em `COMMIT.txt`, aviso à equipe em `MENSAGEM-WHATSAPP.txt`). Serviço de Auditoria (do item, só leitura no Planejamento; rótulo trocado em todas as telas) e Tipo de Auditoria (vários por Planejamento, tabela nova + etapa nova da conversão). Vem depois da entrega de 06/11 (o patch parte dela). Rodar `previa-tipo-auditoria.sql` antes. Testes PLA-17 a PLA-22. Na mesma pasta, `CHECKLIST-PRODUCAO.html`: roteiro para levar as entregas de 06/11 e 10/11 juntas à produção (prévias, commit/tag, artefatos, backup, subida com os 20 comandos de estrutura esperados, conferência da conversão, front, testes, plano de volta).
