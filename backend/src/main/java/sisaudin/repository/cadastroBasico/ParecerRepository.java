package sisaudin.repository.cadastroBasico;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sisaudin.model.cadastroBasico.Parecer;

import java.util.Optional;

@Repository
public interface ParecerRepository extends JpaRepository<Parecer, Long> {
    Optional<Parecer> findByItemTrabalho_Id(Long itemTrabalhoId);
}
