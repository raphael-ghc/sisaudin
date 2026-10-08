package sisaudin.service.cadastroBasico;

import java.time.LocalDate;
import sisaudin.service.cadastroBasico.DocumentoNumeroService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import sisaudin.model.cadastroBasico.Gerencia;
import sisaudin.model.cadastroBasico.ItemTrabalho;
import sisaudin.model.cadastroBasico.NotaPreliminar;
import sisaudin.repository.cadastroBasico.GerenciaRepository;
import sisaudin.repository.cadastroBasico.ItemTrabalhoRepository;
import sisaudin.repository.cadastroBasico.NotaPreliminarRepository;
import jakarta.persistence.EntityNotFoundException;

import java.util.List;
import java.util.Optional;

@Service
public class NotaPreliminarService {

    @Autowired
    private DocumentoNumeroService numeroService;


    @Autowired
    private NotaPreliminarRepository repository;

    @Autowired
    private ItemTrabalhoRepository itemTrabalhoRepository;

    @Autowired
    private GerenciaRepository gerenciaRepository;

    public NotaPreliminar getOrCreateByItemTrabalhoId(Long itemTrabalhoId) {
        Optional<NotaPreliminar> existing = repository.findByItemTrabalho_Id(itemTrabalhoId);
        if (existing.isPresent()) {
            return existing.get();
        }

        ItemTrabalho itemTrabalho = itemTrabalhoRepository.findById(itemTrabalhoId)
                .orElseThrow(() -> new RuntimeException("ItemTrabalho não encontrado: " + itemTrabalhoId));

        NotaPreliminar novaNota = NotaPreliminar.builder()
                .itemTrabalho(itemTrabalho)
                .build();

        Integer anoAtual = LocalDate.now().getYear();
        novaNota.setAno(anoAtual);
        novaNota.setNumero(numeroService.getNextAvailableNumber("NotaPreliminar", anoAtual, itemTrabalhoId));
        return repository.save(novaNota);
    }

    public NotaPreliminar saveOrUpdate(NotaPreliminar dto, Long itemTrabalhoId) {
        NotaPreliminar nota = getOrCreateByItemTrabalhoId(itemTrabalhoId);
        
        if (dto.getIntroducao() != null) nota.setIntroducao(dto.getIntroducao());
        if (dto.getConsideracoes() != null) nota.setConsideracoes(dto.getConsideracoes());
        if (dto.getDataInicial() != null) nota.setDataInicial(dto.getDataInicial());
        if (dto.getDataFinal() != null) nota.setDataFinal(dto.getDataFinal());
        if (dto.getAno() != null) nota.setAno(dto.getAno());
        if (dto.getNumero() != null) nota.setNumero(dto.getNumero());


        updateCollections(nota, dto);
        
        return repository.save(nota);
    }

    public NotaPreliminar saveOrUpdate(NotaPreliminar dto) {
        NotaPreliminar nota;
        if (dto.getId() != null) {
            nota = findById(dto.getId());
        } else {
            nota = new NotaPreliminar();
        }

        nota.setDataInicial(dto.getDataInicial());
        nota.setDataFinal(dto.getDataFinal());
        nota.setAno(dto.getAno());
        nota.setNumero(dto.getNumero());
        
        nota.setIntroducao(dto.getIntroducao());
        nota.setConsideracoes(dto.getConsideracoes());
        

        if (dto.getItemTrabalho() != null && dto.getItemTrabalho().getId() != null) {
            ItemTrabalho item = itemTrabalhoRepository.findById(dto.getItemTrabalho().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Item de trabalho não encontrado"));
            nota.setItemTrabalho(item);
        }

        updateCollections(nota, dto);

        return repository.save(nota);
    }

    public List<NotaPreliminar> findAll() {
        return repository.findAll();
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public NotaPreliminar createEmpty() {
        NotaPreliminar nota = NotaPreliminar.builder().build();
        
        Integer anoAtual = LocalDate.now().getYear();
        nota.setAno(anoAtual);
        nota.setNumero(numeroService.getNextAvailableNumber("NotaPreliminar", anoAtual, null));
        return repository.save(nota);
    }

    public NotaPreliminar findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("NotaPreliminar não encontrado: " + id));
    }

    public NotaPreliminar updateById(Long id, NotaPreliminar dto, Long itemTrabalhoId) {
        NotaPreliminar nota = findById(id);

        if (itemTrabalhoId != null) {
            ItemTrabalho itemTrabalho = itemTrabalhoRepository.findById(itemTrabalhoId)
                    .orElseThrow(() -> new RuntimeException("ItemTrabalho não encontrado: " + itemTrabalhoId));
            nota.setItemTrabalho(itemTrabalho);
        }

        if (dto.getIntroducao() != null) nota.setIntroducao(dto.getIntroducao());
        if (dto.getConsideracoes() != null) nota.setConsideracoes(dto.getConsideracoes());
        
        if (dto.getDataInicial() != null) nota.setDataInicial(dto.getDataInicial());
        if (dto.getDataFinal() != null) nota.setDataFinal(dto.getDataFinal());
        if (dto.getAno() != null) nota.setAno(dto.getAno());
        if (dto.getNumero() != null) nota.setNumero(dto.getNumero());


        updateCollections(nota, dto);

        return repository.save(nota);
    }

