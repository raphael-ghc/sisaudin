package sisaudin.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;
import org.springframework.transaction.annotation.Transactional;
import java.util.Arrays;
import java.util.List;
import sisaudin.model.cadastroBasico.generico.NivelRisco;
import sisaudin.repository.cadastroBasico.generico.NivelRiscoRepository;

@Component
@ConditionalOnProperty(name = "app.seeder.enabled", havingValue = "true", matchIfMissing = false)
@Order(1)
public class NivelRiscoSeeder implements CommandLineRunner {

    @Autowired
    private NivelRiscoRepository repository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (repository.count() > 0) {
            return;
        }

        List<String> items = Arrays.asList(
            "Baixo",
            "Médio",
            "Alto",
            "Extremo"
        );

        for (String item : items) {
            NivelRisco obj = new NivelRisco();
            obj.setNome(item);
            if (item.contains("(INATIVADO)")) {
                obj.setStatus("desabilitado");
            } else {
                obj.setStatus("ACTIVE");
            }
            repository.save(obj);
        }
        System.out.println("SEEDER: NivelRiscoSeeder executado com sucesso.");
    }
}
