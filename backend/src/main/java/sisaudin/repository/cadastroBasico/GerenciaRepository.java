package sisaudin.repository.cadastroBasico;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import sisaudin.model.cadastroBasico.Gerencia;
import sisaudin.model.cadastroBasico.Pessoa;

@Repository
public interface GerenciaRepository extends JpaRepository<Gerencia, Long> {
    
    Gerencia findBySigla(String sigla);
    
    boolean existsBySigla(String sigla);

    // Busca se existe alguma gerência onde esta pessoa é a gestora atual
    Optional<Gerencia> findByGerente(Pessoa gerente);
    
}