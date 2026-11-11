# Relatório de alterações — 06/11/2026: Planejamento e Matriz de Achados

Backend, front e banco (tabelas novas e conversão automática dos dados). Aplicar depois das entregas anteriores (até 29/10, versão 2026.10.1.0.1). Ramo: `patch-29-10-matriz-achados`.

Documentos desta pasta:

- `RELATORIO-ALTERACOES.md`: este relatório.
- `previa-conversao.sql`: consultas para rodar **antes** da subida e ver o que a conversão não vai conseguir ligar ao cadastro. Não altera nada.
- `planejamento-matriz.patch`: as diferenças exatas do código, no formato do git (a partir do commit `b4a962d`).

Testes para o usuário: casos **PLA-07**, **PLA-11 a PLA-16** e grupo **MAT** (MAT-01 a MAT-09) de `docs/alteracoes-2026-10-27/TESTES-SISTEMA.html`.

---

## 1. Regras (decididas pela área em 06/11)

### Planejamento

1. O formulário segue a ordem do documento: I–II Vínculo e dados gerais, III Cronograma, IV Gerências auditadas, V Objeto auditado (começa pelo Escopo), VI Trabalhos anteriores, VII Amostra, VIII Orçamento, Matriz de Planejamento (questões).
2. **Número.** Ao criar, o Planejamento recebe o próximo número da sequência do ano (a mesma regra dos outros documentos). O número aparece no formulário e pode ser trocado. Sem número, o documento mostra **"Planejamento s/n"**; antes mostrava "02" fixo. Os Planejamentos antigos sem número ficam "s/n", para preencher à mão.
3. **Gerências destinatárias do documento.** São ligadas ao cadastro de gerências, e não mais gravadas como nomes. Ao criar, vêm preenchidas com as gerências do item de trabalho. O botão "Carregar gerências do item de trabalho" acrescenta as que faltarem.
4. **Questões.** Cada questão tem **uma ou mais gerências**. A questão nova começa com as gerências destinatárias do documento, e qualquer gerência do cadastro pode ser incluída. Técnicas e riscos também são ligados aos cadastros (Técnica de Auditoria e Tipo de Risco); itens inativos não aparecem para escolha.
5. A ordem das questões (arrastar e soltar) é gravada.
6. Os anexos de cada questão ficam ligados ao id da questão (`Questão Planejamento {id} - Conteúdo`), e não mais à posição. Reordenar ou excluir uma questão não troca os anexos de lugar. Questão recém-criada só aceita anexo depois do salvamento automático (cerca de 3 s).
7. **Horas de Trabalho** continuam = Horas Previstas do item (entrega de 29/10; nada mudou aqui).

### Matriz de Achados

1. **Só com Planejamento.** Sem Planejamento no item, a opção "Matriz de Achados" fica desabilitada, com o motivo. Antes era permitida, com aviso.
2. **Importação.** "Criar Documento → Matriz de Achados" cria a Matriz já com as questões do Planejamento. Se o item já tem Matriz, abre a existente.
3. **As questões não são copiadas.** Cada questão da Matriz aponta para a questão do Planejamento e mostra o que está nela: número, gerências, conteúdo, critérios, técnicas e riscos, só para leitura. Para mudar esses dados, edita-se o Planejamento.
4. **Na Matriz só se preenchem fatos encontrados e evidências.** Cada questão pode ter **vários fatos**, cada um com sua evidência e seus anexos. Não há botão para incluir nem excluir questões.
5. **Atualização a partir do Planejamento.** Ao salvar o Planejamento, as questões novas entram na Matriz e a ordem acompanha a do Planejamento. A Matriz também se atualiza ao ser aberta e pelo botão "Atualizar do Planejamento".
6. **Exclusão bloqueada.** Questão que já tem fatos na Matriz não pode ser excluída do Planejamento: a tela avisa e o servidor recusa (409). Questão sem fatos pode ser excluída e sai também da Matriz.
7. Planejamento com Matriz não pode ser excluído. É preciso excluir a Matriz antes.
8. **Documento.** Há uma linha por fato. A primeira linha da questão traz Nº, gerência, questão, riscos, técnicas e critérios; as linhas seguintes deixam essas colunas em branco e têm só o fato e a evidência. Questão sem fato tem uma linha com "Não informado". Com mais de um fato, cada um leva o número (1.1, 1.2…).
9. O formulário e o documento rolam de forma independente.

## 2. O que mudou

### Banco (criado pelo `ddl-auto=update` na subida)

