-- =====================================================================
-- Sisaudin — lista dos usuários e situação de acesso
-- Só leitura (SELECT). Não mostra senhas: indica apenas o formato.
--
-- Regras de login no código (CustomUserDetailsService / CustomUserDetails):
--   * login = e-mail; sem "@", o sistema completa com "@ghc.com.br";
--   * só entra quem tem status exatamente 'ACTIVE';
--   * a senha precisa estar em bcrypt (começa com $2a$, $2b$ ou $2y$).
--
-- Como usar: troque o nome do banco se for outro e execute no MySQL Workbench.
-- No Workbench, desligue o limite de linhas (Limit to: Don't Limit) ou
-- confira se a lista não foi cortada em 1000.
-- =====================================================================

USE sisaudin_novo_v10;

-- 1) Lista completa: quem consegue entrar primeiro, depois por nome
SELECT
    p.id,
    p.nome,
    p.email,
    CASE WHEN p.email LIKE '%@ghc.com.br'
         THEN SUBSTRING_INDEX(p.email, '@', 1)
         ELSE p.email END                                   AS login_digitar,
    p.role                                                  AS perfil,
    p.status,
    g.sigla                                                 AS gerencia,
    CASE
        WHEN p.password REGEXP '^\\$2[aby]\\$[0-9]{2}\\$' THEN 'bcrypt'
        WHEN p.password IS NULL OR p.password = ''         THEN 'vazia'
        ELSE 'formato invalido'
    END                                                     AS formato_senha,
    CASE
        WHEN p.status = 'ACTIVE'
         AND p.password REGEXP '^\\$2[aby]\\$[0-9]{2}\\$' THEN 'SIM'
        ELSE 'NAO'
    END                                                     AS consegue_entrar,
    CONCAT_WS('; ',
        CASE WHEN p.status IS NULL OR p.status <> 'ACTIVE'
             THEN CONCAT('status "', COALESCE(p.status, 'vazio'), '" (precisa ser ACTIVE)') END,
        CASE WHEN p.password NOT REGEXP '^\\$2[aby]\\$[0-9]{2}\\$' OR p.password IS NULL
             THEN 'senha fora do bcrypt' END,
        CASE WHEN p.email NOT LIKE '%@ghc.com.br'
             THEN 'e-mail externo: digitar completo' END
    )                                                       AS observacao
FROM pessoa p
LEFT JOIN gerencia g ON g.id = p.gerencia_id
ORDER BY consegue_entrar DESC, p.nome;

-- 2) Resumo por situação
SELECT
    p.role   AS perfil,
    p.status,
    CASE
        WHEN p.password REGEXP '^\\$2[aby]\\$[0-9]{2}\\$' THEN 'bcrypt'
        WHEN p.password IS NULL OR p.password = ''         THEN 'vazia'
        ELSE 'formato invalido'
    END      AS formato_senha,
    COUNT(*) AS quantidade
FROM pessoa p
GROUP BY 1, 2, 3
ORDER BY 1, 2, 3;

-- 3) Contas com a mesma senha gravada (senha padrão compartilhada).
--    Mostra só quantas contas repetem cada valor, nunca o valor.
SELECT
    COUNT(*)                                          AS contas_com_o_mesmo_valor,
    GROUP_CONCAT(p.email ORDER BY p.email SEPARATOR ', ') AS emails
FROM pessoa p
GROUP BY p.password
HAVING COUNT(*) > 1
ORDER BY contas_com_o_mesmo_valor DESC;
