package sisaudin.repository.cadastroBasico;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sisaudin.model.cadastroBasico.JustificativaFluxo;
import java.util.List;

@Repository
public interface JustificativaFluxoRepository extends JpaRepository<JustificativaFluxo, Long> {
    List<JustificativaFluxo> findByItemTrabalhoIdOrderByDataHoraDesc(Long itemTrabalhoId);
}
