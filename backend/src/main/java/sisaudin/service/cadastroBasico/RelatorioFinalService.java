package sisaudin.service.cadastroBasico;

import java.time.LocalDate;
import sisaudin.service.cadastroBasico.DocumentoNumeroService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import sisaudin.model.cadastroBasico.*;
import sisaudin.repository.cadastroBasico.GerenciaRepository;
import sisaudin.repository.cadastroBasico.ItemTrabalhoRepository;
import sisaudin.repository.cadastroBasico.RelatorioFinalRepository;
import sisaudin.repository.cadastroBasico.RelatorioPreliminarRepository;
import jakarta.persistence.EntityNotFoundException;

import java.util.List;
import java.util.Optional;

@Service
public class RelatorioFinalService {

    @Autowired
    private DocumentoNumeroService numeroService;


    @Autowired
    private RelatorioFinalRepository repository;

    @Autowired
    private RelatorioPreliminarRepository preliminarRepository;

    @Autowired
    private ItemTrabalhoRepository itemTrabalhoRepository;

    @Autowired
    private GerenciaRepository gerenciaRepository;

    public RelatorioFinal getOrCreateByItemTrabalhoId(Long itemTrabalhoId) {
        Optional<RelatorioFinal> existing = repository.findByItemTrabalho_Id(itemTrabalhoId);
        if (existing.isPresent()) {
            return existing.get();
        }
        return createFromRelatorioPreliminar(itemTrabalhoId);
    }

