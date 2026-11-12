# Sisaudin — versão 2026.11.1.0.1

| Versão | Tag | Sobre | Data de implantação | Responsável |
|---|---|---|---|---|
| 2026.11.1.0.1 | `v2026.11.1.0.1` | 2026.11.1 (`v2026.11.1`) | [preencher] | [preencher] |

Complemento pequeno da versão 2026.11.1, **só no front**. Não muda backend nem banco.

## O que muda para o usuário

- Novo menu lateral **Sisaudin**, no fim da lista, para **todos os usuários** (sem restrição de perfil), com dois itens:
  - **Versões do Sisaudin** (`/sisaudin/versoes`): página com o que mudou em cada versão, da mais recente para a mais antiga. Um índice ao lado leva à seção de cada versão (âncoras `#v2026-11-1-0-1`, `#v2026-11-1`, `#v2026-10-1-0-1`, `#v2026-10-1`). A versão mais recente aparece marcada como "Atual" e no topo da página.
  - **Solicitar Mudanças**: abre em outra aba o sistema de solicitação de mudanças do Sisaudin, na aba **Nova solicitação**. A página de versões também tem esse link.

## Arquivos

- `frontend/src/data/versoes.js` (novo): texto das versões e endereço do sistema de solicitações.
- `frontend/src/pages/Versoes.jsx` (novo): página de versões.
- `frontend/src/components/Sidebar.jsx`: menu "Sisaudin" e item de link externo.
- `frontend/src/App.jsx`: rota `/sisaudin/versoes`.
- `frontend/public/config-sisaudin.js` (novo) e `frontend/index.html`: arquivo de configuração editável na pasta publicada (endereço do sistema de solicitações).

## Endereço do sistema de solicitações

- Atual: `https://script.google.com/macros/s/AKfycbxraP11XPuZ_t6EzXwRayNTxb0RRJxxs4PLgLwkZ7KRF4w8UxDE7Mmgf9BgetJVK4Vs/exec`.
- O link do menu acrescenta `#nova`, a âncora da aba "Nova solicitação" do sistema.
- **Para abrir direto na aba, o sistema de solicitações precisa de um ajuste** no Apps Script. Sem ele, o link abre o sistema no Painel. Veja:
  - `PROMPT-SISTEMA-SOLICITACOES.md` (prompt para fazer o ajuste);
  - `AJUSTE-SISTEMA-SOLICITACOES.md` (o trecho de código).

### Trocar o endereço (sem novo build)

O endereço fica no arquivo `config-sisaudin.js`, na pasta publicada do front:

| Ambiente | Arquivo |
|---|---|
| Produção | `<pasta do nginx>\html\config-sisaudin.js` |
| Homologação | `C:\sisaudin-homolog\frontend\config-sisaudin.js` |
| Código-fonte | `frontend/public/config-sisaudin.js` (vai para o `dist` a cada build) |

1. Abra o arquivo no Bloco de Notas.
2. Troque o endereço entre as aspas de `urlSolicitacoes:`, sem o `#nova`, e salve:
   ```js
   urlSolicitacoes: 'https://script.google.com/macros/s/NOVO-ID/exec',
   ```
3. No navegador, aperte Ctrl+F5. Não precisa gerar o front nem reiniciar o nginx ou o backend.
4. Troque também em `frontend/public/config-sisaudin.js` no repositório. O próximo build copia esse arquivo para o `dist` e, ao publicar, sobrescreve o do servidor.

Prioridade do endereço:

1. `config-sisaudin.js`;
2. `VITE_URL_SOLICITACOES` no `.env` do build (exige novo build; serve só como alternativa);
3. o endereço fixo em `frontend/src/data/versoes.js`.

Se o arquivo faltar ou estiver vazio, o link usa as opções seguintes.

## A cada versão nova

Acrescente a versão **no início** da lista `VERSOES` em `frontend/src/data/versoes.js`. Escreva para quem usa o sistema. Use:

- `tipo: 'versao'` para implantação completa;
- `tipo: 'correcao'` para correção (`.0.N`);
- `tipo: 'ajuste'` para complemento pequeno (`.0.N`).

Esse passo está nos checklists:

- homologação (`docs/alteracoes-2026-10-15/CHECKLIST-HOMOLOGACAO.html`, itens "Página Versões do Sisaudin atualizada" e o teste na seção 8);
- produção (`docs/alteracoes-2026-11-10/CHECKLIST-PRODUCAO.html`, seção 2, com o teste na seção 8).

Textos de lançamento desta versão:

- `EMAIL-LANCAMENTO.txt`: e-mail com as versões 2026.11.1 e 2026.11.1.0.1;
- `MENSAGEM-WHATSAPP.txt`: aviso curto;
- `COMMIT.txt`: mensagem do commit.

## Implantação

1. Front: `npx.cmd vite build --mode nginx` em `frontend/`.
2. Copie o `dist` para a pasta do nginx:
   - homologação: `C:\sisaudin-homolog\frontend`;
   - produção: pasta `html` do nginx.
3. No navegador, Ctrl+F5. Confira o menu Sisaudin, a página de versões e o índice, e veja se o link Solicitar Mudanças abre em outra aba.

Se a 2026.11.1 ainda não estiver em produção, as duas sobem juntas: o build do front já leva este complemento.

## Como voltar

Volte a pasta do front anterior. Não há mudança no backend nem no banco.
