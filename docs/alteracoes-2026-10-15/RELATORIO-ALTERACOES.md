# Relatório de alterações — 15/10/2026

Alteração feita no repositório de teste do Sisaudin em 15/10/2026: **JAR unificado**. O build do front passa a ir dentro do JAR do backend, e um único processo Java serve as telas e a API pela mesma porta. Objetivo imediato: montar a homologação; o mesmo JAR pode ir depois para produção.

Ponto de partida: commit `8ffca6f` do repositório de teste. Independe das entregas de 08/10 e 09/10 (não toca nos mesmos trechos), mas deve ser aplicada depois delas.

> **Atualização de 21/10/2026 — front no nginx, backend separado.** A homologação passa a usar o front publicado no nginx e o JAR só com a API. O JAR unificado continua possível, mas virou opcional (perfil Maven `com-front`). Ver a seção 5. As seções 1 a 4 descrevem a entrega original de 15/10.

Documentos desta pasta:

- `RELATORIO-ALTERACOES.md` — este relatório.
- `jar-unificado.patch` — as diferenças exatas, no formato do git (inclui o arquivo novo `frontend/.env.unificado`).
- `application.properties.homologacao.exemplo` — modelo da configuração externa da homologação.
- `CHECKLIST-HOMOLOGACAO.html` — checklist interativo para levantar a homologação (abrir no navegador; as marcações ficam salvas nele). Atualizado em 21/10 para nginx + backend.
- `nginx.homologacao.conf` — modelo do `nginx.conf` da homologação (21/10).

---

## 1. O que mudou

### Frontend (5 arquivos alterados, 1 novo)

| Arquivo | Mudança |
|---|---|
| `src/api/config.js` | `\|\|` trocado por `??`. Valor vazio passa a ser aceito (antes caía no endereço de produção). Variável ausente continua caindo no padrão de produção, então os builds de desenvolvimento e de produção não mudam. |
| `.env.unificado` (novo) | `VITE_API_BASE=` vazio e `VITE_API_URL=/api`. O front chama o próprio servidor que o entregou; o mesmo build serve em qualquer endereço. |
| `pages/NotaPreliminar.jsx`, `NotaTecnica.jsx`, `Parecer.jsx`, `RelatorioPreliminar.jsx` | A conexão `ws-collab` tinha o endereço de produção escrito no código e passa a usar `API_BASE` de `config.js`. Sem isso, a homologação tentaria conectar na produção. |

O modo se chama `unificado` e não `jar` porque o `.gitignore` da raiz ignora `*.jar`, e um `.env.jar` ficaria fora do git.

### Backend (3 arquivos)

| Arquivo | Mudança |
|---|---|
| `config/WebMvcConfig.java` | Serve `classpath:/static/` em `/**`. Arquivo existente é devolvido; qualquer outro caminho devolve o `index.html` (rotas do React, F5 em tela interna). Caminhos do backend (`api/`, `uploads/`, `ws-collab`, `v3/`, `swagger-ui`, `error`) nunca caem no `index.html`: rota inexistente continua 404. |
| `security/config/SecurityConfig.java` | Antes de `anyRequest().authenticated()`, libera **apenas GET** fora de `/api/` e `/uploads/` (o front). POST/PUT/PATCH/DELETE fora de `/api` e todo `/uploads` continuam exigindo token. |
| `pom.xml` | `maven-resources-plugin` copia `../frontend/dist` para `static/` dentro do JAR, na fase `process-resources`. |

### O que não mudou

Entidades, controllers, serviços, rotas da API e banco de dados. Nenhum dado é alterado.

### Efeito em quem não usa o JAR unificado

- **Desenvolvimento** (`npm run dev` + `spring-boot:run`): sem mudança. `.env.development` define as duas variáveis.
- **Produção atual** (front no nginx, backend separado): o build com `npm run build` continua igual. No backend, um GET fora de `/api` e `/uploads` que antes dava 401 agora dá 404 (não há `static/` sem o front embutido) ou o `index.html`. Nenhuma rota da API muda.

