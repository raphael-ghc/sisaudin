package sisaudin.service.cadastroBasico;

import java.time.LocalDate;
import sisaudin.service.cadastroBasico.DocumentoNumeroService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sisaudin.model.cadastroBasico.*;
import sisaudin.repository.cadastroBasico.ReuniaoBuscaConjuntaRepository;
import sisaudin.repository.cadastroBasico.RelatorioPreliminarRepository;
import sisaudin.repository.cadastroBasico.NotaPreliminarRepository;
import java.util.List;
import java.util.Optional;

@Service
public class ReuniaoBuscaConjuntaService {

    @Autowired
    private DocumentoNumeroService numeroService;


    @Autowired
    private ReuniaoBuscaConjuntaRepository repository;

    @Autowired
    private RelatorioPreliminarRepository preliminarRepository;

    @Autowired
    private NotaPreliminarRepository notaPreliminarRepository;

    public List<ReuniaoBuscaConjunta> findAll() {
        return repository.findAll();
    }

    public List<ReuniaoBuscaConjunta> findByItemTrabalho_Id(Long itemTrabalhoId) {
        return repository.findByItemTrabalho_Id(itemTrabalhoId);
    }

    public Optional<ReuniaoBuscaConjunta> findById(Long id) {
        return repository.findById(id);
    }

