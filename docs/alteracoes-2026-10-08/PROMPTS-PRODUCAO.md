# Prompts para aplicar as alterações no código de produção

Use estes prompts com um assistente de código (por exemplo, Claude Code) aberto **no repositório de produção**, quando a substituição direta de arquivos não for possível.

**Preparação:** copie a pasta `docs/alteracoes-2026-10-08/` para o repositório de produção antes de começar. Os prompts mandam o assistente ler o relatório e os patches que estão nela.

**Ordem:** rode um prompt por vez, na ordem, e revise o resultado antes de passar ao seguinte. O prompt 1 não altera nada; ele diz se dá para ir pelo caminho curto.

---

## Prompt 1 — Levantamento (não altera código)

```text
Preciso levar para este repositório (produção do Sisaudin: backend Spring Boot em backend/,
front React/Vite em frontend/) duas alterações que foram desenvolvidas e testadas em um
repositório de teste. Antes de mudar qualquer coisa, quero saber o quanto este código difere
do código de teste.

Leia docs/alteracoes-2026-10-08/RELATORIO-ALTERACOES.md para entender as alterações e
docs/alteracoes-2026-10-08/SUBSTITUICAO-DE-ARQUIVOS.md para ver a lista dos 26 arquivos.
Os patches reai.patch e rota-api-configuravel.patch, na mesma pasta, mostram as mudanças
exatas e os trechos de código que elas esperam encontrar.

Não altere nenhum arquivo nesta etapa. Verifique e me diga:

1. Para cada um dos 26 arquivos: existe aqui? O trecho que o patch modifica está igual ao
   que o patch espera, ou este repositório tem diferenças naquele ponto?
   (git apply --check --3way ajuda, mas confira também lendo os arquivos que falharem.)
2. O arquivo frontend/src/api/config.js já existe? Há outro mecanismo de configuração da
   URL da API em uso?
3. Qual é o valor de spring.jpa.hibernate.ddl-auto usado em produção? Se não for "update",
   a coluna nova terá de ser criada manualmente.
4. O backend roda em uma única instância ou em várias? A proteção contra números
   duplicados na criação é um bloqueio em memória e só funciona com uma instância.
5. Existe algum outro ponto do código que decida RAI ou REAI olhando a sigla do item de
   trabalho (procure por "EXTRA", "REAI" e "RAI" em backend/src e frontend/src)?

Entregue uma tabela com a situação de cada arquivo (aplica direto / precisa de adaptação /
não existe) e uma recomendação: aplicar os patches, ou refazer as alterações à mão.
```

---

## Prompt 2 — Endereço da API configurável (entrega A)

```text
Aplique neste repositório a entrega A descrita em
docs/alteracoes-2026-10-08/RELATORIO-ALTERACOES.md (seção 3). A referência exata é
docs/alteracoes-2026-10-08/rota-api-configuravel.patch.

Objetivo: o front não deve ter a URL de produção escrita em vários arquivos. Em produção o
comportamento tem de continuar idêntico; a mudança existe para que o mesmo código rode
contra um backend local no "npm run dev".

O que fazer:
- Criar frontend/src/api/config.js exportando API_BASE (import.meta.env.VITE_API_BASE, com
  o endereço atual de produção com porta como padrão) e API_URL (import.meta.env.VITE_API_URL,
  com o endereço atual de produção terminado em /api como padrão).
- Criar frontend/.env.development com as duas variáveis apontando para http://localhost:8080.
- Fazer axiosInstance.js usar API_URL e refreshAxiosInstance.js usar `${API_BASE}/api`.
- Trocar por API_URL todas as chamadas fetch e links de anexos que hoje têm a URL de
  produção fixa, nas telas de documentos e no FileAttachmentManager.

Cuidados:
- Use como padrão em config.js exatamente os endereços que este repositório usa hoje;
  confira nos arquivos, não presuma. A instância principal e a de renovação de token usam
  endereços diferentes (sem porta e com porta) e isso deve ser preservado.
- Não altere frontend/.env nem frontend/.env.production.
- Não mexa em arquivos com "copy" no nome; são cópias de segurança fora do build.
- O commit de origem também alterou PessoaSeeder.java e AuthService.java. Essas duas
  mudanças NÃO fazem parte desta entrega; não as reproduza.

Para conferir: rode "npm run build" em frontend/ e confirme que o pacote gerado contém o
endereço de produção e não contém "localhost:8080". Depois procure por URLs de produção
fixas que tenham sobrado em frontend/src e me liste o que encontrar.
```

