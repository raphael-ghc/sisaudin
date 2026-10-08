package sisaudin.service.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sisaudin.model.cadastroBasico.MatrizAchados;
import sisaudin.model.cadastroBasico.QuestaoMatrizAchados;
import sisaudin.repository.cadastroBasico.MatrizAchadosRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class MatrizAchadosService {

    @Autowired
    private MatrizAchadosRepository repository;

    @Autowired
    private sisaudin.repository.cadastroBasico.ItemTrabalhoRepository itemTrabalhoRepository;

    @Autowired
    private sisaudin.repository.cadastroBasico.PlanejamentoRepository planejamentoRepository;

    public List<MatrizAchados> findAll() {
        return repository.findAll();
    }

    public List<MatrizAchados> findByItemTrabalhoId(Long itemTrabalhoId) {
        return repository.findByItemTrabalhoId(itemTrabalhoId);
    }

    public Optional<MatrizAchados> findById(Long id) {
        return repository.findById(id);
    }

    @Transactional
    public MatrizAchados save(MatrizAchados entity) {
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
        } else if (entity.getPlanejamentoId() != null) {
            planejamentoRepository.findById(entity.getPlanejamentoId())
                    .ifPresent(p -> {
                        if (p.getItemTrabalho() != null) {
                            entity.setItemTrabalho(p.getItemTrabalho());
                        }
                    });
        }
        if (entity.getQuestoes() != null) {
            for (QuestaoMatrizAchados q : entity.getQuestoes()) {
                q.setMatrizAchados(entity);
            }
        }
        return repository.save(entity);
    }

    @Transactional
    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
