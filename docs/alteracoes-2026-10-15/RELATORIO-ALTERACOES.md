# Relatório de alterações — 15/10/2026

Alteração feita no repositório de teste do Sisaudin em 15/10/2026: **JAR unificado**. O build do front passa a ir dentro do JAR do backend, e um único processo Java serve as telas e a API pela mesma porta. Objetivo imediato: montar a homologação; o mesmo JAR pode ir depois para produção.

Ponto de partida: commit `8ffca6f` do repositório de teste. Independe das entregas de 08/10 e 09/10 (não toca nos mesmos trechos), mas deve ser aplicada depois delas.

Documentos desta pasta:

- `RELATORIO-ALTERACOES.md` — este relatório.
- `jar-unificado.patch` — as diferenças exatas, no formato do git (inclui o arquivo novo `frontend/.env.unificado`).
- `application.properties.homologacao.exemplo` — modelo da configuração externa da homologação.

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
npx vite build --mode unificado
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

## 5. Como desfazer

```powershell
git apply -R docs/alteracoes-2026-10-15/jar-unificado.patch
```

Ou voltar os oito arquivos alterados e apagar `frontend/.env.unificado`. Não há nada a desfazer no banco.
