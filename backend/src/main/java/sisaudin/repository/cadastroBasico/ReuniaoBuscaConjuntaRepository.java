package sisaudin.repository.cadastroBasico;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import sisaudin.model.cadastroBasico.NotaPreliminar;
import sisaudin.model.cadastroBasico.ReuniaoBuscaConjunta;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReuniaoBuscaConjuntaRepository extends JpaRepository<ReuniaoBuscaConjunta, Long> {
    @org.springframework.data.jpa.repository.Query("SELECT r FROM ReuniaoBuscaConjunta r WHERE r.itemTrabalho.id = :itemTrabalhoId")
    List<ReuniaoBuscaConjunta> findByItemTrabalhoIdCustom(@org.springframework.data.repository.query.Param("itemTrabalhoId") Long itemTrabalhoId);

    List<ReuniaoBuscaConjunta> findByItemTrabalho_Id(Long itemTrabalhoId);
}
