package sisaudin.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;
import org.springframework.transaction.annotation.Transactional;
import java.util.Arrays;
import java.util.List;
import sisaudin.model.cadastroBasico.generico.TipoAuditoria;
import sisaudin.repository.cadastroBasico.generico.TipoAuditoriaRepository;

@Component
@ConditionalOnProperty(name = "app.seeder.enabled", havingValue = "true", matchIfMissing = false)
@Order(1)
public class TipoAuditoriaSeeder implements CommandLineRunner {

    @Autowired
    private TipoAuditoriaRepository repository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (repository.count() > 0) {
            return;
        }

        List<String> items = Arrays.asList(
            "Operacional",
            "Conformidade",
            "Contábil",
            "Fiscal e Tributária",
            "De Sistemas",
            "Ambiental",
            "De Qualidade"
        );

        for (String item : items) {
            TipoAuditoria obj = new TipoAuditoria();
            obj.setNome(item);
            if (item.contains("(INATIVADO)")) {
                obj.setStatus("desabilitado");
            } else {
                obj.setStatus("ACTIVE");
            }
            repository.save(obj);
        }
        System.out.println("SEEDER: TipoAuditoriaSeeder executado com sucesso.");
    }
}
