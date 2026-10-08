package sisaudin.repository.cadastroBasico;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sisaudin.model.cadastroBasico.HistoricoStatus;
import java.util.List;

@Repository
public interface HistoricoStatusRepository extends JpaRepository<HistoricoStatus, Long> {
    List<HistoricoStatus> findByDocumentoTipoAndDocumentoIdOrderByDataHoraDesc(String documentoTipo, Long documentoId);
}
