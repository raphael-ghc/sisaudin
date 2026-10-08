package sisaudin.repository.cadastroBasico;

import org.springframework.data.jpa.repository.JpaRepository;
import sisaudin.model.cadastroBasico.Solicitacao;

public interface SolicitacaoRepository extends JpaRepository<Solicitacao, Long> {
}
