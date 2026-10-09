# Aplicar em produção substituindo apenas os arquivos modificados

Este caminho só é seguro se os arquivos de produção forem **idênticos** à versão que o repositório de teste tinha antes das alterações. Se produção tiver qualquer mudança própria em um desses arquivos, copiar por cima apaga essa mudança. O script do pacote verifica isso antes de copiar.

## O que há no pacote (`pacote-reai-2026-10-08.zip`)

| Item | Conteúdo |
|---|---|
| `antes/` | Os 23 arquivos como estavam antes das alterações (commit `aa861f0`) |
| `depois/` | Os 26 arquivos na versão final (23 alterados + 3 novos) |
| `lista-arquivos.txt` | Caminhos dos 26 arquivos, relativos à raiz do repositório |
| `verificar-e-aplicar.ps1` | Compara produção com `antes/` e, se tudo bater, copia `depois/` |
| `reai.patch`, `rota-api-configuravel.patch` | As mesmas alterações no formato do git |
| Documentos `.md` | Relatório, prompts e este guia |

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
   | `NOVO` | Arquivo ainda não existe em produção; será criado |
   | `JA APLICADO` | Produção já tem a versão final |
   | `DIFERENTE` | Produção tem conteúdo próprio nesse arquivo |
   | `AUSENTE` | O arquivo não existe em produção |
   | `CONFLITO` | Um arquivo "novo" já existe em produção com outro conteúdo |

4. Se não houver `DIFERENTE`, `AUSENTE` nem `CONFLITO`, aplique:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\verificar-e-aplicar.ps1 -Destino C:\caminho\do\repositorio-producao -Aplicar
   ```

   Os originais são copiados para `_backup-reai-<data>` dentro do repositório de produção. Apague essa pasta depois de validar; ela não deve ir para o controle de versão.

5. Siga o roteiro de implantação do `RELATORIO-ALTERACOES.md` (seção 6): consultas no banco, build, publicação conjunta e conferência.

O script foi testado em uma cópia do código original: verificou, recusou quando um arquivo divergia, aplicou os 26 arquivos e o resultado ficou idêntico ao repositório de teste.

## Se algum arquivo der `DIFERENTE`, `AUSENTE` ou `CONFLITO`

O script não altera nada nesse caso. Opções, da mais simples para a mais trabalhosa:

1. **Patch com mesclagem**, na raiz do repositório de produção:

   ```bash
   git apply --3way --ignore-whitespace rota-api-configuravel.patch
   git apply --3way --ignore-whitespace reai.patch
   ```

   Onde houver conflito, o git marca o trecho no arquivo para resolução manual. A ordem importa: o segundo patch parte do resultado do primeiro.

2. **Prompts** de `PROMPTS-PRODUCAO.md`, que refazem as alterações lendo o código de produção como ele está.

3. **Manual**, comparando `antes/` e `depois/` de cada arquivo divergente em um comparador de arquivos.

## Substituição parcial

Se quiser levar só o REAI, sem a entrega do endereço configurável da API, atenção às dependências:

- **Obrigatórios para o REAI (18 arquivos):** os 11 de backend e, no front, `CriarDocumentoDropdown.jsx`, `relatorioPreliminarApi.js`, `relatorioFinalApi.js`, `RelatorioPreliminar.jsx`, `RelatorioFinal.jsx`, `ItemTrabalhoList.jsx` e `NotaPreliminar.jsx`.
- **Dependência:** `RelatorioPreliminar.jsx`, `RelatorioFinal.jsx` e `NotaPreliminar.jsx` importam `frontend/src/api/config.js`. Esse arquivo precisa ir junto, senão o build do front falha.
- **Opcionais:** `axiosInstance.js`, `refreshAxiosInstance.js`, `FileAttachmentManager.jsx`, `NotaFinal.jsx`, `NotaTecnica.jsx`, `Parecer.jsx` e `.env.development`. Não mudam o comportamento em produção; servem para rodar o front contra um backend local.

Backend e front precisam ser publicados juntos em qualquer um dos casos.

## Lista dos 26 arquivos

**Backend (11)**

```
backend/src/main/java/sisaudin/config/RelatorioEspecialMigration.java            (novo)
backend/src/main/java/sisaudin/controller/cadastroBasico/DocumentoNumeroController.java
backend/src/main/java/sisaudin/controller/cadastroBasico/RelatorioFinalController.java
backend/src/main/java/sisaudin/controller/cadastroBasico/RelatorioPreliminarController.java
backend/src/main/java/sisaudin/model/cadastroBasico/RelatorioFinal.java
backend/src/main/java/sisaudin/model/cadastroBasico/RelatorioPreliminar.java
backend/src/main/java/sisaudin/repository/cadastroBasico/PlanejamentoRepository.java
backend/src/main/java/sisaudin/service/cadastroBasico/DocumentoNumeroService.java
backend/src/main/java/sisaudin/service/cadastroBasico/FluxoDocumentoService.java
backend/src/main/java/sisaudin/service/cadastroBasico/RelatorioFinalService.java
backend/src/main/java/sisaudin/service/cadastroBasico/RelatorioPreliminarService.java
```

**Frontend (15)**

```
frontend/.env.development                              (novo, opcional)
frontend/src/api/config.js                             (novo, obrigatório)
frontend/src/api/axiosInstance.js                      (opcional)
frontend/src/api/refreshAxiosInstance.js               (opcional)
frontend/src/api/relatorioFinalApi.js
frontend/src/api/relatorioPreliminarApi.js
frontend/src/components/CriarDocumentoDropdown.jsx
frontend/src/components/FileAttachmentManager.jsx      (opcional)
frontend/src/pages/ItemTrabalhoList.jsx
frontend/src/pages/NotaFinal.jsx                       (opcional)
frontend/src/pages/NotaPreliminar.jsx
frontend/src/pages/NotaTecnica.jsx                     (opcional)
frontend/src/pages/Parecer.jsx                         (opcional)
frontend/src/pages/RelatorioFinal.jsx
frontend/src/pages/RelatorioPreliminar.jsx
```