---

## 2. Como gerar e subir a homologação

### Gerar o JAR (na máquina de desenvolvimento)

Com o backend local **parado** (o build escreve em `backend/target`):

```powershell
cd frontend
npx.cmd vite build --mode unificado
(Select-String -Path dist\assets\*.js -Pattern 'sisaudin.ghc.com.br' -SimpleMatch).Count   # deve dar 0

cd ..\backend
.\mvnw.cmd clean package -DskipTests
```

Resultado: `backend\target\sisaudin-0.0.1-SNAPSHOT.jar` (cerca de 250 MB, quase tudo do driver do Playwright).

**Atenção:**

- **Front sempre antes do JAR.** Sem `frontend/dist`, o JAR sai sem o front e sem aviso. Com um `dist` antigo, sai com o front antigo.
- **`npm run build` não serve aqui.** Ele usa `.env.production`, que aponta para a produção.
- **O `frontend/dist` é sobrescrito.** Se ele também é a fonte do deploy no nginx de produção, refaça o build de produção antes de publicar por lá.

### Preparar o servidor de homologação

1. Java 17 ou mais novo.
2. Banco `sisaudin_homolog`, restaurado de um backup de produção. Usuário MySQL próprio com `SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES, DROP` nesse banco.
   - **Backup sem a coluna `especial`** (produção ainda sem a entrega de 08/10) é o caso esperado. Não é preciso alterar a exportação: na primeira subida do JAR, o Hibernate cria a coluna e a `RelatorioEspecialMigration` classifica os relatórios antigos pela sigla do item. Antes de subir, rode a prévia da classificação; depois, confira o log e os totais (seções 3, 7 e 9 do `CHECKLIST-HOMOLOGACAO.html`). A homologação serve de ensaio dessa mesma migração em produção.
3. Pasta de execução, por exemplo `C:\sisaudin-homolog\`, com:
   - o JAR;
   - `application.properties`, copiado de `application.properties.homologacao.exemplo` com os `TROCAR_*` preenchidos;
   - `uploads\`, copiada de produção, se quiser os anexos.
4. SMTP falso (MailHog ou smtp4dev) na porta 1025. **O banco restaurado tem os e-mails reais dos usuários.**
5. Chromium do Playwright instalado com o usuário que roda o serviço. É necessário para gerar PDF.

### Subir

```powershell
cd C:\sisaudin-homolog
java -jar sisaudin-0.0.1-SNAPSHOT.jar
```

Executar **de dentro da pasta**. É de lá que o Spring lê o `application.properties` externo e onde fica `uploads\`. Acessar `http://SERVIDOR:8081`.

Com HTTPS, o nginx fica só como proxy de tudo para a porta 8081. Ele precisa de `proxy_set_header` `Host` e `X-Forwarded-*` e de `client_max_body_size 50m`; dispensa `root` e `try_files`.

---

## 3. O que foi testado e o que não foi

**Testado** com um JAR gerado deste código numa cópia do projeto, na porta 8092, contra o MySQL local, com os seeders desligados:

| Requisição | Resultado |
|---|---|
| `GET /`, `/login`, `/ItemTrabalho/81`, `/relatorio-preliminar/5` | 200, `index.html` |
| `GET /assets/index-*.js`, `/vite.svg` | 200, arquivo correto |
| `GET /api/fluxo-documentos/item/1` | 200, JSON |
| `GET /api/rota-que-nao-existe` | 404 (não cai no front) |
| `GET /swagger-ui/index.html`, `/v3/api-docs` | 200, como antes |
| `GET /uploads/...` sem token | 401, como antes |
| `POST /qualquer-coisa`, `DELETE /dashboard` sem token | 401 |

Também verificado:

- o JAR contém `BOOT-INF/classes/static/` com o build;
- o bundle do modo `unificado` não contém `sisaudin.ghc.com.br` e usa `/api` relativo;
- os arquivos do repositório são idênticos aos da cópia testada.

