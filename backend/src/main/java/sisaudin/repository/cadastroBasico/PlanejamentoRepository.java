package sisaudin.repository.cadastroBasico;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sisaudin.model.cadastroBasico.Planejamento;
import java.util.List;

@Repository
public interface PlanejamentoRepository extends JpaRepository<Planejamento, Long> {
    // Consulta explícita: pelo nome do método o Spring Data resolve o campo transiente
    // Documento.itemTrabalhoId, que não existe no banco, e a consulta falha.
    @Query("SELECT p FROM Planejamento p WHERE p.itemTrabalho.id = :itemTrabalhoId")
    List<Planejamento> findByItemTrabalhoId(@Param("itemTrabalhoId") Long itemTrabalhoId);
}
