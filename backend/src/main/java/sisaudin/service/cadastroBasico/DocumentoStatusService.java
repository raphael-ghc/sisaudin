package sisaudin.service.cadastroBasico;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sisaudin.dto.DocumentoStatusDTO;
import sisaudin.dto.TransitarStatusRequestDTO;
import sisaudin.model.cadastroBasico.*;

import sisaudin.repository.cadastroBasico.*;


import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class DocumentoStatusService {

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private ChecklistRevisaoItemRepository revisaoRepository;

    @Autowired
    private ChecklistAprovacaoItemRepository aprovacaoRepository;

    @Autowired
    private HistoricoStatusRepository historicoRepository;

    @Autowired
    private PessoaRepository userRepository;

    @Transactional
    public DocumentoStatusDTO getStatus(String tipo, Long id, Pessoa currentUser) {
        Documento doc = getDocumentoEntity(tipo, id);
        if (doc.getStatus() == null || doc.getStatus().trim().isEmpty()) {
            doc.setStatus("Minuta");
            entityManager.merge(doc);
        }

        List<ChecklistRevisaoItem> revItems = revisaoRepository.findByDocumentoTipoAndDocumentoIdOrderByOrdemAsc(tipo, id);
        if (revItems.isEmpty()) {
            revItems = initChecklistRevisao(tipo, id);
        }

        List<ChecklistAprovacaoItem> aprovaItems = aprovacaoRepository.findByDocumentoTipoAndDocumentoIdOrderByOrdemAsc(tipo, id);
        if (aprovaItems.isEmpty()) {
            aprovaItems = initChecklistAprovacao(tipo, id);
        }

        List<HistoricoStatus> hist = historicoRepository.findByDocumentoTipoAndDocumentoIdOrderByDataHoraDesc(tipo, id);

        boolean podeEditar = true;
        if ("Aprovado".equalsIgnoreCase(doc.getStatus())) {
            podeEditar = isGestorOrAdmin(currentUser);
        }

        return DocumentoStatusDTO.builder()
                .documentoTipo(tipo)
                .documentoId(id)
                .statusAtual(doc.getStatus())
                .podeEditar(podeEditar)
                .historico(hist)
                .checklistRevisao(revItems)
                .checklistAprovacao(aprovaItems)
                .build();
    }

    @Transactional
    public DocumentoStatusDTO transitarStatus(String tipo, Long id, TransitarStatusRequestDTO dto, Pessoa currentUser) {
        Documento doc = getDocumentoEntity(tipo, id);
        String statusAnterior = doc.getStatus() != null ? doc.getStatus() : "Minuta";
        String statusNovo = dto.getNovoStatus();

        if ("Aprovado".equalsIgnoreCase(statusAnterior) && !isGestorOrAdmin(currentUser)) {
            throw new IllegalArgumentException("Este documento já foi aprovado. Somente utilizadores com perfil de Gestor podem alterá-lo.");
        }

        if ("Revisado".equalsIgnoreCase(statusNovo)) {
            List<ChecklistRevisaoItem> revItems = revisaoRepository.findByDocumentoTipoAndDocumentoIdOrderByOrdemAsc(tipo, id);
            boolean checklistCompleto = revItems.stream().allMatch(i -> i.getResposta() != null && !i.getResposta().trim().isEmpty());
            if (!checklistCompleto && (dto.getJustificativaExcecao() == null || dto.getJustificativaExcecao().trim().isEmpty())) {
                throw new IllegalArgumentException("É obrigatório preencher todo o Checklist de Revisão ou fornecer uma justificativa para prosseguir.");
            }
        }

        if ("Aprovado".equalsIgnoreCase(statusNovo)) {
            List<ChecklistAprovacaoItem> aprovaItems = aprovacaoRepository.findByDocumentoTipoAndDocumentoIdOrderByOrdemAsc(tipo, id);
            boolean checklistCompleto = aprovaItems.stream().allMatch(i -> i.getResposta() != null && !i.getResposta().trim().isEmpty());
            if (!checklistCompleto && (dto.getJustificativaExcecao() == null || dto.getJustificativaExcecao().trim().isEmpty())) {
                throw new IllegalArgumentException("É obrigatório preencher todo o Checklist de Aprovação ou fornecer uma justificativa para aprovar.");
            }
        }

        doc.setStatus(statusNovo);
        entityManager.merge(doc);

        Pessoa dest = null;
        if (dto.getUsuarioDestinatarioId() != null) {
            dest = userRepository.findById(dto.getUsuarioDestinatarioId()).orElse(null);
        }
        
        Pessoa usuarioLogado = (Pessoa) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        HistoricoStatus hist = HistoricoStatus.builder()
                .documentoId(id)
                .documentoTipo(tipo)
                .statusAnterior(statusAnterior)
                .statusNovo(statusNovo)
                .dataHora(LocalDateTime.now())
                .usuario(currentUser)
                .usuarioDestinatario(dest)
                .justificativaExcecao(dto.getJustificativaExcecao())
                .observacoes(dto.getObservacoes())
                .build();
        historicoRepository.save(hist);

        return getStatus(tipo, id, currentUser);
    }

    @Transactional
    public ChecklistRevisaoItem updateRevisaoItem(Long itemId, String resposta, String observacao, String link) {
        ChecklistRevisaoItem item = revisaoRepository.findById(itemId).orElseThrow(() -> new IllegalArgumentException("Item de revisão não encontrado"));
        item.setResposta(resposta);
        item.setObservacao(observacao);
        item.setLink(link);
        return revisaoRepository.save(item);
    }

    @Transactional
    public ChecklistAprovacaoItem updateAprovacaoItem(Long itemId, String resposta, String observacao, String link) {
        ChecklistAprovacaoItem item = aprovacaoRepository.findById(itemId).orElseThrow(() -> new IllegalArgumentException("Item de aprovação não encontrado"));
        item.setResposta(resposta);
        item.setObservacao(observacao);
        item.setLink(link);
        return aprovacaoRepository.save(item);
    }

    private Documento getDocumentoEntity(String tipo, Long id) {
        Class<?> clazz = resolveClass(tipo);
        Object entity = entityManager.find(clazz, id);
        if (entity == null || !(entity instanceof Documento)) {
            throw new IllegalArgumentException("Documento não encontrado para o tipo " + tipo + " e id " + id);
        }
        return (Documento) entity;
    }

    private Class<?> resolveClass(String tipo) {
        String basePackage = "sisaudin.model.cadastroBasico.";
        try {
            return Class.forName(basePackage + tipo);
        } catch (ClassNotFoundException e) {
            // Tenta mapear nomes comuns no frontend
            switch (tipo.toLowerCase()) {
                case "ordem-servico":
                case "ordemdeservico":
                case "ordemservico":
                    return OrdemServico.class;
                case "comunicacao":
                    return Comunicacao.class;
                case "solicitacao":
                    return Solicitacao.class;
                case "nota--preliminar":
                case "notapreliminar":
                    return NotaPreliminar.class;
                case "nota-final":
                case "notafinal":
                    return NotaFinal.class;
                case "relatorio-preliminar":
                case "relatoriopreliminar":
                    return RelatorioPreliminar.class;
                case "relatorio-final":
                case "relatoriofinal":
                    return RelatorioFinal.class;
                case "plano-acao-preliminar":
                case "planoacaopreliminar":
                    return PlanoAcaoPreliminar.class;
                case "plano-acao-final":
                case "planoacaofinal":
                    return PlanoAcaoFinal.class;
                case "nota-tecnica":
                case "notatecnica":
                    return NotaTecnica.class;
                case "parecer":
                    return Parecer.class;
                case "planejamento":
                    return Planejamento.class;
                case "matriz-achados":
                case "matrizachados":
                    return MatrizAchados.class;
                case "reuniao-busca-conjunta":
                case "reuniaobusca":
                case "reuniaobuscaconjunta":
                    return ReuniaoBuscaConjunta.class;
                case "reuniao":
                    return Reuniao.class;
                case "visita":
                    return Visita.class;
                default:
                    throw new IllegalArgumentException("Tipo de documento desconhecido: " + tipo);
            }
        }
    }

    private boolean isGestorOrAdmin(Pessoa user) {
        if (user == null || user.getRole() == null) return true;
        String role = user.getRole().name().toUpperCase();
        return role.contains("GESTOR") || role.contains("SISTEMA") || role.contains("ADMIN");
    }

    private List<ChecklistRevisaoItem> initChecklistRevisao(String tipo, Long id) {
        List<String> questoes = List.of(
                "O documento atende ao objetivo e escopo propostos para o trabalho de auditoria?",
                "As informações e constatações estão devidamente fundamentadas e claras?",
                "A redação respeita os padrões institucionais e ortográficos de auditoria?"
        );
        List<ChecklistRevisaoItem> saved = new ArrayList<>();
        int i = 1;
        for (String q : questoes) {
            saved.add(revisaoRepository.save(ChecklistRevisaoItem.builder()
                    .documentoId(id)
                    .documentoTipo(tipo)
                    .questao(q)
                    .ordem(i++)
                    .build()));
        }
        return saved;
    }

    private List<ChecklistAprovacaoItem> initChecklistAprovacao(String tipo, Long id) {
        List<String> questoes = List.of(
                "As observações e revisões da equipe foram adequadamente tratadas ou justificadas?",
                "O documento cumpre as exigências normativas e legais aplicáveis à CGU/SFC?",
                "Recomenda-se a aprovação formal do documento no SisAudin?"
        );
        List<ChecklistAprovacaoItem> saved = new ArrayList<>();
        int i = 1;
        for (String q : questoes) {
            saved.add(aprovacaoRepository.save(ChecklistAprovacaoItem.builder()
                    .documentoId(id)
                    .documentoTipo(tipo)
                    .questao(q)
                    .ordem(i++)
                    .build()));
        }
        return saved;
    }
}
