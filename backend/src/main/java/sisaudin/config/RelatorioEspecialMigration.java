package sisaudin.config;

import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Preenche o campo "especial" dos relatórios criados antes de ele existir.
 * Até então o REAI era deduzido da sigla do item de trabalho (contendo "EXTRA"),
 * então essa mesma regra é usada para classificar os relatórios antigos.
 * Só toca em registros com o campo nulo; depois da primeira execução não altera nada.
 */
@Component
public class RelatorioEspecialMigration implements CommandLineRunner {

    @Autowired
    private EntityManager entityManager;

    @Override
    @Transactional
    public void run(String... args) {
        for (String entidade : new String[]{"RelatorioPreliminar", "RelatorioFinal"}) {
            int especiais = entityManager.createQuery(
                    "UPDATE " + entidade + " r SET r.especial = true WHERE r.especial IS NULL " +
                    "AND r.itemTrabalho.id IN (SELECT i.id FROM ItemTrabalho i WHERE UPPER(i.sigla) LIKE '%EXTRA%')")
                    .executeUpdate();
            int comuns = entityManager.createQuery(
                    "UPDATE " + entidade + " r SET r.especial = false WHERE r.especial IS NULL")
                    .executeUpdate();
            if (especiais + comuns > 0) {
                System.out.println("[RelatorioEspecialMigration] " + entidade + ": " + especiais + " marcados como REAI, " + comuns + " como RAI.");
            }
        }
    }
}