---

## Prompt 3 — REAI no backend (entrega B)

```text
Implemente neste backend o Relatório Especial de Auditoria (REAI) como um tipo próprio de
relatório. A descrição completa está em docs/alteracoes-2026-10-08/RELATORIO-ALTERACOES.md
(seções 1, 2 e 4) e a implementação de referência em docs/alteracoes-2026-10-08/reai.patch.
Leia os dois antes de começar. Se o código daqui for diferente do que o patch espera,
adapte preservando as regras abaixo; não copie o patch às cegas.

Contexto: hoje o sistema só tem "Relatório Preliminar" e "Relatório Final". O REAI não é um
documento à parte: o código decide que um relatório é REAI quando a sigla do item de
trabalho contém "EXTRA". Com isso não dá para criar REAI em item PAINT nem RAI em item
EXTRA, e a numeração depende de um texto livre.

Regras que o resultado tem de cumprir:
1. RelatorioPreliminar e RelatorioFinal ganham o campo "especial" (Boolean, padrão false;
   coluna que aceita nulo). false = RAI, true = REAI. Mesmas tabelas, mesma estrutura.
2. Qualquer item de trabalho aceita RAI ou REAI. O item tem um único relatório preliminar,
   de um dos dois tipos.
3. O tipo é definido na criação e não muda depois: nenhuma rota de atualização pode
   alterar "especial".
4. O relatório final herda tipo, número e ano do preliminar do mesmo item. Sem preliminar
   (ou com preliminar sem número), usa o tipo pedido e recebe o próximo número da sequência.
5. Numeração: duas sequências independentes por ano, RAI e REAI. Próximo número = maior
   número do tipo no ano, considerando preliminares e finais, mais 1. Preliminar e final do
   mesmo item compartilham o número. A separação é feita pelo campo "especial", nunca pela
   sigla do item. Registros com "especial" nulo contam como RAI.
6. A verificação de número disponível só considera relatórios do mesmo tipo.
7. O cálculo do próximo número e a gravação do relatório novo acontecem sem concorrência
   (um de cada vez), com a transação concluída antes de liberar o próximo.
8. O menu de criação (FluxoDocumentoService) oferece quatro opções: RELATORIO_PRELIMINAR
   (RAI-P), RELATORIO_ESPECIAL_PRELIMINAR (REAI-P), RELATORIO_FINAL (RAI-F) e
   RELATORIO_ESPECIAL_FINAL (REAI-F). As duas preliminares seguem as mesmas condições da
   opção atual. Se o item tem preliminar de um tipo, o final do outro tipo fica desabilitado
   com o motivo explicado.
9. Na lista de documentos criados do item, o nome distingue "Relatório de Auditoria ..." de
   "Relatório Especial de Auditoria ...". O front usa esse nome para montar a sigla.
10. As rotas de criação e as de numeração aceitam o parâmetro opcional "especial". Sem ele,
    tudo continua funcionando como antes e resulta em RAI.
11. Relatórios que já existem: na inicialização, os que estiverem com "especial" nulo são
    classificados pela regra antiga (item com "EXTRA" na sigla = REAI, demais = RAI), sem
    alterar números. A rotina precisa poder rodar em toda inicialização sem refazer nada.

Correção que precisa vir junto: PlanejamentoRepository.findByItemTrabalhoId falha em tempo
de execução, porque o Spring Data resolve o nome pelo campo transiente
Documento.itemTrabalhoId. Por causa disso, criar relatório preliminar a partir do item
devolve erro 500. Troque por uma consulta explícita (@Query filtrando por itemTrabalho.id).
Outros repositórios têm o mesmo defeito; apenas me liste quais são, sem alterá-los.

Fora do escopo: não crie restrição de unicidade no banco, não renumere relatórios
existentes e não mude regras de outros documentos.

Para conferir, suba o backend contra um banco de teste (nunca o de produção) e verifique
por chamadas à API:
- próximo número de RAI e de REAI no mesmo ano são independentes;
- criar um REAI-P por um item, depois o final sem informar tipo: o final vem como REAI com
  o mesmo número;
- criar um REAI-F em item sem preliminar: vem com número;
- em item com REAI-P, a opção RAI-F aparece desabilitada, e vice-versa;
- um REAI não pode usar número de outro REAI do mesmo ano, mas pode usar número que só
  exista em RAI.
Apague os registros de teste ao final e me mostre o resultado de cada verificação.
```

