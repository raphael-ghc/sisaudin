package sisaudin.repository.cadastroBasico;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sisaudin.model.cadastroBasico.ChecklistAprovacaoItem;
import java.util.List;

@Repository
public interface ChecklistAprovacaoItemRepository extends JpaRepository<ChecklistAprovacaoItem, Long> {
    List<ChecklistAprovacaoItem> findByDocumentoTipoAndDocumentoIdOrderByOrdemAsc(String documentoTipo, Long documentoId);
}
