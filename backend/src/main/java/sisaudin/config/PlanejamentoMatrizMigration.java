package sisaudin.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Supplier;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Converte os dados do Planejamento e da Matriz de Achados para o modelo de 11/2026. Roda na subida do backend;
 * cada etapa roda uma vez só e fica registrada na tabela sisaudin_migracao (nome, data, resumo).
 *
 * 1. Gerências destinatárias do Planejamento: nomes (planejamento_gerencia_destinataria) → cadastro (planejamento_gerencia).
 * 2. Questões do Planejamento: ordem; gerência, técnicas e riscos em texto → tabelas ligadas aos cadastros.
 * 3. Matriz de Achados: liga cada questão à questão do Planejamento (pelo texto; se sobrarem quantidades iguais, pela ordem),
 *    copia fato/evidência únicos para matriz_achados_fato e religa os anexos ("Fato Encontrado Q1"...) ao fato.
 * 4. Anexos das questões do Planejamento: "Questão #1 - Conteúdo" (posição) → "Questão Planejamento {id} - Conteúdo".
 * 5. Tipo de auditoria do Planejamento (texto) → tipos do cadastro (planejamento_tipo_auditoria); ver converterTipoAuditoria.
 *
 * As colunas e a tabela antigas não são apagadas. Nomes sem correspondência no cadastro aparecem no log
 * ([PlanejamentoMatrizMigration]) e no resumo gravado; a prévia está em docs/alteracoes-2026-11-06/previa-conversao.sql.
 */
@Component
@Order(100)
public class PlanejamentoMatrizMigration implements CommandLineRunner {

    private static final String LOG = "[PlanejamentoMatrizMigration] ";

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Override
    public void run(String... args) {
        jdbc.execute("CREATE TABLE IF NOT EXISTS sisaudin_migracao (" +
                "nome VARCHAR(120) NOT NULL PRIMARY KEY, executada_em DATETIME, resumo TEXT)");
        etapa("2026-11-planejamento-gerencias", this::converterGerenciasDoPlanejamento);
        etapa("2026-11-planejamento-questoes", this::converterQuestoesDoPlanejamento);
        etapa("2026-11-matriz-questoes-fatos", this::converterMatrizes);
        etapa("2026-11-planejamento-anexos-questoes", this::religarAnexosDoPlanejamento);
        etapa("2026-11-planejamento-tipo-auditoria", this::converterTipoAuditoria);
    }

