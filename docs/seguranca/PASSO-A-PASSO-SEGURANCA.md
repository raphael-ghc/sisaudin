# Sisaudin — passo a passo das mudanças de segurança

Roteiro para corrigir as fragilidades levantadas em 13/11/2026. Proposta, ainda não aplicada.
Todo passo vai primeiro para a **homologação** e só depois para a produção (servidor `172.16.253.238`, banco `sisaudin_novo_v10`).

## Visão geral

| Fase | O que muda | Mexe em código? | Pode ir sozinha para produção? | Efeito para o usuário |
|---|---|---|---|---|
| 0 | Preparação e levantamento | Não | — | Nenhum |
| 1 | Configuração do servidor (chaves, banco, rede, nginx) | Não | Sim, item a item | Todos precisam entrar de novo (troca das chaves JWT) |
| 2 | Backend: login obrigatório, perfis, uploads, PDF | Sim | **Não: só junto com a Fase 3** | Nenhum, se a Fase 3 for junto |
| 3 | Front: chamadas que hoje vão sem token | Sim | **Não: só junto com a Fase 2** | Nenhum |
| 4 | Médio prazo (XSS, sessão, trilha de auditoria) | Sim | Sim | Nenhum |

As Fases 2 e 3 são uma entrega só. Com o login obrigatório no backend e o front antigo, os anexos, os downloads e a colaboração das telas de documento param de funcionar.

---

## Fase 0 — Preparação

**0.1 Decisões da área, antes de escrever código:**
- **Matriz de perfis** (passo 2.4): o que cada perfil (SISTEMA, GESTOR, AUDITOR, VISITANTE) pode ver e alterar. Sugestão inicial na Fase 2.
- **Autocadastro** (`/api/auth/register`, tela `Register.jsx`): hoje qualquer um cria conta. A proposta é desligar e deixar o cadastro só com o perfil SISTEMA.
- **Certificado HTTPS**: pedir à TI do GHC um certificado para o nome do servidor (ex.: `sisaudin.ghc.com.br`), da autoridade interna ou pública.

**0.2 Levantamento no servidor de produção (só leitura):**
```powershell
# A porta do backend está aberta para a rede? "0.0.0.0:8080" = aberta; "127.0.0.1:8080" = só local
netstat -ano | findstr ":8080"
# E o MySQL?
netstat -ano | findstr ":3306"
# Configuração externa em uso
Select-String -Path "PASTA_DO_BACKEND\application.properties" -Pattern 'jwt','datasource','seeder','server.address','springdoc' | ForEach-Object { $_.Line }
```
Anotar também quem acessa o MySQL de fora do servidor (Workbench de outra máquina?). Isso decide o passo 1.4.

**0.3 Backup** do banco e da pasta `uploads\`, como na seção 4 do `docs/alteracoes-2026-11-10/CHECKLIST-PRODUCAO.html`.

---

## Fase 1 — Configuração do servidor (sem código novo)

Cada item é independente e pode ser revertido voltando ao arquivo anterior. Guardar uma cópia do `application.properties` e do `nginx.conf` antes de cada mudança.

### 1.1 Trocar as chaves JWT
As chaves atuais são de um tutorial público: qualquer um consegue gerar um token válido.
```powershell
# Rodar duas vezes: uma para access, outra para refresh
$b = New-Object byte[] 64; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
```
No `application.properties` **externo** (pasta do JAR):
```properties
jwt.access.secret=<valor 1>
jwt.refresh.secret=<valor 2>
```
Reiniciar o backend. **Efeito:** todas as sessões caem e todos entram de novo. Avisar a equipe.
Guardar os valores num cofre de senhas da TI. Nunca no git, no WhatsApp ou em e-mail.
Homologação e produção usam chaves **diferentes**.

### 1.2 Usuário próprio no MySQL e nova senha do `root`
```sql
CREATE USER 'sisaudin_app'@'localhost' IDENTIFIED BY '<senha forte>';
CREATE USER 'sisaudin_app'@'127.0.0.1' IDENTIFIED BY '<mesma senha>';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
  ON sisaudin_novo_v10.* TO 'sisaudin_app'@'localhost', 'sisaudin_app'@'127.0.0.1';
