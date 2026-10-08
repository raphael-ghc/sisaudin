package sisaudin.service.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sisaudin.model.cadastroBasico.Reuniao;
import sisaudin.repository.cadastroBasico.ReuniaoRepository;
import java.util.List;
import java.util.Optional;

@Service
public class ReuniaoService {

    @Autowired
    private ReuniaoRepository reuniaoRepository;

    public List<Reuniao> findAll() {
        return reuniaoRepository.findAll();
    }

    public List<Reuniao> findByItemTrabalhoId(Long itemTrabalhoId) {
        return reuniaoRepository.findByItemTrabalhoId(itemTrabalhoId);
    }

    public Optional<Reuniao> findById(Long id) {
        return reuniaoRepository.findById(id);
    }

    @Transactional
    public Reuniao save(Reuniao reuniao) {
        if (reuniao.getStatus() == null || reuniao.getStatus().trim().isEmpty()) {
            reuniao.setStatus("Minuta");
        }
        return reuniaoRepository.save(reuniao);
    }

    @Transactional
    public void deleteById(Long id) {
        reuniaoRepository.deleteById(id);
    }
}
