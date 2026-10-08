package sisaudin.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;
import org.springframework.transaction.annotation.Transactional;
import java.util.Arrays;
import java.util.List;
import sisaudin.model.cadastroBasico.generico.Cargo;
import sisaudin.repository.cadastroBasico.generico.CargoRepository;

@Component
@ConditionalOnProperty(name = "app.seeder.enabled", havingValue = "true", matchIfMissing = false)
@Order(1)
public class CargoSeeder implements CommandLineRunner {

    @Autowired
    private CargoRepository repository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (repository.count() > 0) {
            return;
        }

        List<String> items = Arrays.asList(
            "Auxiliar de Higienização",
            "Auxiliar Técnico de Higienização Hospitalar",
            "Auxiliar Geral",
            "Auxiliar de Raio 'X'",
            "Atendente de Enfermagem",
            "Auxiliar de Fisiatria",
            "Auxiliar de Limpeza e Esterilização Laboratório",
            "Vigia",
            "Atendente de Nutrição",
            "Auxiliar de Manutenção",
            "Cozinheiro",
            "Despenseiro",
            "Instrumentador Cirúrgico",
            "Coletador de Laboratório",
            "Auxiliar de Farmácia",
            "Agente de Saúde Comunitária",
            "Telefonista",
            "Motorista",
            "Auxiliar Administrativo",
            "Auxiliar de Laboratório",
            "Auxiliar de Nutrição",
            "Supervisor Segurança Física",
            "Gessista",
            "Auxiliar de Enfermagem B",
            "Técnico de Nutrição",
            "Auxiliar de Almoxarifado",
            "Auxiliar Técnico Gasometria",
            "Técnico de Manutenção",
            "Técnico em Saúde Bucal",
            "Técnico de Enfermagem",
            "Auxiliar de Enfermagem A",
            "Técnico de Prótese Dentária",
            "Auxiliar Técnico Administrativo",
            "Técnico de Segurança do Trabalho",
            "Técnico de Radiologia",
            "Administrador",
            "Técnico em Histopatologia",
            "Técnico em Eletrônica",
            "Técnico Administrativo",
            "Especialista em Manutenção Hospitalar",
            "Programador",
            "Comprador",
            "Nutricionista",
            "Farmacêutico",
            "Farmacêutico Bioquímico",
            "Perfusionista",
            "Físico",
            "Psicólogo",
            "Enfermeiro",
            "Bibliotecário",
            "Fisioterapeuta",
            "Técnico em Educação",
            "Terapeuta Ocupacional",
            "Fonoaudiólogo",
            "Especialista em Hemoterapia",
            "Biólogo",
            "Assistente Social",
            "Odontólogo",
            "Médico",
            "Supervisor Administrativo",
            "Engenheiro",
            "Contador",
            "Arquiteto",
            "Analista de Suporte",
            "Químico",
            "Gerente",
            "Analista de Sistemas",
            "Técnico Especializado",
            "Auditor Interno",
            "Advogado",
            "FG-4 Supervisor",
            "FG-3 Assistente de Coordenação",
            "FG-2 Especialista",
            "FG-2 Pregoeiro",
            "FG-1 Assessor de Gerência",
            "FG-1 Consultor",
            "FG-1 Coordenador",
            "CC-2 Assessor de Diretoria",
            "Diretor-Presidente",
            "Diretor Administrativo e Financeiro",
            "Diretor de Atenção à Saúde",
            "Diretora de Inovação, Gestão do Trabalho e Educação",
            "Superintendente",
            "Gerente CCRJ2"
        );

        for (String item : items) {
            Cargo obj = new Cargo();
            obj.setNome(item);
            if (item.contains("(INATIVADO)")) {
                obj.setStatus("desabilitado");
            } else {
                obj.setStatus("ACTIVE");
            }
            repository.save(obj);
        }
        System.out.println("SEEDER: CargoSeeder executado com sucesso.");
    }
}