```
`CREATE`, `ALTER` e `REFERENCES` são exigidos pelo `ddl-auto=update` e pelas conversões da subida.
Testar a subida completa em homologação com esse usuário antes de levar à produção.
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/sisaudin_novo_v10?zeroDateTimeBehavior=CONVERT_TO_NULL&serverTimezone=America/Sao_Paulo
spring.datasource.username=sisaudin_app
spring.datasource.password=<senha forte>
```
Na URL saíram o `createDatabaseIfNotExist=true` e o `allowPublicKeyRetrieval=true`. Se o MySQL recusar a conexão sem eles, voltar só o `allowPublicKeyRetrieval` (servidor local).
Depois, trocar a senha do `root` (`ALTER USER 'root'@'localhost' IDENTIFIED BY '...'`) e guardá-la no cofre.

### 1.3 Desligar o que é só de desenvolvimento
No `application.properties` externo:
```properties
app.seeder.enabled=false
spring.jpa.show-sql=false
springdoc.api-docs.enabled=false
springdoc.swagger-ui.enabled=false
server.error.include-message=never
server.error.include-stacktrace=never
```
Apagar as linhas `spring.security.user.name` e `spring.security.user.password`, que não são usadas pelo login JWT.

### 1.4 Fechar as portas para a rede
```properties
server.address=127.0.0.1
```
Com isso, o backend só aceita conexões do nginx da mesma máquina.
O MySQL também, se ninguém o acessa de outra máquina: em `my.ini`, `bind-address=127.0.0.1`, e reiniciar o serviço.
Confirmar no Firewall do Windows que 8080 e 3306 não têm regra de entrada liberada.
Conferir de **outra máquina**: `Test-NetConnection 172.16.253.238 -Port 8080` deve falhar.

### 1.5 HTTPS e cabeçalhos no nginx
Modelo (ajustar nomes e caminhos; testar com `nginx.exe -t`):
```nginx
http {
    # ... (o que já existe)
    server_tokens off;
    limit_req_zone $binary_remote_addr zone=login:10m rate=10r/m;

    server {
        listen 80;
        server_name sisaudin.ghc.com.br;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl;
        server_name sisaudin.ghc.com.br;
        ssl_certificate      C:/nginx/conf/sisaudin.crt;
        ssl_certificate_key  C:/nginx/conf/sisaudin.key;
        ssl_protocols        TLSv1.2 TLSv1.3;
        client_max_body_size 50m;

        root html;
        index index.html;

        add_header X-Content-Type-Options nosniff always;
        add_header X-Frame-Options SAMEORIGIN always;
        add_header Referrer-Policy same-origin always;
        # Ligar só depois de uma semana de HTTPS estável:
        # add_header Strict-Transport-Security "max-age=31536000" always;

        location / { try_files $uri $uri/ /index.html; }

        # Tentativas de login: até 10 por minuto por IP
        location = /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://127.0.0.1:8080;
            include sisaudin-proxy.conf;
        }

        location /api/ {
            proxy_pass http://127.0.0.1:8080;
            include sisaudin-proxy.conf;
        }

        # Arquivos enviados: nunca executar como página
        location /uploads/ {
            proxy_pass http://127.0.0.1:8080;
            include sisaudin-proxy.conf;
            add_header X-Content-Type-Options nosniff always;
            add_header Content-Security-Policy "default-src 'none'; img-src 'self'; sandbox" always;
        }
    }
}
```
`sisaudin-proxy.conf` (mesma pasta do `nginx.conf`):
```nginx
proxy_set_header Host              $http_host;
proxy_set_header X-Real-IP         $remote_addr;
proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_read_timeout 120s;
```
**Armadilha do nginx:** um `add_header` dentro de um `location` anula todos os `add_header` do `server`. Os blocos que têm `add_header` próprio (`/uploads/`, e `= /index.html` e `/assets/` se forem mantidos) precisam repetir os cabeçalhos de segurança.

Depois, no `application.properties`: `sisaudin.link=https://sisaudin.ghc.com.br/login`.
O front não muda: com o build `--mode nginx`, a API é chamada por `/api`, relativo.

### 1.6 Testes da Fase 1
- Login, abrir e salvar um documento, gerar PDF, enviar anexo e foto de perfil.
- `http://` redireciona para `https://`, e o navegador mostra o cadeado sem aviso.
- De outra máquina, as portas 8080 e 3306 estão fechadas.
- `https://.../swagger-ui/index.html` não abre a documentação da API.

---

## Fase 2 — Backend (entrega única com a Fase 3)

