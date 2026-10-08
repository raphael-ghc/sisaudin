package sisaudin.repository.cadastroBasico;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sisaudin.model.cadastroBasico.PlanoAcaoFinal;
import java.util.List;

@Repository
public interface PlanoAcaoFinalRepository extends JpaRepository<PlanoAcaoFinal, Long> {
    List<PlanoAcaoFinal> findByItemTrabalhoId(Long itemTrabalhoId);
}