    @Transactional
    public ReuniaoBuscaConjunta save(ReuniaoBuscaConjunta entity) {
        if (entity.getStatus() == null || entity.getStatus().trim().isEmpty()) {
            entity.setStatus("Minuta");
        }

        if (entity.getId() == null && entity.getItemTrabalho() != null) {
            // Nova reunião: tentar clonar do relatório preliminar
            Optional<RelatorioPreliminar> preliminarOpt = preliminarRepository.findByItemTrabalho_Id(entity.getItemTrabalho().getId());
            if (preliminarOpt.isPresent()) {
                RelatorioPreliminar preliminar = preliminarOpt.get();
                
                if (preliminar.getGerenciasDestinatarias() != null) {
                    entity.getGerenciasDestinatarias().addAll(preliminar.getGerenciasDestinatarias());
                }

                if (preliminar.getConstatacoes() != null) {
                    for (RelatorioPreliminarConstatacao c : preliminar.getConstatacoes()) {
                        ReuniaoConstatacao rc = ReuniaoConstatacao.builder()
                                .titulo(c.getTitulo())
                                .resumoFato(c.getResumoFato())
                                .resumoCriterio(c.getResumoCriterio())
                                .resumoCausa(c.getResumoCausa())
                                .resumoImpacto(c.getResumoImpacto())
                                .reuniaoBuscaConjunta(entity)
                                .build();
                        
                        if (c.getRecomendacoes() != null) {
                            for (RelatorioPreliminarRecomendacao r : c.getRecomendacoes()) {
                                ReuniaoRecomendacao rr = ReuniaoRecomendacao.builder()
                                        .content(r.getContent())
                                        .dataLimite(r.getDataLimite())
                                        .nivelRisco(r.getNivelRisco())
                                        .gerencia(r.getGerencia())
                                        .isNova(false)
                                        .reuniaoConstatacao(rc)
                                        .build();
                                rc.getRecomendacoes().add(rr);
                            }
                        }
                        entity.getConstatacoes().add(rc);
                    }
                }
            } else {
                Optional<NotaPreliminar> notaOpt = notaPreliminarRepository.findByItemTrabalho_Id(entity.getItemTrabalho().getId());
                if (notaOpt.isPresent()) {
                    NotaPreliminar nota = notaOpt.get();
                    if (nota.getGerenciasDestinatarias() != null) {
                        entity.getGerenciasDestinatarias().addAll(nota.getGerenciasDestinatarias());
                    }
                    if (nota.getConstatacoes() != null) {
                        for (NotaPreliminarConstatacao c : nota.getConstatacoes()) {
                            ReuniaoConstatacao rc = ReuniaoConstatacao.builder()
                                    .titulo(c.getTitulo())
                                    .resumoFato(c.getContent())
                                    .resumoCriterio("")
                                    .resumoCausa("")
                                    .resumoImpacto("")
                                    .reuniaoBuscaConjunta(entity)
                                    .build();
                            
                            if (c.getRecomendacoes() != null) {
                                for (NotaPreliminarRecomendacao r : c.getRecomendacoes()) {
                                    ReuniaoRecomendacao rr = ReuniaoRecomendacao.builder()
                                            .content(r.getContent())
                                            .dataLimite(r.getDataLimite())
                                            .nivelRisco(r.getNivelRisco())
                                            .gerencia(r.getGerencia())
                                            .isNova(false)
                                            .reuniaoConstatacao(rc)
                                            .build();
                                    rc.getRecomendacoes().add(rr);
                                }
                            }
                            entity.getConstatacoes().add(rc);
                        }
                    }
                }
            }
        } else if (entity.getId() != null) {
            // Update logic for nested collections
            ReuniaoBuscaConjunta existing = repository.findById(entity.getId()).orElse(null);
            if (existing != null) {
                if (entity.getConstatacoes() != null) {
                    existing.getConstatacoes().removeIf(e -> e.getId() != null && entity.getConstatacoes().stream().noneMatch(i -> e.getId().equals(i.getId())));
                    for (ReuniaoConstatacao incomingC : entity.getConstatacoes()) {
                        if (incomingC.getId() != null) {
                            ReuniaoConstatacao existingC = existing.getConstatacoes().stream().filter(e -> incomingC.getId().equals(e.getId())).findFirst().orElse(null);
                            if (existingC != null) {
                                existingC.setTitulo(incomingC.getTitulo());
                                existingC.setResumoFato(incomingC.getResumoFato());
                                existingC.setResumoCriterio(incomingC.getResumoCriterio());
                                existingC.setResumoCausa(incomingC.getResumoCausa());
                                existingC.setResumoImpacto(incomingC.getResumoImpacto());

                                if (incomingC.getRecomendacoes() != null) {
                                    existingC.getRecomendacoes().removeIf(e -> e.getId() != null && incomingC.getRecomendacoes().stream().noneMatch(i -> e.getId().equals(i.getId())));
                                    for (ReuniaoRecomendacao incomingR : incomingC.getRecomendacoes()) {
                                        if (incomingR.getId() != null) {
                                            ReuniaoRecomendacao existingR = existingC.getRecomendacoes().stream().filter(r -> incomingR.getId().equals(r.getId())).findFirst().orElse(null);
                                            if (existingR != null) {
                                                existingR.setContent(incomingR.getContent());
                                                existingR.setDataLimite(incomingR.getDataLimite());
                                                existingR.setNivelRisco(incomingR.getNivelRisco());
                                                existingR.setGerencia(incomingR.getGerencia());
                                                existingR.setAcao(incomingR.getAcao());
                                                existingR.setGerenciaEncaminhada(incomingR.getGerenciaEncaminhada());
                                                existingR.setEncaminhamentos(incomingR.getEncaminhamentos());
                                                existingR.setIsNova(incomingR.getIsNova() != null ? incomingR.getIsNova() : false);
                                            } else {
                                                incomingR.setReuniaoConstatacao(existingC);
                                                existingC.getRecomendacoes().add(incomingR);
                                            }
                                        } else {
                                            incomingR.setReuniaoConstatacao(existingC);
                                            existingC.getRecomendacoes().add(incomingR);
                                        }
                                    }
                                }
                            } else {
                                incomingC.setReuniaoBuscaConjunta(existing);
                                if (incomingC.getRecomendacoes() != null) {
                                    for (ReuniaoRecomendacao r : incomingC.getRecomendacoes()) {
                                        r.setReuniaoConstatacao(incomingC);
                                    }
                                }
                                existing.getConstatacoes().add(incomingC);
                            }
                        } else {
                            incomingC.setReuniaoBuscaConjunta(existing);
                            if (incomingC.getRecomendacoes() != null) {
                                for (ReuniaoRecomendacao r : incomingC.getRecomendacoes()) {
                                    r.setReuniaoConstatacao(incomingC);
                                }
                            }
                            existing.getConstatacoes().add(incomingC);
                        }
                    }
                }
                
                // Handle Agendamentos
                if (entity.getAgendamentos() != null) {
                    existing.getAgendamentos().removeIf(e -> e.getId() != null && entity.getAgendamentos().stream().noneMatch(i -> e.getId().equals(i.getId())));
                    for (ReuniaoBuscaConjuntaAgendamento incomingA : entity.getAgendamentos()) {
                        if (incomingA.getId() != null) {
                            ReuniaoBuscaConjuntaAgendamento existingA = existing.getAgendamentos().stream().filter(e -> incomingA.getId().equals(e.getId())).findFirst().orElse(null);
                            if (existingA != null) {
                                existingA.setDataHora(incomingA.getDataHora());
                                existingA.setLocal(incomingA.getLocal());
                                existingA.setPessoas(incomingA.getPessoas());
                                existingA.setGerencias(incomingA.getGerencias());
                            } else {
                                incomingA.setReuniaoBuscaConjunta(existing);
                                existing.getAgendamentos().add(incomingA);
                            }
                        } else {
                            incomingA.setReuniaoBuscaConjunta(existing);
                            existing.getAgendamentos().add(incomingA);
                        }
                    }
                }
                
                // Copy basic fields back to existing to persist
                existing.setNome(entity.getNome());
                existing.setDescricao(entity.getDescricao());
                existing.setConteudo(entity.getConteudo());
                existing.setGerenciasDestinatarias(entity.getGerenciasDestinatarias());
                existing.setStatus(entity.getStatus());
                existing.setNumero(entity.getNumero());
                existing.setAno(entity.getAno());
                existing.setDataCriacao(entity.getDataCriacao());

                return repository.save(existing);
            }
        }
        
        return repository.save(entity);
    }

    @Transactional
    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
