package sisaudin.service.cadastroBasico;

import java.time.LocalDate;
import sisaudin.service.cadastroBasico.DocumentoNumeroService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sisaudin.model.cadastroBasico.PlanoAcaoPreliminar;
import sisaudin.repository.cadastroBasico.PlanoAcaoPreliminarRepository;
import java.util.List;
import java.util.Optional;

@Service
public class PlanoAcaoPreliminarService {

    @Autowired
    private DocumentoNumeroService numeroService;


    @Autowired
    private PlanoAcaoPreliminarRepository repository;

    public List<PlanoAcaoPreliminar> findAll() {
        return repository.findAll();
    }

    public List<PlanoAcaoPreliminar> findByItemTrabalhoId(Long itemTrabalhoId) {
        return repository.findByItemTrabalhoId(itemTrabalhoId);
    }

    public Optional<PlanoAcaoPreliminar> findById(Long id) {
        return repository.findById(id);
    }

    @Transactional
    public PlanoAcaoPreliminar save(PlanoAcaoPreliminar entity) {
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
