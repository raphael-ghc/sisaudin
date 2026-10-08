package sisaudin.repository.cadastroBasico;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import sisaudin.model.cadastroBasico.ItemTrabalho;

@Repository
public interface ItemTrabalhoRepository extends JpaRepository<ItemTrabalho, Long> {
    ItemTrabalho findBySigla(String sigla);
    boolean existsBySigla(String sigla);
}