| Tabela / coluna | Uso |
|---|---|
| `planejamento_gerencia` (planejamento_id, gerencia_id, ordem) | Gerências destinatárias do Planejamento. Substitui `planejamento_gerencia_destinataria` (nomes), que fica no banco sem uso. |
| `planejamento_questao_gerencia`, `planejamento_questao_tecnica`, `planejamento_questao_tipo_risco` | Gerências, técnicas e riscos de cada questão. As colunas antigas de texto (`gerencia`, `gerencia_destinataria`, `tecnicas`, `riscos`) ficam sem uso. |
| `planejamento_questao.ordem` | Posição da questão. |
| `matriz_achados_questao.questao_planejamento_id` | Questão do Planejamento ligada (FK com `ON DELETE SET NULL`). |
| `matriz_achados_fato` (questao_id, ordem, fato, evidencia) | Fatos e evidências. As colunas `fato_encontrado` e `evidencia` da questão ficam sem uso. |
| `sisaudin_migracao` (nome, executada_em, resumo) | Registro das etapas da conversão. |

Nenhuma tabela ou coluna é apagada.

### Conversão dos dados (`config/PlanejamentoMatrizMigration.java`)

Roda sozinha na subida do backend. Cada etapa roda **uma vez** e fica registrada em `sisaudin_migracao`, com um resumo; ver também o log `[PlanejamentoMatrizMigration]`. Se uma etapa falhar, ela é desfeita e tentada de novo na próxima subida.

1. **Gerências do Planejamento:** os nomes viram ligações com o cadastro. Casa pelo nome, pela sigla ou por "SIGLA - Nome", sem diferenciar maiúsculas.
2. **Questões do Planejamento:**
   - A ordem passa a ser a mesma em que a tela já mostrava (pelo id).
   - A gerência, as técnicas e os riscos em texto viram ligações com os cadastros. Técnicas e riscos são separados por vírgula.
3. **Matrizes de Achados:**
   - Cada questão é ligada à questão do Planejamento com o mesmo texto (sem HTML, espaços e acentos). Se sobrarem quantidades iguais dos dois lados, a ligação é feita pela ordem.
   - O que não for ligado fica no fim da Matriz, com o aviso "Questão da versão anterior…" e os dados da cópia antiga.
   - O fato e a evidência únicos de cada questão viram o primeiro fato.
   - Os anexos `Fato Encontrado Qn` passam para o fato; `Evidência Qn`, `Questão Qn` e `Critérios Qn` passam para a evidência do fato.
4. **Anexos das questões do Planejamento:** `Questão #n - X` → `Questão Planejamento {id} - X`. Anexo de uma posição que não existe mais fica como está.

Nomes sem correspondência no cadastro **não** são ligados. Eles aparecem no resumo da etapa ("SEM CORRESPONDÊNCIA NO CADASTRO") e podem ser vistos antes da subida com `previa-conversao.sql`.

### Backend

| Arquivo | Mudança |
|---|---|
| `model/.../Planejamento.java` | `gerenciasDestinatarias` passa a ser `List<Gerencia>`; questões ordenadas por `ordem`. |
| `model/.../QuestaoPlanejamento.java` | `gerencias`, `tecnicas` e `riscos` ligados aos cadastros; campo `ordem`. |
| `model/.../QuestaoMatrizAchados.java` | `questaoPlanejamento`, lista `fatos` e `ordem`. Os campos de texto antigos ficam só para leitura. |
| `model/.../FatoMatrizAchados.java` | Novo: fato e evidência. |
| `model/.../MatrizAchados.java` | Questões ordenadas por `ordem`. |
| `service/.../PlanejamentoService.java` | Número na criação; liga os cadastros pelo id; ordem das questões; barra a exclusão de questão com fatos; sincroniza a Matriz depois de salvar; barra a exclusão do Planejamento com Matriz. |
| `service/.../MatrizAchadosService.java` | Importar do Planejamento; sincronizar; gravar só cabeçalho e fatos; listar as questões com fatos. |
| `service/.../RegraDocumentoException.java` | Novo: recusa por regra, devolvida como `{"error": "..."}`. |
| `service/.../FluxoDocumentoService.java` | Matriz de Achados só com Planejamento. |
| `repository/.../MatrizAchadosRepository.java` | `findByItemTrabalhoId` com `@Query`: o nome do método falhava em tempo de execução (armadilha do CLAUDE.md). Consultas novas. |
| `controller/.../PlanejamentoController.java` | A criação usa `executarComNumeroReservado`; devolve 409 com mensagem. |
| `controller/.../MatrizAchadosController.java` | Rotas novas (abaixo). O POST antigo agora importa do Planejamento. |
| `config/PlanejamentoMatrizMigration.java` | Novo: conversão. |

Rotas novas:

- `POST /api/matriz-achados/item/{itemId}/importar-planejamento`: cria a Matriz ou devolve a existente, sincronizada. Item sem Planejamento → 400.
- `POST /api/matriz-achados/{id}/sincronizar`: traz as questões novas e a ordem do Planejamento.
- `GET /api/matriz-achados/planejamento/{planejamentoId}/questoes-com-fatos`: ids das questões do Planejamento que têm fatos.

Mudanças nas rotas existentes:

