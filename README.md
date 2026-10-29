# Sisaudin

Sistema de auditoria interna do GHC.

## Solicitações de melhoria e correções

Pedidos de melhoria e relatos de erro no Sisaudin são registrados nesta planilha:

[Planilha de solicitações do Sisaudin](https://docs.google.com/spreadsheets/d/1_Bd-axVMfz5TVve6c5kte2JmbTAWHwXt1BjSx6FA_wU/edit?gid=0#gid=0)

## Estrutura

- `backend/` — API em Java 17 e Spring Boot, com banco MySQL.
- `frontend/` — telas em React e Vite.
- `docs/` — histórico das alterações (`docs/alteracoes-<data>/`), roteiros de implantação e consultas SQL.

## Como rodar

- Backend: `mvnw.cmd spring-boot:run` em `backend/` (porta 8080).
- Frontend: `npm run dev` em `frontend/` (porta 5173).
- Build para o servidor (front no nginx): `npx.cmd vite build --mode nginx` em `frontend/`. Não use `npm run build` para isso.

## Versões

Formato `ANO.MÊS.N` para cada implantação; as correções pequenas sobre ela acrescentam `.0.N`. Cada versão tem uma tag no git (`v<versão>`) e as notas em `docs/`.

| Versão | Data | O que muda no servidor | Notas |
|---|---|---|---|
| **2026.10.1.0.1** | 29/10/2026 | Só o front (pasta `html` do nginx) | [Controle de versão](docs/alteracoes-2026-10-29/CONTROLE-VERSAO.md) |
| 2026.10.1 | 28/10/2026 | Backend, front, nginx e scripts de dados | [Controle de versão](docs/alteracoes-2026-10-27/CONTROLE-VERSAO.md) |

### 2026.10.1.0.1 — correção do Planejamento

- O Planejamento já criado mostrava "Não informado" na **Equipe de Auditoria**. Agora mostra a equipe cadastrada no item, na tela e no PDF.
- As **Horas de Trabalho** do Planejamento mostravam sempre 420. Agora mostram as "Horas Previstas" do item, que já são o total da equipe. A Ordem de Serviço também deixa de mostrar 420 quando o item não tem horas.

Detalhes e implantação: [docs/alteracoes-2026-10-29/](docs/alteracoes-2026-10-29/).

### 2026.10.1 — REAI e homologação

REAI, regra RAI só em item PAINT e REAI só em item EXTRA, Parecer reestruturado, correções de salvamento e de abertura dos documentos, front no nginx e reclassificação dos relatórios antigos de itens EXTRA. Entregas de 08/10 a 26/10.
