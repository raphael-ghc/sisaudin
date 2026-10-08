package sisaudin.repository.cadastroBasico;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sisaudin.model.cadastroBasico.Planejamento;
import java.util.List;

@Repository
public interface PlanejamentoRepository extends JpaRepository<Planejamento, Long> {
    List<Planejamento> findByItemTrabalhoId(Long itemTrabalhoId);
}
