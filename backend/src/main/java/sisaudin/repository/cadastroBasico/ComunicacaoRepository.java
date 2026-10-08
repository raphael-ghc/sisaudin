package sisaudin.repository.cadastroBasico;

import org.springframework.data.jpa.repository.JpaRepository;
import sisaudin.model.cadastroBasico.Comunicacao;

public interface ComunicacaoRepository extends JpaRepository<Comunicacao, Long> {
}
