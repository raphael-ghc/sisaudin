package sisaudin.repository.cadastroBasico;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import sisaudin.model.cadastroBasico.MatrizAchados;
import sisaudin.model.cadastroBasico.QuestaoMatrizAchados;
import java.util.Collection;
import java.util.List;

@Repository
public interface MatrizAchadosRepository extends JpaRepository<MatrizAchados, Long> {
    // Consulta explícita: pelo nome do método (findByItemTrabalhoId) o Spring Data resolve o campo
    // transiente Documento.itemTrabalhoId, que não existe no banco, e a consulta falha.
    @Query("SELECT m FROM MatrizAchados m WHERE m.itemTrabalho.id = :itemTrabalhoId ORDER BY m.id")
    List<MatrizAchados> findByItemTrabalhoId(@Param("itemTrabalhoId") Long itemTrabalhoId);

    @Query("SELECT m FROM MatrizAchados m WHERE m.planejamentoId = :planejamentoId ORDER BY m.id")
    List<MatrizAchados> findByPlanejamentoId(@Param("planejamentoId") Long planejamentoId);

    // Questões da Matriz ligadas às questões do Planejamento informadas.
    @Query("SELECT q FROM QuestaoMatrizAchados q WHERE q.questaoPlanejamento.id IN :ids")
    List<QuestaoMatrizAchados> findQuestoesPorQuestaoPlanejamento(@Param("ids") Collection<Long> ids);
}
