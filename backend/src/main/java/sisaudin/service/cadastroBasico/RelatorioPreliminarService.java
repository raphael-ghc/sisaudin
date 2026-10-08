package sisaudin.service.cadastroBasico;

import java.time.LocalDate;
import sisaudin.service.cadastroBasico.DocumentoNumeroService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import sisaudin.model.cadastroBasico.Gerencia;
import sisaudin.model.cadastroBasico.ItemTrabalho;
import sisaudin.model.cadastroBasico.RelatorioPreliminar;
import sisaudin.repository.cadastroBasico.GerenciaRepository;
import sisaudin.repository.cadastroBasico.ItemTrabalhoRepository;
import sisaudin.repository.cadastroBasico.RelatorioPreliminarRepository;
import jakarta.persistence.EntityNotFoundException;

import java.util.List;
import java.util.Optional;

@Service
public class RelatorioPreliminarService {

    @Autowired
    private DocumentoNumeroService numeroService;


    @Autowired
    private RelatorioPreliminarRepository repository;

    @Autowired
    private ItemTrabalhoRepository itemTrabalhoRepository;

    @Autowired
    private GerenciaRepository gerenciaRepository;
    
    @Autowired
    private sisaudin.repository.cadastroBasico.PlanejamentoRepository planejamentoRepository;

    public RelatorioPreliminar getOrCreateByItemTrabalhoId(Long itemTrabalhoId) {
        Optional<RelatorioPreliminar> existing = repository.findByItemTrabalho_Id(itemTrabalhoId);
        if (existing.isPresent()) {
            return existing.get();
        }

        ItemTrabalho itemTrabalho = itemTrabalhoRepository.findById(itemTrabalhoId)
                .orElseThrow(() -> new RuntimeException("ItemTrabalho não encontrado: " + itemTrabalhoId));

        RelatorioPreliminar novoRelatorio = RelatorioPreliminar.builder()
                .itemTrabalho(itemTrabalho)
                .planObjetivo(itemTrabalho.getObjetivoAuditoria())
                .build();
                
        List<sisaudin.model.cadastroBasico.Planejamento> planejamentos = planejamentoRepository.findByItemTrabalhoId(itemTrabalhoId);
        if (planejamentos != null && !planejamentos.isEmpty()) {
            sisaudin.model.cadastroBasico.Planejamento plan = planejamentos.get(0);
            novoRelatorio.setPlanRiscos(plan.getPrincipaisRiscos());
            novoRelatorio.setPlanEscopo(plan.getEscopo());
            novoRelatorio.setPlanCriterios(plan.getCriterioUniversoAmostral());
            novoRelatorio.setPlanAmostra(plan.getAmostra());
        }

        Integer anoAtual = LocalDate.now().getYear();
        novoRelatorio.setAno(anoAtual);
        novoRelatorio.setNumero(numeroService.getNextAvailableNumber("RelatorioPreliminar", anoAtual, itemTrabalhoId));
        return repository.save(novoRelatorio);
    }

