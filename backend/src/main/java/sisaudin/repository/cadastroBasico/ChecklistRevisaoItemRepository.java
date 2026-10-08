package sisaudin.repository.cadastroBasico;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sisaudin.model.cadastroBasico.ChecklistRevisaoItem;
import java.util.List;

@Repository
public interface ChecklistRevisaoItemRepository extends JpaRepository<ChecklistRevisaoItem, Long> {
    List<ChecklistRevisaoItem> findByDocumentoTipoAndDocumentoIdOrderByOrdemAsc(String documentoTipo, Long documentoId);
}
