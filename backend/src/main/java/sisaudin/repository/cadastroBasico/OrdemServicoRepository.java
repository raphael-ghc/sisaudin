package sisaudin.repository.cadastroBasico;

import org.springframework.data.jpa.repository.JpaRepository;
import sisaudin.model.cadastroBasico.OrdemServico;

public interface OrdemServicoRepository extends JpaRepository<OrdemServico, Long> {
}