    public RelatorioPreliminar saveOrUpdate(RelatorioPreliminar dto, Long itemTrabalhoId) {
        RelatorioPreliminar relatorio = getOrCreateByItemTrabalhoId(itemTrabalhoId);
        
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

    public RelatorioPreliminar saveOrUpdate(RelatorioPreliminar dto) {
        RelatorioPreliminar relatorio;
        if (dto.getId() != null) {
            relatorio = findById(dto.getId());
        } else {
            relatorio = new RelatorioPreliminar();
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

    public List<RelatorioPreliminar> findAll() {
        return repository.findAll();
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public RelatorioPreliminar createEmpty() {
        RelatorioPreliminar relatorio = RelatorioPreliminar.builder().build();
        
        Integer anoAtual = LocalDate.now().getYear();
        relatorio.setAno(anoAtual);
        relatorio.setNumero(numeroService.getNextAvailableNumber("RelatorioPreliminar", anoAtual, null));
        return repository.save(relatorio);
    }

    public RelatorioPreliminar findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("RelatorioPreliminar não encontrado: " + id));
    }

    public RelatorioPreliminar updateById(Long id, RelatorioPreliminar dto, Long itemTrabalhoId) {
        RelatorioPreliminar relatorio = findById(id);

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

    private void updateCollections(RelatorioPreliminar relatorio, RelatorioPreliminar dto) {
        if (dto.getPreliminares() != null) {
            relatorio.getPreliminares().removeIf(e -> e.getId() != null && dto.getPreliminares().stream().noneMatch(i -> e.getId().equals(i.getId())));
            for (sisaudin.model.cadastroBasico.RelatorioPreliminarInformacao incoming : dto.getPreliminares()) {
                if (incoming.getId() != null) {
                    sisaudin.model.cadastroBasico.RelatorioPreliminarInformacao existing = relatorio.getPreliminares().stream()
                            .filter(e -> incoming.getId().equals(e.getId())).findFirst().orElse(null);
                    if (existing != null) {
                        existing.setTitulo(incoming.getTitulo());
                        existing.setContent(incoming.getContent());
                        existing.setOrdem(incoming.getOrdem());
                    } else {
                        incoming.setRelatorioPreliminar(relatorio);
                        relatorio.getPreliminares().add(incoming);
                    }
                } else {
                    incoming.setRelatorioPreliminar(relatorio);
                    relatorio.getPreliminares().add(incoming);
                }
            }
        }

        if (dto.getConstatacoes() != null) {
            relatorio.getConstatacoes().removeIf(e -> e.getId() != null && dto.getConstatacoes().stream().noneMatch(i -> e.getId().equals(i.getId())));
            for (sisaudin.model.cadastroBasico.RelatorioPreliminarConstatacao incoming : dto.getConstatacoes()) {
                if (incoming.getId() != null) {
                    sisaudin.model.cadastroBasico.RelatorioPreliminarConstatacao existing = relatorio.getConstatacoes().stream()
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
                        incoming.setRelatorioPreliminar(relatorio);
                        if (incoming.getRecomendacoes() != null) {
                            for (sisaudin.model.cadastroBasico.RelatorioPreliminarRecomendacao r : incoming.getRecomendacoes()) {
                                r.setConstatacao(incoming);
                            }
                        }
                        relatorio.getConstatacoes().add(incoming);
                    }
                } else {
                    incoming.setRelatorioPreliminar(relatorio);
                    if (incoming.getRecomendacoes() != null) {
                        for (sisaudin.model.cadastroBasico.RelatorioPreliminarRecomendacao r : incoming.getRecomendacoes()) {
                            r.setConstatacao(incoming);
                        }
                    }
                    relatorio.getConstatacoes().add(incoming);
                }
            }
        }
        if (dto.getAnexosFinais() != null) {
            relatorio.getAnexosFinais().removeIf(e -> e.getId() != null && dto.getAnexosFinais().stream().noneMatch(i -> e.getId().equals(i.getId())));
            for (sisaudin.model.cadastroBasico.AnexoRelatorio incoming : dto.getAnexosFinais()) {
                if (incoming.getId() != null) {
                    sisaudin.model.cadastroBasico.AnexoRelatorio existing = relatorio.getAnexosFinais().stream()
                            .filter(e -> incoming.getId().equals(e.getId())).findFirst().orElse(null);
                    if (existing != null) {
                        existing.setTitulo(incoming.getTitulo());
                        existing.setTipo(incoming.getTipo());
                        existing.setOrientacao(incoming.getOrientacao());
                        existing.setContent(incoming.getContent());
                        existing.setOrdem(incoming.getOrdem());
                    } else {
                        incoming.setRelatorioPreliminar(relatorio);
                        relatorio.getAnexosFinais().add(incoming);
                    }
                } else {
                    incoming.setRelatorioPreliminar(relatorio);
                    relatorio.getAnexosFinais().add(incoming);
                }
            }
        }
        updateGerenciasDestinatarias(relatorio, dto);
    }

    private void updateGerenciasDestinatarias(RelatorioPreliminar relatorio, RelatorioPreliminar dto) {
        if (dto.getGerenciasDestinatarias() != null) {
            List<Gerencia> gerencias = dto.getGerenciasDestinatarias().stream()
                    .filter(g -> g.getId() != null)
                    .map(g -> gerenciaRepository.findById(g.getId()).orElse(null))
                    .filter(java.util.Objects::nonNull)
                    .collect(java.util.stream.Collectors.toList());
            relatorio.setGerenciasDestinatarias(gerencias);
        }
    }

    private void updateRecomendacoes(sisaudin.model.cadastroBasico.RelatorioPreliminarConstatacao existing, sisaudin.model.cadastroBasico.RelatorioPreliminarConstatacao incoming) {
        if (incoming.getRecomendacoes() != null) {
            existing.getRecomendacoes().removeIf(e -> e.getId() != null && incoming.getRecomendacoes().stream().noneMatch(i -> e.getId().equals(i.getId())));
            for (sisaudin.model.cadastroBasico.RelatorioPreliminarRecomendacao incRec : incoming.getRecomendacoes()) {
                if (incRec.getId() != null) {
                    sisaudin.model.cadastroBasico.RelatorioPreliminarRecomendacao exRec = existing.getRecomendacoes().stream()
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
