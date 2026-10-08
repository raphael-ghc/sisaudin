package sisaudin.repository.cadastroBasico;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sisaudin.model.cadastroBasico.MatrizAchados;
import java.util.List;

@Repository
public interface MatrizAchadosRepository extends JpaRepository<MatrizAchados, Long> {
    List<MatrizAchados> findByItemTrabalhoId(Long itemTrabalhoId);
}
