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
- O tipo é definido na criação e não muda depois. Relatórios antigos fora da regra (RAI em item EXTRA) continuam como estão.
- O relatório final herda tipo, número e ano do preliminar do mesmo item.
- Numeração em `DocumentoNumeroService`: sequências separadas para RAI e REAI, por ano; preliminar e final compartilham o número; próximo = maior do tipo no ano + 1.
- A criação de relatórios passa por `executarComNumeroReservado`, que evita números repetidos em criações simultâneas (só com uma instância do backend).

## Armadilhas conhecidas

- Em repositórios de entidades que estendem `Documento`, um método `findByItemTrabalhoId` falha em tempo de execução: o Spring Data resolve o campo transiente `Documento.itemTrabalhoId`. Use `findByItemTrabalho_Id` ou `@Query`. Corrigido em `PlanejamentoRepository`; ainda quebrado em `MatrizAchados`, `Visita`, `Reuniao`, `PlanoAcaoPreliminar`, `PlanoAcaoFinal` e `DocumentoRepository`.
- PATCH de relatório sem as listas (`constatacoes`, `preliminares`, `anexosFinais`) apaga as filhas: a entidade inicia as listas vazias e o serviço trata vazio como "remover tudo". As telas sempre mandam as listas completas; ao testar a API à mão, mande-as também.
- A exclusão de documentos pela lista de itens (`ItemTrabalhoList`) usa o campo `tipo` do documento para escolher a rota; a `rotaEditar` do backend não segue um padrão único (ex.: `/RelatorioPreliminar/{id}`).
- Após criar, as telas de documento trocam a URL com `basePath` calculado por `location.pathname.startsWith(...)`. Corrigido no RAI-F (ia para `/relatorio/{id}`, 404); ainda errado em `NotaPreliminar`, `NotaFinal` e `NotaTecnica`, que vão para `/nota/{id}` (rota da tela `Nota`, outra tela).
- As telas de documento são grandes e muito parecidas entre si; uma mudança em uma costuma ter de ser repetida nas outras.
- O banco local tem números de RAI duplicados e um item (IT-81) com dois relatórios preliminares.

## Levar alterações para produção

O histórico do que foi alterado aqui, com regras, roteiro de implantação, prompts e pacote de arquivos, fica em `docs/alteracoes-<data>/`. Entregas, na ordem em que devem ser aplicadas:

- `docs/alteracoes-2026-10-08/` — REAI e endereço da API configurável.
- `docs/alteracoes-2026-10-09/` — correção: RAI só em item PAINT, REAI só em item EXTRA. Parte do código já com a entrega de 08/10 e substitui a regra "qualquer item aceita RAI ou REAI" descrita lá.
- `docs/alteracoes-2026-10-15/` — homologação: front no nginx e backend separado (atualizado em 21/10; o JAR unificado ficou opcional), com modelos de `application.properties` e `nginx.conf` e o checklist.
- `docs/alteracoes-2026-10-22/` — correção (só front): salvamento automático de RAI-P, RAI-F, notas e parecer; exclusão de documentos pela lista de itens.
- `docs/alteracoes-2026-10-23/` — correção (só front): 404 ao criar RAI-F/REAI-F (URL trocada para `/relatorio/{id}`, rota inexistente).
