-- =====================================================================================================
-- Prévia da conversão de 06/11/2026 (Planejamento e Matriz de Achados). SÓ CONSULTA: não altera nada.
--
-- Rodar ANTES de subir a versão nova, no banco que vai receber a versão (homologação ou produção).
-- Mostra o que a conversão automática (PlanejamentoMatrizMigration, na primeira subida) não vai conseguir
-- ligar ao cadastro. Corrija o cadastro antes (ex.: cadastre a técnica que falta) ou anote para ajustar à mão
-- depois, na tela do Planejamento.
--
-- A comparação da conversão ignora maiúsculas/minúsculas e espaços extras nas pontas; aqui a comparação
-- usa a collation do banco (que também ignora maiúsculas/minúsculas).
--
-- No MySQL Workbench, rode com o raio (Execute all), sem selecionar trecho. Cada consulta abre uma aba de resultado.
-- =====================================================================================================

-- Banco a consultar. Troque o nome pelo banco de destino (ex.: sisaudin_novo_v10 em produção).
USE sisaudin_homolog_v6;

-- 1. Gerências destinatárias do Planejamento (gravadas por nome desde 23/10) sem gerência no cadastro.
--    Se esta consulta der erro de tabela inexistente, a entrega de 23/10 nunca subiu nesse banco: não há o que converter.
SELECT pgd.planejamento_id, pgd.ordem, pgd.gerencia AS nome_gravado
FROM planejamento_gerencia_destinataria pgd
WHERE NOT EXISTS (
    SELECT 1 FROM gerencia g
    WHERE TRIM(pgd.gerencia) IN (g.nome, g.sigla, CONCAT(g.sigla, ' - ', g.nome))
)
ORDER BY pgd.planejamento_id, pgd.ordem;

-- 2. Gerência da questão do Planejamento sem gerência no cadastro.
SELECT q.id AS questao_id, q.planejamento_id,
       COALESCE(NULLIF(TRIM(q.gerencia_destinataria), ''), q.gerencia) AS gerencia_gravada
FROM planejamento_questao q
WHERE COALESCE(NULLIF(TRIM(q.gerencia_destinataria), ''), NULLIF(TRIM(q.gerencia), '')) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM gerencia g
    WHERE TRIM(COALESCE(NULLIF(TRIM(q.gerencia_destinataria), ''), q.gerencia)) IN (g.nome, g.sigla, CONCAT(g.sigla, ' - ', g.nome))
  )
ORDER BY q.planejamento_id, q.id;

-- 3. Técnicas das questões (texto separado por vírgula) sem técnica no cadastro.
SELECT q.id AS questao_id, q.planejamento_id, TRIM(jt.nome) AS tecnica_gravada
FROM planejamento_questao q,
     JSON_TABLE(CONCAT('["', REPLACE(REPLACE(q.tecnicas, '"', ''), ',', '","'), '"]'), '$[*]' COLUMNS (nome VARCHAR(500) PATH '$')) jt
WHERE q.tecnicas IS NOT NULL AND TRIM(q.tecnicas) <> '' AND TRIM(jt.nome) <> ''
  AND NOT EXISTS (SELECT 1 FROM tecnica_auditoria t WHERE t.nome = TRIM(jt.nome))
ORDER BY q.planejamento_id, q.id;

-- 4. Riscos das questões sem tipo de risco no cadastro.
SELECT q.id AS questao_id, q.planejamento_id, TRIM(jt.nome) AS risco_gravado
FROM planejamento_questao q,
     JSON_TABLE(CONCAT('["', REPLACE(REPLACE(q.riscos, '"', ''), ',', '","'), '"]'), '$[*]' COLUMNS (nome VARCHAR(500) PATH '$')) jt
WHERE q.riscos IS NOT NULL AND TRIM(q.riscos) <> '' AND TRIM(jt.nome) <> ''
  AND NOT EXISTS (SELECT 1 FROM tipo_risco r WHERE r.nome = TRIM(jt.nome))
ORDER BY q.planejamento_id, q.id;

-- 5. Matrizes de Achados existentes: quantas questões, quantas têm fato/evidência e o Planejamento do item.
--    A conversão liga cada questão da Matriz à questão do Planejamento com o mesmo texto; se sobrarem
--    quantidades iguais dos dois lados, liga pela ordem; o resto fica sem ligação (aparece no fim da Matriz).
SELECT m.id AS matriz_id, m.item_trabalho_id, m.planejamento_id,
       (SELECT MIN(p.id) FROM planejamento p WHERE p.item_trabalho_id = m.item_trabalho_id) AS planejamento_do_item,
       (SELECT COUNT(*) FROM matriz_achados_questao q WHERE q.matriz_achados_id = m.id) AS questoes_matriz,
       (SELECT COUNT(*) FROM matriz_achados_questao q WHERE q.matriz_achados_id = m.id
            AND (NULLIF(TRIM(q.fato_encontrado), '') IS NOT NULL OR NULLIF(TRIM(q.evidencia), '') IS NOT NULL)) AS questoes_com_fato,
       (SELECT COUNT(*) FROM planejamento_questao pq JOIN planejamento p ON p.id = pq.planejamento_id
            WHERE p.item_trabalho_id = m.item_trabalho_id) AS questoes_planejamento
FROM matriz_achados m
ORDER BY m.id;

-- 6. Anexos que a conversão vai religar (Matriz: Fato Encontrado Q1 e semelhantes; Planejamento: Questão #1 - Conteúdo e semelhantes).
SELECT documento, secao, COUNT(*) AS anexos
FROM anexo_documento
WHERE (documento = 'MatrizAchados' AND secao REGEXP '^(Fato Encontrado|Evidência|Questão|Critérios) Q[0-9]+$')
   OR (documento = 'Planejamento' AND secao LIKE 'Questão #%')
GROUP BY documento, secao
ORDER BY documento, secao;

-- 7. Planejamentos sem número (o documento passa a mostrar s/n; preencher à mão no formulário).
SELECT p.id, p.item_trabalho_id, p.ano, p.data_emissao
FROM planejamento p
WHERE p.numero IS NULL
ORDER BY p.id;

-- -----------------------------------------------------------------------------------------------------
-- Depois da primeira subida: resultado da conversão (uma linha por etapa).
-- SELECT nome, executada_em, resumo FROM sisaudin_migracao ORDER BY executada_em;
-- -----------------------------------------------------------------------------------------------------
