package sisaudin.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;
import org.springframework.transaction.annotation.Transactional;
import java.util.Arrays;
import java.util.List;
import sisaudin.model.cadastroBasico.generico.TipoRisco;
import sisaudin.repository.cadastroBasico.generico.TipoRiscoRepository;

@Component
@ConditionalOnProperty(name = "app.seeder.enabled", havingValue = "true", matchIfMissing = false)
@Order(1)
public class TipoRiscoSeeder implements CommandLineRunner {

    @Autowired
    private TipoRiscoRepository repository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (repository.count() > 0) {
            return;
        }

        List<String> items = Arrays.asList(
            "Ambiental",
            "Contábil",
            "Financeiro",
            "Operacional",
            "Conformidade",
            "Estratégico",
            "Integridade",
            "Gestão de Pessoas",
            "Imagem",
            "Assistencial",
            "Segurança da Informação",
            "Tecnologia da Informação",
            "Governança",
            "Continuidade do Negócio",
            "Transparência e Accountability"
        );

        for (String item : items) {
            TipoRisco obj = new TipoRisco();
            obj.setNome(item);
            if (item.contains("(INATIVADO)")) {
                obj.setStatus("desabilitado");
            } else {
                obj.setStatus("ACTIVE");
            }
            repository.save(obj);
        }
        System.out.println("SEEDER: TipoRiscoSeeder executado com sucesso.");
    }
}
