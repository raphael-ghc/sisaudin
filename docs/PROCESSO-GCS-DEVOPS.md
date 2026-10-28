# Sisaudin — proposta de gerência de configuração e DevOps

Proposta de processo para controle de versões, controle de construção e integração e entrega contínuas (CI/CD), pensada para a arquitetura atual. A arquitetura é:

- front em React/Vite servido pelo nginx;
- backend Spring Boot em JAR separado;
- MySQL;
- servidores Windows na rede interna (homologação e produção em `172.16.253.238`);
- código no GitHub.

A proposta é gradual: cada fase já se paga sozinha, e nenhuma exige trocar a arquitetura.

---

## 1. Situação atual

| Tema | Hoje | Risco |
|---|---|---|
| Fonte do código | Este repositório é cópia de teste; o código de produção fica em outro lugar e pode divergir. | Não se sabe com certeza o que está rodando; uma correção feita aqui pode não chegar lá, ou desfazer algo de lá. |
| Ramos | `main` mais ramos `patch-dd-mm-*`; commits sem revisão. | Mudanças entram sem conferência; ramos longos divergem. |
| Versões | Sem tags e sem número de versão (`0.0.1-SNAPSHOT`). A primeira foi nomeada à mão (2026.10). | Não há como dizer "produção está na versão X" nem voltar a ela com segurança. |
| Entregas | Arquivos `.patch` e relatórios em `docs/alteracoes-<data>/`, aplicados à mão no outro código. | Aplicação manual sujeita a erro; histórico espalhado. |
| Build | Comandos manuais, diferentes por ambiente (`--mode nginx`; `npm run build` aponta para o lugar errado). | O JAR e o front de produção podem sair de um código ou configuração diferente do homologado. |
| Configuração | `application.properties` versionado com senha do banco e segredos JWT; o de produção fica dentro do JAR. | Vazamento de segredos; trocar a configuração exige recompilar. |
| Banco | `ddl-auto=update` cria e altera tabelas na subida; ajustes de dados por scripts SQL avulsos. | Mudança de estrutura sem revisão nem histórico; nada impede rodar um script duas vezes ou esquecê-lo. |
| Testes | Um teste vazio (`contextLoads`), que depende de um MySQL acessível. Testes de aceite manuais (`TESTES-SISTEMA.html`). | Defeitos já corrigidos podem voltar, como o salvamento e o 400 do Planejamento. |
| Implantação | Roteiro manual de 51 passos (`CHECKLIST-PRODUCAO.html`). | Depende de quem executa; difícil de repetir igual. |
| Itens soltos | Cerca de 80 scripts de remendo na raiz e arquivos `copy`/`_backup` no código. | Confundem e podem ser executados por engano. |

---

## 2. Princípios

1. **Uma fonte da verdade:** um só repositório, e o que está em `main` é o que pode ir para produção.
2. **Construir uma vez, promover o mesmo pacote:** o pacote testado na homologação é o mesmo, byte a byte, que vai para produção. Só a configuração externa muda.
3. **Tudo que define o sistema está versionado:** código, migrações do banco, modelo do nginx, modelos de configuração, scripts de implantação e documentação. Segredos e dados ficam fora.
4. **Automatizar o que se repete; aprovar o que é arriscado:** build, testes e homologação são automáticos; produção exige aprovação de uma pessoa.
5. **Toda implantação tem volta:** pacote anterior guardado, backup antes e roteiro de retorno.

---

## 3. Controle de versões

### 3.1 Unificar o código (pré-requisito)

Antes de qualquer outra coisa:

1. Trazer o código que roda em produção para este repositório (ou o contrário), num ramo `producao-atual`.
2. Comparar com `main` e decidir, arquivo por arquivo, o que vale. As entregas de 08/10 a 26/10 já estão descritas em `docs/alteracoes-*`.
3. Marcar o ponto de partida com a tag `v2026.10.0` (a versão 2026.10 do `CONTROLE-VERSAO.md`), depois de implantada.
4. Deixar de manter código fora do repositório.

Repositório: hoje está numa conta pessoal (`raphael-ghc/sisaudin`). Vale passá-lo para uma organização do GHC, no GitHub ou num Git interno, conforme a política de TI, com acesso por equipe e não por pessoa.