### 2.1 Login obrigatório na API
[SecurityConfig.java](../../backend/src/main/java/sisaudin/security/config/SecurityConfig.java):
```java
.authorizeHttpRequests(req -> req
        .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/refresh-token").permitAll()
        .requestMatchers(HttpMethod.GET, "/uploads/perfis/**").permitAll()   // <img> não manda token
        .requestMatchers("/error").permitAll()
        .requestMatchers(SecurityConfig::isPaginaDoFront).permitAll()
        .anyRequest().authenticated())
```
- Sai o `/api/**` liberado, o `/api/auth/register` (se a área confirmar, passo 0.1) e o Swagger.
- `isPaginaDoFront` libera qualquer GET fora de `/api/` e `/uploads/`. Hoje isso inclui `/v3/api-docs`, `/swagger-ui` e `/ws-collab`. Acrescentar esses prefixos à exclusão, senão eles continuam abertos.
- `/ws-collab`: não há tratador desse endereço no backend desta cópia. Conferir se a produção tem um.
  - **Se não tiver**, remover a liberação daqui e o código SockJS das telas (passo 3.4).
  - **Se tiver**, autenticar pelo cabeçalho do `CONNECT` do STOMP, com um `ChannelInterceptor`. O handshake do SockJS não leva o `Authorization`.

### 2.2 Só os anexos de perfil saem como arquivo estático
Hoje o [WebMvcConfig.java](../../backend/src/main/java/sisaudin/config/WebMvcConfig.java) serve a pasta `uploads/` inteira. Os anexos dos documentos também ficam acessíveis pelo caminho, sem passar pela API. Trocar por:
```java
registry.addResourceHandler("/uploads/perfis/**")
        .addResourceLocations("file:/" + uploadPath + "/perfis/");
```
Os anexos passam a sair só por `GET /api/anexos/download/{id}`, que exige login.

### 2.3 CORS só para o endereço do sistema
- No `SecurityConfig`, ler as origens de uma propriedade, em vez de `*`:
  ```java
  @Value("${sisaudin.cors.origens:http://localhost:5173}")
  private List<String> origensPermitidas;
  // ...
  config.setAllowedOrigins(origensPermitidas);
  config.setAllowCredentials(false);   // o token vai no cabeçalho, não em cookie
  ```
  Em produção: `sisaudin.cors.origens=https://sisaudin.ghc.com.br`.
- Remover o `@CrossOrigin` dos cerca de 18 controllers (`Grep "@CrossOrigin" backend/src`). Ele passa por cima da configuração central.

### 2.4 Autorização por perfil
**Sugestão de matriz** (a área confirma no passo 0.1):

| Ação | SISTEMA | GESTOR | AUDITOR | VISITANTE |
|---|---|---|---|---|
| Ler documentos e itens | sim | sim | sim | sim |
| Criar e editar documentos, anexos e PDF | sim | sim | sim | não |
| Excluir documentos e itens | sim | sim | não | não |
| Cadastros básicos (gerência, tipos, técnicas…) | sim | sim | não | não |
| Pessoas: criar, alterar perfil, senha de outros | sim | não | não | não |
| Trocar a própria senha | sim | sim | sim | sim |

Implementação:
- Regras por método e caminho no `SecurityConfig`, por exemplo `.requestMatchers(HttpMethod.DELETE, "/api/**").hasAnyRole("SISTEMA","GESTOR")`. Elas cobrem muitas telas de uma vez; o `@PreAuthorize` fica só para as exceções.
- No [BaseController.java](../../backend/src/main/java/sisaudin/controller/cadastroBasico/generico/BaseController.java), trocar `hasRole('ADMIN')` (perfil que não existe) por `hasAnyRole('SISTEMA','GESTOR')`.
- [PessoaService](../../backend/src/main/java/sisaudin/service/cadastroBasico/PessoaService.java): `putUpdate`/`patchUpdate` só copiam `role` e `password` se quem chama for SISTEMA. Para o próprio usuário, criar uma rota `PATCH /api/pessoa/me/senha` que pede a senha atual.
- O usuário precisa estar ativo: `CustomUserDetails.isEnabled()` devolve `"ACTIVE".equals(status)`, e o `AuthService.refreshToken` recusa usuário inativo.
- O campo `responsavel` dos anexos passa a vir do usuário logado, não do formulário.

### 2.5 Senha padrão e carga inicial
- No `application.properties` versionado: `app.seeder.enabled=false`. Quem precisar da carga inicial liga só na máquina local.
- No `PessoaSeeder`, remover o trecho que põe `123456` em quem está sem senha.
- Nova coluna `pessoa.trocar_senha` (boolean). Uma conversão única na subida, registrada em `sisaudin_migracao` como a `PlanejamentoMatrizMigration`, marca `true` em quem tem senha igual a `123456`, comparando com `passwordEncoder.matches`. O login devolve essa marca e o front leva direto para a troca de senha.

