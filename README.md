# sisaudin
# Documento de Configuração de Software - Sisaudin

Este documento descreve as características técnicas, arquitetura e instruções para configuração e execução do projeto **Sisaudin** em ambiente de desenvolvimento local.

---

## 1. Características do Sistema e Tecnologias

O sistema é dividido em duas partes principais: um **Backend** construído com Java/Spring Boot que fornece uma API RESTful, e um **Frontend** construído com React utilizando o Vite como build tool.

### 1.1. Backend
- **Linguagem:** Java 17
- **Framework Principal:** Spring Boot 4.0.0
- **Gerenciador de Dependências:** Maven
- **Banco de Dados:** MySQL (Driver `mysql-connector-j` 9.1.0)
- **Mapeamento Objeto-Relacional (ORM):** Spring Data JPA / Hibernate
- **Auditoria de Dados:** Hibernate Envers (para manter histórico de alterações)
- **Segurança e Autenticação:** Spring Security + JWT (JSON Web Tokens)
- **Geração de PDF:** Microsoft Playwright e Apache PDFBox
- **Templates e E-mail:** Spring Mail e Thymeleaf
- **Documentação de API:** Springdoc OpenAPI (Swagger)
- **Porta Padrão:** `8080`

### 1.2. Frontend
- **Linguagem / Biblioteca Principal:** React 19 (com Vite)
- **Roteamento:** React Router DOM (v7)
- **Estilização:** Tailwind CSS (v4)
- **Requisições HTTP:** Axios
- **Componentes Visuais e Ícones:** Lucide React, SweetAlert2, React Select, React Toastify
- **Gráficos:** Recharts
- **Exportação (PDF):** html2pdf.js
- **Porta Padrão:** Geralmente `5173` (padrão do Vite)

---

## 2. Configuração do Banco de Dados

Antes de rodar a aplicação, é necessário configurar o banco de dados.

1. Instale o **MySQL Server**.
2. Crie o banco de dados utilizado pelo sistema:
   ```sql
   CREATE DATABASE sisaudin_novo_v10;
   ```
3. O projeto está configurado para acessar o banco local com as seguintes credenciais (definidas em `backend/src/main/resources/application.properties`):
   - **Host:** `localhost`
   - **Usuário:** `root`
   - **Senha:** `mysql`
   *(Se as suas credenciais locais forem diferentes, altere provisoriamente no arquivo `application.properties`).*

---

## 3. Como Rodar o Sistema

Para que o sistema funcione corretamente, você deve rodar os dois serviços (Backend e Frontend) simultaneamente em terminais separados.

### Passo 1: Executar o Backend (API)
Abra um terminal, navegue até a pasta raiz do projeto e siga os comandos:

1. Acesse o diretório do backend:
   ```bash
   cd backend
   ```
2. Execute o projeto usando o Maven Wrapper (já incluído no projeto):
   - **No Windows:**
     ```bash
     mvnw.cmd spring-boot:run
     ```
   - **No Linux/Mac:**
     ```bash
     ./mvnw spring-boot:run
     ```
3. Aguarde até que o terminal exiba que a aplicação iniciou na porta `8080`. Se tudo estiver correto com a conexão com o banco, o Hibernate cuidará de atualizar as tabelas do banco automaticamente.

### Passo 2: Executar o Frontend (Interface)
Abra um **novo terminal** na pasta raiz do projeto e siga os comandos:

1. Acesse o diretório do frontend:
   ```bash
   cd frontend
   ```
2. Instale as dependências (necessário apenas na primeira vez ou quando o `package.json` for alterado):
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. O terminal exibirá uma URL local (geralmente `http://localhost:5173`). Clique nesse link para abrir o sistema no seu navegador.

---

## 4. Scripts Adicionais do Frontend

No arquivo `package.json`, estão disponíveis os seguintes comandos auxiliares (rodados via `npm run <comando>`):
- `dev`: Inicia o servidor de desenvolvimento Vite com Hot Module Replacement (HMR).
- `build`: Cria o build otimizado para produção na pasta `dist`.
- `lint`: Executa o ESLint para verificar problemas e padronização no código.
- `preview`: Inicia um servidor local para visualizar como ficou a versão compilada (`build`) do projeto.