### 3.2 Modelo de ramos (GitHub Flow)

| Ramo | Uso | Regra |
|---|---|---|
| `main` | Sempre implantável. | Protegido: só entra por pull request, com CI verde e uma revisão. Sem push direto. |
| `feat/<assunto>` | Funcionalidade nova (ex.: `feat/reai`). | Curto, de dias. Sai de `main` e volta por PR. |
| `fix/<assunto>` | Correção (ex.: `fix/rai-f-404`). | Idem. |
| `hotfix/<assunto>` | Correção urgente em produção. | Sai da tag em produção; volta para `main` por PR e gera versão de correção. |

Trunk-based com ramos curtos serve bem a uma equipe pequena. Git Flow (`develop`, `release/*`) dobraria o trabalho sem ganho aqui.

### 3.3 Versões e tags

- **Calendário:** `AAAA.MM.N`, por exemplo `2026.10.0` e `2026.10.1` para uma correção. As entregas já são organizadas por data e a área entende "versão de outubro". O número fica no `pom.xml`, no `package.json` e na tag `v2026.10.0`.
- **Uma tag por implantação em produção.** A tag é imutável. Para saber o que está em produção, basta olhar a última tag implantada.
- **Versão visível no sistema:** no rodapé do front (`VITE_APP_VERSION`) e numa rota do backend (`/api/versao` ou `/actuator/info`). Isso ajuda a conferir que o navegador e o servidor estão na versão certa.

### 3.4 Commits, PRs e histórico de mudanças

- Mensagens no padrão `tipo: descrição`, por exemplo `fix: RAI-F abria 404 após criar` ou `feat: Parecer no modelo oficial`. Tipos: `feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci`, `db`.
- O PR substitui o `.patch` e o relatório em `docs/alteracoes-<data>/`. A descrição do PR traz o sintoma, a causa, a correção, como foi testado e os efeitos no banco. O modelo vai em `.github/pull_request_template.md`.
- `CHANGELOG.md` na raiz, alimentado a cada PR na seção "Próxima versão" e fechado na tag. O `CONTROLE-VERSAO.md` de 2026.10 vira a primeira entrada.
- Demandas e defeitos em Issues (ou na ferramenta da TI), ligados ao PR que os resolve (`Corrige #12`).

### 3.5 Itens de configuração

| Versionado no repositório | Fora do repositório |
|---|---|
| Código do backend e do front | Senhas, segredos JWT, credenciais de e-mail |
| `package-lock.json`, Maven Wrapper | Arquivos enviados (`uploads/`) |
| Migrações do banco (`db/migration`) | Dumps e backups do banco |
| Modelos: `deploy/nginx/sisaudin.conf`, `deploy/config/application-*.properties.exemplo` | `application.properties` real de cada servidor |
| Scripts de build e implantação (`deploy/*.ps1`) | Logs |
| Documentação, checklists e testes de aceite | `node_modules`, `target`, `dist` |

Limpeza:

- mover os scripts de remendo da raiz para fora do ramo principal (o histórico do git guarda);
- apagar os arquivos `copy`/`_backup`, cujo papel o git já cumpre;
- incluir no `.gitignore` o `out.json` e o `response.json`.

---

## 4. Gestão da configuração dos ambientes

| Ambiente | Front | Backend | Banco |
|---|---|---|---|
| Desenvolvimento | `npm run dev` (5173) | `mvnw spring-boot:run` (8080) | MySQL local |
| Homologação | nginx + `dist` | JAR, porta 8081, `127.0.0.1` | Cópia recente de produção |
| Produção | nginx + `dist` | JAR, porta interna, sem acesso pela rede | `sisaudin_novo_v10` |

