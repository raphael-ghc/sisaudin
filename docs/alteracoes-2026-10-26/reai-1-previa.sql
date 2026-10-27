-- =====================================================================
-- Sisaudin - Reclassificacao RAI -> REAI dos relatorios de itens EXTRA
-- PARTE 1: PREVIA (somente consultas; nao altera nada)
--
-- Regra (decisao da area, 26/10/2026):
--   * Todo relatorio (preliminar e final) de item do tipo EXTRA passa a ser REAI.
--   * A sequencia REAI de cada ano e renumerada na ordem de criacao:
--     data de criacao; quando vazia (relatorios vindos do sistema antigo), pelo id.
--     Sem data de criacao conta como mais antigo.
--   * Preliminar e final do mesmo item recebem o mesmo numero e o ano do preliminar.
--   * Relatorios de item PAINT continuam RAI, com os numeros atuais.
--
-- Rodar DEPOIS da primeira subida da versao nova (que cria a coluna "especial").
-- Trocar o nome do banco na linha abaixo antes de executar.
-- =====================================================================

USE TROCAR_NOME_DO_BANCO;

-- Relatorios preliminares e finais num so conjunto
DROP TEMPORARY TABLE IF EXISTS reai_rel;
CREATE TEMPORARY TABLE reai_rel AS
SELECT 'P' AS tabela, r.id, r.item_trabalho_id, i.sigla, r.ano, r.numero, (r.especial + 0) AS especial, r.data_criacao, r.status,
       (UPPER(COALESCE(t.nome, '')) LIKE '%EXTRA%') AS item_extra
FROM relatorio_preliminar r
LEFT JOIN item_trabalho i ON i.id = r.item_trabalho_id
LEFT JOIN tipo_item t ON t.id = i.tipo_item_id
UNION ALL
SELECT 'F', r.id, r.item_trabalho_id, i.sigla, r.ano, r.numero, (r.especial + 0), r.data_criacao, r.status,
       (UPPER(COALESCE(t.nome, '')) LIKE '%EXTRA%')
FROM relatorio_final r
LEFT JOIN item_trabalho i ON i.id = r.item_trabalho_id
LEFT JOIN tipo_item t ON t.id = i.tipo_item_id;

-- Um grupo por item (preliminar + final andam juntos); relatorio sem item e grupo proprio.
-- Entram: relatorios de item EXTRA e REAIs que ja existam (para a sequencia REAI nao repetir numero).
DROP TEMPORARY TABLE IF EXISTS reai_grupo;
CREATE TEMPORARY TABLE reai_grupo AS
SELECT IFNULL(CONCAT('I', item_trabalho_id), CONCAT(tabela, id)) AS grupo,
       COALESCE(MAX(CASE WHEN tabela = 'P' THEN ano END), MAX(ano))  AS ano_novo,
       MIN(COALESCE(data_criacao, '1900-01-01'))                     AS ordem_data,
       COALESCE(MIN(CASE WHEN tabela = 'P' THEN id END), MIN(id))    AS ordem_id
FROM reai_rel
WHERE item_extra = 1 OR especial = 1
GROUP BY IFNULL(CONCAT('I', item_trabalho_id), CONCAT(tabela, id));

DROP TEMPORARY TABLE IF EXISTS reai_plano;
CREATE TEMPORARY TABLE reai_plano AS
SELECT g.*, ROW_NUMBER() OVER (PARTITION BY g.ano_novo ORDER BY g.ordem_data, g.ordem_id) AS numero_novo
FROM reai_grupo g;

-- 1. O que vai mudar (uma linha por relatorio)
SELECT r.tabela AS tab, r.id, r.sigla, r.status,
       CONCAT(IF(r.especial = 1, 'REAI ', 'RAI '), IFNULL(r.numero, '-'), '/', IFNULL(r.ano, '-')) AS hoje,
       CONCAT('REAI ', p.numero_novo, '/', IFNULL(p.ano_novo, '-'))                                  AS depois,
       IF(r.especial = 1 AND r.numero <=> p.numero_novo AND r.ano <=> p.ano_novo, 'igual', 'MUDA')  AS situacao,
       r.data_criacao
FROM reai_rel r
JOIN reai_plano p ON p.grupo = IFNULL(CONCAT('I', r.item_trabalho_id), CONCAT(r.tabela, r.id))
WHERE r.item_extra = 1 OR r.especial = 1
ORDER BY p.ano_novo, p.numero_novo, r.tabela DESC;

-- 2. Relatorios ja emitidos (status diferente de Minuta) que mudariam de numero: conferir um a um
SELECT r.tabela AS tab, r.id, r.sigla, r.status,
       CONCAT(r.numero, '/', r.ano) AS numero_hoje, CONCAT(p.numero_novo, '/', p.ano_novo) AS numero_depois
FROM reai_rel r
JOIN reai_plano p ON p.grupo = IFNULL(CONCAT('I', r.item_trabalho_id), CONCAT(r.tabela, r.id))
WHERE (r.item_extra = 1 OR r.especial = 1)
  AND NOT (r.numero <=> p.numero_novo AND r.ano <=> p.ano_novo)
  AND COALESCE(r.status, 'Minuta') <> 'Minuta';

-- 3. REAI fora de item EXTRA (item PAINT, sem tipo ou sem item): entram na sequencia REAI, mas fogem da regra
SELECT tabela AS tab, id, sigla, item_trabalho_id, CONCAT(numero, '/', ano) AS numero
FROM reai_rel WHERE especial = 1 AND item_extra = 0;

-- 4. Proximos numeros depois da aplicacao (o sistema usa o maior do tipo no ano + 1)
SELECT 'REAI' AS tipo, ano_novo AS ano, MAX(numero_novo) + 1 AS proximo FROM reai_plano GROUP BY ano_novo
ORDER BY ano;

DROP TEMPORARY TABLE IF EXISTS reai_plano;
DROP TEMPORARY TABLE IF EXISTS reai_grupo;
DROP TEMPORARY TABLE IF EXISTS reai_rel;
