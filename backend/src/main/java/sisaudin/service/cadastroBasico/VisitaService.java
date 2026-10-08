package sisaudin.service.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sisaudin.model.cadastroBasico.Visita;
import sisaudin.repository.cadastroBasico.VisitaRepository;
import java.util.List;
import java.util.Optional;

@Service
public class VisitaService {

    @Autowired
    private VisitaRepository visitaRepository;

    public List<Visita> findAll() {
        return visitaRepository.findAll();
    }

    public List<Visita> findByItemTrabalhoId(Long itemTrabalhoId) {
        return visitaRepository.findByItemTrabalhoId(itemTrabalhoId);
    }

    public Optional<Visita> findById(Long id) {
        return visitaRepository.findById(id);
    }

    @Transactional
    public Visita save(Visita visita) {
        if (visita.getStatus() == null || visita.getStatus().trim().isEmpty()) {
            visita.setStatus("Minuta");
        }
        return visitaRepository.save(visita);
    }

    @Transactional
    public void deleteById(Long id) {
        visitaRepository.deleteById(id);
    }
}
