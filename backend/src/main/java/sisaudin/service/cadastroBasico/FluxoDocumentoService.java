package sisaudin.service.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sisaudin.dto.DocumentoCriadoDTO;
import sisaudin.dto.DocumentoOpcaoDTO;
import sisaudin.dto.FluxoDocumentoStatusDTO;
import sisaudin.dto.GerenciaComunicacaoDTO;
import sisaudin.model.cadastroBasico.*;
import sisaudin.repository.cadastroBasico.GerenciaRepository;
import sisaudin.repository.cadastroBasico.ItemTrabalhoRepository;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;


@Service
public class FluxoDocumentoService {

    @Autowired
    private ItemTrabalhoRepository itemTrabalhoRepository;

    @Autowired
    private GerenciaRepository gerenciaRepository;

    @Transactional(readOnly = true)
    public FluxoDocumentoStatusDTO getStatusFluxo(Long itemTrabalhoId) {
        ItemTrabalho item = itemTrabalhoRepository.findById(itemTrabalhoId)
                .orElseThrow(() -> new IllegalArgumentException("Item de Trabalho não encontrado: " + itemTrabalhoId));

        boolean existeOS = item.getOrdensServico() != null && !item.getOrdensServico().isEmpty();
        //boolean existeComunicacao = item.getComunicacoes() != null && !item.getComunicacoes().isEmpty();
        boolean existePlanejamento = item.getPlanejamentos() != null && !item.getPlanejamentos().isEmpty();
        boolean existeMatrizPlanejamento = false;
        boolean existeMatrizAchados = item.getMatrizesAchados() != null && !item.getMatrizesAchados().isEmpty();
        boolean existeRelatorioPreliminar = item.getRelatoriosPreliminar() != null && !item.getRelatoriosPreliminar().isEmpty();
        boolean existeNotaPreliminar = item.getNotasPreliminar() != null && !item.getNotasPreliminar().isEmpty();
        boolean existeNotaTecnica = item.getNotasTecnica() != null && !item.getNotasTecnica().isEmpty();
        boolean existeParecer = item.getPareceres() != null && !item.getPareceres().isEmpty();
        boolean existeReuniaoBuscaConjunta = item.getReunioesBuscaConjunta() != null && !item.getReunioesBuscaConjunta().isEmpty();

        List<Gerencia> todasGerencias = gerenciaRepository.findAll();

        Set<Long> gerenciasComComunicacao = new HashSet<>();
        if (item.getComunicacoes() != null) {
            for (Comunicacao com : item.getComunicacoes()) {
                if (com.getGerenciasDestinatarias() != null) {
                    com.getGerenciasDestinatarias().forEach(g -> gerenciasComComunicacao.add(g.getId()));
                }
            }
        }

        List<GerenciaComunicacaoDTO> gerenciasDTO = todasGerencias.stream()
                .map(g -> GerenciaComunicacaoDTO.builder()
                        .gerenciaId(g.getId())
                        .nomeGerencia(g.getNome())
                        .siglaGerencia(g.getSigla())
                        .possuiComunicacao(gerenciasComComunicacao.contains(g.getId()))
                        .build())
                .sorted(Comparator.comparing(GerenciaComunicacaoDTO::getNomeGerencia, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .collect(Collectors.toList());

        Map<String, DocumentoOpcaoDTO> opcoes = new LinkedHashMap<>();

        // Regra H: Reunião e Visita sempre habilitadas
        opcoes.put("REUNIAO", DocumentoOpcaoDTO.builder()
                .codigo("REUNIAO")
                .nome("Reunião")
                .habilitado(true)
                .modalVerificacao(null)
                .rotaCriacao("/reuniao?itemTrabalhoId=" + itemTrabalhoId)
                .build());

        opcoes.put("VISITA", DocumentoOpcaoDTO.builder()
                .codigo("VISITA")
                .nome("Visita")
                .habilitado(true)
                .modalVerificacao(null)
                .rotaCriacao("/visita?itemTrabalhoId=" + itemTrabalhoId)
                .build());

        boolean existeNotaFinal =item.getNotasFinal() != null && !item.getNotasFinal().isEmpty();
        boolean existePlanoAcaoPreliminar = item.getPlanosAcaoPreliminar() != null && !item.getPlanosAcaoPreliminar().isEmpty();
        boolean existePlanoAcaoFinal = item.getPlanosAcaoFinal() != null && !item.getPlanosAcaoFinal().isEmpty();

        // Regra A: Se não existem documentos, habilitar Ordem de Serviço (somente uma obrigatória)
        opcoes.put("ORDEM_SERVICO", DocumentoOpcaoDTO.builder()
                .codigo("ORDEM_SERVICO")
                .nome("Ordem de Serviço")
                .habilitado(!existeOS)
                .motivoInabilitado(existeOS ? "Já existe uma Ordem de Serviço criada" : null)
                .modalVerificacao(null)
                .rotaCriacao("/ordem-servico?itemTrabalhoId=" + itemTrabalhoId)
                .build());

        // Regra B: Comunicação de Auditoria e Solicitação (habilitadas, exigem verificação de fluxo se ausentes pré-requisitos)
        opcoes.put("COMUNICACAO_AUDITORIA", DocumentoOpcaoDTO.builder()
                .codigo("COMUNICACAO_AUDITORIA")
                .nome("Comunicação de Auditoria")
                .habilitado(true)
                .motivoInabilitado(null)
                .modalVerificacao(!existeOS ? "B1_COMUNICACAO" : null)
                .rotaCriacao("/comunicacao?itemTrabalhoId=" + itemTrabalhoId)
                .build());

        opcoes.put("SOLICITACAO_AUDITORIA", DocumentoOpcaoDTO.builder()
                .codigo("SOLICITACAO_AUDITORIA")
                .nome("Solicitação de Auditoria")
                .habilitado(true)
                .motivoInabilitado(null)
                .modalVerificacao("B1_COMUNICACAO")
                .rotaCriacao("/solicitacao?itemTrabalhoId=" + itemTrabalhoId)
                .build());

        opcoes.put("NOTA_AUDITORIA_PRELIMINAR", DocumentoOpcaoDTO.builder()
                .codigo("NOTA_AUDITORIA_PRELIMINAR")
                .nome("Nota de Auditoria Preliminar")
                .habilitado(!existeNotaPreliminar && !existeRelatorioPreliminar && !existeNotaTecnica && !existeParecer)
                .motivoInabilitado(existeNotaPreliminar ? "Já existe uma Nota de Auditoria Preliminar criada" : (existeRelatorioPreliminar ? "Incompatível com Relatório Preliminar já criado" : null))
                .modalVerificacao("B1_COMUNICACAO")
                .rotaCriacao("/nota-preliminar?itemTrabalhoId=" + itemTrabalhoId)
                .build());

        opcoes.put("NOTA_TECNICA", DocumentoOpcaoDTO.builder()
                .codigo("NOTA_TECNICA")
                .nome("Nota Técnica")
                .habilitado(!existeNotaTecnica && !existeRelatorioPreliminar && !existeNotaPreliminar && !existeParecer)
                .motivoInabilitado(existeNotaTecnica ? "Já existe uma Nota Técnica criada" : (existeRelatorioPreliminar ? "Incompatível com Relatório Preliminar já criado" : null))
                .modalVerificacao("B1_COMUNICACAO")
                .rotaCriacao("/nota-tecnica?itemTrabalhoId=" + itemTrabalhoId)
                .build());

        opcoes.put("PARECER", DocumentoOpcaoDTO.builder()
                .codigo("PARECER")
                .nome("Parecer")
                .habilitado(!existeParecer && !existeRelatorioPreliminar && !existeNotaPreliminar && !existeNotaTecnica)
                .motivoInabilitado(existeParecer ? "Já existe um Parecer criado" : (existeRelatorioPreliminar ? "Incompatível com Relatório Preliminar já criado" : null))
                .modalVerificacao("B1_COMUNICACAO")
                .rotaCriacao("/parecer?itemTrabalhoId=" + itemTrabalhoId)
                .build());

        boolean existeDocSemPlanejamento = existeNotaPreliminar || existeNotaTecnica || existeParecer;

        opcoes.put("PLANEJAMENTO", DocumentoOpcaoDTO.builder()
                .codigo("PLANEJAMENTO")
                .nome("Planejamento")
                .habilitado(!existePlanejamento && !existeDocSemPlanejamento)
                .motivoInabilitado(existePlanejamento ? "Já existe um Planejamento criado" : (existeDocSemPlanejamento ? "Planejamento é exigido apenas para Relatório de Auditoria Preliminar" : null))
                .modalVerificacao(!existeOS ? "B1_COMUNICACAO" : null)
                .rotaCriacao("/planejamento?itemTrabalhoId=" + itemTrabalhoId)
                .build());

        // RAI e REAI têm a mesma estrutura e as mesmas regras; o item admite um só relatório preliminar.
        // O tipo vem do item: PAINT gera RAI, EXTRA gera REAI. Se já há relatório no item, o par segue o tipo dele.
        boolean existeRelatorioFinal = item.getRelatoriosFinal() != null && !item.getRelatoriosFinal().isEmpty();
        Boolean tipoDoItem = DocumentoNumeroService.tipoRelatorioDoItem(item);
        String motivoTipoRai = tipoDoItem == null ? "Defina o tipo do item de trabalho (PAINT ou EXTRA)" : "RAI só pode ser gerado em item de trabalho PAINT";
        String motivoTipoReai = tipoDoItem == null ? "Defina o tipo do item de trabalho (PAINT ou EXTRA)" : "REAI só pode ser gerado em item de trabalho EXTRA";

        Boolean tipoPreliminar = existeRelatorioFinal ? (Boolean) Boolean.TRUE.equals(item.getRelatoriosFinal().get(0).getEspecial()) : tipoDoItem;
        boolean podeRelatorioPreliminar = !existeRelatorioPreliminar && !existeNotaPreliminar && !existeNotaTecnica && !existeParecer;
        String motivoRelatorioPreliminar = existeRelatorioPreliminar ? "Já existe um Relatório Preliminar criado" : null;
        String modalRelatorioPreliminar = existeOS ? (existeMatrizAchados ? "B1_COMUNICACAO" : "B1_E_B3") : "B1_E_B3";

        opcoes.put("RELATORIO_PRELIMINAR", DocumentoOpcaoDTO.builder()
                .codigo("RELATORIO_PRELIMINAR")
                .nome("RAI-P - Relatório de Auditoria Preliminar")
                .habilitado(podeRelatorioPreliminar && Boolean.FALSE.equals(tipoPreliminar))
                .motivoInabilitado(motivoRelatorioPreliminar != null ? motivoRelatorioPreliminar
                        : (Boolean.FALSE.equals(tipoPreliminar) ? null : (existeRelatorioFinal ? "O relatório final deste item é um REAI" : motivoTipoRai)))
                .modalVerificacao(modalRelatorioPreliminar)
                .rotaCriacao("/RelatorioPreliminar?tipo=preliminar&itemTrabalhoId=" + itemTrabalhoId)
                .build());

        opcoes.put("RELATORIO_ESPECIAL_PRELIMINAR", DocumentoOpcaoDTO.builder()
                .codigo("RELATORIO_ESPECIAL_PRELIMINAR")
                .nome("REAI-P - Relatório Especial de Auditoria Preliminar")
                .habilitado(podeRelatorioPreliminar && Boolean.TRUE.equals(tipoPreliminar))
                .motivoInabilitado(motivoRelatorioPreliminar != null ? motivoRelatorioPreliminar
                        : (Boolean.TRUE.equals(tipoPreliminar) ? null : (existeRelatorioFinal ? "O relatório final deste item é um RAI" : motivoTipoReai)))
                .modalVerificacao(modalRelatorioPreliminar)
                .rotaCriacao("/RelatorioPreliminar?tipo=preliminar&especial=true&itemTrabalhoId=" + itemTrabalhoId)
                .build());

        // Regra C: Matriz Achados (habilitada mesmo sem Planejamento, solicitando justificativa)
        opcoes.put("MATRIZ_ACHADOS", DocumentoOpcaoDTO.builder()
                .codigo("MATRIZ_ACHADOS")
                .nome("Matriz de Achados")
                .habilitado(!existeMatrizAchados && !existeDocSemPlanejamento)
                .motivoInabilitado(existeMatrizAchados ? "Já existe uma Matriz de Achados criada" : (existeDocSemPlanejamento ? "Exigida apenas para Relatório de Auditoria Preliminar" : null))
                .modalVerificacao(!existePlanejamento ? "B2_PLANEJAMENTO_OPCIONAL" : null)
                .rotaCriacao("/matriz-achados?itemTrabalhoId=" + itemTrabalhoId)
                .build());

        // Regras D, E, G: Reunião de Busca Conjunta (habilitada mesmo sem relatórios preliminares, solicitando justificativa)
        boolean podeReuniaoBusca = existeRelatorioPreliminar || existeNotaPreliminar ||
                existeNotaTecnica || existeParecer;

        opcoes.put("REUNIAO_BUSCA_CONJUNTA", DocumentoOpcaoDTO.builder()
                .codigo("REUNIAO_BUSCA_CONJUNTA")
                .nome("Resultado de Reunião de Busca Conjunta")
                .habilitado(true)
                .motivoInabilitado(null)
                .modalVerificacao(!podeReuniaoBusca ? "B3_PLANEJAMENTO_OBRIGATORIO" : null)
                .rotaCriacao("/reuniao-busca-conjunta?itemTrabalhoId=" + itemTrabalhoId)
                .build());

        // Regra F: Finais (habilitados mesmo sem documentos anteriores, solicitando justificativa)
        boolean podeRelatorioFinal = existeReuniaoBuscaConjunta && existeRelatorioPreliminar;
        boolean podeNotaFinal = existeReuniaoBuscaConjunta && existeNotaPreliminar;
        boolean podePlanoAcaoFinal = (existeReuniaoBuscaConjunta && existeRelatorioPreliminar) ||
                (existeReuniaoBuscaConjunta && existeNotaPreliminar);

        // O relatório final segue o tipo (RAI/REAI) do preliminar do item; sem preliminar, o tipo do item (PAINT/EXTRA)
        Boolean tipoFinal = existeRelatorioPreliminar ? (Boolean) Boolean.TRUE.equals(item.getRelatoriosPreliminar().get(0).getEspecial()) : tipoDoItem;
        String motivoRelatorioFinal = existeRelatorioFinal ? "Já existe um Relatório Final criado" : null;

        opcoes.put("RELATORIO_FINAL", DocumentoOpcaoDTO.builder()
                .codigo("RELATORIO_FINAL")
                .nome("RAI-F - Relatório de Auditoria Final")
                .habilitado(!existeRelatorioFinal && Boolean.FALSE.equals(tipoFinal))
                .motivoInabilitado(motivoRelatorioFinal != null ? motivoRelatorioFinal
                        : (Boolean.FALSE.equals(tipoFinal) ? null : (existeRelatorioPreliminar ? "O relatório preliminar deste item é um REAI" : motivoTipoRai)))
                .modalVerificacao(!podeRelatorioFinal ? "B3_PLANEJAMENTO_OBRIGATORIO" : null)
                .rotaCriacao("/RelatorioFinal?tipo=final&itemTrabalhoId=" + itemTrabalhoId)
                .build());

        opcoes.put("RELATORIO_ESPECIAL_FINAL", DocumentoOpcaoDTO.builder()
                .codigo("RELATORIO_ESPECIAL_FINAL")
                .nome("REAI-F - Relatório Especial de Auditoria Final")
                .habilitado(!existeRelatorioFinal && Boolean.TRUE.equals(tipoFinal))
                .motivoInabilitado(motivoRelatorioFinal != null ? motivoRelatorioFinal
                        : (Boolean.TRUE.equals(tipoFinal) ? null : (existeRelatorioPreliminar ? "O relatório preliminar deste item é um RAI" : motivoTipoReai)))
                .modalVerificacao(!podeRelatorioFinal ? "B3_PLANEJAMENTO_OBRIGATORIO" : null)
                .rotaCriacao("/RelatorioFinal?tipo=final&especial=true&itemTrabalhoId=" + itemTrabalhoId)
                .build());

        opcoes.put("NOTA_AUDITORIA_FINAL", DocumentoOpcaoDTO.builder()
                .codigo("NOTA_AUDITORIA_FINAL")
                .nome("Nota de Auditoria Final")
                .habilitado(!existeNotaFinal)
                .motivoInabilitado(existeNotaFinal ? "Já existe uma Nota de Auditoria Final criada" : null)
                .modalVerificacao(!podeNotaFinal ? "B3_PLANEJAMENTO_OBRIGATORIO" : null)
                .rotaCriacao("/nota-final?itemTrabalhoId=" + itemTrabalhoId)
                .build());

        // Opções de Plano de Ação Preliminar e Final removidas conforme solicitação.
        
        return FluxoDocumentoStatusDTO.builder()
                .itemTrabalhoId(itemTrabalhoId)
                .existeOrdemServico(existeOS)
                .existePlanejamento(existePlanejamento)
                .existeMatrizPlanejamento(existeMatrizPlanejamento)
                .existeMatrizAchados(existeMatrizAchados)
                .existeRelatorioPreliminar(existeRelatorioPreliminar)
                .existeNotaPreliminar(existeNotaPreliminar)
                .existeNotaTecnica(existeNotaTecnica)
                .existeParecer(existeParecer)
                .existeReuniaoBuscaConjunta(existeReuniaoBuscaConjunta)
                .gerenciasItem(gerenciasDTO)
                .opcoes(opcoes)
                .build();
    }

    @Transactional(readOnly = true)
    public List<DocumentoCriadoDTO> getDocumentosCriados(Long itemTrabalhoId) {
        ItemTrabalho item = itemTrabalhoRepository.findById(itemTrabalhoId)
                .orElseThrow(() -> new IllegalArgumentException("Item de Trabalho não encontrado: " + itemTrabalhoId));
        return extrairDocumentosCriados(item);
    }

    public static List<DocumentoCriadoDTO> extrairDocumentosCriados(ItemTrabalho item) {
        List<DocumentoCriadoDTO> lista = new ArrayList<>();
        if (item == null) return lista;
        adicionarDocumentos(lista, item.getOrdensServico(), "ORDEM_SERVICO", "Ordem de Serviço", "/ordem-servico", null);
        adicionarDocumentos(lista, item.getComunicacoes(), "COMUNICACAO_AUDITORIA", "Comunicação de Auditoria", "/comunicacao", null);
        adicionarDocumentos(lista, item.getSolicitacoes(), "SOLICITACAO_AUDITORIA", "Solicitação de Auditoria", "/solicitacao", null);
        adicionarDocumentos(lista, item.getNotasPreliminar(), "NOTA_AUDITORIA_PRELIMINAR", "Nota de Auditoria Preliminar", "/nota-preliminar", null);
        adicionarDocumentos(lista, item.getNotasFinal(), "NOTA_AUDITORIA_FINAL", "Nota de Auditoria Final", "/nota-final", null);
        adicionarDocumentos(lista, item.getNotasTecnica(), "NOTA_TECNICA", "Nota Técnica", "/nota-tecnica", null);
        adicionarDocumentos(lista, item.getPareceres(), "PARECER", "Parecer", "/parecer", null);
        adicionarDocumentos(lista, filtrarRelatorios(item.getRelatoriosPreliminar(), false), "RELATORIO_PRELIMINAR", "Relatório de Auditoria Preliminar", "/RelatorioPreliminar", "tipo=preliminar");
        adicionarDocumentos(lista, filtrarRelatorios(item.getRelatoriosPreliminar(), true), "RELATORIO_PRELIMINAR", "Relatório Especial de Auditoria Preliminar", "/RelatorioPreliminar", "tipo=preliminar");
        adicionarDocumentos(lista, filtrarRelatorios(item.getRelatoriosFinal(), false), "RELATORIO_FINAL", "Relatório de Auditoria Final", "/relatorio-final", "tipo=final");
        adicionarDocumentos(lista, filtrarRelatorios(item.getRelatoriosFinal(), true), "RELATORIO_FINAL", "Relatório Especial de Auditoria Final", "/relatorio-final", "tipo=final");
        //adicionarDocumentos(lista, item.getPlanosAcaoPreliminar(), "PLANO_ACAO_PRELIMINAR", "Plano de Ação Preliminar", "/plano-acao", "tipo=preliminar");
        //adicionarDocumentos(lista, item.getPlanosAcaoFinal(), "PLANO_ACAO_FINAL", "Plano de Ação Final", "/plano-acao", "tipo=final");
        adicionarDocumentos(lista, item.getReunioes(), "REUNIAO", "Reunião", "/reuniao", null);
        adicionarDocumentos(lista, item.getVisitas(), "VISITA", "Visita", "/visita", null);
        adicionarDocumentos(lista, item.getPlanejamentos(), "PLANEJAMENTO", "Planejamento de Auditoria", "/planejamento", null);
        adicionarDocumentos(lista, item.getMatrizesAchados(), "MATRIZ_ACHADOS", "Matriz de Achados", "/matriz-achados", null);
        adicionarDocumentos(lista, item.getReunioesBuscaConjunta(), "REUNIAO_BUSCA_CONJUNTA", "Reunião de Busca Conjunta", "/reuniao-busca-conjunta", null);
       
        lista.sort(Comparator.comparing(DocumentoCriadoDTO::getDataCriacao, Comparator.nullsLast(Comparator.naturalOrder())));
        return lista;
    }

    // Separa os relatórios comuns (RAI) dos especiais (REAI), que ficam na mesma lista do item
    private static <T extends Documento> List<T> filtrarRelatorios(List<T> relatorios, boolean especial) {
        if (relatorios == null) return null;
        return relatorios.stream().filter(r -> {
            Boolean e = r instanceof RelatorioPreliminar ? ((RelatorioPreliminar) r).getEspecial()
                    : (r instanceof RelatorioFinal ? ((RelatorioFinal) r).getEspecial() : null);
            return Boolean.TRUE.equals(e) == especial;
        }).collect(Collectors.toList());
    }

    private static <T extends Documento> void adicionarDocumentos(
            List<DocumentoCriadoDTO> lista,
            List<T> documentos,
            String tipo,
            String nomeTipo,
            String rotaBase,
            String paramAdicional
    ) {
        if (documentos == null || documentos.isEmpty()) return;
        for (T doc : documentos) {
            String nrAno = "-";
            if (doc.getNumero() != null) {
                int anoDoc = doc.getAno() != null ? doc.getAno() : (doc.getDataCriacao() != null ? doc.getDataCriacao().getYear() : java.time.LocalDate.now().getYear());
                nrAno = doc.getNumero() + "/" + anoDoc;
            }
            String rotaEd = rotaBase + "/" + doc.getId() + (paramAdicional != null ? "?" + paramAdicional : "");
            String rotaVis = rotaBase + "/" + doc.getId() + "?view=true" + (paramAdicional != null ? "&" + paramAdicional : "");

            lista.add(DocumentoCriadoDTO.builder()
                    .id(doc.getId())
                    .tipo(tipo)
                    .nome(nomeTipo)
                    .numero(doc.getNumero())
                    .numeroAno(nrAno)
                    .dataCriacao(resolveDataCriacao(doc))
                    .siglasGerencias(extractSiglasGerencias(doc))
                    .status(doc.getStatus() != null ? doc.getStatus() : "Minuta")
                    .rotaEditar(rotaEd)
                    .rotaVisualizar(rotaVis)
                    .build());

        }
    }

    private static LocalDateTime resolveDataCriacao(Object doc) {
        if (doc instanceof Documento) {
            Documento d = (Documento) doc;
            if (d.getDataCriacao() != null) {
                return d.getDataCriacao();
            }
            if (doc instanceof OrdemServico && ((OrdemServico) doc).getDataEmissao() != null) {
                return ((OrdemServico) doc).getDataEmissao().atStartOfDay();
            }
            if (doc instanceof Comunicacao && ((Comunicacao) doc).getDataEmissao() != null) {
                return ((Comunicacao) doc).getDataEmissao().atStartOfDay();
            }
            if (doc instanceof Solicitacao && ((Solicitacao) doc).getDataEmissao() != null) {
                return ((Solicitacao) doc).getDataEmissao().atStartOfDay();
            }
            if (d.getDataInicial() != null) {
                return d.getDataInicial().atStartOfDay();
            }
        }
        return LocalDateTime.of(2026, 1, 1, 9, 0);
    }

    private static String extractSiglasGerencias(Object doc) {
        if (doc instanceof Comunicacao) {
            List<Gerencia> gerencias = ((Comunicacao) doc).getGerenciasDestinatarias();
            return formatGerencias(gerencias);
        }
        if (doc instanceof Solicitacao) {
            List<Gerencia> gerencias = ((Solicitacao) doc).getGerenciasDestinatarias();
            return formatGerencias(gerencias);
        }
        try {
            java.lang.reflect.Method method = doc.getClass().getMethod("getGerenciasDestinatarias");
            Object result = method.invoke(doc);
            if (result instanceof List) {
                return formatGerencias((List<Gerencia>) result);
            }
        } catch (Exception e) {
            // ignorar
        }
        try {
            java.lang.reflect.Method method = doc.getClass().getMethod("getGerenciaDestinataria");
            Object result = method.invoke(doc);
            if (result instanceof Gerencia) {
                Gerencia g = (Gerencia) result;
                return g.getSigla() != null ? g.getSigla() : g.getNome();
            }
        } catch (Exception e) {
            // ignorar
        }
        return "-";
    }

    private static String formatGerencias(List<Gerencia> gerencias) {
        if (gerencias == null || gerencias.isEmpty()) {
            return "-";
        }
        return gerencias.stream()
                .map(g -> g.getSigla() != null && !g.getSigla().isBlank() ? g.getSigla() : g.getNome())
                .collect(Collectors.joining(", "));
    }
}

