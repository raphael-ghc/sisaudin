package sisaudin.repository.cadastroBasico;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sisaudin.model.cadastroBasico.RelatorioFinal;

import java.util.Optional;

@Repository
public interface RelatorioFinalRepository extends JpaRepository<RelatorioFinal, Long> {
    Optional<RelatorioFinal> findByItemTrabalho_Id(Long itemTrabalhoId);
}
