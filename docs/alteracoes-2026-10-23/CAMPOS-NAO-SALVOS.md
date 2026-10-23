# Campos que não eram salvos — 23/10/2026

Relato: "os documentos de Planejamento, Relatório Final e outros não estão salvando corretamente todos os campos".

Esta parte é independente da correção de rotas descrita em `RELATORIO-ALTERACOES.md` (mesma data). Arquivos: `campos-nao-salvos.patch`.

---

## 1. Como foi investigado

Para cada tipo de documento (OS, CA, SAI, Planejamento, Matriz de Achados, Notas Preliminar/Final/Técnica, Parecer, RAI-P, RAI-F), três listas foram comparadas:

1. campos que a tela **edita** e **envia** ao salvar (telas analisadas com o parser de JavaScript do projeto);
2. campos que o serviço do backend **copia** para o registro;
3. campos que a **entidade** tem (colunas).

| Documento | Resultado |
|---|---|
| OS, CA, SAI | Coerente: tudo que a tela envia é gravado. |
| RAI-P, RAI-F | Coerente: tudo que a tela edita é enviado e gravado (inclui resumos, recomendações, reportes, anexos). |
| Matriz de Achados | Coerente (grava o objeto inteiro; campos das questões existem na entidade). |
| Nota Técnica, Nota Final (planejamento) | A tela envia campos que a entidade não tem, mas **não há editor** para eles na tela: sobra de código copiado, sem efeito. |
| **Nota Preliminar, Nota Final** | **Defeito 1** (corrigido). |
| **Planejamento** | **Defeito 2** (corrigido). |
| **Parecer**, **Planejamento (gerências)** | **Defeitos 3 e 4** (corrigidos conforme decisão da área, ver seção 4). |

## 2. Defeito 1 — textos iniciais das Notas Preliminar e Final

**Sintoma:** "Informações Preliminares — Texto Inicial" e "Constatações e Recomendações — Texto Inicial" voltavam vazios ao reabrir a nota.

**Causa:** a tela envia `preliminaresTextoInicial` e `constatacoesTextoInicial`, as colunas existem nas tabelas, mas `NotaPreliminarService` e `NotaFinalService` nunca copiavam esses dois campos para o registro.

**Correção:** nos três métodos de gravação de cada serviço (`saveOrUpdate` por item, `saveOrUpdate(dto)` e `updateById`), os dois campos passam a ser copiados, no mesmo padrão de `introducao`/`consideracoes` de cada método (condicional onde o método já era condicional).

**Testado:** cópia descartável do `sisaudin_homolog_v4`, backend corrigido em porta de teste. PATCH em uma nota preliminar e uma nota final com os dois textos → releitura devolveu os textos; listas da nota inalteradas. Cópia do banco apagada ao final.

## 3. Defeito 2 — Planejamento perdia edições e salvava sem parar

**Causa:** após cada salvamento, a tela mesclava a **resposta inteira** do servidor no formulário:

```js
setFormData(prev => ({ ...prev, id: saved.id, ...saved }));
```

Dois efeitos:

1. **Sobrescrita:** o que foi digitado enquanto a requisição estava em andamento era trocado pelo texto que tinha ido na requisição. O editor continua mostrando o texto novo (ele não relê o estado depois de aberto), mas o estado — que é o que vai no próximo salvamento — ficava com o antigo. Se o usuário passasse para outro campo, a última parte digitada no anterior se perdia no banco.
2. **Ciclo de salvamentos:** `questoes` voltava como um array novo a cada resposta; como `formData.questoes` está nas dependências do auto-save, cada resposta agendava outro salvamento — a tela salvava a cada ~3 s enquanto aberta, aumentando a chance do item 1.

**Correção:** `mesclarRespostaSalvamento` (em `Planejamento.jsx`), usada no auto-save e no botão Salvar, completa apenas o que o formulário ainda não tem — `id`, campos vazios preenchidos pelo servidor (ex.: `dataCriacao`) e os `id` das questões recém-criadas — sem sobrescrever conteúdo. `questoes` só muda de referência quando recebe ids, então o ciclo para.