- `PUT /api/matriz-achados/{id}`: grava só o cabeçalho e os fatos (`questoes: [{id, fatos: [{id, fato, evidencia}]}]`). Questão que não vier no envio fica como está. **Ao contrário dos relatórios**, mandar a lista incompleta não apaga nada.
- `PUT /api/planejamentos/{id}`: gerências, técnicas e riscos vão como `[{id}]`. A ordem do envio é a ordem gravada.

### Front

- `pages/Planejamento.jsx`:
  - seções na ordem do documento;
  - número sem "02" fixo;
  - gerências do item ao criar;
  - seletores ligados aos cadastros (só itens ativos);
  - várias gerências por questão;
  - anexos das questões pelo id;
  - confirmação e bloqueio ao excluir questão;
  - mensagem do servidor quando o salvamento é recusado;
  - correção do "aceitar sugestão" de número duplicado, que chamava funções inexistentes;
  - os campos de data do vínculo, que repetiam as datas do Cronograma, foram retirados.
- `pages/MatrizAchados.jsx`: reescrita. Questões só para leitura, vários fatos por questão (incluir, excluir, subir e descer), anexos por fato, uma linha por fato no documento, rolagens independentes, botão "Atualizar do Planejamento", link dos anexos pela rota de download.
- `pages/ItemTrabalhoList.jsx` e `pages/PlanejamentoList.jsx`: mostram a mensagem do servidor quando a exclusão é recusada.

## 3. O que foi testado

Local, com uma cópia do backend na porta 8091 e o banco `sisaudin_novo_v10`. O banco foi restaurado do backup no fim.

- **Compilação:** backend e front (`vite build --mode nginx`) sem erros. ESLint nas duas telas sem identificadores indefinidos.
- **Conversão com os dados locais:** 25 questões ordenadas e 23 gerências ligadas. Uma ficou sem correspondência: "Gerência de Administração e Finanças do HFB", que não existe com esse nome no cadastro. A tabela `planejamento_gerencia_destinataria` não existe no banco local, porque a entrega de 23/10 não subiu nele.
- **Conversão com um cenário montado igual ao de produção:**
  - gerências por nome e por sigla ligadas; nome inexistente apontado no resumo;
  - técnicas e riscos ligados, com o risco inexistente apontado;
  - Matriz antiga: 2 questões ligadas pelo texto e 1 sem ligação (foi para o fim); 3 fatos criados; 3 anexos religados;
  - anexo do Planejamento religado; o de posição inexistente ficou como estava;
  - a sincronização depois incluiu as 4 questões que faltavam, na ordem do Planejamento.
- **API**, nos Planejamentos 10 e 14:
  - a importação cria a Matriz com as questões ligadas, e a segunda importação devolve a mesma;
  - a busca da Matriz por item funciona (antes falhava);
  - gravação, edição e reordenação de fatos mantendo os ids; envio sem algumas questões não apaga nada;
  - questão nova com 2 gerências, 2 técnicas e 1 risco; a Matriz recebe a questão nova e acompanha a ordem;
  - exclusão de questão com fatos → 409 sem alterar nada; sem fatos → excluída também da Matriz;
  - exclusão do Planejamento com Matriz → 409;
  - Planejamento novo recebe número; a edição com número vazio fica sem número;
  - o menu "Criar Documento" habilita a Matriz no item com Planejamento.

**Não testado no navegador** (as telas exigem login; não há usuário de teste local). Conferir na homologação com os casos PLA-07, PLA-11 a PLA-16 e MAT-01 a MAT-09.

## 4. Implantação

1. **Antes:** rodar `previa-conversao.sql` no banco de destino e cadastrar as técnicas, riscos ou gerências que faltarem (ou anotar para ajustar à mão depois).
2. Backup do banco (como no `CHECKLIST-PRODUCAO.html`).
3. Backend: `mvnw.cmd clean package -DskipTests` em `backend/` e subir o JAR novo. Na subida, o log mostra uma linha `[PlanejamentoMatrizMigration]` por etapa.
4. Conferir `SELECT nome, executada_em, resumo FROM sisaudin_migracao;` (4 linhas).
5. Front: `npx.cmd vite build --mode nginx` em `frontend/` e publicar o `dist`. Usuários: Ctrl+F5. A tela antiga, em cache, manda técnicas e riscos como texto, e o servidor recusa.
6. Testes PLA e MAT.

### Como desfazer

- Código: `git apply -R docs/alteracoes-2026-11-06/planejamento-matriz.patch`; gerar e publicar de novo backend e front.
- Banco: a versão anterior volta a ler as colunas e a tabela antigas, que não foram apagadas. Mas o que for gravado depois da subida (gerências, técnicas e riscos novos, fatos da Matriz) fica só nas tabelas novas e não aparece na versão anterior. Para voltar tudo, restaurar o backup do passo 2.
