# Sisaudin — versão 2026.10.1.0.1

Correção pequena sobre a versão **2026.10.1** (tag `v2026.10.1`, commit `9150af8`, 28/10/2026).

| | |
|---|---|
| Versão | 2026.10.1.0.1 |
| Tag | `v2026.10.1.0.1` |
| Data da entrega | 29/10/2026 |
| Data de implantação em produção | **[preencher]** |
| Responsável | **[preencher]** |
| Commit | **[preencher]** |
| Tipo | Correção, só no front |

Detalhes técnicos: `docs/alteracoes-2026-10-29/RELATORIO-ALTERACOES.md`. Testes de aceite: casos PLA-09 e PLA-10 de `docs/alteracoes-2026-10-27/TESTES-SISTEMA.html`.

## Correções

- **Planejamento — Equipe de Auditoria.** Ao abrir um Planejamento já criado, a equipe aparecia como "Não informado" (na tela e no PDF). O item que vem dentro do Planejamento chega sem a equipe; a tela agora busca o item completo.
- **Planejamento — Horas de Trabalho.** Mostrava sempre 420, um valor fixo no código, porque lia um campo que não existe. Agora mostra as "Horas Previstas" do item.
- **Ordem de Serviço — Horas de Trabalho.** Em item sem horas previstas, mostrava 420. Agora mostra "Não informado".

## Regra confirmada

Horas de Trabalho do Planejamento = "Horas Previstas" do item de trabalho, que já é o total da equipe (o responsável faz parte da equipe). Decisão da área em 29/10/2026.

## Arquivos alterados

- `frontend/src/pages/Planejamento.jsx`
- `frontend/src/pages/OrdemServico.jsx`

## O que muda no servidor

| Parte | Muda? |
|---|---|
| Front (pasta `html` do nginx) | **Sim** — novo `dist` |
| Backend (JAR) | Não |
| Banco de dados | Não |
| `application.properties` | Não |
| `nginx.conf` | Não |

Não precisa reiniciar o backend nem o nginx.

## Implantação

1. Gerar o front: `npx.cmd vite build --mode nginx` em `frontend/`.
2. No servidor, guardar a pasta publicada: `robocopy "PASTA_DO_NGINX\html" "PASTA_DO_BACKUP\html" /E`.
3. Publicar: `robocopy CAMINHO_DO_PACOTE\dist "PASTA_DO_NGINX\html" /MIR`.
4. No navegador, Ctrl+F5 e os testes PLA-09 e PLA-10.

## Como voltar à versão anterior

`robocopy "PASTA_DO_BACKUP\html" "PASTA_DO_NGINX\html" /MIR`. No código: `git apply -R docs/alteracoes-2026-10-29/planejamento-equipe-horas.patch`.
