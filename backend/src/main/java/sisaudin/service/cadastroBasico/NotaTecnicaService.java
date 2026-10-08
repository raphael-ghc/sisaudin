package sisaudin.service.cadastroBasico;

import java.time.LocalDate;
import sisaudin.service.cadastroBasico.DocumentoNumeroService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import sisaudin.model.cadastroBasico.Gerencia;
import sisaudin.model.cadastroBasico.ItemTrabalho;
import sisaudin.model.cadastroBasico.NotaTecnica;
import sisaudin.repository.cadastroBasico.GerenciaRepository;
import sisaudin.repository.cadastroBasico.ItemTrabalhoRepository;
import sisaudin.repository.cadastroBasico.NotaTecnicaRepository;
import jakarta.persistence.EntityNotFoundException;

import java.util.List;
import java.util.Optional;

@Service
public class NotaTecnicaService {

    @Autowired
    private DocumentoNumeroService numeroService;


    @Autowired
    private NotaTecnicaRepository repository;

    @Autowired
    private ItemTrabalhoRepository itemTrabalhoRepository;

    @Autowired
    private GerenciaRepository gerenciaRepository;

    public NotaTecnica getOrCreateByItemTrabalhoId(Long itemTrabalhoId) {
        Optional<NotaTecnica> existing = repository.findByItemTrabalho_Id(itemTrabalhoId);
        if (existing.isPresent()) {
            return existing.get();
        }

        ItemTrabalho itemTrabalho = itemTrabalhoRepository.findById(itemTrabalhoId)
                .orElseThrow(() -> new RuntimeException("ItemTrabalho não encontrado: " + itemTrabalhoId));

        NotaTecnica novaNota = NotaTecnica.builder()
                .itemTrabalho(itemTrabalho)
                .build();

        Integer anoAtual = LocalDate.now().getYear();
        novaNota.setAno(anoAtual);
        novaNota.setNumero(numeroService.getNextAvailableNumber("NotaTecnica", anoAtual, itemTrabalhoId));
        return repository.save(novaNota);
    }

    public NotaTecnica saveOrUpdate(NotaTecnica dto, Long itemTrabalhoId) {
        NotaTecnica nota = getOrCreateByItemTrabalhoId(itemTrabalhoId);
        
        if (dto.getIntroducao() != null) nota.setIntroducao(dto.getIntroducao());
        if (dto.getAnaliseFatos() != null) nota.setAnaliseFatos(dto.getAnaliseFatos());
        if (dto.getConsideracoes() != null) nota.setConsideracoes(dto.getConsideracoes());
        if (dto.getDataInicial() != null) nota.setDataInicial(dto.getDataInicial());
        if (dto.getDataFinal() != null) nota.setDataFinal(dto.getDataFinal());
        if (dto.getAno() != null) nota.setAno(dto.getAno());
        if (dto.getNumero() != null) nota.setNumero(dto.getNumero());


        updateCollections(nota, dto);
        
        return repository.save(nota);
    }

    public NotaTecnica saveOrUpdate(NotaTecnica dto) {
        NotaTecnica nota;
        if (dto.getId() != null) {
            nota = findById(dto.getId());
        } else {
            nota = new NotaTecnica();
        }

        nota.setDataInicial(dto.getDataInicial());
        nota.setDataFinal(dto.getDataFinal());
        nota.setAno(dto.getAno());
        nota.setNumero(dto.getNumero());
        
        nota.setIntroducao(dto.getIntroducao());
        nota.setAnaliseFatos(dto.getAnaliseFatos());
        nota.setConsideracoes(dto.getConsideracoes());
        

        if (dto.getItemTrabalho() != null && dto.getItemTrabalho().getId() != null) {
            ItemTrabalho item = itemTrabalhoRepository.findById(dto.getItemTrabalho().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Item de trabalho não encontrado"));
            nota.setItemTrabalho(item);
        }

        updateCollections(nota, dto);

        return repository.save(nota);
    }

    public List<NotaTecnica> findAll() {
        return repository.findAll();
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public NotaTecnica createEmpty() {
        NotaTecnica nota = NotaTecnica.builder().build();
        
        Integer anoAtual = LocalDate.now().getYear();
        nota.setAno(anoAtual);
        nota.setNumero(numeroService.getNextAvailableNumber("NotaTecnica", anoAtual, null));
        return repository.save(nota);
    }

    public NotaTecnica findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("NotaTecnica não encontrado: " + id));
    }

    public NotaTecnica updateById(Long id, NotaTecnica dto, Long itemTrabalhoId) {
        NotaTecnica nota = findById(id);

        if (itemTrabalhoId != null) {
            ItemTrabalho itemTrabalho = itemTrabalhoRepository.findById(itemTrabalhoId)
                    .orElseThrow(() -> new RuntimeException("ItemTrabalho não encontrado: " + itemTrabalhoId));
            nota.setItemTrabalho(itemTrabalho);
        }

        if (dto.getIntroducao() != null) nota.setIntroducao(dto.getIntroducao());
        if (dto.getAnaliseFatos() != null) nota.setAnaliseFatos(dto.getAnaliseFatos());
        if (dto.getConsideracoes() != null) nota.setConsideracoes(dto.getConsideracoes());
        
        if (dto.getDataInicial() != null) nota.setDataInicial(dto.getDataInicial());
        if (dto.getDataFinal() != null) nota.setDataFinal(dto.getDataFinal());
        if (dto.getAno() != null) nota.setAno(dto.getAno());
        if (dto.getNumero() != null) nota.setNumero(dto.getNumero());



        updateCollections(nota, dto);

        return repository.save(nota);
    }

    private void updateCollections(NotaTecnica nota, NotaTecnica dto) {
        if (dto.getAnexosFinais() != null) {
            nota.getAnexosFinais().removeIf(e -> e.getId() != null && dto.getAnexosFinais().stream().noneMatch(i -> e.getId().equals(i.getId())));
            for (sisaudin.model.cadastroBasico.AnexoRelatorio incoming : dto.getAnexosFinais()) {
                if (incoming.getId() != null) {
                    sisaudin.model.cadastroBasico.AnexoRelatorio existing = nota.getAnexosFinais().stream()
                            .filter(e -> incoming.getId().equals(e.getId())).findFirst().orElse(null);
                    if (existing != null) {
                        existing.setTitulo(incoming.getTitulo());
                        existing.setTipo(incoming.getTipo());
                        existing.setOrientacao(incoming.getOrientacao());
                        existing.setContent(incoming.getContent());
                        existing.setOrdem(incoming.getOrdem());
                    } else {
                        incoming.setNotaTecnica(nota);
                        nota.getAnexosFinais().add(incoming);
                    }
                } else {
                    incoming.setNotaTecnica(nota);
                    nota.getAnexosFinais().add(incoming);
                }
            }
        }
        updateGerenciasDestinatarias(nota, dto);
    }


    private void updateGerenciasDestinatarias(NotaTecnica nota, NotaTecnica dto) {
        if (dto.getGerenciasDestinatarias() != null) {
            List<Gerencia> gerencias = dto.getGerenciasDestinatarias().stream()
                    .filter(g -> g.getId() != null)
                    .map(g -> gerenciaRepository.findById(g.getId()).orElse(null))
                    .filter(java.util.Objects::nonNull)
                    .collect(java.util.stream.Collectors.toList());
            nota.setGerenciasDestinatarias(gerencias);
        }
    }
}