**Não testado:**

- login, navegação, upload e geração de PDF no navegador com o JAR;
- o JAR num servidor diferente desta máquina;
- o build usou o JDK 26 desta máquina, com o projeto compilado para Java 17.

---

## 4. Pontos em aberto, não tratados nesta entrega

- **`/uploads/**` exige token, mas `<img>` não envia o token.** Fotos de perfil podem não aparecer. Já era assim antes; conferir na homologação.
- **O backend não tem a rota `ws-collab`.** O front tenta conectar (edição colaborativa) e falha. Já falhava antes; agora falha contra o próprio servidor, e não contra a produção.
- **`/api/**` continua com `permitAll`.** A API responde sem token. Não muda com esta entrega.
- **Constantes `API_URL` mortas** com o endereço de produção em `notaFinalApi.js`, `notaPreliminarApi.js`, `notaTecnicaApi.js`, `parecerApi.js`, `relatorioFinalApi.js` e `relatorioPreliminarApi.js`. Não são usadas e não entram no bundle; podem ser removidas.

---

## 5. Atualização de 21/10/2026 — front no nginx, backend separado

### O que mudou

| Arquivo | Mudança |
|---|---|
| `backend/pom.xml` | A cópia de `frontend/dist` para dentro do JAR saiu do build padrão e foi para o perfil `com-front`. `mvnw.cmd clean package` gera o JAR **só com a API**; `-Pcom-front` gera o JAR unificado. |
| `frontend/.env.nginx` (novo) | Mesmo conteúdo do `.env.unificado` (`VITE_API_BASE` vazio, `VITE_API_URL=/api`), com nome que indica o uso: front no nginx chamando `/api` no próprio endereço. |
| `docs/.../nginx.homologacao.conf` (novo) | Modelo do nginx: serve `C:/sisaudin-homolog/frontend`, `try_files` para as rotas do React, repassa `/api` e `/uploads` a `127.0.0.1:8081`, `client_max_body_size 50m`, `proxy_read_timeout 120s`. |
| `docs/.../application.properties.homologacao.exemplo` | `server.address=127.0.0.1` (backend aceita conexão só do nginx na mesma máquina) e `sisaudin.link` com o endereço do nginx. |
| `CHECKLIST-HOMOLOGACAO.html` | Seção 1: portas 80/8081, firewall, instalação do nginx. Seção 4: build `--mode nginx` e JAR sem front. Seção 5: cópia do front para `C:\sisaudin-homolog\frontend`. Nova seção 7b: configurar, iniciar e conferir o nginx. |

`WebMvcConfig` e `SecurityConfig` (entrega de 15/10) **ficam como estão**. Num JAR sem front, um GET fora de `/api` e `/uploads` responde 404 em vez de 401; atrás do nginx essas requisições nem chegam ao backend.

### Caminhos que o nginx repassa ao backend

- `/api/` — toda a API.
- `/uploads/` — fotos de perfil: a URL é gravada como `/uploads/perfis/...` e o navegador a pede ao próprio nginx.
- `/ws-collab` não precisa: o backend não tem essa rota (pendência da seção 4).

### Testado

- `mvnw.cmd process-resources` sem perfil não copia o front; com `-Pcom-front` copia (`static/index.html`).
- `vite build --mode nginx` gera bundle sem `sisaudin.ghc.com.br` e com `/api` relativo.

**Não testado:** o `nginx.homologacao.conf` não foi executado nesta máquina (nginx não instalado aqui); conferir com `nginx.exe -t` e os itens da seção 7b do checklist.

---

## 6. Como desfazer

```powershell
git apply -R docs/alteracoes-2026-10-15/jar-unificado.patch
```

O patch contém as alterações de 15/10 e de 21/10 juntas. Ou voltar os oito arquivos alterados e apagar `frontend/.env.unificado` e `frontend/.env.nginx`. Não há nada a desfazer no banco.
