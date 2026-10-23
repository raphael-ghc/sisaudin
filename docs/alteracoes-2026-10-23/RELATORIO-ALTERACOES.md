# Relatório de alterações — 23/10/2026

Correção: ao criar um **Relatório de Auditoria Final (RAI-F ou REAI-F)** pelo menu "Criar Documento" da tela Gerir Itens de Trabalho, a tela mostrava **404 — Página não encontrada**, embora o relatório fosse criado e pudesse ser editado depois pela lista.

Só o frontend muda (um arquivo, duas linhas). Backend, banco e regras de negócio não mudam. Aplicar depois da entrega de 22/10.

Documentos desta pasta:

- `RELATORIO-ALTERACOES.md` — este relatório.
- `rai-f-404-apos-criar.patch` — a diferença exata, no formato do git.

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

**Não testado no navegador.** Conferir na homologação: criar um RAI-F (e um REAI-F) pelo menu de um item; a tela deve abrir o relatório em `/relatorio-final/{id}` e o relatório deve aparecer uma única vez no item.

## 4. Achado relacionado, não corrigido (fora do escopo pedido)

O mesmo trecho existe em outras telas. Destino após criar, partindo da rota usada pelo menu:

| Tela | Rota do menu | Vai para | Rota existe? | Efeito |
|---|---|---|---|---|
| Nota de Auditoria Preliminar | `/nota-preliminar` | `/nota/{id}` | sim, mas é da tela **`Nota`** | abre outra tela com o id da nota preliminar |
| Nota de Auditoria Final | `/nota-final` | `/nota/{id}` | idem | idem |
| Nota Técnica | `/nota-tecnica` | `/nota/{id}` | idem | idem |
| Parecer | `/parecer` | `/parecer/{id}` | sim | correto |
| RAI-P / REAI-P | `/RelatorioPreliminar` | `/RelatorioPreliminar/{id}` | sim | correto |

Nas três notas, a tela `Nota` busca o registro em outra tabela (`/api/notas/{id}`); o resultado depende de existir uma nota com o mesmo id. Vale reproduzir na homologação antes de corrigir: a correção é análoga (fixar `basePath` em `/nota-preliminar`, `/nota-final` e `/nota-tecnica`).

## 5. Implantação

1. Aplicar o patch (ou copiar `frontend/src/pages/RelatorioFinal.jsx`).
2. `npx.cmd vite build --mode nginx` em `frontend/`.
3. `robocopy frontend\dist C:\sisaudin-homolog\frontend /MIR` — não precisa reiniciar backend nem nginx.
4. No navegador, Ctrl+F5 e o teste da seção 3.

### Como desfazer

```powershell
git apply -R docs/alteracoes-2026-10-23/rai-f-404-apos-criar.patch
```