Cuidados mantidos: `dataCriacao` continua no formulário (o Planejamento grava o objeto inteiro; sem ela a data seria regravada como nula); questões novas recebem seus ids e não são recriadas a cada salvamento; técnicas e riscos das questões continuam como lista na tela (antes voltavam como texto da resposta).

**Testado:** a função isolada, em 4 cenários (texto digitado durante a requisição preservado; `questoes` sem mudança de referência; ids do planejamento e das questões novas recebidos; campo vazio preenchido pelo servidor). Front compila. **Não testado no navegador.**

## 4. Parecer e gerências do Planejamento (decididos e corrigidos)

### 4.1 Parecer: estrutura do documento (decisão: sem constatações)

Decisão da área: o Parecer tem só os campos do modelo oficial (ex.: Parecer 01/2026 — Prestação de Contas 2025), parecido com a Nota Técnica; **não tem constatações nem recomendações**.

**O que havia na tela** (cópia da tela do relatório):

- seção "4. Constatações e Recomendações" (+ texto inicial, recomendações, benefícios) e "6. Anexo A – Plano de Ação" — nada disso era gravado (a entidade não tem esses campos);
- **sem editor** para Objetivo, Escopo de Avaliação e Análise dos Fatos, embora existam no banco e a tela os enviasse;
- **ao abrir, a tela não lia** objetivo, escopo e análise do servidor e, ao salvar, enviava esses campos vazios, **apagando** o que estivesse gravado (no `sisaudin_homolog_v4`, o Parecer 1 tem objetivo e escopo preenchidos que seriam perdidos);
- na pré-visualização/PDF, as **Considerações Finais e as assinaturas** estavam dentro de um bloco oculto (`display: none`) junto com as constatações, e havia uma página "Parecer Introdutória" com o glossário de constatações/recomendações/benefícios.

**Como ficou** (`frontend/src/pages/Parecer.jsx`):

| Editor | Campo | No documento |
|---|---|---|
| 1. Introdução | `introducao` | 1 INTRODUÇÃO |
| 2. Objetivo | `objetivo` | 2 OBJETIVO |
| 3. Escopo de Avaliação do Parecer | `escopoAvaliacao` | 3 ESCOPO DE AVALIAÇÃO DO PARECER |
| Análise dos Fatos (opcional) | `analiseFatos` | logo após o escopo, sem título; só aparece se tiver conteúdo |
| 4. Conclusão | `consideracoes` | 4 CONCLUSÃO, seguida das assinaturas |
| 5. Anexos | `anexosFinais` | 5. ANEXO A, 6. ANEXO B… |

- Objetivo, escopo e análise passam a ser **carregados** ao abrir.
- O envio ao backend tem só esses campos, gerências destinatárias e anexos (sem listas de constatações).
- Pré-visualização/PDF: capa → sumário (1 a 4 e anexos) → corpo (1 a 4 + assinaturas) → anexos. Sem glossário, sem Anexo A – Plano de Ação. A numeração de páginas do sumário passa a considerar o corpo antes dos anexos.
- **Anexos já enviados continuam ligados:** os arquivos são associados pelo nome da seção. Os nomes internos foram mantidos (`'5. CONSIDERAÇÕES FINAIS'` para a Conclusão; `'Anexo B'`, `'Anexo C'`… para os anexos, herdados de quando o Anexo A era o Plano de Ação). Mudou só o texto exibido (anexos começam em "A").
- Por que a análise é opcional: no banco, os pareceres existentes têm os itens I a IV **dentro do escopo** e a análise vazia. Sem conteúdo, ela não aparece no documento.

Backend do Parecer não mudou: o `ParecerService` já gravava os cinco campos.

Variáveis e funções de constatações que ficaram sem uso na tela foram mantidas (ESLint acusa como não usadas, sem efeito); podem ser removidas numa limpeza posterior.