    @org.springframework.transaction.annotation.Transactional
    public RelatorioFinal createFromRelatorioPreliminar(Long itemTrabalhoId) {
        ItemTrabalho itemTrabalho = itemTrabalhoRepository.findById(itemTrabalhoId)
                .orElseThrow(() -> new RuntimeException("ItemTrabalho não encontrado: " + itemTrabalhoId));

        RelatorioFinal novoRelatorio = RelatorioFinal.builder()
                .itemTrabalho(itemTrabalho)
                .build();
                
        // Clonar dados do relatório preliminar
        Optional<RelatorioPreliminar> preliminarOpt = preliminarRepository.findByItemTrabalho_Id(itemTrabalhoId);
        if (preliminarOpt.isPresent()) {
            RelatorioPreliminar preliminar = preliminarOpt.get();
            novoRelatorio.setIntroducao(preliminar.getIntroducao());
            novoRelatorio.setConsideracoes(preliminar.getConsideracoes());
            novoRelatorio.setDataInicial(preliminar.getDataInicial());
            novoRelatorio.setDataFinal(preliminar.getDataFinal());
            novoRelatorio.setAno(preliminar.getAno());
            novoRelatorio.setNumero(preliminar.getNumero());

            novoRelatorio.setPlanObjetivo(preliminar.getPlanObjetivo());
            novoRelatorio.setPlanRiscos(preliminar.getPlanRiscos());
            novoRelatorio.setPlanEscopo(preliminar.getPlanEscopo());
            novoRelatorio.setPlanLimitacoes(preliminar.getPlanLimitacoes());
            novoRelatorio.setPlanCriterios(preliminar.getPlanCriterios());
            novoRelatorio.setPlanProcedimentos(preliminar.getPlanProcedimentos());
            novoRelatorio.setPlanAmostra(preliminar.getPlanAmostra());
            
            novoRelatorio.setPlanTextoInicial(preliminar.getPlanTextoInicial());
            novoRelatorio.setPreliminaresTextoInicial(preliminar.getPreliminaresTextoInicial());
            novoRelatorio.setConstatacoesTextoInicial(preliminar.getConstatacoesTextoInicial());

            if (preliminar.getGerenciasDestinatarias() != null) {
                novoRelatorio.getGerenciasDestinatarias().addAll(preliminar.getGerenciasDestinatarias());
            }

            if (preliminar.getPreliminares() != null) {
                for (RelatorioPreliminarInformacao ip : preliminar.getPreliminares()) {
                    RelatorioFinalInformacao inf = RelatorioFinalInformacao.builder()
                            .titulo(ip.getTitulo())
                            .content(ip.getContent())
                            .relatorioFinal(novoRelatorio)
                            .build();
                    novoRelatorio.getPreliminares().add(inf);
                }
            }
            
            if (preliminar.getConstatacoes() != null) {
                for (RelatorioPreliminarConstatacao c : preliminar.getConstatacoes()) {
                    RelatorioFinalConstatacao cf = RelatorioFinalConstatacao.builder()
                            .titulo(c.getTitulo())
                            .content(c.getContent())
                            .resumoFato(c.getResumoFato())
                            .resumoCriterio(c.getResumoCriterio())
                            .resumoCausa(c.getResumoCausa())
                            .resumoImpacto(c.getResumoImpacto())
                            .relatorioFinal(novoRelatorio)
                            .build();
                    
                    if (c.getRecomendacoes() != null) {
                        for (RelatorioPreliminarRecomendacao r : c.getRecomendacoes()) {
                            RelatorioFinalRecomendacao rf = RelatorioFinalRecomendacao.builder()
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
                    novoRelatorio.getConstatacoes().add(cf);
                }
            }

            if (preliminar.getAnexosFinais() != null) {
                for (AnexoRelatorio ar : preliminar.getAnexosFinais()) {
                    AnexoRelatorioFinal arf = AnexoRelatorioFinal.builder()
                            .titulo(ar.getTitulo())
                            .tipo(ar.getTipo())
                            .orientacao(ar.getOrientacao())
                            .content(ar.getContent())
                            .ordem(ar.getOrdem())
                            .relatorioFinal(novoRelatorio)
                            .build();
                    novoRelatorio.getAnexosFinais().add(arf);
                }
            }
        }

        return repository.save(novoRelatorio);
    }

    public RelatorioFinal saveOrUpdate(RelatorioFinal dto, Long itemTrabalhoId) {
        RelatorioFinal relatorio = getOrCreateByItemTrabalhoId(itemTrabalhoId);
        
        if (dto.getIntroducao() != null) relatorio.setIntroducao(dto.getIntroducao());
        if (dto.getConsideracoes() != null) relatorio.setConsideracoes(dto.getConsideracoes());
        if (dto.getDataInicial() != null) relatorio.setDataInicial(dto.getDataInicial());
        if (dto.getDataFinal() != null) relatorio.setDataFinal(dto.getDataFinal());
        if (dto.getAno() != null) relatorio.setAno(dto.getAno());
        if (dto.getNumero() != null) relatorio.setNumero(dto.getNumero());

        if (dto.getPlanObjetivo() != null) relatorio.setPlanObjetivo(dto.getPlanObjetivo());
        if (dto.getPlanRiscos() != null) relatorio.setPlanRiscos(dto.getPlanRiscos());
        if (dto.getPlanEscopo() != null) relatorio.setPlanEscopo(dto.getPlanEscopo());
        if (dto.getPlanLimitacoes() != null) relatorio.setPlanLimitacoes(dto.getPlanLimitacoes());
        if (dto.getPlanCriterios() != null) relatorio.setPlanCriterios(dto.getPlanCriterios());
        if (dto.getPlanProcedimentos() != null) relatorio.setPlanProcedimentos(dto.getPlanProcedimentos());
        if (dto.getPlanAmostra() != null) relatorio.setPlanAmostra(dto.getPlanAmostra());
        if (dto.getPlanTextoInicial() != null) relatorio.setPlanTextoInicial(dto.getPlanTextoInicial());
        if (dto.getPreliminaresTextoInicial() != null) relatorio.setPreliminaresTextoInicial(dto.getPreliminaresTextoInicial());
        if (dto.getConstatacoesTextoInicial() != null) relatorio.setConstatacoesTextoInicial(dto.getConstatacoesTextoInicial());

        updateCollections(relatorio, dto);
        
        return repository.save(relatorio);
    }

    public RelatorioFinal saveOrUpdate(RelatorioFinal dto) {
        RelatorioFinal relatorio;
        if (dto.getId() != null) {
            relatorio = findById(dto.getId());
        } else {
            relatorio = new RelatorioFinal();
        }

        relatorio.setDataInicial(dto.getDataInicial());
        relatorio.setDataFinal(dto.getDataFinal());
        relatorio.setAno(dto.getAno());
        relatorio.setNumero(dto.getNumero());
        
        relatorio.setIntroducao(dto.getIntroducao());
        relatorio.setConsideracoes(dto.getConsideracoes());
        relatorio.setPlanObjetivo(dto.getPlanObjetivo());
        relatorio.setPlanRiscos(dto.getPlanRiscos());
        relatorio.setPlanEscopo(dto.getPlanEscopo());
        relatorio.setPlanLimitacoes(dto.getPlanLimitacoes());
        relatorio.setPlanCriterios(dto.getPlanCriterios());
        relatorio.setPlanProcedimentos(dto.getPlanProcedimentos());
        relatorio.setPlanAmostra(dto.getPlanAmostra());
        
        relatorio.setPlanTextoInicial(dto.getPlanTextoInicial());
        relatorio.setPreliminaresTextoInicial(dto.getPreliminaresTextoInicial());
        relatorio.setConstatacoesTextoInicial(dto.getConstatacoesTextoInicial());

        if (dto.getItemTrabalho() != null && dto.getItemTrabalho().getId() != null) {
            ItemTrabalho item = itemTrabalhoRepository.findById(dto.getItemTrabalho().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Item de trabalho não encontrado"));
            relatorio.setItemTrabalho(item);
        }

        updateCollections(relatorio, dto);

        return repository.save(relatorio);
    }

    public List<RelatorioFinal> findAll() {
        return repository.findAll();
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public RelatorioFinal createEmpty() {
        RelatorioFinal relatorio = RelatorioFinal.builder().build();
        
        Integer anoAtual = LocalDate.now().getYear();
        relatorio.setAno(anoAtual);
        relatorio.setNumero(numeroService.getNextAvailableNumber("RelatorioFinal", anoAtual, null));
        return repository.save(relatorio);
    }

    public RelatorioFinal findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("RelatorioFinal não encontrado: " + id));
    }

    public RelatorioFinal updateById(Long id, RelatorioFinal dto, Long itemTrabalhoId) {
        RelatorioFinal relatorio = findById(id);

        if (itemTrabalhoId != null) {
            ItemTrabalho itemTrabalho = itemTrabalhoRepository.findById(itemTrabalhoId)
                    .orElseThrow(() -> new RuntimeException("ItemTrabalho não encontrado: " + itemTrabalhoId));
            relatorio.setItemTrabalho(itemTrabalho);
        }

        if (dto.getIntroducao() != null) relatorio.setIntroducao(dto.getIntroducao());
        if (dto.getConsideracoes() != null) relatorio.setConsideracoes(dto.getConsideracoes());
        
        if (dto.getDataInicial() != null) relatorio.setDataInicial(dto.getDataInicial());
        if (dto.getDataFinal() != null) relatorio.setDataFinal(dto.getDataFinal());
        if (dto.getAno() != null) relatorio.setAno(dto.getAno());
        if (dto.getNumero() != null) relatorio.setNumero(dto.getNumero());

        if (dto.getPlanObjetivo() != null) relatorio.setPlanObjetivo(dto.getPlanObjetivo());
        if (dto.getPlanRiscos() != null) relatorio.setPlanRiscos(dto.getPlanRiscos());
        if (dto.getPlanEscopo() != null) relatorio.setPlanEscopo(dto.getPlanEscopo());
        if (dto.getPlanLimitacoes() != null) relatorio.setPlanLimitacoes(dto.getPlanLimitacoes());
        if (dto.getPlanCriterios() != null) relatorio.setPlanCriterios(dto.getPlanCriterios());
        if (dto.getPlanProcedimentos() != null) relatorio.setPlanProcedimentos(dto.getPlanProcedimentos());
        if (dto.getPlanAmostra() != null) relatorio.setPlanAmostra(dto.getPlanAmostra());
        if (dto.getPlanTextoInicial() != null) relatorio.setPlanTextoInicial(dto.getPlanTextoInicial());
        if (dto.getPreliminaresTextoInicial() != null) relatorio.setPreliminaresTextoInicial(dto.getPreliminaresTextoInicial());
        if (dto.getConstatacoesTextoInicial() != null) relatorio.setConstatacoesTextoInicial(dto.getConstatacoesTextoInicial());

        updateCollections(relatorio, dto);

        return repository.save(relatorio);
    }

    private void updateCollections(RelatorioFinal relatorio, RelatorioFinal dto) {
        if (dto.getPreliminares() != null) {
            relatorio.getPreliminares().removeIf(e -> e.getId() != null && dto.getPreliminares().stream().noneMatch(i -> e.getId().equals(i.getId())));
            int ordemPreliminar = 0;
            for (RelatorioFinalInformacao incoming : dto.getPreliminares()) {
                incoming.setOrdem(ordemPreliminar++);
                if (incoming.getId() != null) {
                    RelatorioFinalInformacao existing = relatorio.getPreliminares().stream()
                            .filter(e -> incoming.getId().equals(e.getId())).findFirst().orElse(null);
                    if (existing != null) {
                        existing.setTitulo(incoming.getTitulo());
                        existing.setContent(incoming.getContent());
                        existing.setOrdem(incoming.getOrdem());
                    } else {
                        incoming.setRelatorioFinal(relatorio);
                        relatorio.getPreliminares().add(incoming);
                    }
                } else {
                    incoming.setRelatorioFinal(relatorio);
                    relatorio.getPreliminares().add(incoming);
                }
            }
        }

        if (dto.getConstatacoes() != null) {
            relatorio.getConstatacoes().removeIf(e -> e.getId() != null && dto.getConstatacoes().stream().noneMatch(i -> e.getId().equals(i.getId())));
            int ordemConstatacao = 0;
            for (RelatorioFinalConstatacao incoming : dto.getConstatacoes()) {
                incoming.setOrdem(ordemConstatacao++);
                if (incoming.getId() != null) {
                    RelatorioFinalConstatacao existing = relatorio.getConstatacoes().stream()
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
                        incoming.setRelatorioFinal(relatorio);
                        if (incoming.getRecomendacoes() != null) {
                            for (RelatorioFinalRecomendacao r : incoming.getRecomendacoes()) {
                                r.setConstatacao(incoming);
                                if (r.getReportes() != null) {
                                    for (RelatorioFinalRecomendacaoReporte rep : r.getReportes()) {
                                        rep.setRecomendacao(r);
                                    }
                                }
                            }
                        }
                        relatorio.getConstatacoes().add(incoming);
                    }
                } else {
                    incoming.setRelatorioFinal(relatorio);
                    if (incoming.getRecomendacoes() != null) {
                        for (RelatorioFinalRecomendacao r : incoming.getRecomendacoes()) {
                            r.setConstatacao(incoming);
                            if (r.getReportes() != null) {
                                for (RelatorioFinalRecomendacaoReporte rep : r.getReportes()) {
                                    rep.setRecomendacao(r);
                                }
                            }
                        }
                    }
                    relatorio.getConstatacoes().add(incoming);
                }
            }
        }
        
        if (dto.getAnexosFinais() != null) {
            relatorio.getAnexosFinais().removeIf(e -> e.getId() != null && dto.getAnexosFinais().stream().noneMatch(i -> e.getId().equals(i.getId())));
            for (AnexoRelatorioFinal incoming : dto.getAnexosFinais()) {
                if (incoming.getId() != null) {
                    AnexoRelatorioFinal existing = relatorio.getAnexosFinais().stream()
                            .filter(e -> incoming.getId().equals(e.getId())).findFirst().orElse(null);
                    if (existing != null) {
                        existing.setTitulo(incoming.getTitulo());
                        existing.setTipo(incoming.getTipo());
                        existing.setOrientacao(incoming.getOrientacao());
                        existing.setContent(incoming.getContent());
                        existing.setOrdem(incoming.getOrdem());
                    } else {
                        incoming.setRelatorioFinal(relatorio);
                        relatorio.getAnexosFinais().add(incoming);
                    }
                } else {
                    incoming.setRelatorioFinal(relatorio);
                    relatorio.getAnexosFinais().add(incoming);
                }
            }
        }
        updateGerenciasDestinatarias(relatorio, dto);
    }

    private void updateGerenciasDestinatarias(RelatorioFinal relatorio, RelatorioFinal dto) {
        if (dto.getGerenciasDestinatarias() != null) {
            List<Gerencia> gerencias = dto.getGerenciasDestinatarias().stream()
                    .filter(g -> g.getId() != null)
                    .map(g -> gerenciaRepository.findById(g.getId()).orElse(null))
                    .filter(java.util.Objects::nonNull)
                    .collect(java.util.stream.Collectors.toList());
            relatorio.setGerenciasDestinatarias(gerencias);
        }
    }

    private void updateRecomendacoes(RelatorioFinalConstatacao existing, RelatorioFinalConstatacao incoming) {
        if (incoming.getRecomendacoes() != null) {
            existing.getRecomendacoes().removeIf(e -> e.getId() != null && incoming.getRecomendacoes().stream().noneMatch(i -> e.getId().equals(i.getId())));
            for (RelatorioFinalRecomendacao incRec : incoming.getRecomendacoes()) {
                if (incRec.getId() != null) {
                    RelatorioFinalRecomendacao exRec = existing.getRecomendacoes().stream()
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
                            for (RelatorioFinalRecomendacaoReporte rep : incRec.getReportes()) {
                                rep.setRecomendacao(incRec);
                            }
                        }
                        existing.getRecomendacoes().add(incRec);
                    }
                } else {
                    incRec.setConstatacao(existing);
                    if (incRec.getReportes() != null) {
                        for (RelatorioFinalRecomendacaoReporte rep : incRec.getReportes()) {
                            rep.setRecomendacao(incRec);
                        }
                    }
                    existing.getRecomendacoes().add(incRec);
                }
            }
        }
    }

    private void updateReportes(RelatorioFinalRecomendacao existing, RelatorioFinalRecomendacao incoming) {
        if (incoming.getReportes() != null) {
            existing.getReportes().removeIf(e -> e.getId() != null && incoming.getReportes().stream().noneMatch(i -> e.getId().equals(i.getId())));
            for (RelatorioFinalRecomendacaoReporte incRep : incoming.getReportes()) {
                if (incRep.getId() != null) {
                    RelatorioFinalRecomendacaoReporte exRep = existing.getReportes().stream()
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
