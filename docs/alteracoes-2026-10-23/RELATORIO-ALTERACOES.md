# Relatório de alterações — 23/10/2026

Correção: ao criar um **Relatório de Auditoria Final (RAI-F ou REAI-F)** pelo menu "Criar Documento" da tela Gerir Itens de Trabalho, a tela mostrava **404 — Página não encontrada**, embora o relatório fosse criado e pudesse ser editado depois pela lista.

Na mesma entrega, o defeito equivalente das **notas** (Nota de Auditoria Preliminar, Nota de Auditoria Final e Nota Técnica), que após criar abriam a tela errada (seção 4).

Só o frontend muda (quatro arquivos, duas linhas em cada). Backend, banco e regras de negócio não mudam. Aplicar depois da entrega de 22/10.

Documentos desta pasta:

- `RELATORIO-ALTERACOES.md` — este relatório.
- `rai-f-404-apos-criar.patch` — as diferenças exatas dos quatro arquivos, no formato do git (a partir do commit anterior a `4d56a31`).

---

## 1. Causa

Fluxo da criação:

1. O menu navega para `/relatorio-final?itemTrabalhoId={id}` (`CriarDocumentoDropdown.jsx`).
2. A tela `RelatorioFinal.jsx` cria o relatório no backend (`POST /api/relatorios-final/create-from-preliminar/{itemId}`) — **o relatório é gravado aqui**.
3. Em seguida, troca a URL para a do relatório criado:

```js
const basePath = location.pathname.startsWith('/relatorio') ? '/relatorio' : '/relatorio-final';
navigate(`${basePath}/${relRes.id}${queryStr}`, { replace: true });
```

`/relatorio-final` também começa com `/relatorio`, então a condição é sempre verdadeira e a tela ia para **`/relatorio/{id}`**. Essa rota não existe em `App.jsx`: o endereço (dois segmentos) não casa com `/:entidade` e cai na rota `*`, a página 404.

Conferido com o `react-router-dom` do projeto, sobre as rotas do `App.jsx`:

| Endereço | Rota que atende |
|---|---|
| `/relatorio/123` (antes) | `*` → página 404 |
| `/relatorio-final/123` (depois) | `/relatorio-final/:id` → tela do RAI-F |

O mesmo acontecia ao criar pelo botão "novo" da lista de relatórios finais (`/relatorios-final/novo`).

## 2. Correção

`frontend/src/pages/RelatorioFinal.jsx`, nos dois pontos em que a URL é trocada após criar/obter o relatório:

```js
const basePath = '/relatorio-final'; // rota de edição do RAI-F/REAI-F (App.jsx: /relatorio-final/:id)
```

### Por que não há efeito colateral

- `/relatorio-final/{id}` é a mesma rota usada ao editar o relatório pela lista (`FluxoDocumentoService` monta `rotaEditar` = `/relatorio-final/{id}`).
- A navegação usa `replace`, como antes; os parâmetros da URL (`itemTrabalhoId`, `especial`) são mantidos.
- Depois da troca de URL a tela carrega o relatório pelo `id` (`relatorioId` vem de `useParams`); não cria outro.
- A tela não usa `location.pathname` em nenhum outro ponto.
- Tipo (RAI/REAI), número e herança do preliminar continuam decididos no backend, que não mudou.

## 3. O que foi testado

- Casamento de rotas com o `react-router-dom` do projeto (tabela acima).
- Build do front (`vite build --mode nginx`).

Para as notas, a mesma verificação de rotas (tabela da seção 4) e o build.

**Não testado no navegador.** Conferir na homologação, criando pelo menu de um item:

- RAI-F e REAI-F: abre em `/relatorio-final/{id}`;
- Nota de Auditoria Preliminar: abre em `/nota-preliminar/{id}`, na tela da nota preliminar;
- Nota de Auditoria Final: abre em `/nota-final/{id}`;
- Nota Técnica: abre em `/nota-tecnica/{id}`;
- em todos, o documento aparece uma única vez no item.

## 4. Notas: mesma causa, tela errada após criar

### Causa

O mesmo trecho existe nas telas das notas, com o prefixo `/nota`:

```js
const basePath = location.pathname.startsWith('/nota') ? '/nota' : '/NotaPreliminar'; // ou '/nota-final', '/NotaTecnica'
```

As rotas de criação (`/nota-preliminar`, `/nota-final`, `/nota-tecnica`, e também `/notas-*/novo` das listas) começam com `/nota`, então as três iam para **`/nota/{id}`** — rota existente, mas da tela **`Nota`**, que é outra tela e busca o registro em outra tabela. As alternativas `/NotaPreliminar/{id}` e `/NotaTecnica/{id}` nem existem como rota (cairiam no 404).

| Endereço | Rota / componente |
|---|---|
| `/nota/7` (antes, nas três) | `/nota/:id` → **`Nota`** (tela errada) |
| `/nota-preliminar/7` (depois) | `/nota-preliminar/:id` → `NotaPreliminar` |
| `/nota-final/7` (depois) | `/nota-final/:id` → `NotaFinal` |
| `/nota-tecnica/7` (depois) | `/nota-tecnica/:id` → `NotaTecnica` |

### Correção

Nos dois pontos de cada tela:

| Arquivo | `basePath` |
|---|---|
| `frontend/src/pages/NotaPreliminar.jsx` | `'/nota-preliminar'` |
| `frontend/src/pages/NotaFinal.jsx` | `'/nota-final'` |
| `frontend/src/pages/NotaTecnica.jsx` | `'/nota-tecnica'` |

São as mesmas rotas que a lista de itens usa para editar cada nota (`FluxoDocumentoService`, `rotaEditar`). As três telas têm a mesma estrutura do RAI-F (estado `notaId` iniciado pelo `id` da URL, `location.pathname` sem outro uso), então valem as mesmas garantias da seção 2.

### Telas conferidas e mantidas

| Tela | Vai para | Situação |
|---|---|---|
| Parecer | `/parecer/{id}` | correto, não mudou |
| RAI-P / REAI-P | `/RelatorioPreliminar/{id}` | correto, não mudou |

## 5. Implantação

1. Aplicar o patch (ou copiar `RelatorioFinal.jsx`, `NotaPreliminar.jsx`, `NotaFinal.jsx` e `NotaTecnica.jsx` de `frontend/src/pages/`).
2. `npx.cmd vite build --mode nginx` em `frontend/`.
3. `robocopy frontend\dist C:\sisaudin-homolog\frontend /MIR` — não precisa reiniciar backend nem nginx.
4. No navegador, Ctrl+F5 e o teste da seção 3.

### Como desfazer

```powershell
git apply -R docs/alteracoes-2026-10-23/rai-f-404-apos-criar.patch
```