### 4.2 Planejamento: "Gerências destinatárias" (decisão: gravar)

- **Backend** (`model/cadastroBasico/Planejamento.java`): novo campo `gerenciasDestinatarias` (lista de nomes, como o seletor usa), na tabela nova `planejamento_gerencia_destinataria` (`planejamento_id`, `ordem`, `gerencia`), criada pelo `ddl-auto=update` na subida. Nenhuma tabela existente é alterada. Carregado junto com o planejamento (`EAGER`), na ordem escolhida.
- **Front** (`Planejamento.jsx`): o campo entrou nas dependências do auto-save (antes, escolher uma gerência não disparava salvamento). Ao abrir, a lista vem do servidor e o seletor mostra o que foi gravado (a tela já carregava o planejamento inteiro).

**Permissão no banco:** a subida cria a tabela; o usuário do banco precisa de `CREATE` (já previsto no checklist da homologação).

### 4.3 Testado

Backend modificado em porta de teste, sobre cópia descartável do `sisaudin_homolog_v4` (apagada ao final):

| Teste | Resultado |
|---|---|
| Subida: criação da tabela `planejamento_gerencia_destinataria` | Criada; nenhum erro de DDL |
| Planejamento: gravar 2 gerências (PUT com o objeto inteiro, como a tela) e reler | As 2 voltaram, na ordem; escopo e questões inalterados |
| Planejamento: remover uma e reler | Ficou só a outra (também no banco) |
| Parecer: gravar objetivo, escopo e análise (PATCH, como a tela) e reler | Os três voltaram; introdução e conclusão inalteradas |
| Listagens que incluem planejamentos (`/item-trabalho`, `/planejamentos`, `/fluxo-documentos/item/{id}`) | 200, sem erro no log |
| Front: build e ESLint (referências indefinidas) | Compila; nenhuma referência indefinida nova |

**Não testado no navegador:** telas do Parecer e do Planejamento, pré-visualização e PDF do Parecer.

## 5. Pequenas inconsistências registradas (sem efeito visível)

- `Planejamento.jsx`: `acceptSuggestion` chama `setNumero`/`setAno`, que não existem; a validação de número nunca é chamada nessa tela, então o aviso de número repetido não abre e a função não é executada. Já era assim.

- `RelatorioFinalService.updateRecomendacoes` não copia a `ordem` de recomendação existente; a tela também não envia a ordem das recomendações.
- `RelatorioPreliminarService` não grava `ordem` das constatações; a tela não a envia.

## 6. Implantação

1. Aplicar `campos-nao-salvos.patch`.
2. Backend: gerar o JAR (`mvnw.cmd clean package -DskipTests`) e substituir na homologação; reiniciar o backend.
3. Front: `npx.cmd vite build --mode nginx` e `robocopy frontend\dist C:\sisaudin-homolog\frontend /MIR`.
4. Conferir no navegador (Ctrl+F5):
   - Nota Preliminar e Nota Final: preencher os dois textos iniciais, esperar "Salvo", recarregar;
   - Planejamento: editar vários campos em sequência, esperar "Salvo", recarregar e conferir todos; com a tela parada, o indicador não deve voltar a "salvando" sozinho a cada 3 s;
   - Planejamento: escolher gerências destinatárias, esperar "Salvo", recarregar — devem continuar selecionadas;
   - Parecer existente: ao abrir, Objetivo e Escopo aparecem preenchidos (antes vinham vazios); editar, recarregar; gerar o PDF e conferir: 1 Introdução, 2 Objetivo, 3 Escopo, 4 Conclusão, assinaturas; sem constatações, sem glossário, sem "Plano de Ação";
   - Parecer com anexo já enviado: o arquivo continua aparecendo no anexo correspondente.

### Como desfazer

```powershell
git apply -R docs/alteracoes-2026-10-23/campos-nao-salvos.patch
```
