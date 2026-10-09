# Prompts para aplicar a correção no código de produção

Use estes prompts com um assistente de código (por exemplo, Claude Code) aberto **no repositório de produção**, quando a substituição direta de arquivos não for possível.

**Pré-requisito:** a entrega de 08/10/2026 (REAI como tipo de relatório) já aplicada em produção. Se não estiver, rode antes os prompts de `docs/alteracoes-2026-10-08/PROMPTS-PRODUCAO.md`. Nesse caso, a regra 2 do Prompt 3 de lá ("qualquer item de trabalho aceita RAI ou REAI") e o trecho da regra 4 que diz "usa o tipo pedido" serão substituídos por esta correção.

**Preparação:** copie a pasta `docs/alteracoes-2026-10-09/` para o repositório de produção antes de começar. Os prompts mandam o assistente ler o relatório e o patch que estão nela.

**Ordem:** rode um prompt por vez, na ordem, e revise o resultado antes de passar ao seguinte. O prompt 1 não altera nada.

---

## Prompt 1 — Levantamento (não altera código)

```text
Preciso levar para este repositório (produção do Sisaudin: backend Spring Boot em backend/,
front React/Vite em frontend/) uma correção de regra desenvolvida e testada em um
repositório de teste. Antes de mudar qualquer coisa, quero saber se este código está no
ponto de partida que a correção espera.

Leia docs/alteracoes-2026-10-09/RELATORIO-ALTERACOES.md para entender a correção e
docs/alteracoes-2026-10-09/SUBSTITUICAO-DE-ARQUIVOS.md para ver a lista dos 6 arquivos.
O patch tipo-relatorio-por-item.patch, na mesma pasta, mostra as mudanças exatas e os
trechos de código que elas esperam encontrar.

Não altere nenhum arquivo nesta etapa. Verifique e me diga:

1. A entrega anterior (REAI como tipo de relatório) está aplicada aqui? Sinais: as
   entidades RelatorioPreliminar e RelatorioFinal têm o campo "especial";
   DocumentoNumeroService tem os métodos resolveEspecial e executarComNumeroReservado;
   FluxoDocumentoService devolve as opções RELATORIO_ESPECIAL_PRELIMINAR e
   RELATORIO_ESPECIAL_FINAL.
2. Para cada um dos 6 arquivos: o trecho que o patch modifica está igual ao que o patch
   espera, ou este repositório tem diferenças naquele ponto?
   (git apply --check --3way ajuda, mas confira também lendo os arquivos que falharem.)
3. Como o item de trabalho guarda o tipo? No código de teste é o campo tipoItem de
   ItemTrabalho, uma entidade TipoItem com o atributo "nome" (valores PAINT e EXTRA).
   Confirme se aqui é igual.
4. Existe algum outro caminho que crie relatório preliminar ou final, ou que vincule um
   relatório a um item de trabalho, além dos serviços RelatorioPreliminarService e
   RelatorioFinalService?
5. Existe algum ponto do código que ainda decida RAI ou REAI olhando a sigla do item
   (procure por "EXTRA" em backend/src e frontend/src)?

Entregue uma tabela com a situação de cada arquivo (aplica direto / precisa de adaptação)
e uma recomendação: aplicar o patch, ou refazer a correção à mão.
```

---

## Prompt 2 — Backend

