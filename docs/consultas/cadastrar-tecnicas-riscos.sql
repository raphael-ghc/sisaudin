-- =====================================================================
-- Sisaudin — carga das Técnicas de Auditoria e dos Tipos de Risco
--
-- Por quê: as telas de Planejamento e Matriz de Achados buscam as opções
-- nas tabelas tecnica_auditoria e tipo_risco. No banco novo elas estão
-- vazias (os seeders só rodam com app.seeder.enabled=true, desligado em
-- produção), então os campos de seleção não mostram nenhuma opção.
--
-- Valores: os mesmos do sistema anterior (tabelas tecnica_auditoria e
-- risco) e dos seeders do código (TecnicaAuditoriaSeeder, TipoRiscoSeeder).
--
-- Pode rodar mais de uma vez: só insere o nome que ainda não existe.
-- Não altera nem apaga registros existentes. Não precisa reiniciar o sistema.
-- =====================================================================

USE sisaudin_novo_v10;

-- 0) Situação antes
SELECT (SELECT COUNT(*) FROM tecnica_auditoria) AS tecnicas_antes,
       (SELECT COUNT(*) FROM tipo_risco)        AS riscos_antes;

START TRANSACTION;

INSERT INTO tecnica_auditoria (nome, status)
SELECT v.nome, 'ACTIVE'
FROM (
          SELECT 1 AS ordem, 'Inspeção' AS nome
    UNION ALL SELECT 2,  'Observação'
    UNION ALL SELECT 3,  'Análise documental'
    UNION ALL SELECT 4,  'Confirmação externa'
    UNION ALL SELECT 5,  'Indagação'
    UNION ALL SELECT 6,  'Recálculo'
    UNION ALL SELECT 7,  'Inquérito'
    UNION ALL SELECT 8,  'Técnicas de auditoria assistidas por computador (TAAC)'
    UNION ALL SELECT 9,  'Questionário'
    UNION ALL SELECT 10, 'Entrevista'
    UNION ALL SELECT 11, 'Benchmarking'
) v
WHERE NOT EXISTS (SELECT 1 FROM tecnica_auditoria t WHERE t.nome = v.nome)
ORDER BY v.ordem;

INSERT INTO tipo_risco (nome, status)
SELECT v.nome, 'ACTIVE'
FROM (
          SELECT 1 AS ordem, 'Ambiental' AS nome
    UNION ALL SELECT 2,  'Contábil'
    UNION ALL SELECT 3,  'Financeiro'
    UNION ALL SELECT 4,  'Operacional'
    UNION ALL SELECT 5,  'Conformidade'
    UNION ALL SELECT 6,  'Estratégico'
    UNION ALL SELECT 7,  'Integridade'
    UNION ALL SELECT 8,  'Gestão de Pessoas'
    UNION ALL SELECT 9,  'Imagem'
    UNION ALL SELECT 10, 'Assistencial'
    UNION ALL SELECT 11, 'Segurança da Informação'
    UNION ALL SELECT 12, 'Tecnologia da Informação'
    UNION ALL SELECT 13, 'Governança'
    UNION ALL SELECT 14, 'Continuidade do Negócio'
    UNION ALL SELECT 15, 'Transparência e Accountability'
) v
WHERE NOT EXISTS (SELECT 1 FROM tipo_risco r WHERE r.nome = v.nome)
ORDER BY v.ordem;

-- 1) Conferência: esperado 11 técnicas e 15 riscos (ou mais, se já havia outros)
SELECT 'tecnica_auditoria' AS tabela, id, nome, status FROM tecnica_auditoria
UNION ALL
SELECT 'tipo_risco', id, nome, status FROM tipo_risco
ORDER BY tabela, id;

COMMIT;
