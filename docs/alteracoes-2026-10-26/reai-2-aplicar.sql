-- =====================================================================
-- Sisaudin - Reclassificacao RAI -> REAI dos relatorios de itens EXTRA
-- PARTE 2: APLICACAO (altera relatorio_preliminar e relatorio_final)
--
-- Antes: backup do banco e reai-1-previa.sql conferida.
-- Mesma regra da previa. Pode ser rodado de novo: o resultado e o mesmo.
-- Trocar o nome do banco na linha abaixo antes de executar.
--
-- O script termina com ROLLBACK. Confira as consultas de conferencia (A a D);
-- estando corretas, troque ROLLBACK por COMMIT na ultima linha e rode de novo.
-- =====================================================================

USE TROCAR_NOME_DO_BANCO;

DROP TEMPORARY TABLE IF EXISTS reai_rel;
CREATE TEMPORARY TABLE reai_rel AS
SELECT 'P' AS tabela, r.id, r.item_trabalho_id, r.ano, r.numero, (r.especial + 0) AS especial, r.data_criacao,
       (UPPER(COALESCE(t.nome, '')) LIKE '%EXTRA%') AS item_extra
FROM relatorio_preliminar r
LEFT JOIN item_trabalho i ON i.id = r.item_trabalho_id
LEFT JOIN tipo_item t ON t.id = i.tipo_item_id
UNION ALL
SELECT 'F', r.id, r.item_trabalho_id, r.ano, r.numero, (r.especial + 0), r.data_criacao,
       (UPPER(COALESCE(t.nome, '')) LIKE '%EXTRA%')
FROM relatorio_final r
LEFT JOIN item_trabalho i ON i.id = r.item_trabalho_id
LEFT JOIN tipo_item t ON t.id = i.tipo_item_id;

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

START TRANSACTION;

UPDATE relatorio_preliminar x
JOIN reai_rel r   ON r.tabela = 'P' AND r.id = x.id
JOIN reai_plano p ON p.grupo = IFNULL(CONCAT('I', r.item_trabalho_id), CONCAT('P', r.id))
SET x.especial = 1, x.numero = p.numero_novo, x.ano = p.ano_novo
WHERE r.item_extra = 1 OR r.especial = 1;

UPDATE relatorio_final x
JOIN reai_rel r   ON r.tabela = 'F' AND r.id = x.id
JOIN reai_plano p ON p.grupo = IFNULL(CONCAT('I', r.item_trabalho_id), CONCAT('F', r.id))
SET x.especial = 1, x.numero = p.numero_novo, x.ano = p.ano_novo
WHERE r.item_extra = 1 OR r.especial = 1;

-- ---------------- Conferencia (antes de COMMIT/ROLLBACK) ----------------

-- A. Relatorio de item EXTRA que ainda nao e REAI (deve vir vazio)
SELECT 'preliminar' AS tabela, r.id FROM relatorio_preliminar r
JOIN item_trabalho i ON i.id = r.item_trabalho_id JOIN tipo_item t ON t.id = i.tipo_item_id
WHERE UPPER(t.nome) LIKE '%EXTRA%' AND COALESCE(r.especial, 0) = 0
UNION ALL
SELECT 'final', r.id FROM relatorio_final r
JOIN item_trabalho i ON i.id = r.item_trabalho_id JOIN tipo_item t ON t.id = i.tipo_item_id
WHERE UPPER(t.nome) LIKE '%EXTRA%' AND COALESCE(r.especial, 0) = 0;

-- B. Numero REAI repetido no mesmo ano, na mesma tabela (deve vir vazio)
SELECT 'preliminar' AS tabela, ano, numero, COUNT(*) AS qtd FROM relatorio_preliminar WHERE especial = 1 GROUP BY ano, numero HAVING COUNT(*) > 1
UNION ALL
SELECT 'final', ano, numero, COUNT(*) FROM relatorio_final WHERE especial = 1 GROUP BY ano, numero HAVING COUNT(*) > 1;

-- C. Preliminar e final do mesmo item com tipo, numero ou ano diferentes (deve vir vazio)
SELECT p.item_trabalho_id, p.id AS preliminar, f.id AS final
FROM relatorio_preliminar p JOIN relatorio_final f ON f.item_trabalho_id = p.item_trabalho_id
WHERE (p.especial + 0) <> (f.especial + 0) OR NOT (p.numero <=> f.numero) OR NOT (p.ano <=> f.ano);

-- D. Resultado: REAIs por ano
SELECT 'preliminar' AS tabela, ano, GROUP_CONCAT(numero ORDER BY numero) AS numeros_reai FROM relatorio_preliminar WHERE especial = 1 GROUP BY ano
UNION ALL
SELECT 'final', ano, GROUP_CONCAT(numero ORDER BY numero) FROM relatorio_final WHERE especial = 1 GROUP BY ano;

-- Trocar por COMMIT depois de conferir A a D:
ROLLBACK;
