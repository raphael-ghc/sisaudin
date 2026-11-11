-- =====================================================================================================
-- Prévia da conversão de 10/11/2026 (Serviço e Tipo de Auditoria do Planejamento). SÓ CONSULTA: não altera nada.
--
-- Rodar ANTES de subir a versão nova, no banco que vai recebê-la. No MySQL Workbench, use o raio
-- (Execute all), sem selecionar trecho. Cada consulta abre uma aba de resultado.
-- =====================================================================================================

-- Banco a consultar. Troque o nome pelo banco de destino (ex.: sisaudin_novo_v10 em produção).
USE sisaudin_homolog_v6;

-- 1. Cadastro de tipos de auditoria hoje. A conversão cria Desempenho, Financeira e Conformidade se faltarem
--    (comparando o nome sem diferenciar maiúsculas) e não mexe nos demais.
SELECT id, nome, status FROM tipo_auditoria ORDER BY id;

-- 2. Cadastro de serviços (o Serviço de Auditoria do Planejamento é o tipo de serviço do item de trabalho).
SELECT id, nome, status FROM tipo_servico ORDER BY id;

-- 3. O que a conversão vai fazer com cada valor gravado no campo antigo do Planejamento.
SELECT p.tipo_auditoria AS valor_gravado,
       CASE
         WHEN LOWER(p.tipo_auditoria) LIKE '%operacional%' OR LOWER(p.tipo_auditoria) LIKE '%desempenho%' THEN 'Tipo: Desempenho'
         WHEN LOWER(p.tipo_auditoria) LIKE '%financeira%' THEN 'Tipo: Financeira'
         WHEN LOWER(p.tipo_auditoria) LIKE '%conformidade%' THEN 'Tipo: Conformidade'
         WHEN EXISTS (SELECT 1 FROM tipo_servico s WHERE LOWER(TRIM(s.nome)) = LOWER(TRIM(p.tipo_auditoria)))
              THEN 'Serviço: preenche o item só se estiver vazio'
         WHEN UPPER(TRIM(p.tipo_auditoria)) IN ('PAINT', 'EXTRA') THEN 'Ignorado (gravado por engano)'
         ELSE 'SEM CORRESPONDÊNCIA (ajustar à mão)'
       END AS destino,
       COUNT(*) AS planejamentos
FROM planejamento p
WHERE p.tipo_auditoria IS NOT NULL AND TRIM(p.tipo_auditoria) <> ''
GROUP BY p.tipo_auditoria, destino
ORDER BY destino, valor_gravado;

-- 4. Planejamentos cujo campo antigo é um serviço diferente do serviço do item (o item prevalece; conferir).
SELECT p.id AS planejamento_id, p.item_trabalho_id, p.tipo_auditoria AS servico_no_planejamento, s.nome AS servico_do_item
FROM planejamento p
JOIN item_trabalho i ON i.id = p.item_trabalho_id
LEFT JOIN tipo_servico s ON s.id = i.tipo_servico_id
WHERE EXISTS (SELECT 1 FROM tipo_servico x WHERE LOWER(TRIM(x.nome)) = LOWER(TRIM(p.tipo_auditoria)))
  AND s.nome IS NOT NULL AND LOWER(TRIM(s.nome)) <> LOWER(TRIM(p.tipo_auditoria))
ORDER BY p.id;

-- 5. Itens com Planejamento e sem serviço definido (o Planejamento mostrará Não informado até o item ser preenchido).
SELECT i.id AS item_trabalho_id, p.id AS planejamento_id, p.tipo_auditoria AS valor_gravado
FROM item_trabalho i
JOIN planejamento p ON p.item_trabalho_id = i.id
WHERE i.tipo_servico_id IS NULL
ORDER BY i.id;

-- -----------------------------------------------------------------------------------------------------
-- Depois da subida: resultado da etapa.
-- SELECT nome, executada_em, resumo FROM sisaudin_migracao WHERE nome = '2026-11-planejamento-tipo-auditoria';
-- -----------------------------------------------------------------------------------------------------