- **O mesmo JAR em todos os ambientes.** O que muda fica num `application.properties` ao lado do JAR (já é o modelo de 15/10). No repositório ficam só os modelos `.exemplo`, sem valores reais.
- **Segredos por variável de ambiente**, que o Spring lê sem mudar código: `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET` (conforme o nome da chave no código), `SPRING_MAIL_PASSWORD`. Também podem ficar no arquivo externo, com acesso restrito à conta do serviço.
- **Trocar os segredos atuais:** a senha do banco e os segredos JWT estão no histórico do git e foram compartilhados em conversa, então devem ser considerados expostos. Junto com isso, criar um usuário próprio do sistema no MySQL, com permissões só no banco `sisaudin_*`, no lugar de `root`.
- **Front:** o endereço da API já vem de `src/api/config.js` com os modos do Vite. Padronizar um único modo de produção (`nginx`) e remover ou corrigir o `.env.production`, que aponta para `:8080`, para que `npm run build` não gere um pacote errado.
- **nginx:** o modelo versionado em `deploy/nginx/` é a referência. Ao mudar o arquivo do servidor, mudar também o modelo, pelo PR.

### 4.1 Banco de dados: migrações versionadas

Trocar `ddl-auto=update` por **Flyway**, que o Spring Boot integra nativamente:

1. `V1__base.sql`: estrutura atual de produção, já com a coluna `especial` e a tabela `planejamento_gerencia_destinataria`. Em bancos existentes, aplicar com `baseline-on-migrate` (marca como aplicada, sem executar).
2. Cada mudança futura vira um arquivo novo (`V2__...sql`), revisado no PR, aplicado uma vez e na ordem, automaticamente na subida. O Flyway registra o que já rodou e recusa um arquivo alterado depois de aplicado.
3. Ajustes de dados de uso único, como a reclassificação REAI, também viram migração. Isso acaba com o "rodar o script depois da primeira subida".
4. Com o Flyway no lugar, `ddl-auto=validate`: o Hibernate só confere se as entidades batem com o banco e para a subida se não baterem, em vez de alterar tabelas sozinho.

---

## 5. Controle de construção

### 5.1 Build reproduzível

- Versões fixas das ferramentas: Java 17 (Temurin) e a versão do Node num arquivo `.nvmrc` e em `engines`, no `package.json`.
- Front com `npm ci`, que usa exatamente o `package-lock.json`, em vez de `npm install`.
- Backend pelo Maven Wrapper (`mvnw`), com a versão do Maven fixa no repositório.
- Um script único, `deploy/build.ps1`, que roda em qualquer máquina e no CI:
  1. `npm ci` → `npm run lint` → `vite build --mode nginx`;
  2. conferência de que o bundle não contém endereço de produção nem `:8080` (a mesma conferência do checklist);
  3. `mvnw clean verify` (compila e roda os testes);
  4. monta o pacote.

### 5.2 Pacote de versão (artefato)

Um arquivo por versão, `sisaudin-2026.10.0.zip`, com:

```
sisaudin-2026.10.0/
  backend/sisaudin-2026.10.0.jar
  frontend/            (conteúdo do dist)
  deploy/              (nginx de referência, modelos de configuração, scripts de implantação e de volta)
  CHANGELOG.md
  SHA256SUMS.txt
```

- Gerado **só pelo CI**, a partir de uma tag, e guardado nos Releases do GitHub ou num compartilhamento interno com retenção das últimas versões.
- A homologação recebe o pacote. A produção recebe **o mesmo pacote**, conferido pelo SHA-256.
- Ninguém gera JAR de produção na própria máquina.

---

## 6. Qualidade e testes

A pirâmide começa pelas regras que já quebraram:

| Nível | O que testar primeiro | Ferramenta |
|---|---|---|
| Unidade (backend) | `DocumentoNumeroService` (tipo pelo item, sequências RAI/REAI por ano, final herda o número); `FluxoDocumentoService` (opções e motivos do menu); cópia campo a campo nos serviços das notas | JUnit 5 + Mockito (já vêm no `spring-boot-starter-test`) |
| Integração (backend) | Leitura de JSON de documento com `itemTrabalho: {...}` depois de ler um `ItemTrabalho` (o erro 400 de 23/10); salvar e reler Planejamento com gerências; PATCH de relatório com listas | `@SpringBootTest` com MySQL de teste (serviço no CI ou Testcontainers, se houver Docker) |
| Unidade (front) | `mesclarRespostaSalvamento`; mapa de exclusão por `tipo`; `basePath` de cada tela | Vitest |
| Ponta a ponta | Roteiro curto baseado em `TESTES-SISTEMA.html`: login, criar e salvar RAI-P, recarregar, excluir | Playwright (já usado nos testes manuais desta etapa) |
| Aceite | `TESTES-SISTEMA.html`, executado pela área na homologação | Manual |

