package sisaudin.repository.cadastroBasico;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sisaudin.model.cadastroBasico.Reuniao;
import java.util.List;

@Repository
public interface ReuniaoRepository extends JpaRepository<Reuniao, Long> {
    List<Reuniao> findByItemTrabalhoId(Long itemTrabalhoId);
}
