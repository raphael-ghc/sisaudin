# Relatório de alterações — 10/11/2026: Serviço de Auditoria e Tipo de Auditoria no Planejamento

Backend, front e banco (uma tabela nova e uma etapa nova na conversão automática). Vem **depois** da entrega de 06/11 (`docs/alteracoes-2026-11-06/`), que ainda não foi commitada; o patch desta pasta parte do código com a entrega de 06/11 já aplicada.

Documentos desta pasta:

- `RELATORIO-ALTERACOES.md`: este relatório.
- `previa-tipo-auditoria.sql`: consultas para rodar **antes** da subida (só consulta). Mostra o cadastro de tipos e o destino de cada valor do campo antigo.
- `servico-tipo-auditoria.patch`: diferenças do código desta entrega (sobre a de 06/11).

Testes para o usuário: **PLA-17 a PLA-22** de `docs/alteracoes-2026-10-27/TESTES-SISTEMA.html`.

---

## 1. Regras (decididas pela área em 10/11)

1. O antigo campo "Tipo de Auditoria" do Planejamento misturava serviço (Avaliação, Consultoria) e tipo (Operacional, Financeira, Conformidade). Agora são dois campos separados.
2. **Serviço de Auditoria:** é o tipo de serviço **do item de trabalho** (cadastro `tipo_servico`: Avaliação, Consultoria, Auditoria Contínua).
   - O Planejamento só mostra, travado; para trocar, edita-se o item.
   - Há um serviço por Planejamento (o do item).
3. **Tipo de Auditoria:** fica logo abaixo do Serviço e funciona como as Gerências Destinatárias (etiquetas com seletor).
   - Aceita mais de um por Planejamento.
   - Usa o cadastro `tipo_auditoria`, com Desempenho, Financeira e Conformidade.
   - Opções que já existirem nesse cadastro continuam. Só os itens ativos aparecem para escolha.
4. O Tipo de Auditoria aparece **só no Planejamento** (formulário, documento e lista). Os demais documentos não o mostram.
5. O rótulo **"Tipo de Serviço" passa a "Serviço de Auditoria"** em todas as telas que mostram o serviço do item. O dado continua o mesmo.

## 2. O que mudou

### Banco (criado na subida, `ddl-auto=update`)

- Tabela nova `planejamento_tipo_auditoria` (planejamento_id, tipo_auditoria_id, ordem).
- A coluna `planejamento.tipo_auditoria` (texto) fica no banco sem uso. Nada é apagado.

### Conversão (`PlanejamentoMatrizMigration`, etapa `2026-11-planejamento-tipo-auditoria`)

Roda uma vez na subida e registra um resumo em `sisaudin_migracao`.

1. Cria no cadastro `tipo_auditoria` as opções **Desempenho, Financeira e Conformidade** que faltarem (comparando o nome sem diferenciar maiúsculas). As demais opções não mudam.
2. Converte cada valor do campo antigo:

| Valor no campo antigo | Resultado |
|---|---|
| contém "Operacional" ou "Desempenho" | Tipo: Desempenho |
| contém "Financeira" | Tipo: Financeira |
| contém "Conformidade" | Tipo: Conformidade |
| nome de um serviço (Avaliação, Consultoria…) | Preenche o serviço do item **só se estiver vazio** |
| PAINT / EXTRA (a tela gravava o tipo do item, por engano) | Ignorado |
| outro valor | Não convertido; aparece no resumo como SEM CORRESPONDÊNCIA |

O `TipoAuditoriaSeeder`, para banco novo e vazio, passa a criar só Desempenho, Financeira e Conformidade.

### Backend

| Arquivo | Mudança |
|---|---|
| `model/.../Planejamento.java` | `tipoAuditoria` (texto) sai; entra `tiposAuditoria` (`List<TipoAuditoria>`). |
| `service/.../PlanejamentoService.java` | Liga os tipos ao cadastro pelo id, como as gerências. |
| `config/PlanejamentoMatrizMigration.java` | Etapa 5 (acima). |
| `config/TipoAuditoriaSeeder.java` | Opções novas. |

