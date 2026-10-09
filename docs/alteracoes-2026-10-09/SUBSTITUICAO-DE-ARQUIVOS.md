# Aplicar em produção substituindo apenas os arquivos modificados

Esta correção parte do código **já com a entrega de 08/10/2026 aplicada**. Os seis arquivos abaixo também foram alterados naquela entrega; a versão `depois/` deste pacote contém as duas alterações somadas.

Este caminho só é seguro se os arquivos de produção forem **idênticos** à versão `antes/` deste pacote, que é a versão final da entrega de 08/10. Se produção tiver qualquer mudança própria em um desses arquivos, copiar por cima apaga essa mudança. O script do pacote verifica isso antes de copiar.

## O que há no pacote (`pacote-tipo-relatorio-2026-10-09.zip`)

| Item | Conteúdo |
|---|---|
| `antes/` | Os 6 arquivos como estavam antes desta correção (commit `7cd2305`, já com a entrega de 08/10) |
| `depois/` | Os 6 arquivos na versão final |
| `lista-arquivos.txt` | Caminhos dos 6 arquivos, relativos à raiz do repositório |
| `verificar-e-aplicar.ps1` | Compara produção com `antes/` e, se tudo bater, copia `depois/` |
| `tipo-relatorio-por-item.patch` | A mesma alteração no formato do git |
| Documentos `.md` | Relatório, prompts e este guia |

## Ordem em relação à entrega de 08/10

- **Produção já tem a entrega de 08/10:** siga o passo a passo abaixo.
- **Produção ainda não tem a entrega de 08/10:** aplique primeiro o pacote `pacote-reai-2026-10-08.zip`, conforme o guia daquela pasta, e depois este. As duas podem ser publicadas juntas, em um único build.

Rodar este script antes do de 08/10 resulta em `DIFERENTE` nos seis arquivos e nada é alterado.

## Passo a passo

1. Extraia o zip em uma pasta qualquer, fora do repositório de produção.
2. Verifique, sem alterar nada:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\verificar-e-aplicar.ps1 -Destino C:\caminho\do\repositorio-producao
   ```

3. Leia o resultado de cada arquivo:

   | Resultado | Significado |
   |---|---|
   | `IGUAL` | Produção é igual à versão anterior; pode substituir |
   | `JA APLICADO` | Produção já tem a versão final |
   | `DIFERENTE` | Produção tem conteúdo próprio nesse arquivo, ou a entrega de 08/10 ainda não foi aplicada |
   | `AUSENTE` | O arquivo não existe em produção |

4. Se não houver `DIFERENTE` nem `AUSENTE`, aplique:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\verificar-e-aplicar.ps1 -Destino C:\caminho\do\repositorio-producao -Aplicar
   ```

   Os originais são copiados para `_backup-reai-<data>` dentro do repositório de produção. Apague essa pasta depois de validar; ela não deve ir para o controle de versão.

5. Siga o roteiro de implantação do `RELATORIO-ALTERACOES.md` (seção 5): consultas no banco, build, publicação conjunta e conferência.

## Se algum arquivo der `DIFERENTE` ou `AUSENTE`

O script não altera nada nesse caso. Opções, da mais simples para a mais trabalhosa:

1. **Patch com mesclagem**, na raiz do repositório de produção:

   ```bash
   git apply --3way --ignore-whitespace tipo-relatorio-por-item.patch
   ```

   Onde houver conflito, o git marca o trecho no arquivo para resolução manual.

2. **Prompts** de `PROMPTS-PRODUCAO.md`, que refazem a correção lendo o código de produção como ele está.

3. **Manual**, comparando `antes/` e `depois/` de cada arquivo divergente em um comparador de arquivos.

## Substituição parcial

- **Os 4 arquivos de backend são obrigatórios e vão juntos.** Os três serviços chamam métodos novos de `DocumentoNumeroService.java`; sem ele, o backend não compila.
- **Os 2 arquivos de front são recomendados, não obrigatórios.** Sem eles a regra continua garantida pelo backend, mas o seletor de item de um relatório avulso mostra itens incompatíveis e o usuário só descobre ao salvar, com uma mensagem de erro genérica.

## Lista dos 6 arquivos

**Backend (4)**

```
backend/src/main/java/sisaudin/service/cadastroBasico/DocumentoNumeroService.java
backend/src/main/java/sisaudin/service/cadastroBasico/FluxoDocumentoService.java
backend/src/main/java/sisaudin/service/cadastroBasico/RelatorioFinalService.java
backend/src/main/java/sisaudin/service/cadastroBasico/RelatorioPreliminarService.java
```

**Frontend (2)**

```
frontend/src/pages/RelatorioFinal.jsx
frontend/src/pages/RelatorioPreliminar.jsx
```
