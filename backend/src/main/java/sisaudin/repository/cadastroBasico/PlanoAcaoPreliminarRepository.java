package sisaudin.repository.cadastroBasico;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sisaudin.model.cadastroBasico.PlanoAcaoPreliminar;
import java.util.List;

@Repository
public interface PlanoAcaoPreliminarRepository extends JpaRepository<PlanoAcaoPreliminar, Long> {
    List<PlanoAcaoPreliminar> findByItemTrabalhoId(Long itemTrabalhoId);
}