Na API, o Planejamento passa a receber e devolver `tiposAuditoria: [{id, nome, ...}]`. O campo `tipoAuditoria` sai do JSON.

### Front

- `Planejamento.jsx`:
  - o seletor antigo sai;
  - entra **Serviço de Auditoria** (travado, do item) e, abaixo, **Tipo de Auditoria** (vários);
  - no documento, "II. Dados Gerais" mostra "Serviço de Auditoria" e "Tipo de Auditoria";
  - o Planejamento novo deixa de gravar PAINT/EXTRA no tipo.
- `PlanejamentoList.jsx`: a coluna passa a "Serviço / Tipo de Auditoria" (ex.: "Avaliação — Desempenho"). O filtro "Tipo" busca no tipo do item, no serviço e nos tipos de auditoria.
- Rótulo "Tipo de Serviço" → "Serviço de Auditoria", no painel do item e no documento gerado de: OS, CA, SAI, Nota, Nota Preliminar, Nota Final, Nota Técnica, Parecer, RAI-P e RAI-F. Também na tela do item de trabalho.
- Menu: "Gerir Tipos de Serviços" → "Gerir Serviços de Auditoria". Base de Conhecimento: "Tipo de Serviços" → "Serviços de Auditoria".

## 3. O que foi testado

Local, com uma cópia do backend na porta 8091 e o banco `sisaudin_novo_v10`. Antes de montar o cenário, foi feito um backup; no fim, o banco foi restaurado dele.

- Backend compila. Front: build (`vite build --mode nginx`) sem erros; ESLint sem identificadores indefinidos.
- **Conversão, num cenário com os seis casos:**

| Valor gravado | Resultado |
|---|---|
| Auditoria Operacional | Desempenho |
| Auditoria Financeira | Financeira |
| PAINT | ignorado |
| Consultoria, com o item sem serviço | o item recebeu Consultoria |
| Avaliação, com o item já com serviço | item inalterado |
| Outra coisa | apontado como sem correspondência |

  As três opções foram criadas no cadastro, que estava vazio.
- **API:**
  - o Planejamento devolve `tiposAuditoria` e o serviço do item;
  - a gravação com dois tipos mantém a ordem enviada;
  - o campo antigo não aparece mais;
  - a lista de Planejamentos carrega.
- **Prévia** rodada na homologação (`sisaudin_homolog_v6`):
  - o cadastro `tipo_auditoria` está vazio, e a conversão vai criar as três opções;
  - 1 Planejamento com "Auditoria Operacional" vira Desempenho;
  - 4 com PAINT/EXTRA são ignorados;
  - nenhum conflito de serviço.

**Não testado no navegador** (exige login). Conferir com PLA-17 a PLA-22.

## 4. Implantação

Na homologação, que já está com a entrega de 06/11:

1. Rodar `previa-tipo-auditoria.sql` (trocar o nome do banco no `USE`, se precisar).
2. Backup do banco.
3. Parar o backend e trocar o JAR (`mvnw.cmd clean package -DskipTests` em `backend/`).
4. Subir. A etapa `2026-11-planejamento-tipo-auditoria` roda uma vez. Conferir com `SELECT * FROM sisaudin_migracao WHERE nome = '2026-11-planejamento-tipo-auditoria';`.
5. Front: `npx.cmd vite build --mode nginx` em `frontend/` e copiar o `dist` para a pasta do `root` do nginx de cada ambiente. Na homologação é `C:\sisaudin-homolog\frontend`; em produção, `PASTA_DO_NGINX\html`.
6. Ctrl+F5 nos navegadores.

Em produção, aplicar junto com a entrega de 06/11, que também precisa da sua prévia (`docs/alteracoes-2026-11-06/previa-conversao.sql`).

### Como desfazer

- Código: `git apply -R docs/alteracoes-2026-11-10/servico-tipo-auditoria.patch`, gerar e publicar de novo.
- Banco: a coluna antiga continua lá, e a versão anterior volta a lê-la. Os tipos escolhidos depois da subida ficam só na tabela nova. Para voltar tudo, restaurar o backup do passo 2.
