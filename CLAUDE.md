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

## Armadilhas conhecidas

- Em repositórios de entidades que estendem `Documento`, um método `findByItemTrabalhoId` falha em tempo de execução: o Spring Data resolve o campo transiente `Documento.itemTrabalhoId`. Use `findByItemTrabalho_Id` ou `@Query`. Corrigido em `PlanejamentoRepository`; ainda quebrado em `MatrizAchados`, `Visita`, `Reuniao`, `PlanoAcaoPreliminar`, `PlanoAcaoFinal` e `DocumentoRepository`.
- PATCH de relatório sem as listas (`constatacoes`, `preliminares`, `anexosFinais`) apaga as filhas: a entidade inicia as listas vazias e o serviço trata vazio como "remover tudo". As telas sempre mandam as listas completas; ao testar a API à mão, mande-as também.
- A exclusão de documentos pela lista de itens (`ItemTrabalhoList`) usa o campo `tipo` do documento para escolher a rota; a `rotaEditar` do backend não segue um padrão único (ex.: `/RelatorioPreliminar/{id}`).
- Após criar, as telas de documento trocam a URL para `{basePath}/{id}`. O `basePath` tem de ser a rota de edição da própria tela (a mesma `rotaEditar` do `FluxoDocumentoService`); calculá-lo por `location.pathname.startsWith(...)` mandava o RAI-F para `/relatorio/{id}` (404) e as notas para `/nota/{id}` (tela `Nota`). Corrigido em 23/10 nas quatro telas.
- O **Parecer** não tem constatações nem recomendações (decisão da área, 23/10): só introdução, objetivo, escopo de avaliação, análise dos fatos (opcional; nos pareceres existentes os itens I a IV ficam no escopo), conclusão (`consideracoes`) e anexos. Nos anexos e na conclusão, os nomes internos de seção (`'Anexo B'`…, `'5. CONSIDERAÇÕES FINAIS'`) ligam os arquivos já enviados: não renomeie.
- Planejamento grava as gerências destinatárias como lista de nomes (tabela `planejamento_gerencia_destinataria`).
- Ao salvar um documento, um campo novo precisa estar em três lugares: no envio da tela, na cópia do serviço (`updateById`/`saveOrUpdate`, que copiam campo a campo) e na entidade. Planejamento e Matriz de Achados gravam o objeto inteiro: campo ausente no envio vira nulo.
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
- `docs/alteracoes-2026-10-27/CHECKLIST-PRODUCAO.html` — roteiro da implantação em produção (servidor 172.16.253.238, banco `sisaudin_novo_v10`): artefatos, configuração externa, backup, subida, scripts REAI, nginx, testes, conferências e plano de volta. Na mesma pasta, `TESTES-SISTEMA.html`: suítes de teste para o usuário validar as entregas de 08/10 a 26/10 no navegador (53 casos; os marcados "Homologação e produção" só consultam). Ao mudar uma regra coberta ali, atualize o caso correspondente. Também na pasta: `CONTROLE-VERSAO.md` (notas da versão 2026.10), `ORIENTACOES-USUARIOS.md` (guia para a equipe) e `MENSAGEM-WHATSAPP.txt` (aviso curto).
