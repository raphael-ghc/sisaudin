# Prompt: abrir o sistema de solicitação de mudanças direto em "Nova solicitação"

Cole o texto abaixo na conversa (Claude ou outro assistente) junto com o código atual do sistema de solicitação de mudanças:

- o HTML da página;
- o `Código.gs`, com o `doGet`.

---

Preciso de um ajuste pequeno no "Painel SisAudin", o sistema de solicitação de mudanças do Sisaudin. É um web app do Google Apps Script e segue o código atual em anexo.

**Objetivo:** quando o sistema for aberto por um endereço com a aba indicada, ele deve abrir já nessa aba. Exemplos:

- `https://script.google.com/macros/s/<id>/exec#nova` → aba "Nova solicitação";
- `.../exec?aba=nova` → aba "Nova solicitação";
- vale o mesmo para `lista` e `painel`;
- sem indicação, ou com valor desconhecido, abre o Painel, como hoje.

O Sisaudin tem um link "Solicitar Mudanças" no menu lateral que abre `.../exec#nova` em outra aba.

**O que já existe no código:**

- As abas ficam na constante `ABAS` (`painel`, `nova`, `lista`). Os links do topo usam `href="#painel"`, `"#nova"`, `"#lista"` e `data-tab`.
- `mostrarAba(aba)` mostra a aba.
- `irPara(aba)` mostra a aba e tenta trocar o `#` com `history.replaceState`.
- `abaDoEndereco()` lê `location.hash`.
- Na carga, roda `mostrarAba(abaDoEndereco() || 'painel')`, e há um ouvinte de `hashchange`.

**Por que hoje não funciona:** no Apps Script, a página roda dentro de um iframe de `googleusercontent.com`. O `location.hash` lido ali é o do iframe, não o do endereço que o usuário abriu. Por isso o `#nova` nunca chega.

**O que fazer:**

1. Na carga, ler o endereço de fora com `google.script.url.getLocation(cb)`:
   - usar `loc.hash` ou, na falta dele, `loc.parameter.aba`;
   - se o valor estiver em `ABAS`, chamar `mostrarAba` com ele.
2. Manter a leitura atual de `location.hash` como alternativa, para quando a página roda fora do Apps Script (prévia local ou no Claude). Proteja a chamada com `try/catch` e com a verificação `window.google && google.script && google.script.url`.
3. Opcional: ao trocar de aba pelo topo, atualizar o endereço de fora com `google.script.history.replace(null, {}, aba)`. Assim, quem copiar o endereço leva a aba junto. Se fizer isso, trate `google.script.history.setChangeHandler` para os botões voltar/avançar do navegador.
4. Não mude:
   - o restante do comportamento;
   - os ids e classes;
   - a leitura e gravação na planilha;
   - o formulário e as permissões (incluindo o aviso de "acesso só de leitura").
5. Se o `doGet` usa `HtmlService.createTemplateFromFile`, não é preciso mexer nele. Se quiser, passe `e.parameter.aba` ao template como valor inicial. Não troque `XFrameOptionsMode` nem o modo de sandbox.

**Entregue:**

- o trecho alterado (ou o arquivo inteiro, se for mais simples colar);
- onde colar.

**Critérios de aceite** (testar numa aba anônima, já logado na conta Google com acesso):

- `.../exec#nova` abre em "Nova solicitação", com o formulário "Registrar solicitação" visível e o filtro escondido.
- `.../exec?aba=lista` abre na Lista.
- `.../exec` e `.../exec#qualquercoisa` abrem no Painel.
- Trocar de aba pelo topo continua funcionando e a atualização automática a cada minuto não volta para o Painel.
- Usuário só de leitura que abre `#nova` vê a aba com o aviso de acesso só de leitura, como hoje.

---

## Depois do ajuste

- **Publicar:** em Implantar > Gerenciar implantações, editar a implantação atual e escolher "Nova versão". Assim o endereço `/exec` não muda e não é preciso mexer no Sisaudin.
- **Se publicar como nova implantação** (o endereço `/exec` muda), troque o endereço no `config-sisaudin.js` do Sisaudin, sem novo build. Veja "Trocar o endereço" em `CONTROLE-VERSAO.md`.
