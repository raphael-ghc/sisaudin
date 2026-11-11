package sisaudin.service.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sisaudin.model.cadastroBasico.Gerencia;
import sisaudin.model.cadastroBasico.Planejamento;
import sisaudin.model.cadastroBasico.QuestaoPlanejamento;
import sisaudin.model.cadastroBasico.generico.BaseEntity;
import sisaudin.repository.cadastroBasico.GerenciaRepository;
import sisaudin.repository.cadastroBasico.ItemTrabalhoRepository;
import sisaudin.repository.cadastroBasico.PlanejamentoRepository;
import sisaudin.repository.cadastroBasico.generico.TecnicaAuditoriaRepository;
import sisaudin.repository.cadastroBasico.generico.TipoAuditoriaRepository;
import sisaudin.repository.cadastroBasico.generico.TipoRiscoRepository;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.jpa.repository.JpaRepository;

@Service
public class PlanejamentoService {

    @Autowired
    private DocumentoNumeroService numeroService;

    @Autowired
    private PlanejamentoRepository repository;

    @Autowired
    private ItemTrabalhoRepository itemTrabalhoRepository;

    @Autowired
    private GerenciaRepository gerenciaRepository;

    @Autowired
    private TecnicaAuditoriaRepository tecnicaRepository;

    @Autowired
    private TipoRiscoRepository tipoRiscoRepository;

    @Autowired
    private TipoAuditoriaRepository tipoAuditoriaRepository;

    @Autowired
    private MatrizAchadosService matrizAchadosService;

    @Transactional(readOnly = true)
    public List<Planejamento> findAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Planejamento> findByItemTrabalhoId(Long itemTrabalhoId) {
        return repository.findByItemTrabalhoId(itemTrabalhoId);
    }

    @Transactional(readOnly = true)
    public Optional<Planejamento> findById(Long id) {
        return repository.findById(id);
    }

    /**
     * Grava o Planejamento inteiro (o envio substitui o que está no banco).
     * - Na criação, sem número informado, recebe o próximo da sequência do ano. Na edição, número vazio fica vazio (s/n).
     * - Gerências, tipos de auditoria, técnicas e riscos chegam como objetos com id e são ligados aos cadastros.
     * - A ordem das questões é a do envio.
     * - Questão retirada que já tem fatos na Matriz de Achados: a gravação é recusada (409).
     * - Depois de gravar, a Matriz de Achados do item recebe as questões novas.
     */
    @Transactional
    public Planejamento save(Planejamento entity) {
        boolean novo = entity.getId() == null;

        if (entity.getStatus() == null || entity.getStatus().trim().isEmpty()) {
            entity.setStatus("Minuta");
        }
        if (entity.getDataEmissao() == null) {
            entity.setDataEmissao(LocalDate.now());
        }
        Long itemId = entity.getItemTrabalhoId();
        if (itemId == null && entity.getItemTrabalho() != null && entity.getItemTrabalho().getId() != null) {
            itemId = entity.getItemTrabalho().getId();
        }
        if (itemId != null) {
            itemTrabalhoRepository.findById(itemId).ifPresent(entity::setItemTrabalho);
        } else if (!novo) {
            repository.findById(entity.getId()).ifPresent(existing -> {
                if (existing.getItemTrabalho() != null && entity.getItemTrabalho() == null) {
                    entity.setItemTrabalho(existing.getItemTrabalho());
                }
            });
        }

        if (entity.getAno() == null) {
            entity.setAno(entity.getDataEmissao().getYear());
        }
        if (novo && entity.getNumero() == null) {
            Long itemDoNumero = entity.getItemTrabalho() != null ? entity.getItemTrabalho().getId() : null;
            entity.setNumero(numeroService.getNextAvailableNumber("Planejamento", entity.getAno(), itemDoNumero));
        }

        entity.setGerenciasDestinatarias(resolver(entity.getGerenciasDestinatarias(), Gerencia::getId, gerenciaRepository));
        entity.setTiposAuditoria(resolver(entity.getTiposAuditoria(), BaseEntity::getId, tipoAuditoriaRepository));

        List<QuestaoPlanejamento> questoes = entity.getQuestoes() != null ? entity.getQuestoes() : new ArrayList<>();
        entity.setQuestoes(questoes);
        int ordem = 1;
        for (QuestaoPlanejamento q : questoes) {
            q.setPlanejamento(entity);
            q.setOrdem(ordem++);
            q.setGerencias(resolver(q.getGerencias(), Gerencia::getId, gerenciaRepository));
            q.setTecnicas(resolver(q.getTecnicas(), BaseEntity::getId, tecnicaRepository));
            q.setRiscos(resolver(q.getRiscos(), BaseEntity::getId, tipoRiscoRepository));
        }

        if (!novo) {
            Set<Long> mantidas = questoes.stream().map(QuestaoPlanejamento::getId)
                    .filter(Objects::nonNull).collect(Collectors.toSet());
            Set<Long> removidas = repository.findById(entity.getId())
                    .map(p -> p.getQuestoes().stream().map(QuestaoPlanejamento::getId)
                            .filter(id -> id != null && !mantidas.contains(id)).collect(Collectors.toSet()))
                    .orElseGet(HashSet::new);
            matrizAchadosService.liberarQuestoesDoPlanejamento(removidas);
        }

        Planejamento salvo = repository.save(entity);
        matrizAchadosService.sincronizarComPlanejamento(salvo);
        return salvo;
    }

    /** Exclui o Planejamento. Recusa (409) enquanto houver Matriz de Achados do item. */
    @Transactional
    public void deleteById(Long id) {
        Planejamento planejamento = repository.findById(id).orElse(null);
        if (planejamento == null) return;
        if (matrizAchadosService.existeMatrizDoPlanejamento(planejamento)) {
            throw new RegraDocumentoException(HttpStatus.CONFLICT,
                    "Este Planejamento tem Matriz de Achados. Exclua a Matriz de Achados antes de excluir o Planejamento.");
        }
        repository.deleteById(id);
    }

    /**
     * Troca os objetos recebidos (só o id importa) pelos registros do cadastro, mantendo a ordem
     * e sem repetir. Ids que não existem no cadastro são descartados.
     */
    private <T> List<T> resolver(List<T> recebidos, Function<T, Long> getId, JpaRepository<T, Long> repo) {
        if (recebidos == null || recebidos.isEmpty()) return new ArrayList<>();
        LinkedHashSet<Long> ids = recebidos.stream().filter(Objects::nonNull).map(getId)
                .filter(Objects::nonNull).collect(Collectors.toCollection(LinkedHashSet::new));
        if (ids.isEmpty()) return new ArrayList<>();
        Map<Long, T> encontrados = repo.findAllById(ids).stream()
                .collect(Collectors.toMap(getId, Function.identity()));
        return ids.stream().map(encontrados::get).filter(Objects::nonNull)
                .collect(Collectors.toCollection(ArrayList::new));
    }
}
