package sisaudin.repository.cadastroBasico;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sisaudin.model.cadastroBasico.NotaTecnica;

import java.util.Optional;

@Repository
public interface NotaTecnicaRepository extends JpaRepository<NotaTecnica, Long> {
    Optional<NotaTecnica> findByItemTrabalho_Id(Long itemTrabalhoId);
}
