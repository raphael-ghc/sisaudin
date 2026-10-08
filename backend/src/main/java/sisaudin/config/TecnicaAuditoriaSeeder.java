package sisaudin.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;
import org.springframework.transaction.annotation.Transactional;
import java.util.Arrays;
import java.util.List;
import sisaudin.model.cadastroBasico.generico.TecnicaAuditoria;
import sisaudin.repository.cadastroBasico.generico.TecnicaAuditoriaRepository;

@Component
@ConditionalOnProperty(name = "app.seeder.enabled", havingValue = "true", matchIfMissing = false)
@Order(1)
public class TecnicaAuditoriaSeeder implements CommandLineRunner {

    @Autowired
    private TecnicaAuditoriaRepository repository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (repository.count() > 0) {
            return;
        }

        List<String> items = Arrays.asList(
            "Inspeção",
            "Observação",
            "Análise documental",
            "Confirmação externa",
            "Indagação",
            "Recálculo",
            "Inquérito",
            "Técnicas de auditoria assistidas por computador (TAAC)",
            "Questionário",
            "Entrevista",
            "Benchmarking"
        );

        for (String item : items) {
            TecnicaAuditoria obj = new TecnicaAuditoria();
            obj.setNome(item);
            if (item.contains("(INATIVADO)")) {
                obj.setStatus("desabilitado");
            } else {
                obj.setStatus("ACTIVE");
            }
            repository.save(obj);
        }
        System.out.println("SEEDER: TecnicaAuditoriaSeeder executado com sucesso.");
    }
}
