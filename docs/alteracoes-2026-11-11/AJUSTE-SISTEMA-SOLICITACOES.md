# Ajuste no sistema de solicitação de mudanças (Apps Script)

O link **Solicitar Mudanças** do Sisaudin abre:

`https://script.google.com/macros/s/AKfycbxraP11XPuZ_t6EzXwRayNTxb0RRJxxs4PLgLwkZ7KRF4w8UxDE7Mmgf9BgetJVK4Vs/exec#nova`

## Por que precisa de ajuste

O sistema escolhe a aba pela âncora: `abaDoEndereco()` lê `location.hash`. No Apps Script, a página roda dentro de um quadro do Google (iframe). O `location.hash` lido ali é o do quadro, não o do endereço aberto pelo usuário.

Por isso, sem o ajuste, o `#nova` do link não chega à página e o sistema abre no **Painel**.

O Apps Script tem uma função própria para ler o endereço de fora: `google.script.url.getLocation`.

## O que alterar

No HTML do sistema, logo **depois** da linha

```js
mostrarAba(abaDoEndereco() || 'painel');
```

acrescente:

```js
// Aba pedida no endereço aberto pelo usuário (ex.: .../exec#nova ou .../exec?aba=nova).
// No Apps Script a página roda num quadro e não enxerga o "#" do endereço; getLocation lê o endereço de fora.
try {
  if (window.google && google.script && google.script.url) {
    google.script.url.getLocation(function (loc) {
      var a = (loc && loc.hash) || (loc && loc.parameter && loc.parameter.aba) || '';
      if (ABAS.includes(a)) mostrarAba(a);
    });
  }
} catch (e) {}
```

Depois:

1. Salve.
2. Em **Implantar > Gerenciar implantações**, edite a implantação atual e escolha **Nova versão**.
   - Assim o endereço `/exec` continua o mesmo.
   - Uma implantação nova gera outro endereço. Nesse caso, troque o endereço no `config-sisaudin.js` da pasta publicada do Sisaudin, sem novo build (veja "Trocar o endereço" em `CONTROLE-VERSAO.md`).

O ajuste também aceita `?aba=nova` (ou `?aba=lista`, `?aba=painel`), caso a âncora seja trocada por parâmetro no futuro.

## Como conferir

Abra o endereço com `#nova` numa aba anônima. A página tem de abrir já em **Nova solicitação** ("Registrar solicitação").