---

## Prompt 4 — REAI no frontend (entrega B)

```text
O backend deste repositório agora trata o Relatório Especial de Auditoria (REAI) como um
tipo próprio: os relatórios têm o atributo "especial", o menu de criação devolve as opções
RELATORIO_ESPECIAL_PRELIMINAR e RELATORIO_ESPECIAL_FINAL, e as rotas de criação aceitam
?especial=true. Ajuste o front para usar isso. Referências: seções 1 e 2 de
docs/alteracoes-2026-10-08/RELATORIO-ALTERACOES.md e docs/alteracoes-2026-10-08/reai.patch.

O que precisa acontecer:
1. No componente do menu "Criar Documento", as duas opções novas levam às mesmas telas do
   RAI com especial=true na URL (tela de relatório preliminar e tela de relatório final).
2. As funções de API que criam relatório (buscar/criar por item, criar vazio e criar final
   a partir do preliminar) repassam "especial" ao backend.
3. Nas telas de relatório preliminar e final: na criação, o tipo vem do parâmetro da URL;
   depois de carregado, vale sempre o atributo "especial" que o backend devolveu. O tipo
   não é editável na tela.
4. Tudo que identifica o documento usa REAI ou RAI conforme esse atributo: código do
   relatório (ex.: "REAI 03/2026") no cabeçalho, na capa, no rodapé do PDF e no nome do
   arquivo baixado; título da aba do navegador; texto da capa ("Relatório Especial de
   Auditoria Interna").
5. Nenhum ponto do front pode decidir RAI/REAI pela sigla do item de trabalho. Na lista de
   itens, a sigla do documento (RAI-P, REAI-P, RAI-F, REAI-F) sai do nome do documento
   devolvido pelo backend, que contém "Especial" quando é REAI.
6. Na tela de Nota de Auditoria Preliminar, o título da aba mostrava "REAI" para itens
   EXTRA; o correto é "NA".

Cuidados:
- As telas de relatório são grandes e têm trechos duplicados entre si; faça as mesmas
  mudanças nas duas e não refatore além do necessário.
- Não mexa em arquivos com "copy" ou "backup" no nome.
- A função de salvamento automático dessas telas (debouncedSave) usa variáveis que não
  existem (payload, itemId). É um defeito anterior: não corrija agora, só confirme para mim
  se ele existe aqui também.

Para conferir: "npm run build" sem erros; depois, com o backend de teste no ar, crie pelo
menu um REAI-P em um item, confira número, cabeçalho e capa, gere o PDF, crie o REAI-F do
mesmo item e confira que herdou o número. Repita com um RAI para garantir que nada mudou.
Diga claramente o que você conseguiu verificar no navegador e o que não conseguiu.
```

---

## Prompt 5 — Preparação da implantação

```text
As alterações do REAI estão aplicadas neste repositório. Prepare a implantação seguindo a
seção 6 de docs/alteracoes-2026-10-08/RELATORIO-ALTERACOES.md.

Não execute nada no banco de produção e não publique nada. Quero que você:
1. Confira qual é o ddl-auto de produção e diga se a coluna "especial" será criada
   automaticamente ou se o ALTER TABLE manual da seção 2 é necessário.
2. Monte um roteiro com os comandos exatos deste ambiente para: backup, as quatro consultas
   de antes, build do backend e do front, publicação conjunta, reinício e a consulta de
   depois.
3. Aponte o que precisa de decisão humana: relatórios que a consulta 1 classificar no tipo
   errado, números duplicados, itens com mais de um preliminar e relatórios sem item.
4. Revise o diff completo em busca de qualquer coisa que não pertença a esta entrega e
   liste o que encontrar.
```
