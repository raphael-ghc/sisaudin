package sisaudin.service.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jakarta.persistence.EntityManager;
import sisaudin.model.cadastroBasico.ItemTrabalho;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Supplier;

@Service
public class DocumentoNumeroService {

    @Autowired
    private EntityManager entityManager;

    private static boolean isRelatorio(String entityName) {
        return entityName.equals("RelatorioPreliminar") || entityName.equals("RelatorioFinal");
    }

    /**
     * Executa o cálculo do próximo número e a gravação do documento sem concorrência,
     * para que duas criações simultâneas não recebam o mesmo número.
     */
    public synchronized <T> T executarComNumeroReservado(Supplier<T> acao) {
        return acao.get();
    }

    /**
     * Determina o grupo lógico de numeração baseado na entidade.
     * Relatórios têm duas sequências: RAI (comum) e REAI (especial).
     */
    public String determineSequenceGroup(String entityName, boolean especial) {
        if (isRelatorio(entityName)) return especial ? "REAI" : "RAI";
        if (entityName.equals("NotaPreliminar") || entityName.equals("NotaFinal")) return "NA";
        if (entityName.equals("PlanoAcaoPreliminar") || entityName.equals("PlanoAcaoFinal")) return "PA";
        if (entityName.equals("Planejamento") || entityName.equals("MatrizAchados")) return "PLANEJAMENTO";
        if (entityName.equals("OrdemServico")) return "OS";
        if (entityName.equals("Comunicacao")) return "CA";
        if (entityName.equals("Solicitacao")) return "SAI";
        if (entityName.equals("NotaTecnica")) return "NT";
        if (entityName.equals("Parecer")) return "PARECER";
        if (entityName.equals("ReuniaoBuscaConjunta")) return "RBC";
        return entityName;
    }

    /**
     * Tipo de relatório que o item de trabalho admite, pelo cadastro "Tipo de Item":
     * EXTRA gera REAI (true), PAINT gera RAI (false). Sem tipo reconhecido, devolve null (nenhum dos dois).
     */
    public static Boolean tipoRelatorioDoItem(ItemTrabalho item) {
        String tipo = item != null && item.getTipoItem() != null && item.getTipoItem().getNome() != null
                ? item.getTipoItem().getNome().toUpperCase() : "";
        if (tipo.contains("EXTRA")) return true;
        if (tipo.contains("PAINT")) return false;
        return null;
    }

    /**
     * Igual a tipoRelatorioDoItem, mas recusa a criação quando o item não tem tipo PAINT ou EXTRA.
     */
    public static boolean exigirTipoRelatorioDoItem(ItemTrabalho item) {
        Boolean tipo = tipoRelatorioDoItem(item);
        if (tipo == null) {
            throw new IllegalStateException("O item de trabalho não tem tipo PAINT ou EXTRA; não é possível definir se o relatório é RAI ou REAI.");
        }
        return tipo;
    }

    /**
     * Um relatório só pode ser vinculado a um item do tipo correspondente (RAI em PAINT, REAI em EXTRA).
     */
    public static void validarVinculoRelatorio(ItemTrabalho item, Boolean especial) {
        if (exigirTipoRelatorioDoItem(item) != Boolean.TRUE.equals(especial)) {
            throw new IllegalStateException(Boolean.TRUE.equals(especial)
                    ? "REAI só pode ser vinculado a item de trabalho EXTRA."
                    : "RAI só pode ser vinculado a item de trabalho PAINT.");
        }
    }

    /**
     * Descobre se o relatório é especial (REAI) quando o chamador não informa:
     * primeiro pelo próprio relatório, depois por um relatório já existente no item de trabalho
     * e, por fim, pelo tipo do item.
     */
    public boolean resolveEspecial(String entityName, Long itemTrabalhoId, Long currentEntityId, Boolean especial) {
        if (!isRelatorio(entityName)) return false;
        if (especial != null) return especial;

        if (currentEntityId != null) {
            List<Boolean> r = entityManager.createQuery(
                            "SELECT d.especial FROM " + entityName + " d WHERE d.id = :id", Boolean.class)
                    .setParameter("id", currentEntityId)
                    .getResultList();
            if (!r.isEmpty()) return Boolean.TRUE.equals(r.get(0));
        }
        if (itemTrabalhoId != null) {
            for (String table : List.of("RelatorioPreliminar", "RelatorioFinal")) {
                List<Boolean> r = entityManager.createQuery(
                                "SELECT d.especial FROM " + table + " d WHERE d.itemTrabalho.id = :itemId", Boolean.class)
                        .setParameter("itemId", itemTrabalhoId)
                        .setMaxResults(1)
                        .getResultList();
                if (!r.isEmpty()) return Boolean.TRUE.equals(r.get(0));
            }
            return Boolean.TRUE.equals(tipoRelatorioDoItem(entityManager.find(ItemTrabalho.class, itemTrabalhoId)));
        }
        return false;
    }

    public Integer getNextAvailableNumber(String entityName, Integer ano, Long itemTrabalhoId) {
        return getNextAvailableNumber(entityName, ano, itemTrabalhoId, null);
    }

