package sisaudin.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.Arrays;
import java.util.List;
import sisaudin.model.cadastroBasico.Pessoa;
import sisaudin.repository.cadastroBasico.PessoaRepository;
import sisaudin.repository.cadastroBasico.GerenciaRepository;

@Component
@ConditionalOnProperty(name = "app.seeder.enabled", havingValue = "true", matchIfMissing = false)
@Order(4)
public class PessoaSeeder implements CommandLineRunner {

    @Autowired
    private PessoaRepository pessoaRepository;

    @Autowired
    private GerenciaRepository gerenciaRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static class PessoaDTO {
        String nome;
        String email;
        String cartaoPonto;
        Long gerenciaId;

        public PessoaDTO(String nome, String email, String cartaoPonto, Long gerenciaId) {
            this.nome = nome;
            this.email = email;
            this.cartaoPonto = cartaoPonto;
            this.gerenciaId = gerenciaId;
        }
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (pessoaRepository.count() == 0) {
            seedPessoas();
        }

        // Garante que todas as pessoas tenham senha e role
        List<Pessoa> todasPessoas = pessoaRepository.findAll();
        for (Pessoa p : todasPessoas) {
            boolean updated = false;
            if (p.getPassword() == null || p.getPassword().isEmpty()) {
                p.setPassword(passwordEncoder.encode("123456"));
                updated = true;
            }
            if (p.getRole() == null) {
                if (p.getEmail() != null && (p.getEmail().equals("amanda.kochhann@ghc.com.br") || p.getEmail().equals("admin@ghc.com.br"))) {
                    p.setRole(Pessoa.Role.SISTEMA);
                } else if (p.getEmail() != null && (p.getEmail().equals("vanessar@ghc.com.br") || p.getEmail().equals("erika@ghc.com.br") || p.getEmail().equals("jerri.coelho@ghc.com.br"))) {
                    p.setRole(Pessoa.Role.GESTOR);
                } else if (p.getGerencia() != null && p.getGerencia().getId() != null && p.getGerencia().getId() == 1L) {
                    p.setRole(Pessoa.Role.AUDITOR);
                } else {
                    p.setRole(Pessoa.Role.VISITANTE);
                }
                updated = true;
            }
            if (updated) {
                pessoaRepository.save(p);
            }
        }
        System.out.println("SEEDER: PessoaSeeder executado e senhas/roles atualizadas.");
    }