    private void updateCollections(NotaPreliminar nota, NotaPreliminar dto) {
        if (dto.getPreliminares() != null) {
            nota.getPreliminares().removeIf(e -> e.getId() != null && dto.getPreliminares().stream().noneMatch(i -> e.getId().equals(i.getId())));
            for (sisaudin.model.cadastroBasico.NotaPreliminarInformacao incoming : dto.getPreliminares()) {
                if (incoming.getId() != null) {
                    sisaudin.model.cadastroBasico.NotaPreliminarInformacao existing = nota.getPreliminares().stream()
                            .filter(e -> incoming.getId().equals(e.getId())).findFirst().orElse(null);
                    if (existing != null) {
                        existing.setTitulo(incoming.getTitulo());
                        existing.setContent(incoming.getContent());
                        existing.setOrdem(incoming.getOrdem());
                    } else {
                        incoming.setNotaPreliminar(nota);
                        nota.getPreliminares().add(incoming);
                    }
                } else {
                    incoming.setNotaPreliminar(nota);
                    nota.getPreliminares().add(incoming);
                }
            }
        }

        if (dto.getConstatacoes() != null) {
            nota.getConstatacoes().removeIf(e -> e.getId() != null && dto.getConstatacoes().stream().noneMatch(i -> e.getId().equals(i.getId())));
            for (sisaudin.model.cadastroBasico.NotaPreliminarConstatacao incoming : dto.getConstatacoes()) {
                if (incoming.getId() != null) {
                    sisaudin.model.cadastroBasico.NotaPreliminarConstatacao existing = nota.getConstatacoes().stream()
                            .filter(e -> incoming.getId().equals(e.getId())).findFirst().orElse(null);
                    if (existing != null) {
                        existing.setTitulo(incoming.getTitulo());
                        existing.setContent(incoming.getContent());
                        existing.setResumoFato(incoming.getResumoFato());
                        existing.setResumoCriterio(incoming.getResumoCriterio());
                        existing.setResumoCausa(incoming.getResumoCausa());
                        existing.setResumoImpacto(incoming.getResumoImpacto());
                        updateRecomendacoes(existing, incoming);
                    } else {
                        incoming.setNotaPreliminar(nota);
                        if (incoming.getRecomendacoes() != null) {
                            for (sisaudin.model.cadastroBasico.NotaPreliminarRecomendacao r : incoming.getRecomendacoes()) {
                                r.setConstatacao(incoming);
                            }
                        }
                        nota.getConstatacoes().add(incoming);
                    }
                } else {
                    incoming.setNotaPreliminar(nota);
                    if (incoming.getRecomendacoes() != null) {
                        for (sisaudin.model.cadastroBasico.NotaPreliminarRecomendacao r : incoming.getRecomendacoes()) {
                            r.setConstatacao(incoming);
                        }
                    }
                    nota.getConstatacoes().add(incoming);
                }
            }
        }
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
                        incoming.setNotaPreliminar(nota);
                        nota.getAnexosFinais().add(incoming);
                    }
                } else {
                    incoming.setNotaPreliminar(nota);
                    nota.getAnexosFinais().add(incoming);
                }
            }
        }
        updateGerenciasDestinatarias(nota, dto);
    }

    private void updateGerenciasDestinatarias(NotaPreliminar nota, NotaPreliminar dto) {
        if (dto.getGerenciasDestinatarias() != null) {
            List<Gerencia> gerencias = dto.getGerenciasDestinatarias().stream()
                    .filter(g -> g.getId() != null)
                    .map(g -> gerenciaRepository.findById(g.getId()).orElse(null))
                    .filter(java.util.Objects::nonNull)
                    .collect(java.util.stream.Collectors.toList());
            nota.setGerenciasDestinatarias(gerencias);
        }
    }

    private void updateRecomendacoes(sisaudin.model.cadastroBasico.NotaPreliminarConstatacao existing, sisaudin.model.cadastroBasico.NotaPreliminarConstatacao incoming) {
        if (incoming.getRecomendacoes() != null) {
            existing.getRecomendacoes().removeIf(e -> e.getId() != null && incoming.getRecomendacoes().stream().noneMatch(i -> e.getId().equals(i.getId())));
            for (sisaudin.model.cadastroBasico.NotaPreliminarRecomendacao incRec : incoming.getRecomendacoes()) {
                if (incRec.getId() != null) {
                    sisaudin.model.cadastroBasico.NotaPreliminarRecomendacao exRec = existing.getRecomendacoes().stream()
                            .filter(r -> incRec.getId().equals(r.getId())).findFirst().orElse(null);
                    if (exRec != null) {
                        exRec.setContent(incRec.getContent());
                        exRec.setDataLimite(incRec.getDataLimite());
                        exRec.setNivelRisco(incRec.getNivelRisco());
                        exRec.setGerencia(incRec.getGerencia());
                        exRec.setTipoBeneficio(incRec.getTipoBeneficio());
                        exRec.setDetalheBeneficio(incRec.getDetalheBeneficio());
                        exRec.setStatusBeneficio(incRec.getStatusBeneficio());
                        exRec.setAnoImplementacao(incRec.getAnoImplementacao());
                        exRec.setDescricaoBeneficioRealizado(incRec.getDescricaoBeneficioRealizado());
                        exRec.setDescricaoCustoBeneficio(incRec.getDescricaoCustoBeneficio());
                        exRec.setValorCustoBeneficio(incRec.getValorCustoBeneficio());
                        exRec.setValorBrutoBeneficio(incRec.getValorBrutoBeneficio());
                        exRec.setValorLiquidoBeneficio(incRec.getValorLiquidoBeneficio());
                    } else {
                        incRec.setConstatacao(existing);
                        existing.getRecomendacoes().add(incRec);
                    }
                } else {
                    incRec.setConstatacao(existing);
                    existing.getRecomendacoes().add(incRec);
                }
            }
        }
    }
}
