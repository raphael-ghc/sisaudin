package sisaudin.repository.cadastroBasico;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import sisaudin.model.cadastroBasico.GerenciaHistorico;

@Repository
public interface GerenciaHistoricoRepository extends JpaRepository<GerenciaHistorico, Long> {
            
}