# Planejamento não salva (400) — 23/10/2026

Relato: "um documento de Planejamento criado num item de trabalho PAINT não está salvando".

Correção só no backend: uma anotação em `model/cadastroBasico/Documento.java`. Arquivo: `documento-itemtrabalho-json.patch`. Independe das outras correções desta pasta.

---

## 1. O que acontecia

Na homologação (log do nginx), **todas** as tentativas de criar planejamento depois das 11:57 falharam com **400** — 12 tentativas, itens 104 e 106. O log do backend registrava em cada uma:

```
JSON parse error: Cannot construct instance of `sisaudin.model.cadastroBasico.ItemTrabalho`
(although at least one Creator exists): cannot deserialize from Object value (no delegate- or property-based Creator)
```

O backend recusava o corpo da requisição antes de chegar ao serviço; nada era gravado. A tela continuava tentando a cada alteração.

## 2. Causa

O campo `itemTrabalho` dos documentos (`Documento.java`) tem um `@JsonIgnoreProperties` próprio (lista de coleções do item que não devem ir dentro do JSON do documento). Na **leitura** de um JSON com `"itemTrabalho": {...}`, o Jackson cria a partir dele uma variante do leitor de `ItemTrabalho`. Se essa variante é criada **depois** que o leitor principal de `ItemTrabalho` já foi montado — o que acontece quando alguém salva um item de trabalho (`POST`/`PUT /api/item-trabalho`) —, ela sai sem o construtor, e daí em diante **todo documento enviado com `itemTrabalho: {...}` é recusado até o backend reiniciar**.

Por isso o comportamento dependia da ordem desde a subida: se o primeiro uso foi salvar um documento, tudo funcionava; se foi salvar um item (como na homologação: o usuário criou os itens 104 e 106 e em seguida o planejamento), os documentos passavam a falhar.

Telas que enviam o item como objeto (as afetadas): **Planejamento** e **Matriz de Achados** (ao salvar) e **Reunião de Busca Conjunta** (ao criar). As demais enviam o item pela URL e não eram afetadas.

### Reprodução

Backend da homologação (mesmo JAR) numa porta de teste, sobre cópia descartável do `sisaudin_homolog_v4`:

| Ordem desde a subida | `POST /api/planejamentos` com `itemTrabalho: {id}` |
|---|---|
| primeiro um planejamento | 200 (e continua 200) |
| primeiro `POST /api/item-trabalho`, depois o planejamento | **400** (e continua 400) |

Com o mesmo bundle do front publicado na homologação, a tela também passou a falhar nessa ordem — idêntico ao log da homologação.

## 3. Correção

```java
@JsonIgnoreProperties(allowSetters = true, value = { ...mesma lista... })
private ItemTrabalho itemTrabalho;
```

A lista existe para a **escrita** (não mandar as coleções do item dentro de cada documento). Com `allowSetters = true` ela continua valendo na escrita e deixa de valer na leitura, e o Jackson não precisa criar a variante que perdia o construtor.

**Sem efeito na escrita:** o JSON devolvido por `GET /planejamentos/{id}`, `GET /relatorios-preliminar/{id}`, `GET /item-trabalho/{id}` e `GET /fluxo-documentos/item/{id}` é **idêntico byte a byte** entre o JAR anterior e o corrigido.

Não alterados (mesmo padrão, mas não recebem JSON do front): `JustificativaFluxo.itemTrabalho`/`usuario` e `HistoricoStatus.usuario`. No `usuario`, a lista esconde a senha; liberá-la na leitura seria mudança de segurança sem necessidade.

## 4. Testado

Com o JAR corrigido, na ordem que antes quebrava (primeiro `POST /api/item-trabalho`):

| Requisição | Antes | Depois |
|---|---|---|
| `POST /api/planejamentos` com `itemTrabalho: {id}` | 400 | 200 |
| `PATCH /api/relatorios-preliminar/{id}` com `itemTrabalho: {id}` | 400 | 200 |
| `POST /api/matriz-achados` com `itemTrabalho: {id}` | — | 200 |
| `POST /api/reuniao-busca-conjunta` com `itemTrabalho: {id}` | — | 200 |
| Tela (navegador automatizado, front publicado): criar planejamento em item PAINT, editar 2 campos, recarregar | — | criou 1 planejamento, salvou as 2 edições, recarregou com os textos |

Cópia do banco e instâncias de teste removidas ao final.

## 5. Implantação

1. Aplicar o patch.
2. Gerar o JAR (`mvnw.cmd clean package -DskipTests`), substituir e **reiniciar o backend**. O reinício é necessário: no backend em execução, o leitor defeituoso fica em memória até ele parar.
3. Conferir: salvar um item de trabalho e, **em seguida**, criar um planejamento num item PAINT pelo menu "Criar Documento"; editar, esperar "Salvo", recarregar.

### Como desfazer

```powershell
git apply -R docs/alteracoes-2026-10-23/documento-itemtrabalho-json.patch
```
