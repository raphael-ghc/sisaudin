package sisaudin.service.cadastroBasico;

import java.time.LocalDate;
import sisaudin.service.cadastroBasico.DocumentoNumeroService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import sisaudin.model.cadastroBasico.*;
import sisaudin.repository.cadastroBasico.GerenciaRepository;
import sisaudin.repository.cadastroBasico.ItemTrabalhoRepository;
import sisaudin.repository.cadastroBasico.NotaFinalRepository;
import sisaudin.repository.cadastroBasico.RelatorioPreliminarRepository;
import jakarta.persistence.EntityNotFoundException;

import java.util.List;
import java.util.Optional;

@Service
public class NotaFinalService {

    @Autowired
    private DocumentoNumeroService numeroService;


    @Autowired
    private NotaFinalRepository repository;

    @Autowired
    private RelatorioPreliminarRepository preliminarRepository;

    @Autowired
    private ItemTrabalhoRepository itemTrabalhoRepository;

    @Autowired
    private GerenciaRepository gerenciaRepository;

    public NotaFinal getOrCreateByItemTrabalhoId(Long itemTrabalhoId) {
        Optional<NotaFinal> existing = repository.findByItemTrabalho_Id(itemTrabalhoId);
        if (existing.isPresent()) {
            return existing.get();
        }
        return createFromRelatorioPreliminar(itemTrabalhoId);
    }

    @org.springframework.transaction.annotation.Transactional
    public NotaFinal createFromRelatorioPreliminar(Long itemTrabalhoId) {
        ItemTrabalho itemTrabalho = itemTrabalhoRepository.findById(itemTrabalhoId)
                .orElseThrow(() -> new RuntimeException("ItemTrabalho não encontrado: " + itemTrabalhoId));

        NotaFinal novaNota = NotaFinal.builder()
                .itemTrabalho(itemTrabalho)
                .build();
                
        // Clonar dados do relatório preliminar
        Optional<RelatorioPreliminar> preliminarOpt = preliminarRepository.findByItemTrabalho_Id(itemTrabalhoId);
        if (preliminarOpt.isPresent()) {
            RelatorioPreliminar preliminar = preliminarOpt.get();
            novaNota.setIntroducao(preliminar.getIntroducao());
            novaNota.setConsideracoes(preliminar.getConsideracoes());
            novaNota.setDataInicial(preliminar.getDataInicial());
            novaNota.setDataFinal(preliminar.getDataFinal());
            novaNota.setAno(preliminar.getAno());
            novaNota.setNumero(preliminar.getNumero());

            

            if (preliminar.getGerenciasDestinatarias() != null) {
                novaNota.getGerenciasDestinatarias().addAll(preliminar.getGerenciasDestinatarias());
            }

            if (preliminar.getPreliminares() != null) {
                for (RelatorioPreliminarInformacao ip : preliminar.getPreliminares()) {
                    NotaFinalInformacao inf = NotaFinalInformacao.builder()
                            .titulo(ip.getTitulo())
                            .content(ip.getContent())
                            .notaFinal(novaNota)
                            .build();
                    novaNota.getPreliminares().add(inf);
                }
            }
            
            if (preliminar.getConstatacoes() != null) {
                for (RelatorioPreliminarConstatacao c : preliminar.getConstatacoes()) {
                    NotaFinalConstatacao cf = NotaFinalConstatacao.builder()
                            .titulo(c.getTitulo())
                            .content(c.getContent())
                            .resumoFato(c.getResumoFato())
                            .resumoCriterio(c.getResumoCriterio())
                            .resumoCausa(c.getResumoCausa())
                            .resumoImpacto(c.getResumoImpacto())
                            .notaFinal(novaNota)
                            .build();
                    
                    if (c.getRecomendacoes() != null) {
                        for (RelatorioPreliminarRecomendacao r : c.getRecomendacoes()) {
                            NotaFinalRecomendacao rf = NotaFinalRecomendacao.builder()
                                    .content(r.getContent())
                                    .dataLimite(r.getDataLimite())
                                    .nivelRisco(r.getNivelRisco())
                                    .gerencia(r.getGerencia())
                                    .tipoBeneficio(r.getTipoBeneficio())
                                    .detalheBeneficio(r.getDetalheBeneficio())
                                    .statusBeneficio(r.getStatusBeneficio())
                                    .anoImplementacao(r.getAnoImplementacao())
                                    .descricaoBeneficioRealizado(r.getDescricaoBeneficioRealizado())
                                    .descricaoCustoBeneficio(r.getDescricaoCustoBeneficio())
                                    .valorCustoBeneficio(r.getValorCustoBeneficio())
                                    .valorBrutoBeneficio(r.getValorBrutoBeneficio())
                                    .valorLiquidoBeneficio(r.getValorLiquidoBeneficio())
                                    .constatacao(cf)
                                    .build();
                            cf.getRecomendacoes().add(rf);
                        }
                    }
                    novaNota.getConstatacoes().add(cf);
                }
            }

            if (preliminar.getAnexosFinais() != null) {
                for (AnexoRelatorio ar : preliminar.getAnexosFinais()) {
                    AnexoNotaFinal arf = AnexoNotaFinal.builder()
                            .titulo(ar.getTitulo())
                            .tipo(ar.getTipo())
                            .orientacao(ar.getOrientacao())
                            .content(ar.getContent())
                            .ordem(ar.getOrdem())
                            .notaFinal(novaNota)
                            .build();
                    novaNota.getAnexosFinais().add(arf);
                }
            }
        }

        return repository.save(novaNota);
    }

