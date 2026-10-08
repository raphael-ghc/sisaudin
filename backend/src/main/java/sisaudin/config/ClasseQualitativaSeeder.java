package sisaudin.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;
import org.springframework.transaction.annotation.Transactional;
import java.util.Arrays;
import java.util.List;
import sisaudin.model.cadastroBasico.generico.ClasseQualitativa;
import sisaudin.repository.cadastroBasico.generico.ClasseQualitativaRepository;

@Component
@ConditionalOnProperty(name = "app.seeder.enabled", havingValue = "true", matchIfMissing = false)
@Order(1)
public class ClasseQualitativaSeeder implements CommandLineRunner {

    @Autowired
    private ClasseQualitativaRepository repository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (repository.count() > 0) {
            return;
        }

        List<String> items = Arrays.asList(
            "Medida de aperfeiçoamento da capacidade de gerir riscos e de implementação de controles internos.",
            "Medida de aperfeiçoamento da prestação de serviços públicos.",
            "Medida de aperfeiçoamento ou incremento da transparência e/ou da participação social.",
            "(INATIVADO)Medida de aperfeiçoamento da integridade pública.",
            "(INATIVADO)Medida de aperfeiçoamento da prevenção e enfrentamento da corrupção.",
            "Medida de promoção à sustentabilidade ambiental.",
            "(INATIVADO)Medida de educação para ética e cidadania.",
            "(INATIVADO)Medida de aperfeiçoamento da gestão correcional.",
            "Outras medidas estruturantes de aperfeiçoamento dos programas/processos.",
            "Condenação criminal.",
            "Declaração de inidoneidade.",
            "Demissão, cassação ou destituição.",
            "Medida de aperfeiçoamento do controle social.",
            "Outras decisões civis e medidas administrativas ou correicionais."
        );

        for (String item : items) {
            ClasseQualitativa obj = new ClasseQualitativa();
            obj.setNome(item);
            if (item.contains("(INATIVADO)")) {
                obj.setStatus("desabilitado");
            } else {
                obj.setStatus("ACTIVE");
            }
            repository.save(obj);
        }
        System.out.println("SEEDER: ClasseQualitativaSeeder executado com sucesso.");
    }
}
