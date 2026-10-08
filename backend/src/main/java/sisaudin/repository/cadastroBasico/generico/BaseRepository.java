package sisaudin.repository.cadastroBasico.generico;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.NoRepositoryBean;

import sisaudin.model.cadastroBasico.generico.BaseEntity;

// Interface Base
@NoRepositoryBean
public interface BaseRepository<T extends BaseEntity> extends JpaRepository<T, Long> {

    T findByNome(String nome);
    
    boolean existsByNome(String nome);
}