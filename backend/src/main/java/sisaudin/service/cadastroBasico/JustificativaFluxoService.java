package sisaudin.service.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sisaudin.model.cadastroBasico.JustificativaFluxo;
import sisaudin.repository.cadastroBasico.JustificativaFluxoRepository;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class JustificativaFluxoService {

    @Autowired
    private JustificativaFluxoRepository repository;

    public List<JustificativaFluxo> findByItemTrabalho(Long itemTrabalhoId) {
        return repository.findByItemTrabalhoIdOrderByDataHoraDesc(itemTrabalhoId);
    }

    @Transactional
    public JustificativaFluxo save(JustificativaFluxo justificativa) {
        if (justificativa.getDataHora() == null) {
            justificativa.setDataHora(LocalDateTime.now());
        }
        return repository.save(justificativa);
    }
}
