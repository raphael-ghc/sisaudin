package sisaudin.repository.cadastroBasico;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sisaudin.model.cadastroBasico.RelatorioPreliminar;

import java.util.Optional;

@Repository
public interface RelatorioPreliminarRepository extends JpaRepository<RelatorioPreliminar, Long> {
    Optional<RelatorioPreliminar> findByItemTrabalho_Id(Long itemTrabalhoId);
}