    /**
     * Obtém o próximo número disponível para um grupo de sequência.
     * Se o documento fizer parte de um par (ex: NotaPreliminar/NotaFinal) no mesmo ItemTrabalho, herda o número.
     */
    public Integer getNextAvailableNumber(String entityName, Integer ano, Long itemTrabalhoId, Boolean especial) {
        String group = determineSequenceGroup(entityName, resolveEspecial(entityName, itemTrabalhoId, null, especial));

        if (itemTrabalhoId != null) {
            Integer existingNumber = findExistingNumberInSameItemTrabalho(group, itemTrabalhoId);
            if (existingNumber != null) {
                return existingNumber; // Compartilha o número do correspondente!
            }
        }

        return getMaxNumberFromSequenceGroup(group, ano) + 1;
    }

    public boolean checkNumberAvailability(String entityName, Integer ano, Integer numero, Long itemTrabalhoId, Long currentEntityId) {
        return checkNumberAvailability(entityName, ano, numero, itemTrabalhoId, currentEntityId, null);
    }

    /**
     * Verifica se o número desejado já está em uso por OUTRO item no mesmo grupo.
     * (Se for o MESMO itemTrabalho, e o número já é compartilhado, retorna true - ou seja, está disponível para ele).
     */
    public boolean checkNumberAvailability(String entityName, Integer ano, Integer numero, Long itemTrabalhoId, Long currentEntityId, Boolean especial) {
        String group = determineSequenceGroup(entityName, resolveEspecial(entityName, itemTrabalhoId, currentEntityId, especial));

        // Se no mesmo ItemTrabalho já existe ESSE número para o mesmo grupo, então ele tem o direito de usá-lo.
        if (itemTrabalhoId != null) {
            Integer existingNumber = findExistingNumberInSameItemTrabalho(group, itemTrabalhoId);
            if (existingNumber != null && existingNumber.equals(numero)) {
                return true; // Available because it's shared
            }
        }

        // Verifica se qualquer entidade do grupo já usa esse número neste ano, em OUTROS itens de trabalho
        List<String> tables = getTablesForGroup(group);
        for (String table : tables) {
            String query = "SELECT COUNT(d) FROM " + table + " d WHERE d.ano = :ano AND d.numero = :numero";

            // Se a tabela atual é a que estamos validando, excluímos o ID atual para permitir update sem conflito consigo mesmo
            if (table.equals(entityName) && currentEntityId != null) {
                query += " AND d.id != " + currentEntityId;
            }
            query += filtroEspecial(group);

            Long count = entityManager.createQuery(query, Long.class)
                    .setParameter("ano", ano)
                    .setParameter("numero", numero)
                    .getSingleResult();

            if (count > 0) {
                return false; // Alguém já está usando
            }
        }
        return true;
    }

    // Separa as sequências RAI e REAI, que dividem as mesmas tabelas
    private String filtroEspecial(String group) {
        if (group.equals("REAI")) return " AND d.especial = true";
        if (group.equals("RAI")) return " AND (d.especial = false OR d.especial IS NULL)";
        return "";
    }

    private Integer findExistingNumberInSameItemTrabalho(String group, Long itemId) {
        List<String> tables = getTablesForGroup(group);
        for (String table : tables) {
            String query = "SELECT d.numero FROM " + table + " d WHERE d.itemTrabalho.id = :itemId AND d.numero IS NOT NULL" + filtroEspecial(group);
            List<Integer> results = entityManager.createQuery(query, Integer.class)
                    .setParameter("itemId", itemId)
                    .setMaxResults(1)
                    .getResultList();
            if (!results.isEmpty()) {
                return results.get(0);
            }
        }
        return null;
    }

    private Integer getMaxNumberFromSequenceGroup(String group, Integer ano) {
        List<String> tables = getTablesForGroup(group);
        Integer overallMax = 0;

        for (String table : tables) {
            String query = "SELECT MAX(d.numero) FROM " + table + " d WHERE d.ano = :ano" + filtroEspecial(group);

            Integer max = entityManager.createQuery(query, Integer.class)
                    .setParameter("ano", ano)
                    .getSingleResult();
            if (max != null && max > overallMax) {
                overallMax = max;
            }
        }
        return overallMax;
    }

    private List<String> getTablesForGroup(String group) {
        List<String> tables = new ArrayList<>();
        switch (group) {
            case "NA":
                tables.add("NotaPreliminar");
                tables.add("NotaFinal");
                break;
            case "PA":
                tables.add("PlanoAcaoPreliminar");
                tables.add("PlanoAcaoFinal");
                break;
            case "RAI":
            case "REAI":
                tables.add("RelatorioPreliminar");
                tables.add("RelatorioFinal");
                break;
            case "PLANEJAMENTO":
                tables.add("Planejamento");
                tables.add("MatrizAchados");
                break;
            case "OS":
                tables.add("OrdemServico");
                break;
            case "CA":
                tables.add("Comunicacao");
                break;
            case "SAI":
                tables.add("Solicitacao");
                break;
            case "NT":
                tables.add("NotaTecnica");
                break;
            case "PARECER":
                tables.add("Parecer");
                break;
            case "RBC":
                tables.add("ReuniaoBuscaConjunta");
                break;
            default:
                tables.add(group);
        }
        return tables;
    }
}
