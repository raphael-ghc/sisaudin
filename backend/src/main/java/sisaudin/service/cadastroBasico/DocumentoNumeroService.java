package sisaudin.service.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jakarta.persistence.EntityManager;
import sisaudin.model.cadastroBasico.ItemTrabalho;
import sisaudin.repository.cadastroBasico.ItemTrabalhoRepository;

import java.util.ArrayList;
import java.util.List;

@Service
public class DocumentoNumeroService {

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private ItemTrabalhoRepository itemTrabalhoRepository;

    /**
     * Determina o grupo lógico de numeração baseado na entidade e no ItemTrabalho.
     */
    public String determineSequenceGroup(String entityName, Long itemTrabalhoId) {
        if (itemTrabalhoId != null && (entityName.equals("RelatorioPreliminar") || entityName.equals("RelatorioFinal"))) {
            ItemTrabalho item = itemTrabalhoRepository.findById(itemTrabalhoId).orElse(null);
            if (item != null && item.getSigla() != null && item.getSigla().toUpperCase().contains("EXTRA")) {
                return "REAI";
            }
            return "RAI";
        }
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
     * Obtém o próximo número disponível para um grupo de sequência.
     * Se o documento fizer parte de um par (ex: NotaPreliminar/NotaFinal) no mesmo ItemTrabalho, herda o número.
     */
    public Integer getNextAvailableNumber(String entityName, Integer ano, Long itemTrabalhoId) {
        String group = determineSequenceGroup(entityName, itemTrabalhoId);

        if (itemTrabalhoId != null) {
            Integer existingNumber = findExistingNumberInSameItemTrabalho(group, itemTrabalhoId);
            if (existingNumber != null) {
                return existingNumber; // Compartilha o número do correspondente!
            }
        }

        return getMaxNumberFromSequenceGroup(group, ano) + 1;
    }

    /**
     * Verifica se o número desejado já está em uso por OUTRO item no mesmo grupo.
     * (Se for o MESMO itemTrabalho, e o número já é compartilhado, retorna true - ou seja, está disponível para ele).
     */
    public boolean checkNumberAvailability(String entityName, Integer ano, Integer numero, Long itemTrabalhoId, Long currentEntityId) {
        String group = determineSequenceGroup(entityName, itemTrabalhoId);
        
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
            // Filtro de RAI / REAI
            if (table.equals("RelatorioPreliminar") || table.equals("RelatorioFinal")) {
                if (group.equals("REAI")) {
                    query += " AND d.itemTrabalho.sigla LIKE '%EXTRA%'";
                } else if (group.equals("RAI")) {
                    query += " AND d.itemTrabalho.sigla NOT LIKE '%EXTRA%'";
                }
            }

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

    private Integer findExistingNumberInSameItemTrabalho(String group, Long itemId) {
        List<String> tables = getTablesForGroup(group);
        for (String table : tables) {
            String query = "SELECT d.numero FROM " + table + " d WHERE d.itemTrabalho.id = :itemId AND d.numero IS NOT NULL";
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
            String query = "SELECT MAX(d.numero) FROM " + table + " d WHERE d.ano = :ano";
            
            if (table.equals("RelatorioPreliminar") || table.equals("RelatorioFinal")) {
                if (group.equals("REAI")) {
                    query += " AND d.itemTrabalho.sigla LIKE '%EXTRA%'";
                } else if (group.equals("RAI")) {
                    query += " AND d.itemTrabalho.sigla NOT LIKE '%EXTRA%'";
                }
            }

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