```text
Corrija neste backend a regra de quem pode gerar RAI e REAI. A descrição completa está em
docs/alteracoes-2026-10-09/RELATORIO-ALTERACOES.md (seções 1, 2 e 3) e a implementação de
referência em docs/alteracoes-2026-10-09/tipo-relatorio-por-item.patch. Leia os dois antes
de começar. Se o código daqui for diferente do que o patch espera, adapte preservando as
regras abaixo; não copie o patch às cegas.

Contexto: hoje qualquer item de trabalho aceita RAI ou REAI, e o usuário escolhe o tipo no
menu "Criar Documento". A regra correta é: RAI só pode ser gerado em item de trabalho
PAINT, e REAI só pode ser gerado em item de trabalho EXTRA.

Regras que o resultado tem de cumprir:
1. O tipo do item vem do cadastro Tipo de Item (ItemTrabalho.tipoItem.nome), nunca da
   sigla do item. Nome contendo "EXTRA" é EXTRA (inclusive "EXTRA PAINT"); senão, contendo
   "PAINT" é PAINT; comparação sem diferenciar maiúsculas. Qualquer outro caso, inclusive
   item sem tipo, é "sem tipo reconhecido". Essa decisão fica em um único método, usado
   por todos os pontos abaixo.
2. Menu (FluxoDocumentoService): as quatro opções de relatório continuam sendo devolvidas.
   Uma opção só fica habilitada se o seu tipo for o permitido; a outra vem desabilitada
   com o motivo ("RAI só pode ser gerado em item de trabalho PAINT", "REAI só pode ser
   gerado em item de trabalho EXTRA" ou "Defina o tipo do item de trabalho (PAINT ou
   EXTRA)"). As demais condições e motivos de cada opção não mudam.
3. Tipo permitido para o preliminar: o do item; se o item já tem relatório final, o tipo
   desse final. Tipo permitido para o final: o do preliminar do item; sem preliminar, o do
   item. O menu e a criação têm de decidir da mesma forma.
4. Criação de relatório por item (preliminar, e final sem preliminar): o tipo é definido
   pela regra 3. O parâmetro "especial" das rotas continua sendo aceito, mas não decide o
   tipo; não devolva erro quando ele divergir do item. Item sem tipo reconhecido e sem
   relatório: a criação é recusada.
5. O final com preliminar continua herdando tipo, número e ano do preliminar.
6. Vincular um relatório a um item (rotas PATCH /{id}?itemTrabalhoId=): se o item informado
   for diferente do item atual do relatório, ou o relatório ainda não tiver item, o tipo do
   relatório tem de corresponder ao tipo do item; caso contrário, recusar. Se o item
   informado for o mesmo que o relatório já tem, não validar: relatórios antigos fora da
   regra precisam continuar sendo salvos.
7. Numeração: quando o chamador não informa o tipo e o item ainda não tem relatório, a
   sequência (RAI ou REAI) é a do tipo do item.
8. Criação de relatório avulso (sem item) não muda.

Fora do escopo: não reclassifique nem renumere relatórios existentes; não altere a rotina
RelatorioEspecialMigration; não altere entidades, controllers nem rotas; não bloqueie a
troca do tipo de um item que já tem relatório (apenas me diga onde isso teria de ser feito).

Para conferir, suba o backend contra um banco de teste (nunca o de produção) e verifique
por chamadas à API, usando um item PAINT e um item EXTRA sem documentos:
- o menu de cada item habilita só o tipo correspondente e traz o motivo no outro;
- criar o preliminar do item PAINT pedindo especial=true resulta em RAI;
- criar o preliminar do item EXTRA sem parâmetro resulta em REAI, e o final herda tipo e
  número;
- criar o final sem preliminar em cada item resulta no tipo do item, com número;
- vincular um RAI avulso a um item EXTRA é recusado; ao item PAINT, aceito;
- salvar um relatório antigo que esteja fora da regra, sem trocar o item, continua
  funcionando;
- o próximo número pedido só com o item segue a sequência do tipo do item.
Apague os registros de teste ao final e me mostre o resultado de cada verificação.
```

---

## Prompt 3 — Frontend

```text
O backend deste repositório agora só permite RAI em item de trabalho PAINT e REAI em item
de trabalho EXTRA, e recusa o vínculo de um relatório a um item de tipo incompatível.
Ajuste as telas de relatório para não oferecer esse vínculo. Referências: seções 1 e 2 de
docs/alteracoes-2026-10-09/RELATORIO-ALTERACOES.md e
docs/alteracoes-2026-10-09/tipo-relatorio-por-item.patch.

O que precisa acontecer:
1. Nas telas de relatório preliminar e de relatório final, o seletor "Item de Trabalho
   Base" lista apenas os itens compatíveis com o tipo do relatório aberto: itens EXTRA
   quando o relatório é REAI, itens PAINT quando é RAI. O tipo do item vem de
   item.tipoItem.nome, com a mesma regra do backend (contém "EXTRA" = EXTRA; senão, contém
   "PAINT" = PAINT; sem diferenciar maiúsculas). Itens sem tipo reconhecido não entram.
2. O item já vinculado ao relatório continua na lista mesmo que seja incompatível, para
   que relatórios antigos fora da regra mostrem o item a que pertencem.
3. O contador "Total" ao lado do rótulo e o restante da tela não mudam.

Cuidados:
- As duas telas são grandes e têm esse trecho duplicado; faça a mesma mudança nas duas e
  não refatore além do necessário.
- Não altere o componente do menu "Criar Documento" nem as funções de API: o menu já
  recebe do backend quais opções estão habilitadas e o motivo das bloqueadas.
- Não mexa em arquivos com "copy" ou "backup" no nome.

Para conferir: "npm run build" sem erros; depois, com o backend de teste no ar:
- abra o menu "Criar Documento" de um item PAINT e de um item EXTRA e confira as opções
  habilitadas e os motivos das bloqueadas;
- crie um relatório avulso e confira que o seletor só mostra itens PAINT;
- abra um relatório antigo que esteja fora da regra, se houver, e confira que o item dele
  aparece selecionado.
Diga claramente o que você conseguiu verificar no navegador e o que não conseguiu.
```

---

## Prompt 4 — Preparação da implantação

```text
A correção da regra de RAI e REAI está aplicada neste repositório. Prepare a implantação
seguindo a seção 5 de docs/alteracoes-2026-10-09/RELATORIO-ALTERACOES.md.

Não execute nada no banco de produção e não publique nada. Quero que você:
1. Monte um roteiro com os comandos exatos deste ambiente para: backup, as três consultas
   de antes, build do backend e do front, publicação conjunta, reinício e a consulta de
   depois.
2. Aponte o que precisa de decisão humana: tipos de item cujo nome não contenha PAINT nem
   EXTRA, itens sem tipo que precisem emitir relatório, e relatórios existentes cujo tipo
   não corresponde ao tipo do item.
3. Se a entrega de 08/10 for publicada junto, diga em que ordem as duas entram e junte os
   dois roteiros em um só.
4. Revise o diff completo em busca de qualquer coisa que não pertença a esta correção e
   liste o que encontrar.
```
