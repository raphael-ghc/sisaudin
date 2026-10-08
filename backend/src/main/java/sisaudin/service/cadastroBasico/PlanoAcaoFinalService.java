package sisaudin.service.cadastroBasico;

import java.time.LocalDate;
import sisaudin.service.cadastroBasico.DocumentoNumeroService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sisaudin.model.cadastroBasico.PlanoAcaoFinal;
import sisaudin.repository.cadastroBasico.PlanoAcaoFinalRepository;
import java.util.List;
import java.util.Optional;

@Service
public class PlanoAcaoFinalService {

    @Autowired
    private DocumentoNumeroService numeroService;


    @Autowired
    private PlanoAcaoFinalRepository repository;

    public List<PlanoAcaoFinal> findAll() {
        return repository.findAll();
    }

    public List<PlanoAcaoFinal> findByItemTrabalhoId(Long itemTrabalhoId) {
        return repository.findByItemTrabalhoId(itemTrabalhoId);
    }

    public Optional<PlanoAcaoFinal> findById(Long id) {
        return repository.findById(id);
    }

    @Transactional
    public PlanoAcaoFinal save(PlanoAcaoFinal entity) {
        if (entity.getStatus() == null || entity.getStatus().trim().isEmpty()) {
            entity.setStatus("Minuta");
        }
        return repository.save(entity);
    }

    @Transactional
    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