### 2.6 Segredos fora do arquivo versionado
- No `application.properties` versionado, deixar só valores de desenvolvimento, sem senha real, e trocar os segredos por variáveis:
  ```properties
  jwt.access.secret=${JWT_ACCESS_SECRET}
  jwt.refresh.secret=${JWT_REFRESH_SECRET}
  spring.datasource.password=${DB_PASSWORD}
  ```
- Na máquina de desenvolvimento, os valores ficam em `backend/config/application.properties`. O Spring lê esse arquivo sozinho e ele já está no `.gitignore`.
- Em produção, ficam no `application.properties` externo, como hoje.
- Apagar do git as cópias `application copy*.properties` (`git rm --cached`).

### 2.7 Uploads
- **Anexos:** aceitar só uma lista de extensões (ex.: `pdf, doc, docx, xls, xlsx, ppt, pptx, odt, ods, png, jpg, jpeg, gif, txt, csv, zip`) e recusar o resto com 400.
- **Foto de perfil:** só `png`, `jpg`, `jpeg` e `webp`, conferindo o tipo real do arquivo (`ImageIO.read` diferente de `null`). A extensão gravada vem da lista, não do nome enviado.
- **Download:** montar o cabeçalho com `ContentDisposition.attachment().filename(nome, StandardCharsets.UTF_8).build()`, em vez de concatenar o nome.
- **Limite de tamanho:** apagar `server.tomcat.max-swallow-size=-1`.
- **Erros:** não devolver `e.getMessage()` ao cliente. Registrar no log e responder uma mensagem fixa.

### 2.8 Geração de PDF
Em [PdfGeneratorService.java](../../backend/src/main/java/sisaudin/service/PdfGeneratorService.java):
- **Login:** passa a ser exigido pelo passo 2.1.
- **Tamanho:** recusar HTML acima de um limite (ex.: 15 MB).
- **Rede e JavaScript:** criar a página com rede bloqueada e sem JavaScript:
  ```java
  BrowserContext ctx = browser.newContext(new Browser.NewContextOptions().setJavaScriptEnabled(false));
  Page page = ctx.newPage();
  page.route("**/*", route -> {
      if (route.request().url().startsWith("data:")) route.resume(); else route.abort();
  });
  ```
  As telas já convertem as imagens em `data:` antes de enviar (`fetch(imgEl.src)`). Testar em todas as telas que geram PDF se nenhuma imagem ou fonte some.
- **Concorrência:** no máximo 2 PDFs ao mesmo tempo (`Semaphore`). Hoje cada pedido abre um Chromium.
- **Versão:** atualizar o Playwright (1.41.0 é de janeiro de 2024) e testar.

### 2.9 Pequenos ajustes
- `spring.jpa.show-sql=false` no arquivo versionado.
- Trocar `e.printStackTrace()` por log nos controllers que o usam.

---

## Fase 3 — Front (entrega única com a Fase 2)

### 3.1 Anexos com token
As telas abaixo chamam os anexos com `fetch` puro, que não leva o token. Trocar pelo `api` de [axiosInstance.js](../../frontend/src/api/axiosInstance.js), que põe o token e renova a sessão. As três chamadas de cada tela (listar, enviar, excluir):
- `NotaFinal.jsx` (727, 757, 776)
- `NotaPreliminar.jsx` (575, 605, 624)
- `NotaTecnica.jsx` (552, 582, 601)
- `Parecer.jsx` (560, 590, 609)
- `RelatorioFinal.jsx` (730, 760, 779)
- `RelatorioPreliminar.jsx` (603, 633, 652)

Melhor criar um `src/api/anexosApi.js` com as três funções e usá-lo nas seis telas. As telas são parecidas e a mudança se repete.

### 3.2 Download de anexos
Um link `href` não leva o token. Trocar os links de `${API_URL}/anexos/download/{id}` por uma função que baixa pelo `api` (`responseType: 'blob'`) e abre ou salva o arquivo:
- `FileAttachmentManager.jsx:61`
- `MatrizAchados.jsx:418`
- as visualizações nas seis telas acima (`url: f.url || ...`)

### 3.3 Limpeza de sessão
- Remover os `console.log` do token em `axiosInstance.js` (linhas 40, 46 e 66).
- Se o autocadastro for desligado (passo 0.1), remover a rota e a tela `Register.jsx` e o `register` do `authApi.js`.
- Tela de troca obrigatória de senha (passo 2.5).

### 3.4 Colaboração (`/ws-collab`)
Seguir a decisão do passo 2.1. Se não houver tratador no backend de produção, remover a conexão SockJS das quatro telas: `RelatorioPreliminar`, `Parecer`, `NotaTecnica`, `NotaPreliminar`.

