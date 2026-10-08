package sisaudin.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;
import org.springframework.transaction.annotation.Transactional;
import java.util.Arrays;
import java.util.List;
import sisaudin.model.cadastroBasico.generico.Origem;
import sisaudin.repository.cadastroBasico.generico.OrigemRepository;

@Component
@ConditionalOnProperty(name = "app.seeder.enabled", havingValue = "true", matchIfMissing = false)
@Order(1)
public class OrigemDemandaSeeder implements CommandLineRunner {

    @Autowired
    private OrigemRepository repository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (repository.count() > 0) {
            return;
        }

        List<String> items = Arrays.asList(
            "Obrigação Legal",
            "Solicitação da Gestão",
            "Avaliação de Riscos",
            "Outros",
            "Legado",
            "TCU",
            "CGU"
        );

        for (String item : items) {
            Origem obj = new Origem();
            obj.setNome(item);
            if (item.contains("(INATIVADO)")) {
                obj.setStatus("desabilitado");
            } else {
                obj.setStatus("ACTIVE");
            }
            repository.save(obj);
        }
        System.out.println("SEEDER: OrigemDemandaSeeder executado com sucesso.");
    }
}
