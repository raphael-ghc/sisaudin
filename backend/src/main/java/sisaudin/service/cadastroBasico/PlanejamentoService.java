package sisaudin.service.cadastroBasico;

import sisaudin.service.cadastroBasico.DocumentoNumeroService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sisaudin.model.cadastroBasico.Planejamento;
import sisaudin.model.cadastroBasico.QuestaoPlanejamento;
import sisaudin.repository.cadastroBasico.PlanejamentoRepository;
import sisaudin.repository.cadastroBasico.ItemTrabalhoRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class PlanejamentoService {

    @Autowired
    private DocumentoNumeroService numeroService;


    @Autowired
    private PlanejamentoRepository repository;

    @Autowired
    private ItemTrabalhoRepository itemTrabalhoRepository;

    @Transactional(readOnly = true)
    public List<Planejamento> findAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Planejamento> findByItemTrabalhoId(Long itemTrabalhoId) {
        return repository.findByItemTrabalhoId(itemTrabalhoId);
    }

    @Transactional(readOnly = true)
    public Optional<Planejamento> findById(Long id) {
        return repository.findById(id);
    }

    @Transactional
    public Planejamento save(Planejamento entity) {
        if (entity.getStatus() == null || entity.getStatus().trim().isEmpty()) {
            entity.setStatus("Minuta");
        }
        if (entity.getDataEmissao() == null) {
            entity.setDataEmissao(LocalDate.now());
        }
        Long itemId = entity.getItemTrabalhoId();
        if (itemId == null && entity.getItemTrabalho() != null && entity.getItemTrabalho().getId() != null) {
            itemId = entity.getItemTrabalho().getId();
        }
        if (itemId != null) {
            itemTrabalhoRepository.findById(itemId).ifPresent(entity::setItemTrabalho);
        } else if (entity.getId() != null) {
            repository.findById(entity.getId()).ifPresent(existing -> {
                if (existing.getItemTrabalho() != null && entity.getItemTrabalho() == null) {
                    entity.setItemTrabalho(existing.getItemTrabalho());
                }
            });
        }
        if (entity.getQuestoes() != null) {
            for (QuestaoPlanejamento q : entity.getQuestoes()) {
                q.setPlanejamento(entity);
            }
        }
        return repository.save(entity);
    }

    @Transactional
    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