### 3.5 Esconder ações por perfil
Esconder no front os botões que o perfil não pode usar, conforme a matriz do passo 2.4. Isso é só conforto: quem barra de fato é o backend.

---

## Testes da entrega Fases 2 + 3 (homologação)

**Sem login, tudo recusado:**
```powershell
# Esperado: 401
(Invoke-WebRequest https://HOMOLOGACAO/api/planejamentos -UseBasicParsing -SkipHttpErrorCheck).StatusCode
(Invoke-WebRequest https://HOMOLOGACAO/api/pessoa -UseBasicParsing -SkipHttpErrorCheck).StatusCode
# Esperado: sem cabeçalho Access-Control-Allow-Origin
(Invoke-WebRequest https://HOMOLOGACAO/api/auth/login -Method Options -Headers @{Origin='https://outro-site.example'; 'Access-Control-Request-Method'='POST'} -UseBasicParsing -SkipHttpErrorCheck).Headers['Access-Control-Allow-Origin']
```
`-SkipHttpErrorCheck` só existe no PowerShell 7. No 5.1, usar `try { ... } catch { $_.Exception.Response.StatusCode }`.

**Com login, por perfil**, uma conta de teste de cada perfil:
- Abrir, criar, salvar e excluir cada tipo de documento conforme a matriz.
- Nas seis telas: enviar, listar, baixar e excluir anexo.
- Gerar PDF em todas as telas que geram: conferir imagens, sumário e notas de rodapé.
- Enviar e ver a foto de perfil.
- VISITANTE não consegue salvar (403) e não vê os botões.
- AUDITOR não consegue mudar o perfil de ninguém (`PATCH /api/pessoa/{id}` com `role` → 403 ou campo ignorado).
- A sessão expira e é renovada sem perder o que estava sendo editado.
- Usuário inativo não entra.
- Usuário com senha `123456` é levado à troca de senha.

**Arquivos:**
- Um `.html` enviado como anexo é recusado.
- A foto com extensão trocada (`.html` renomeado para `.png`) é recusada.
- Um anexo não abre por `/uploads/<documento>/...`.

Registrar os casos novos em `docs/alteracoes-2026-10-27/TESTES-SISTEMA.html` (o CLAUDE.md pede isso quando muda regra coberta ali).

## Implantação em produção

1. **Fase 1**, item a item, fora do horário de uso, com aviso prévio da troca das chaves (1.1).
2. **Fases 2 + 3** juntas: JAR novo e `dist` novo na mesma janela. Seguir o modelo do `CHECKLIST-PRODUCAO.html` de 10/11 (backup, subida, conferência, testes).
3. Acrescentar a versão em `frontend/src/data/versoes.js` (troca de senha obrigatória, fim do autocadastro) e avisar a equipe.

**Plano de volta:**
- Fase 1: restaurar a cópia do `application.properties` ou do `nginx.conf` e reiniciar. A troca das chaves JWT não tem volta, e não precisa.
- Fases 2 + 3: voltar o JAR **e** o `dist` anteriores juntos. A coluna `trocar_senha` pode ficar no banco sem uso.

---

## Fase 4 — Médio prazo

- **XSS nos textos ricos:**
  - Sanitizar no **backend** ao gravar, com jsoup `Safelist`, nos campos HTML de todos os documentos.
  - No **front**, usar uma função única `sanitizeHtml` (DOMPurify) em todo `dangerouslySetInnerHTML`. Hoje são cerca de 170 usos, e só o Planejamento sanitiza.
- **Sessão:**
  - Access token de 15 a 30 minutos; o refresh já renova sozinho.
  - Refresh token em cookie `HttpOnly` + `Secure` + `SameSite=Strict`, em vez do `localStorage`.
  - Guardar no banco só o hash do refresh token.
  - Revogar as sessões ao trocar senha ou perfil.
- **Trilha de auditoria:** quem criou, alterou e excluiu cada documento e quando (Hibernate Envers ou colunas `criado_por`/`alterado_por`).
- **Repositório:**
  - Verificador de segredos (gitleaks) no pre-commit e na CI.
  - Tirar do git os arquivos já versionados que o `.gitignore` novo bloqueia.
  - Tirar do `PessoaSeeder` os nomes, e-mails e cartões-ponto reais (LGPD).
- **Infraestrutura:**
  - Backups do banco e de `uploads\` criptografados e fora do servidor.
  - E-mail com conta de serviço (`sisaudin@ghc.com.br`), com autenticação e TLS, em vez do remetente pessoal.
  - Atualização periódica das dependências (Playwright, springdoc, jjwt).