    private void seedPessoas() {
        List<PessoaDTO> items = Arrays.asList(
            new PessoaDTO("Jerri Eddie Xavier Coelho", "jerri.coelho@ghc.com.br", "249", 1L),
            new PessoaDTO("Gilberto Barichello", "barichello@ghc.com.br", "233", 2L),
            new PessoaDTO("João Constantino Pavani Motta", "motta@ghc.com.br", "241", 25L),
            new PessoaDTO("Luís Antônio Benvegnú", "Luis.Benvegnu@ghc.com.br", "246", 26L),
            new PessoaDTO("Quelen Tanize Alves da Silva", "Quelen.Silva@ghc.com.br", "31492", 27L),
            new PessoaDTO("Gerusa Bittencourt", "Gerusa.Bittencourt@ghc.com.br", "44448", 7L),
            new PessoaDTO("Denise Maria Mantovani", "Denise.Mantovani@ghc.com.br", "43770", 3L),
            new PessoaDTO("Vitto Giancristoforo dos Santos", "svitto@ghc.com.br", "26295", 6L),
            new PessoaDTO("Jonas Luís Ribeiro", "rjonas@ghc.com.br", "37712", 24L),
            new PessoaDTO("Paulo César Salvamoura Pires", "PauloCesar.Pires@ghc.com.br", "43756", 5L),
            new PessoaDTO("Edenilson Bomfim da Silva", "EDENILSON@ghc.com.br", "26473", 23L),
            new PessoaDTO("Neury João Moretto", "Neury.Moretto@ghc.com.br", "43787", 22L),
            new PessoaDTO("Elifas Marion Kerller Simas", "Elifas.Simas@ghc.com.br", "43816", 21L),
            new PessoaDTO("Leandro Pires Barcellos", "BARCELLOS@ghc.com.br", "43759", 20L),
            new PessoaDTO("Janice de Freitas Cardoso", "janice.fcardoso@ghc.com.br", "43815", 19L),
            new PessoaDTO("Julianna Alves Spall Valente Lopes", "Julianna.Spall@ghc.com.br", "44057", 18L),
            new PessoaDTO("Marco Antônio Fisch", "FMARCO@ghc.com.br", "5989", 17L),
            new PessoaDTO("Maicon Barbosa da Silva", "Maicon.Silva@ghc.com.br", "44422", 4L),
            new PessoaDTO("José Jorge Rodrigues Branco", "Jorge.Branco@ghc.com.br", "43935", 16L),
            new PessoaDTO("Carolina Gasperin", "GCAROLINA@ghc.com.br", "29663", 15L),
            new PessoaDTO("Gilberto Faturi Gindri", "gilberto@ghc.com.br", "20003", 1L),
            new PessoaDTO("Amanda Monteiro Galvão Kochhann", "amanda.kochhann@ghc.com.br", "43461", 1L),
            new PessoaDTO("Ana Paula de Melo Saraçol", "anamelo@ghc.com.br", "32971", 1L),
            new PessoaDTO("Monise Ferreira Jacques", "monise@ghc.com.br", "34097", 1L),
            new PessoaDTO("Maria Flora Garcia da Silva", "fmaria@ghc.com.br", "16281", 1L),
            new PessoaDTO("Sidney Rodrigues da Costa", "csidney@ghc.com.br", "18073", 1L),
            new PessoaDTO("Paulo Ravara", "ravara@ghc.com.br", "34194", 1L),
            new PessoaDTO("Erika da Rocha Capristrani", "erika@ghc.com.br", "35193", 1L),
            new PessoaDTO("Vanessa Bragança Rocha", "vanessar@ghc.com.br", "33901", 1L),
            new PessoaDTO("Juliano Campanha Barcelos", "julianoc@ghc.com.br", "28598", 1L),
            new PessoaDTO("Natália Camargo Mattos", "mnatalia@ghc.com.br", "37078", 1L),
            new PessoaDTO("Jesse James Marquezotti Selistre", "Jesse.Selistre@ghc.com.br", "40661", 7L),
            new PessoaDTO("Diego Monroe Kurtz", "Diego.Kurtz@ghc.com.br", "27820", 8L),
            new PessoaDTO("Carlos Roberto da Silva Xavier", "XCARLOS@ghc.com.br", "23874", 9L),
            new PessoaDTO("Cláudio Roberto Ramos da Silva", "Claudio.Silva@ghc.com.br", "43790", 10L),
            new PessoaDTO("Eduardo Russomano Freire", "Eduardo.Freire@ghc.com.br", "43791", 12L),
            new PessoaDTO("Lana Catani Ferreira Pinto", "Lana.Pinto@ghc.com.br", "34287", 13L),
            new PessoaDTO("Alvarim de Souza Severo", "SALVARIM@ghc.com.br", "14107", 14L),
            new PessoaDTO("Niva Maria de Deus Martinez", "Niva.Martinez@ghc.com.br", "32760", 29L),
            new PessoaDTO("Fernanda Zanoto Kraemer", "FKRAEMER@ghc.com.br", "27402", 28L),
            new PessoaDTO("Laís Gonçalves Garcia", "Lais.Garcia@ghc.com.br", "43772", 30L),
            new PessoaDTO("Salete Teresinha Rizzotto", "salete@ghc.com.br", "42480", 31L),
            new PessoaDTO("José Luís Serafini Boll", "joseb@ghc.com.br", "257", 1L),
            new PessoaDTO("Elaine Machado López", "ELOPEZ@ghc.com.br", "46167", 36L),
            new PessoaDTO("Admin", "admin@ghc.com.br", "87458", 1L),
            new PessoaDTO("Rosana Reis Nothen", "aindanaotem@ghc.com.br", "1063", 26L),
            new PessoaDTO("Carine Vasconcelos Tellier", "Carine.Tellier@ghc.com.br", "43312", 46L),
            new PessoaDTO("Marcio Marcelo de Oliveira", "mmopuc@gmail.com", "50942", 1L),
            new PessoaDTO("Breno Mothe Mattos", "breno.mothe99@gmail.com", "51901", 1L),
            new PessoaDTO("Lisiane Vieira dos Santos", "superintendenciahfb@ghc.com.br", "49986", 36L)
        );

        for (PessoaDTO dto : items) {
            Pessoa pessoa = new Pessoa();
            pessoa.setNome(dto.nome);
            pessoa.setEmail(dto.email);
            pessoa.setCartaoPonto(dto.cartaoPonto);
            pessoa.setStatus("ACTIVE");
            pessoa.setPassword(passwordEncoder.encode("123456"));
            
            if (dto.email.equals("amanda.kochhann@ghc.com.br") || dto.email.equals("admin@ghc.com.br")) {
                pessoa.setRole(Pessoa.Role.SISTEMA);
            } else if (dto.email.equals("vanessar@ghc.com.br") || dto.email.equals("erika@ghc.com.br") || dto.email.equals("jerri.coelho@ghc.com.br")) {
                pessoa.setRole(Pessoa.Role.GESTOR);
            } else if (dto.gerenciaId == 1L) {
                pessoa.setRole(Pessoa.Role.AUDITOR);
            } else {
                pessoa.setRole(Pessoa.Role.VISITANTE);
            }
            
            sisaudin.model.cadastroBasico.Gerencia gerencia = gerenciaRepository.findById(dto.gerenciaId).orElse(null);
            pessoa.setGerencia(gerencia);
            
            pessoaRepository.save(pessoa);
        }
    }
}