    public NotaFinal saveOrUpdate(NotaFinal dto, Long itemTrabalhoId) {
        NotaFinal nota = getOrCreateByItemTrabalhoId(itemTrabalhoId);
        
        if (dto.getIntroducao() != null) nota.setIntroducao(dto.getIntroducao());
        if (dto.getConsideracoes() != null) nota.setConsideracoes(dto.getConsideracoes());
        if (dto.getDataInicial() != null) nota.setDataInicial(dto.getDataInicial());
        if (dto.getDataFinal() != null) nota.setDataFinal(dto.getDataFinal());
        if (dto.getAno() != null) nota.setAno(dto.getAno());
        if (dto.getNumero() != null) nota.setNumero(dto.getNumero());


        updateCollections(nota, dto);
        
        return repository.save(nota);
    }

    public NotaFinal saveOrUpdate(NotaFinal dto) {
        NotaFinal nota;
        if (dto.getId() != null) {
            nota = findById(dto.getId());
        } else {
            nota = new NotaFinal();
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

    public List<NotaFinal> findAll() {
        return repository.findAll();
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public NotaFinal createEmpty() {
        NotaFinal nota = NotaFinal.builder().build();
        
        Integer anoAtual = LocalDate.now().getYear();
        nota.setAno(anoAtual);
        nota.setNumero(numeroService.getNextAvailableNumber("NotaFinal", anoAtual, null));
        return repository.save(nota);
    }

    public NotaFinal findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("NotaFinal não encontrado: " + id));
    }

    public NotaFinal updateById(Long id, NotaFinal dto, Long itemTrabalhoId) {
        NotaFinal nota = findById(id);

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

    private void updateCollections(NotaFinal nota, NotaFinal dto) {
        if (dto.getPreliminares() != null) {
            nota.getPreliminares().removeIf(e -> e.getId() != null && dto.getPreliminares().stream().noneMatch(i -> e.getId().equals(i.getId())));
            int ordemPreliminar = 0;
            for (NotaFinalInformacao incoming : dto.getPreliminares()) {
                incoming.setOrdem(ordemPreliminar++);
                if (incoming.getId() != null) {
                    NotaFinalInformacao existing = nota.getPreliminares().stream()
                            .filter(e -> incoming.getId().equals(e.getId())).findFirst().orElse(null);
                    if (existing != null) {
                        existing.setTitulo(incoming.getTitulo());
                        existing.setContent(incoming.getContent());
                        existing.setOrdem(incoming.getOrdem());
                    } else {
                        incoming.setNotaFinal(nota);
                        nota.getPreliminares().add(incoming);
                    }
                } else {
                    incoming.setNotaFinal(nota);
                    nota.getPreliminares().add(incoming);
                }
            }
        }

        if (dto.getConstatacoes() != null) {
            nota.getConstatacoes().removeIf(e -> e.getId() != null && dto.getConstatacoes().stream().noneMatch(i -> e.getId().equals(i.getId())));
            int ordemConstatacao = 0;
            for (NotaFinalConstatacao incoming : dto.getConstatacoes()) {
                incoming.setOrdem(ordemConstatacao++);
                if (incoming.getId() != null) {
                    NotaFinalConstatacao existing = nota.getConstatacoes().stream()
                            .filter(e -> incoming.getId().equals(e.getId())).findFirst().orElse(null);
                    if (existing != null) {
                        existing.setTitulo(incoming.getTitulo());
                        existing.setContent(incoming.getContent());
                        existing.setResumoFato(incoming.getResumoFato());
                        existing.setResumoCriterio(incoming.getResumoCriterio());
                        existing.setResumoCausa(incoming.getResumoCausa());
                        existing.setResumoImpacto(incoming.getResumoImpacto());
                        existing.setOrdem(incoming.getOrdem());
                        updateRecomendacoes(existing, incoming);
                    } else {
                        incoming.setNotaFinal(nota);
                        if (incoming.getRecomendacoes() != null) {
                            for (NotaFinalRecomendacao r : incoming.getRecomendacoes()) {
                                r.setConstatacao(incoming);
                                if (r.getReportes() != null) {
                                    for (NotaFinalRecomendacaoReporte rep : r.getReportes()) {
                                        rep.setRecomendacao(r);
                                    }
                                }
                            }
                        }
                        nota.getConstatacoes().add(incoming);
                    }
                } else {
                    incoming.setNotaFinal(nota);
                    if (incoming.getRecomendacoes() != null) {
                        for (NotaFinalRecomendacao r : incoming.getRecomendacoes()) {
                            r.setConstatacao(incoming);
                            if (r.getReportes() != null) {
                                for (NotaFinalRecomendacaoReporte rep : r.getReportes()) {
                                    rep.setRecomendacao(r);
                                }
                            }
                        }
                    }
                    nota.getConstatacoes().add(incoming);
                }
            }
        }
        
        if (dto.getAnexosFinais() != null) {
            nota.getAnexosFinais().removeIf(e -> e.getId() != null && dto.getAnexosFinais().stream().noneMatch(i -> e.getId().equals(i.getId())));
            for (AnexoNotaFinal incoming : dto.getAnexosFinais()) {
                if (incoming.getId() != null) {
                    AnexoNotaFinal existing = nota.getAnexosFinais().stream()
                            .filter(e -> incoming.getId().equals(e.getId())).findFirst().orElse(null);
                    if (existing != null) {
                        existing.setTitulo(incoming.getTitulo());
                        existing.setTipo(incoming.getTipo());
                        existing.setOrientacao(incoming.getOrientacao());
                        existing.setContent(incoming.getContent());
                        existing.setOrdem(incoming.getOrdem());
                    } else {
                        incoming.setNotaFinal(nota);
                        nota.getAnexosFinais().add(incoming);
                    }
                } else {
                    incoming.setNotaFinal(nota);
                    nota.getAnexosFinais().add(incoming);
                }
            }
        }
        updateGerenciasDestinatarias(nota, dto);
    }

    private void updateGerenciasDestinatarias(NotaFinal nota, NotaFinal dto) {
        if (dto.getGerenciasDestinatarias() != null) {
            List<Gerencia> gerencias = dto.getGerenciasDestinatarias().stream()
                    .filter(g -> g.getId() != null)
                    .map(g -> gerenciaRepository.findById(g.getId()).orElse(null))
                    .filter(java.util.Objects::nonNull)
                    .collect(java.util.stream.Collectors.toList());
            nota.setGerenciasDestinatarias(gerencias);
        }
    }

    private void updateRecomendacoes(NotaFinalConstatacao existing, NotaFinalConstatacao incoming) {
        if (incoming.getRecomendacoes() != null) {
            existing.getRecomendacoes().removeIf(e -> e.getId() != null && incoming.getRecomendacoes().stream().noneMatch(i -> e.getId().equals(i.getId())));
            for (NotaFinalRecomendacao incRec : incoming.getRecomendacoes()) {
                if (incRec.getId() != null) {
                    NotaFinalRecomendacao exRec = existing.getRecomendacoes().stream()
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
                        updateReportes(exRec, incRec);
                    } else {
                        incRec.setConstatacao(existing);
                        if (incRec.getReportes() != null) {
                            for (NotaFinalRecomendacaoReporte rep : incRec.getReportes()) {
                                rep.setRecomendacao(incRec);
                            }
                        }
                        existing.getRecomendacoes().add(incRec);
                    }
                } else {
                    incRec.setConstatacao(existing);
                    if (incRec.getReportes() != null) {
                        for (NotaFinalRecomendacaoReporte rep : incRec.getReportes()) {
                            rep.setRecomendacao(incRec);
                        }
                    }
                    existing.getRecomendacoes().add(incRec);
                }
            }
        }
    }

    private void updateReportes(NotaFinalRecomendacao existing, NotaFinalRecomendacao incoming) {
        if (incoming.getReportes() != null) {
            existing.getReportes().removeIf(e -> e.getId() != null && incoming.getReportes().stream().noneMatch(i -> e.getId().equals(i.getId())));
            for (NotaFinalRecomendacaoReporte incRep : incoming.getReportes()) {
                if (incRep.getId() != null) {
                    NotaFinalRecomendacaoReporte exRep = existing.getReportes().stream()
                            .filter(r -> incRep.getId().equals(r.getId())).findFirst().orElse(null);
                    if (exRep != null) {
                        exRep.setTipo(incRep.getTipo());
                        exRep.setDataHora(incRep.getDataHora());
                        exRep.setGerencia(incRep.getGerencia());
                        exRep.setResponsavel(incRep.getResponsavel());
                        exRep.setContent(incRep.getContent());
                    } else {
                        incRep.setRecomendacao(existing);
                        existing.getReportes().add(incRep);
                    }
                } else {
                    incRep.setRecomendacao(existing);
                    existing.getReportes().add(incRep);
                }
            }
        }
    }
}