    private void etapa(String nome, Supplier<String> acao) {
        Integer feita = jdbc.queryForObject("SELECT COUNT(*) FROM sisaudin_migracao WHERE nome = ?", Integer.class, nome);
        if (feita != null && feita > 0) return;
        try {
            new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
                String resumo = acao.get();
                jdbc.update("INSERT INTO sisaudin_migracao (nome, executada_em, resumo) VALUES (?, NOW(), ?)", nome, resumo);
                System.out.println(LOG + nome + ": " + resumo);
            });
        } catch (Exception e) {
            System.err.println(LOG + nome + " falhou e será tentada de novo na próxima subida: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // 1 -------------------------------------------------------------------------------------------

    private String converterGerenciasDoPlanejamento() {
        if (!tabelaExiste("planejamento_gerencia_destinataria")) return "tabela antiga ausente; nada a converter";
        Map<String, Long> gerencias = indiceGerencias();
        Set<Long> jaConvertidos = new java.util.HashSet<>(jdbc.queryForList(
                "SELECT DISTINCT planejamento_id FROM planejamento_gerencia", Long.class));

        Map<Long, List<String>> nomesPorPlanejamento = new LinkedHashMap<>();
        jdbc.query("SELECT planejamento_id, gerencia FROM planejamento_gerencia_destinataria ORDER BY planejamento_id, ordem",
                rs -> {
                    nomesPorPlanejamento.computeIfAbsent(rs.getLong(1), k -> new ArrayList<>()).add(rs.getString(2));
                });

        int ligadas = 0;
        List<String> semCorrespondencia = new ArrayList<>();
        for (Map.Entry<Long, List<String>> e : nomesPorPlanejamento.entrySet()) {
            if (jaConvertidos.contains(e.getKey())) continue;
            LinkedHashSet<Long> ids = new LinkedHashSet<>();
            for (String nome : e.getValue()) {
                Long id = gerencias.get(normalizar(nome));
                if (id != null) ids.add(id);
                else if (nome != null && !nome.isBlank()) semCorrespondencia.add("planejamento " + e.getKey() + ": " + nome);
            }
            int ordem = 0;
            for (Long id : ids) {
                jdbc.update("INSERT INTO planejamento_gerencia (planejamento_id, gerencia_id, ordem) VALUES (?, ?, ?)", e.getKey(), id, ordem++);
                ligadas++;
            }
        }
        return ligadas + " gerência(s) ligada(s) em " + nomesPorPlanejamento.size() + " planejamento(s)" + listaSem(semCorrespondencia);
    }

    // 2 -------------------------------------------------------------------------------------------

    private String converterQuestoesDoPlanejamento() {
        // Ordem: a mesma em que a tela as mostrava (pelo id), dentro de cada planejamento.
        List<Map<String, Object>> questoes = jdbc.queryForList(
                "SELECT id, planejamento_id FROM planejamento_questao ORDER BY planejamento_id, id");
        Map<Long, Integer> contador = new HashMap<>();
        for (Map<String, Object> q : questoes) {
            Long planId = q.get("planejamento_id") == null ? 0L : ((Number) q.get("planejamento_id")).longValue();
            int ordem = contador.merge(planId, 1, Integer::sum);
            jdbc.update("UPDATE planejamento_questao SET ordem = ? WHERE id = ? AND ordem IS NULL", ordem, ((Number) q.get("id")).longValue());
        }

        boolean temGerencia = colunaExiste("planejamento_questao", "gerencia_destinataria") && colunaExiste("planejamento_questao", "gerencia");
        boolean temTecnicas = colunaExiste("planejamento_questao", "tecnicas");
        boolean temRiscos = colunaExiste("planejamento_questao", "riscos");
        if (!temGerencia && !temTecnicas && !temRiscos) return questoes.size() + " questão(ões) ordenada(s); colunas antigas ausentes";

        Map<String, Long> gerencias = indiceGerencias();
        Map<String, Long> tecnicas = indicePorNome("tecnica_auditoria");
        Map<String, Long> riscos = indicePorNome("tipo_risco");
        List<String> semCorrespondencia = new ArrayList<>();
        int[] contagem = new int[3];

        String sql = "SELECT id"
                + (temGerencia ? ", gerencia, gerencia_destinataria" : "")
                + (temTecnicas ? ", tecnicas" : "")
                + (temRiscos ? ", riscos" : "")
                + " FROM planejamento_questao ORDER BY id";
        for (Map<String, Object> q : jdbc.queryForList(sql)) {
            long id = ((Number) q.get("id")).longValue();
            if (temGerencia && vazia("planejamento_questao_gerencia", id)) {
                String valor = texto(q.get("gerencia_destinataria"));
                if (valor.isBlank()) valor = texto(q.get("gerencia"));
                if (!valor.isBlank()) {
                    Long gid = gerencias.get(normalizar(valor));
                    if (gid != null) {
                        jdbc.update("INSERT INTO planejamento_questao_gerencia (questao_id, gerencia_id, ordem) VALUES (?, ?, 0)", id, gid);
                        contagem[0]++;
                    } else semCorrespondencia.add("questão " + id + " gerência: " + valor);
                }
            }
            if (temTecnicas && vazia("planejamento_questao_tecnica", id)) {
                contagem[1] += ligarLista(id, texto(q.get("tecnicas")), tecnicas, "planejamento_questao_tecnica", "tecnica_id", "técnica", semCorrespondencia);
            }
            if (temRiscos && vazia("planejamento_questao_tipo_risco", id)) {
                contagem[2] += ligarLista(id, texto(q.get("riscos")), riscos, "planejamento_questao_tipo_risco", "tipo_risco_id", "risco", semCorrespondencia);
            }
        }
        return questoes.size() + " questão(ões) ordenada(s); ligadas: " + contagem[0] + " gerência(s), "
                + contagem[1] + " técnica(s), " + contagem[2] + " risco(s)" + listaSem(semCorrespondencia);
    }

    private int ligarLista(long questaoId, String valor, Map<String, Long> indice, String tabela, String coluna,
                           String rotulo, List<String> semCorrespondencia) {
        if (valor.isBlank()) return 0;
        LinkedHashSet<Long> ids = new LinkedHashSet<>();
        for (String parte : valor.split(",")) {
            String nome = parte.trim();
            if (nome.isEmpty()) continue;
            Long id = indice.get(normalizar(nome));
            if (id != null) ids.add(id);
            else semCorrespondencia.add("questão " + questaoId + " " + rotulo + ": " + nome);
        }
        int ordem = 0;
        for (Long id : ids) {
            jdbc.update("INSERT INTO " + tabela + " (questao_id, " + coluna + ", ordem) VALUES (?, ?, ?)", questaoId, id, ordem++);
        }
        return ids.size();
    }

    // 3 -------------------------------------------------------------------------------------------

    private static final Pattern ANEXO_MATRIZ = Pattern.compile("^(Fato Encontrado|Evidência|Questão|Critérios) Q(\\d+)$");

    private String converterMatrizes() {
        List<Map<String, Object>> matrizes = jdbc.queryForList(
                "SELECT id, item_trabalho_id, planejamento_id FROM matriz_achados ORDER BY id");
        int ligadasTexto = 0, ligadasOrdem = 0, semLigacao = 0, fatos = 0, anexos = 0;

        for (Map<String, Object> m : matrizes) {
            long matrizId = ((Number) m.get("id")).longValue();
            Long itemId = m.get("item_trabalho_id") == null ? null : ((Number) m.get("item_trabalho_id")).longValue();
            Long planId = m.get("planejamento_id") == null ? null : ((Number) m.get("planejamento_id")).longValue();
            if (planId != null && jdbc.queryForObject("SELECT COUNT(*) FROM planejamento WHERE id = ?", Integer.class, planId) == 0) planId = null;
            if (planId == null && itemId != null) {
                List<Long> p = jdbc.queryForList("SELECT id FROM planejamento WHERE item_trabalho_id = ? ORDER BY id LIMIT 1", Long.class, itemId);
                planId = p.isEmpty() ? null : p.get(0);
            }

            // Posição de cada questão como a tela antiga mostrava (base dos nomes de anexo "Q1", "Q2"...).
            List<Map<String, Object>> questoes = jdbc.queryForList(
                    "SELECT id, questao_planejamento_id, questao, conteudo, fato_encontrado, evidencia " +
                    "FROM matriz_achados_questao WHERE matriz_achados_id = ? ORDER BY ordem, id", matrizId);

            // Ligação com as questões do Planejamento
            if (planId != null) {
                List<Map<String, Object>> doPlanejamento = jdbc.queryForList(
                        "SELECT id, questao, conteudo FROM planejamento_questao WHERE planejamento_id = ? ORDER BY ordem, id", planId);
                Set<Long> usadas = new java.util.HashSet<>();
                for (Map<String, Object> q : questoes) {
                    if (q.get("questao_planejamento_id") != null) usadas.add(((Number) q.get("questao_planejamento_id")).longValue());
                }
                List<Map<String, Object>> soltasMatriz = new ArrayList<>();
                for (Map<String, Object> q : questoes) {
                    if (q.get("questao_planejamento_id") != null) continue;
                    String alvo = textoPuro(q.get("conteudo"), q.get("questao"));
                    Long encontrada = null;
                    if (!alvo.isEmpty()) {
                        for (Map<String, Object> qp : doPlanejamento) {
                            long qpId = ((Number) qp.get("id")).longValue();
                            if (!usadas.contains(qpId) && alvo.equals(textoPuro(qp.get("conteudo"), qp.get("questao")))) {
                                encontrada = qpId;
                                break;
                            }
                        }
                    }
                    if (encontrada != null) {
                        jdbc.update("UPDATE matriz_achados_questao SET questao_planejamento_id = ? WHERE id = ?", encontrada, q.get("id"));
                        usadas.add(encontrada);
                        ligadasTexto++;
                    } else {
                        soltasMatriz.add(q);
                    }
                }
                List<Long> soltasPlanejamento = new ArrayList<>();
                for (Map<String, Object> qp : doPlanejamento) {
                    long qpId = ((Number) qp.get("id")).longValue();
                    if (!usadas.contains(qpId)) soltasPlanejamento.add(qpId);
                }
                if (!soltasMatriz.isEmpty() && soltasMatriz.size() == soltasPlanejamento.size()) {
                    for (int i = 0; i < soltasMatriz.size(); i++) {
                        jdbc.update("UPDATE matriz_achados_questao SET questao_planejamento_id = ? WHERE id = ?",
                                soltasPlanejamento.get(i), soltasMatriz.get(i).get("id"));
                        ligadasOrdem++;
                    }
                } else {
                    semLigacao += soltasMatriz.size();
                }
                jdbc.update("UPDATE matriz_achados SET planejamento_id = ? WHERE id = ?", planId, matrizId);
            } else {
                for (Map<String, Object> q : questoes) if (q.get("questao_planejamento_id") == null) semLigacao++;
            }

            // Fato e evidência únicos → primeiro fato; anexos "... Qn" → fato da questão n
            Map<Integer, List<Map<String, Object>>> anexosPorPosicao = new HashMap<>();
            if (itemId != null) {
                for (Map<String, Object> a : jdbc.queryForList(
                        "SELECT id, secao FROM anexo_documento WHERE documento = 'MatrizAchados' AND item_trabalho_id = ?", itemId)) {
                    Matcher mt = ANEXO_MATRIZ.matcher(texto(a.get("secao")));
                    if (mt.matches()) anexosPorPosicao.computeIfAbsent(Integer.parseInt(mt.group(2)), k -> new ArrayList<>()).add(a);
                }
            }
            for (int i = 0; i < questoes.size(); i++) {
                Map<String, Object> q = questoes.get(i);
                long questaoId = ((Number) q.get("id")).longValue();
                String fato = texto(q.get("fato_encontrado"));
                String evidencia = texto(q.get("evidencia"));
                List<Map<String, Object>> anexosDaQuestao = anexosPorPosicao.getOrDefault(i + 1, List.of());
                boolean semFatos = jdbc.queryForObject("SELECT COUNT(*) FROM matriz_achados_fato WHERE questao_id = ?", Integer.class, questaoId) == 0;
                if (!semFatos || (fato.isBlank() && evidencia.isBlank() && anexosDaQuestao.isEmpty())) continue;

                jdbc.update("INSERT INTO matriz_achados_fato (questao_id, ordem, fato, evidencia) VALUES (?, 1, ?, ?)",
                        questaoId, fato.isBlank() ? null : fato, evidencia.isBlank() ? null : evidencia);
                Long fatoId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
                fatos++;
                for (Map<String, Object> a : anexosDaQuestao) {
                    Matcher mt = ANEXO_MATRIZ.matcher(texto(a.get("secao")));
                    if (!mt.matches()) continue;
                    String nova = "Fato Encontrado".equals(mt.group(1)) ? "Fato Matriz " + fatoId : "Evidência Matriz " + fatoId;
                    jdbc.update("UPDATE anexo_documento SET secao = ? WHERE id = ?", nova, a.get("id"));
                    anexos++;
                }
            }
        }
        return matrizes.size() + " matriz(es); questões ligadas pelo texto: " + ligadasTexto + ", pela ordem: " + ligadasOrdem
                + ", sem ligação: " + semLigacao + "; fatos criados: " + fatos + "; anexos religados: " + anexos;
    }

    // 4 -------------------------------------------------------------------------------------------

    private static final Pattern ANEXO_PLANEJAMENTO = Pattern.compile("^Questão #(\\d+) - (.+)$");

    private String religarAnexosDoPlanejamento() {
        int religados = 0, semQuestao = 0;
        for (Map<String, Object> a : jdbc.queryForList(
                "SELECT id, secao, item_trabalho_id FROM anexo_documento WHERE documento = 'Planejamento' AND secao LIKE 'Questão #%'")) {
            Matcher mt = ANEXO_PLANEJAMENTO.matcher(texto(a.get("secao")));
            if (!mt.matches() || a.get("item_trabalho_id") == null) continue;
            int posicao = Integer.parseInt(mt.group(1));
            List<Long> ids = jdbc.queryForList(
                    "SELECT q.id FROM planejamento_questao q JOIN planejamento p ON p.id = q.planejamento_id " +
                    "WHERE p.item_trabalho_id = ? AND p.id = (SELECT MIN(p2.id) FROM planejamento p2 WHERE p2.item_trabalho_id = ?) " +
                    "ORDER BY q.ordem, q.id", Long.class, a.get("item_trabalho_id"), a.get("item_trabalho_id"));
            if (posicao < 1 || posicao > ids.size()) { semQuestao++; continue; }
            jdbc.update("UPDATE anexo_documento SET secao = ? WHERE id = ?",
                    "Questão Planejamento " + ids.get(posicao - 1) + " - " + mt.group(2), a.get("id"));
            religados++;
        }
        return religados + " anexo(s) religado(s) à questão" + (semQuestao > 0 ? "; " + semQuestao + " sem questão na posição (mantidos)" : "");
    }

    // 5 -------------------------------------------------------------------------------------------

    /**
     * O campo de texto "Tipo de Auditoria" do Planejamento misturava serviço e tipo (decisão da área, 10/11):
     * - garante no cadastro tipo_auditoria as opções Desempenho, Financeira e Conformidade (as demais ficam como estão);
     * - "Auditoria Operacional" → Desempenho, "Auditoria Financeira" → Financeira, "Auditoria de Conformidade" → Conformidade,
     *   em planejamento_tipo_auditoria;
     * - "Avaliação"/"Consultoria" são serviço: o serviço passa a ser o do item de trabalho, que só é preenchido
     *   com esse valor se estiver vazio;
     * - "PAINT"/"EXTRA" (gravados por engano: era o tipo do item) são ignorados.
     */
    private String converterTipoAuditoria() {
        int criados = 0;
        Map<String, Long> tipos = new HashMap<>();
        for (String nome : List.of("Desempenho", "Financeira", "Conformidade")) {
            List<Long> ids = jdbc.queryForList("SELECT id FROM tipo_auditoria WHERE LOWER(TRIM(nome)) = LOWER(?) ORDER BY id", Long.class, nome);
            if (ids.isEmpty()) {
                jdbc.update("INSERT INTO tipo_auditoria (nome, status) VALUES (?, 'ACTIVE')", nome);
                ids = jdbc.queryForList("SELECT LAST_INSERT_ID()", Long.class);
                criados++;
            }
            tipos.put(nome, ids.get(0));
        }
        if (!colunaExiste("planejamento", "tipo_auditoria")) return criados + " tipo(s) criado(s) no cadastro; coluna antiga ausente";

        Map<String, Long> servicos = indicePorNome("tipo_servico");
        int ligados = 0, servicoNoItem = 0, ignorados = 0;
        List<String> semCorrespondencia = new ArrayList<>();
        for (Map<String, Object> p : jdbc.queryForList(
                "SELECT id, item_trabalho_id, tipo_auditoria FROM planejamento WHERE tipo_auditoria IS NOT NULL AND TRIM(tipo_auditoria) <> '' ORDER BY id")) {
            long planId = ((Number) p.get("id")).longValue();
            String valor = normalizar(texto(p.get("tipo_auditoria")));
            String tipo = valor.contains("operacional") || valor.contains("desempenho") ? "Desempenho"
                    : valor.contains("financeira") ? "Financeira"
                    : valor.contains("conformidade") ? "Conformidade" : null;
            if (tipo != null) {
                boolean vazio = jdbc.queryForObject("SELECT COUNT(*) FROM planejamento_tipo_auditoria WHERE planejamento_id = ?", Integer.class, planId) == 0;
                if (vazio) {
                    jdbc.update("INSERT INTO planejamento_tipo_auditoria (planejamento_id, tipo_auditoria_id, ordem) VALUES (?, ?, 0)", planId, tipos.get(tipo));
                    ligados++;
                }
            } else if (servicos.containsKey(valor)) {
                if (p.get("item_trabalho_id") != null) {
                    servicoNoItem += jdbc.update("UPDATE item_trabalho SET tipo_servico_id = ? WHERE id = ? AND tipo_servico_id IS NULL",
                            servicos.get(valor), p.get("item_trabalho_id"));
                }
            } else if (valor.equals("paint") || valor.equals("extra")) {
                ignorados++;
            } else {
                semCorrespondencia.add("planejamento " + planId + ": " + texto(p.get("tipo_auditoria")));
            }
        }
        return criados + " tipo(s) criado(s) no cadastro; " + ligados + " planejamento(s) com tipo de auditoria; "
                + servicoNoItem + " item(ns) com serviço preenchido; " + ignorados + " PAINT/EXTRA ignorado(s)"
                + listaSem(semCorrespondencia);
    }

    // ---------------------------------------------------------------------------------------------

    /** Gerências pelo nome, pela sigla e por "SIGLA - Nome" (formas que as telas antigas gravavam). */
    private Map<String, Long> indiceGerencias() {
        Map<String, Long> indice = new HashMap<>();
        jdbc.query("SELECT id, nome, sigla FROM gerencia", rs -> {
            long id = rs.getLong(1);
            String nome = rs.getString(2), sigla = rs.getString(3);
            if (nome != null) indice.putIfAbsent(normalizar(nome), id);
            if (sigla != null) indice.putIfAbsent(normalizar(sigla), id);
            if (nome != null && sigla != null) indice.putIfAbsent(normalizar(sigla + " - " + nome), id);
        });
        return indice;
    }

    private Map<String, Long> indicePorNome(String tabela) {
        Map<String, Long> indice = new HashMap<>();
        if (!tabelaExiste(tabela)) return indice;
        jdbc.query("SELECT id, nome FROM " + tabela + " ORDER BY id", rs -> {
            if (rs.getString(2) != null) indice.putIfAbsent(normalizar(rs.getString(2)), rs.getLong(1));
        });
        return indice;
    }

    private boolean vazia(String tabela, long questaoId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM " + tabela + " WHERE questao_id = ?", Integer.class, questaoId) == 0;
    }

    private boolean tabelaExiste(String tabela) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
                Integer.class, tabela);
        return n != null && n > 0;
    }

    private boolean colunaExiste(String tabela, String coluna) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
                Integer.class, tabela, coluna);
        return n != null && n > 0;
    }

    private static String texto(Object o) {
        return o == null ? "" : o.toString();
    }

    private static String normalizar(String s) {
        if (s == null) return "";
        return s.trim().replaceAll("\\s+", " ").toLowerCase();
    }

    /** Texto sem HTML, espaços e acentos, para comparar a questão da Matriz com a do Planejamento. */
    private static String textoPuro(Object principal, Object alternativo) {
        String s = texto(principal).isBlank() ? texto(alternativo) : texto(principal);
        s = s.replaceAll("<[^>]*>", " ").replace("&nbsp;", " ");
        s = Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return s.replaceAll("\\s+", " ").trim().toLowerCase();
    }

    private static String listaSem(List<String> itens) {
        if (itens.isEmpty()) return "";
        return "; SEM CORRESPONDÊNCIA NO CADASTRO (" + itens.size() + "): " + String.join(" | ", itens);
    }
}
