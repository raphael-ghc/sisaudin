package sisaudin.repository.cadastroBasico;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import sisaudin.model.cadastroBasico.Pessoa;

@Repository
public interface PessoaRepository extends JpaRepository<Pessoa, Long> {
   
    Pessoa findByCartaoPonto(String sigla);
    
    boolean existsByCartaoPonto(String sigla);

    Pessoa findByEmail(String email);
}