- O teste `contextLoads` atual precisa de um banco. No CI, ele roda com o MySQL de serviço, ou é trocado por testes que não sobem o contexto inteiro.
- Regra prática: **toda correção vem com o teste que teria pegado o defeito.**
- Análise estática: ESLint (já existe) e, opcionalmente, SpotBugs no backend. O Dependabot avisa sobre dependências com falhas de segurança.

---

## 7. Integração contínua (CI)

GitHub Actions, em todo PR e em todo push em `main`:

```yaml
# .github/workflows/ci.yml (esboço)
name: CI
on:
  pull_request:
  push:
    branches: [main]
    tags: ['v*']
jobs:
  build:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env: { MYSQL_ROOT_PASSWORD: teste, MYSQL_DATABASE: sisaudin_ci }
        ports: ['3306:3306']
        options: --health-cmd="mysqladmin ping" --health-interval=5s --health-retries=20
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: frontend/.nvmrc, cache: npm, cache-dependency-path: frontend/package-lock.json }
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: '17', cache: maven }
      - name: Front - lint e build
        working-directory: frontend
        run: |
          npm ci
          npm run lint
          npx vite build --mode nginx
          ! grep -rE "ghc\.com\.br|:8080" dist/assets   # bundle sem endereço fixo
      - name: Backend - testes e JAR
        working-directory: backend
        env:
          SPRING_DATASOURCE_URL: jdbc:mysql://localhost:3306/sisaudin_ci
          SPRING_DATASOURCE_USERNAME: root
          SPRING_DATASOURCE_PASSWORD: teste
        run: ./mvnw -B clean verify
      - name: Pacote (só em tag)
        if: startsWith(github.ref, 'refs/tags/v')
        run: pwsh deploy/build.ps1 -SomentePacote
      - uses: actions/upload-artifact@v4
        if: startsWith(github.ref, 'refs/tags/v')
        with: { name: pacote, path: 'sisaudin-*.zip' }
```

- **Proteção do `main`:** exigir o job `build` verde e uma aprovação antes do merge.
- Tempo esperado: 5 a 8 minutos por execução. Repositório privado no plano gratuito tem cota mensal de minutos, suficiente para uma equipe pequena.
- O CI roda na nuvem do GitHub e **não acessa** a rede interna. Por isso a entrega fica com um executor interno (seção 8).

---

## 8. Entrega contínua (CD)

### 8.1 Como alcançar servidores internos

Instalar um **executor próprio do GitHub Actions** (self-hosted runner) como serviço Windows no servidor de homologação, ou numa máquina interna com acesso aos dois servidores.

- Ele só faz conexões de saída para o GitHub: não é preciso abrir porta de entrada no firewall.
- Rodar com uma conta de serviço sem privilégios de administrador, com acesso só às pastas do Sisaudin, ao nginx e ao `mysqldump`.
- Usar só neste repositório privado, que não recebe PR de fora.
- Se a TI não permitir executor ligado ao GitHub, a mesma automação funciona puxando o pacote: um script agendado no servidor busca a versão aprovada no compartilhamento interno. A entrega deixa de ser disparada pelo GitHub, mas continua sem passos manuais.

### 8.2 Fluxo

```
PR aprovado → merge em main → CI → implanta na HOMOLOGAÇÃO (automático)
   → testes de fumaça automáticos → aceite da área (TESTES-SISTEMA.html)
   → tag v2026.11.0 → pacote → aprovação para PRODUÇÃO (pessoa responsável)
   → implanta na janela combinada → testes de fumaça → comunicação aos usuários
```

- **Homologação automática** a cada merge em `main`, com o banco de homologação atualizado periodicamente a partir de uma cópia de produção.
- **Produção com aprovação:** ambiente `producao` no GitHub, com revisores obrigatórios. Dependendo do plano do GitHub, essa regra pode não estar disponível em repositório privado. Nesse caso, um workflow manual (`workflow_dispatch`) restrito aos responsáveis cumpre o papel.

### 8.3 Script de implantação (`deploy/implantar.ps1`)

Automatiza o que hoje está no `CHECKLIST-PRODUCAO.html`:

