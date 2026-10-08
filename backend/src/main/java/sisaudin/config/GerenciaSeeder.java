package sisaudin.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;
import org.springframework.transaction.annotation.Transactional;
import sisaudin.model.cadastroBasico.Gerencia;
import sisaudin.repository.cadastroBasico.GerenciaRepository;
import sisaudin.repository.cadastroBasico.UnidadeRepository;

@Component
@ConditionalOnProperty(name = "app.seeder.enabled", havingValue = "true", matchIfMissing = false)
@Order(3)
public class GerenciaSeeder implements CommandLineRunner {

    @Autowired
    private GerenciaRepository repository;

    @Autowired
    private UnidadeRepository unidadeRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (repository.count() > 0) {
            return;
        }

                repository.save(Gerencia.builder().nome("Gerência de Auditoria Interna").sigla("AUDIN").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Presidência").sigla("PRESID").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Comunicação Social e Assessoria de Eventos").sigla("CSAE").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Assessoria Jurídica").sigla("ASSJUR").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gerência de Licitações").sigla("GL").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Corregedoria").sigla("CORREG").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gerência da Unidade de Pronto Atendimento Moacyr Scliar").sigla("GUPA").unidade(unidadeRepository.findById(6L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gerência de Administração HCC").sigla("GADM-HCC").unidade(unidadeRepository.findById(5L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gerência de Administração HCR").sigla("GADM-HCR").unidade(unidadeRepository.findById(4L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gerência de Administração HF").sigla("GADM-HF").unidade(unidadeRepository.findById(3L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gerência de Atenção Primária à Saúde").sigla("GAPS").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gerência de Participação Social e Diversidade").sigla("GPSD").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gerência de Unidades de Internação HNSC").sigla("GUI-HNSC").unidade(unidadeRepository.findById(2L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gerência de Administração HNSC").sigla("GADM-HNSC").unidade(unidadeRepository.findById(2L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gerência de Interunidades de Serviços Auxiliares de Diagnóstico e Tratamento").sigla("GISADT").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gerência de Projetos").sigla("GPROJ").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gerência de Tecnologia da Informação").sigla("GTI").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gerência de Gestão de Pessoas").sigla("GGP").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gerência Financeira").sigla("GFIN").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gerência de Governança, Riscos e Conformidade").sigla("GGRC").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gerência de Engenharia e Manutenção").sigla("GEM").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gerência de Suprimentos").sigla("GSUP").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gerência de Ensino e Pesquisa").sigla("GEP").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Ouvidoria Geral").sigla("OUVG").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Diretoria Administrativa e Financeira").sigla("DAF").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Diretoria de Atenção à Saúde").sigla("DAS").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Diretoria de Inovação, Gestão do Trabalho e Educação").sigla("DIGTE").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gerência de Unidades de Internação HCR").sigla("GUI-HCR").unidade(unidadeRepository.findById(4L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gerência de Unidades de Internação HF").sigla("GUI-HF").unidade(unidadeRepository.findById(3L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gerência de Unidades de Internação HCC").sigla("GUI-HCC").unidade(unidadeRepository.findById(5L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Diretoria-Executiva").sigla("DIRET").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Comissão de Ética e Conduta").sigla("CEC").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Conselho Fiscal").sigla("CONFIS").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Comitê de Pessoas, Elegibilidade, Sucessão e Remuneração").sigla("CPESR").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gerência de Interunidades de Emergências (EXTINTO)").sigla("GIE").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gerência Geral do HFB").sigla("GG-HFB").unidade(unidadeRepository.findById(25L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Comissão de Padronização de Materiais").sigla("COPAMATI").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Comissão de Padronização de Têxteis").sigla("COPATEX").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("(INATIVA) Gerência de Atenção à Saúde do HFB").sigla("GAS-HFB").unidade(unidadeRepository.findById(25L).orElse(null)).status("desabilitado").build());
        repository.save(Gerencia.builder().nome("(INATIVA) Gerência de Valor em Saúde do HFB").sigla("GVS-HFB").unidade(unidadeRepository.findById(25L).orElse(null)).status("desabilitado").build());
        repository.save(Gerencia.builder().nome("(INATIVA) Gerência de Administração, Finanças, Logística e Suprimentos do HFB").sigla("GAFLS-HFB").unidade(unidadeRepository.findById(25L).orElse(null)).status("desabilitado").build());
        repository.save(Gerencia.builder().nome("Gerência de Administração e Finanças do HFB").sigla("GAF-HFB").unidade(unidadeRepository.findById(25L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gerência de Inovação, Gestão do Trabalho e Educação do HFB").sigla("GIGTE-HFB").unidade(unidadeRepository.findById(25L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gerência de Participação Social e Diversidade do HFB").sigla("GPSD-HFB").unidade(unidadeRepository.findById(25L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gerência de Processos").sigla("GPROC").unidade(unidadeRepository.findById(1L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("GT de Enfretamento ao Passivo Trabalhista (Portaria 332/25)").sigla("GTPassivo").unidade(unidadeRepository.findById(2L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gestão de Atenção à Saude da Pessoa Adulta do HFB").sigla("GASPA-HFB").unidade(unidadeRepository.findById(25L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gestão de Atenção à Saude da Criança e da Mulher do HFB").sigla("GASCRIM-HFB").unidade(unidadeRepository.findById(25L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Serviços Auxiliares de Diagnóstico e Tratamento do HFB").sigla("SADT-HFB").unidade(unidadeRepository.findById(25L).orElse(null)).status("ACTIVE").build());
        repository.save(Gerencia.builder().nome("Gerência de Infraestrutura, Logística e Suprimentos do HFB").sigla("GILS-HFB").unidade(unidadeRepository.findById(25L).orElse(null)).status("ACTIVE").build());
        
        System.out.println("SEEDER: Gerências inseridas com sucesso.");
    }
}
