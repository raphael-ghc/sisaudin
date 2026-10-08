package sisaudin.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;
import org.springframework.transaction.annotation.Transactional;
import sisaudin.model.cadastroBasico.Unidade;
import sisaudin.repository.cadastroBasico.UnidadeRepository;

@Component
@ConditionalOnProperty(name = "app.seeder.enabled", havingValue = "true", matchIfMissing = false)
@Order(2)
public class UnidadeSeeder implements CommandLineRunner {

    @Autowired
    private UnidadeRepository repository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (repository.count() > 0) {
            return;
        }

        repository.save(Unidade.builder().nome("Grupo Hospitalar Conceição").sigla("GHC").cnpj("74636542000191").status("ACTIVE").build());
        repository.save(Unidade.builder().nome("Hospital Nossa Senhora da Conceição S.A.").sigla("HNSC").cnpj("92787118000120").status("ACTIVE").build());
        repository.save(Unidade.builder().nome("Hospital Fêmina").sigla("HF").cnpj("92787118000200").status("ACTIVE").build());
        repository.save(Unidade.builder().nome("Hospital Cristo Redentor").sigla("HCR").cnpj("92787118000391").status("ACTIVE").build());
        repository.save(Unidade.builder().nome("Hospital Criança Conceição").sigla("HCC").cnpj("92787118000472").status("ACTIVE").build());
        repository.save(Unidade.builder().nome("Unidade de Pronto Atendimento Zona Norte Moacyr Scliar").sigla("UPA").cnpj("92787118000553").status("ACTIVE").build());
        repository.save(Unidade.builder().nome("Unidade de Saúde Santíssima Trindade").sigla("USST").cnpj("92787118000634").status("ACTIVE").build());
        repository.save(Unidade.builder().nome("Unidade de Saúde Parque dos Maias").sigla("USPM").cnpj("92787118000715").status("ACTIVE").build());
        repository.save(Unidade.builder().nome("Unidade de Saúde Nossa Senhora Aparecida").sigla("USNSA").cnpj("92787118000804").status("ACTIVE").build());
        repository.save(Unidade.builder().nome("Unidade de Saúde Jardim Leopoldina").sigla("USJL").cnpj("92787118000987").status("ACTIVE").build());
        repository.save(Unidade.builder().nome("Unidade de Saúde Floresta").sigla("USF").cnpj("92787118001010").status("ACTIVE").build());
        repository.save(Unidade.builder().nome("Unidade de Saúde Divina Providência").sigla("USDP").cnpj("92787118001100").status("ACTIVE").build());
        repository.save(Unidade.builder().nome("Unidade de Saúde Costa e Silva").sigla("USCS").cnpj("92787118001282").status("ACTIVE").build());
        repository.save(Unidade.builder().nome("Unidade de Saúde Coinma").sigla("USC").cnpj("92787118001363").status("ACTIVE").build());
        repository.save(Unidade.builder().nome("Unidade de Saúde Barão de Bagé").sigla("USBB").cnpj("92787118001444").status("ACTIVE").build());
        repository.save(Unidade.builder().nome("Centro de Educação Tecnológica e Pesquisa em Saúde - Escola GHC").sigla("CETPS").cnpj("92787118001525").status("ACTIVE").build());
        repository.save(Unidade.builder().nome("Centro de Atenção Psicossocial I - Infantil").sigla("CAPS1").cnpj("92787118001606").status("ACTIVE").build());
        repository.save(Unidade.builder().nome("Unidade de Saúde Sesc").sigla("USS").cnpj("92787118001797").status("ACTIVE").build());
        repository.save(Unidade.builder().nome("Centro de Atenção Psicossocial II - Adulto").sigla("CAPS2").cnpj("92787118001878").status("ACTIVE").build());
        repository.save(Unidade.builder().nome("Unidade de Saúde Conceição").sigla("USCO").cnpj("92787118001959").status("ACTIVE").build());
        repository.save(Unidade.builder().nome("Unidade de Saúde Jardim Itu").sigla("USJI").cnpj("92787118002092").status("ACTIVE").build());
        repository.save(Unidade.builder().nome("Centro de Atenção Psicossocial III - Álcool e Drogas").sigla("CAPS3").cnpj("92787118002173").status("ACTIVE").build());
        repository.save(Unidade.builder().nome("Consultório de Rua").sigla("CR").cnpj("92787118002254").status("ACTIVE").build());
        repository.save(Unidade.builder().nome("Central de Logística do Grupo Hospitalar Conceição").sigla("CELOG").cnpj("92787118002335").status("ACTIVE").build());
        repository.save(Unidade.builder().nome("Hospital Federal de Bonsucesso").sigla("HFB").cnpj("00394544020291").status("ACTIVE").build());
        
        System.out.println("SEEDER: Unidades inseridas com sucesso.");
    }
}