1. Confere o SHA-256 do pacote.
2. Faz backup: `mysqldump` do banco, cópia de `uploads`, do JAR atual, do `nginx.conf` e do front atual, numa pasta com data e versão.
3. Para o serviço do backend, que roda como serviço Windows (WinSW ou NSSM), e não num console aberto.
4. Copia o JAR novo, mantendo o anterior ao lado.
5. Sobe o serviço; o Flyway aplica as migrações pendentes.
6. Espera `/actuator/health` responder `UP` (incluir `spring-boot-starter-actuator`, expondo só `health` e `info`). Se não responder em 2 minutos, volta sozinho para o JAR anterior.
7. Publica o front (`robocopy /MIR`), roda `nginx -t` e `nginx -s reload`.
8. Testes de fumaça: login técnico, `GET` de um item, abertura de uma página interna e confirmação de que a versão exibida é a nova.
9. Registra num log da implantação: versão, horário, responsável e resultado.

E `deploy/voltar.ps1`, que restaura o JAR, o front e o `nginx.conf` anteriores. O banco só volta pelo backup quando a migração não for compatível com a versão anterior; por isso, migrações devem ser preferencialmente aditivas.

### 8.4 Correções urgentes (hotfix)

Ramo `hotfix/*` a partir da tag em produção → PR → CI → homologação → tag `v2026.10.1` → produção com aprovação. O PR volta para `main` no mesmo dia.

---

## 9. Operação e observabilidade

- **Logs:** arquivo com rotação (`logging.file.name` e `logging.logback.rollingpolicy.*`), `show-sql=false` em produção e retenção de 30 dias.
- **Saúde:** `/actuator/health` monitorado a cada minuto (Zabbix ou o monitor da TI, se houver; um script agendado serve no começo), com alerta por e-mail.
- **Backups agendados**, além dos de implantação: `mysqldump` diário e cópia de `uploads`, retenção de 30 dias, cópia fora do servidor e um **teste de restauração por mês** numa base descartável.
- **Disco:** alerta quando `uploads`, logs ou backups passarem de 80%.

---

## 10. Papéis

| Atividade | Desenvolvedor | Revisor | Responsável pela versão | Área de Auditoria | TI / infraestrutura |
|---|---|---|---|---|---|
| Ramo, código, teste, PR | Faz | — | — | — | — |
| Revisão e merge | — | Faz | — | — | — |
| Aceite na homologação | Apoia | — | Acompanha | Faz | — |
| Tag e aprovação para produção | — | — | Faz | Consultada | Informada |
| Janela, backup, servidor | Apoia | — | Acompanha | Informada | Faz ou autoriza |
| Comunicação aos usuários | Redige | — | Aprova | Recebe | — |

Numa equipe de uma ou duas pessoas, o revisor pode ser a outra pessoa da equipe, ou o próprio autor no dia seguinte, com o checklist do PR. O importante é que nada entre em `main` sem passar pelo CI.

---

## 11. Plano de adoção

| Fase | Duração estimada | Entregas |
|---|---|---|
| **1. Base** | 1 a 2 semanas | Código unificado num repositório; `main` protegido; tag `v2026.10.0`; segredos fora do repositório e trocados; usuário próprio no MySQL; `CHANGELOG.md`; modelo de PR; limpeza da raiz; CI com lint, build do front e compilação do backend. |
| **2. Pacote e implantação** | 2 a 3 semanas | `build.ps1` e pacote versionado; versão visível na tela; backend como serviço Windows; `implantar.ps1` e `voltar.ps1`; executor interno; homologação automática a cada merge. |
| **3. Banco e testes** | 3 a 4 semanas | Flyway com linha de base e `ddl-auto=validate`; testes de unidade das regras RAI/REAI e do menu; teste de regressão do 400; Vitest no front; Playwright de fumaça no pipeline. |
| **4. Produção contínua** | Contínuo | Aprovação de produção pelo pipeline; monitoramento de saúde e disco; backups agendados com teste de restauração; Dependabot. |

A fase 1 resolve o risco maior, código divergente e segredos expostos, e não depende de aprovação de infraestrutura. As fases 2 e 4 precisam de alinhamento com a TI sobre o executor interno, a conta de serviço e o monitoramento.
