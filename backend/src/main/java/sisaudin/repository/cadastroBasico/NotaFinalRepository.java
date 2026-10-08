package sisaudin.repository.cadastroBasico;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sisaudin.model.cadastroBasico.NotaFinal;

import java.util.Optional;

@Repository
public interface NotaFinalRepository extends JpaRepository<NotaFinal, Long> {
    Optional<NotaFinal> findByItemTrabalho_Id(Long itemTrabalhoId);
}
