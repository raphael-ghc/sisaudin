package sisaudin.service.cadastroBasico;

import java.time.LocalDate;
import sisaudin.service.cadastroBasico.DocumentoNumeroService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import sisaudin.model.cadastroBasico.Gerencia;
import sisaudin.model.cadastroBasico.ItemTrabalho;
import sisaudin.model.cadastroBasico.Parecer;
import sisaudin.repository.cadastroBasico.GerenciaRepository;
import sisaudin.repository.cadastroBasico.ItemTrabalhoRepository;
import sisaudin.repository.cadastroBasico.ParecerRepository;
import jakarta.persistence.EntityNotFoundException;

import java.util.List;
import java.util.Optional;

@Service
public class ParecerService {

    @Autowired
    private DocumentoNumeroService numeroService;


    @Autowired
    private ParecerRepository repository;

    @Autowired
    private ItemTrabalhoRepository itemTrabalhoRepository;

    @Autowired
    private GerenciaRepository gerenciaRepository;

    public Parecer getOrCreateByItemTrabalhoId(Long itemTrabalhoId) {
        Optional<Parecer> existing = repository.findByItemTrabalho_Id(itemTrabalhoId);
        if (existing.isPresent()) {
            return existing.get();
        }

        ItemTrabalho itemTrabalho = itemTrabalhoRepository.findById(itemTrabalhoId)
                .orElseThrow(() -> new RuntimeException("ItemTrabalho não encontrado: " + itemTrabalhoId));

        Parecer novoParecer = Parecer.builder()
                .itemTrabalho(itemTrabalho)
                .build();

        Integer anoAtual = LocalDate.now().getYear();
        novoParecer.setAno(anoAtual);
        novoParecer.setNumero(numeroService.getNextAvailableNumber("Parecer", anoAtual, itemTrabalhoId));
        return repository.save(novoParecer);
    }

    public Parecer saveOrUpdate(Parecer dto, Long itemTrabalhoId) {
        Parecer parecer = getOrCreateByItemTrabalhoId(itemTrabalhoId);
        
        if (dto.getIntroducao() != null) parecer.setIntroducao(dto.getIntroducao());
        if (dto.getObjetivo() != null) parecer.setObjetivo(dto.getObjetivo());
        if (dto.getEscopoAvaliacao() != null) parecer.setEscopoAvaliacao(dto.getEscopoAvaliacao());
        if (dto.getAnaliseFatos() != null) parecer.setAnaliseFatos(dto.getAnaliseFatos());

        if (dto.getConsideracoes() != null) parecer.setConsideracoes(dto.getConsideracoes());
        if (dto.getDataInicial() != null) parecer.setDataInicial(dto.getDataInicial());
        if (dto.getDataFinal() != null) parecer.setDataFinal(dto.getDataFinal());
        if (dto.getAno() != null) parecer.setAno(dto.getAno());
        if (dto.getNumero() != null) parecer.setNumero(dto.getNumero());


        updateCollections(parecer, dto);
        
        return repository.save(parecer);
    }

    public Parecer saveOrUpdate(Parecer dto) {
        Parecer parecer;
        if (dto.getId() != null) {
            parecer = findById(dto.getId());
        } else {
            parecer = new Parecer();
        }

        parecer.setDataInicial(dto.getDataInicial());
        parecer.setDataFinal(dto.getDataFinal());
        parecer.setAno(dto.getAno());
        parecer.setNumero(dto.getNumero());
        
        parecer.setIntroducao(dto.getIntroducao());
        parecer.setConsideracoes(dto.getConsideracoes());
        

        if (dto.getItemTrabalho() != null && dto.getItemTrabalho().getId() != null) {
            ItemTrabalho item = itemTrabalhoRepository.findById(dto.getItemTrabalho().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Item de trabalho não encontrado"));
            parecer.setItemTrabalho(item);
        }

        updateCollections(parecer, dto);

        return repository.save(parecer);
    }

    public List<Parecer> findAll() {
        return repository.findAll();
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public Parecer createEmpty() {
        Parecer parecer = Parecer.builder().build();
        
        Integer anoAtual = LocalDate.now().getYear();
        parecer.setAno(anoAtual);
        parecer.setNumero(numeroService.getNextAvailableNumber("Parecer", anoAtual, null));
        return repository.save(parecer);
    }

    public Parecer findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parecer não encontrado: " + id));
    }

    public Parecer updateById(Long id, Parecer dto, Long itemTrabalhoId) {
        Parecer parecer = findById(id);

        if (itemTrabalhoId != null) {
            ItemTrabalho itemTrabalho = itemTrabalhoRepository.findById(itemTrabalhoId)
                    .orElseThrow(() -> new RuntimeException("ItemTrabalho não encontrado: " + itemTrabalhoId));
            parecer.setItemTrabalho(itemTrabalho);
        }

        if (dto.getIntroducao() != null) parecer.setIntroducao(dto.getIntroducao());
        if (dto.getObjetivo() != null) parecer.setObjetivo(dto.getObjetivo());
        if (dto.getEscopoAvaliacao() != null) parecer.setEscopoAvaliacao(dto.getEscopoAvaliacao());
        if (dto.getAnaliseFatos() != null) parecer.setAnaliseFatos(dto.getAnaliseFatos());

        if (dto.getConsideracoes() != null) parecer.setConsideracoes(dto.getConsideracoes());
        
        if (dto.getDataInicial() != null) parecer.setDataInicial(dto.getDataInicial());
        if (dto.getDataFinal() != null) parecer.setDataFinal(dto.getDataFinal());
        if (dto.getAno() != null) parecer.setAno(dto.getAno());
        if (dto.getNumero() != null) parecer.setNumero(dto.getNumero());



        updateCollections(parecer, dto);

        return repository.save(parecer);
    }

    private void updateCollections(Parecer parecer, Parecer dto) {
        if (dto.getAnexosFinais() != null) {
            parecer.getAnexosFinais().removeIf(e -> e.getId() != null && dto.getAnexosFinais().stream().noneMatch(i -> e.getId().equals(i.getId())));
            for (sisaudin.model.cadastroBasico.AnexoRelatorio incoming : dto.getAnexosFinais()) {
                if (incoming.getId() != null) {
                    sisaudin.model.cadastroBasico.AnexoRelatorio existing = parecer.getAnexosFinais().stream()
                            .filter(e -> incoming.getId().equals(e.getId())).findFirst().orElse(null);
                    if (existing != null) {
                        existing.setTitulo(incoming.getTitulo());
                        existing.setTipo(incoming.getTipo());
                        existing.setOrientacao(incoming.getOrientacao());
                        existing.setContent(incoming.getContent());
                        existing.setOrdem(incoming.getOrdem());
                    } else {
                        incoming.setParecer(parecer);
                        parecer.getAnexosFinais().add(incoming);
                    }
                } else {
                    incoming.setParecer(parecer);
                    parecer.getAnexosFinais().add(incoming);
                }
            }
        }
        updateGerenciasDestinatarias(parecer, dto);
    }


    private void updateGerenciasDestinatarias(Parecer parecer, Parecer dto) {
        if (dto.getGerenciasDestinatarias() != null) {
            List<Gerencia> gerencias = dto.getGerenciasDestinatarias().stream()
                    .filter(g -> g.getId() != null)
                    .map(g -> gerenciaRepository.findById(g.getId()).orElse(null))
                    .filter(java.util.Objects::nonNull)
                    .collect(java.util.stream.Collectors.toList());
            parecer.setGerenciasDestinatarias(gerencias);
        }
    }
}
