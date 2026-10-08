package sisaudin.repository.cadastroBasico;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sisaudin.model.cadastroBasico.NotaPreliminar;

import java.util.Optional;

@Repository
public interface NotaPreliminarRepository extends JpaRepository<NotaPreliminar, Long> {
    Optional<NotaPreliminar> findByItemTrabalho_Id(Long itemTrabalhoId);
}
