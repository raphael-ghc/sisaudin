package sisaudin.repository.cadastroBasico;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import sisaudin.model.cadastroBasico.Unidade;

@Repository
public interface UnidadeRepository extends JpaRepository<Unidade, Long> {
    
    Unidade findByNome(String nome);
    
    boolean existsByNome(String nome);

    
    Unidade findBySigla(String sigla);
    
    boolean existsBySigla(String sigla);

    
    Unidade findByCnpj(String cnpj);
    
    boolean existsByCnpj(String cnpj);
    
}