package sisaudin.repository.cadastroBasico;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import sisaudin.model.cadastroBasico.AnexoDocumento;
import java.util.List;

@Repository
public interface AnexoDocumentoRepository extends JpaRepository<AnexoDocumento, Long> {
    List<AnexoDocumento> findByItemTrabalhoIdAndDocumento(Long itemTrabalhoId, String documento);
}
