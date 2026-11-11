package sisaudin.service.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sisaudin.model.cadastroBasico.FatoMatrizAchados;
import sisaudin.model.cadastroBasico.ItemTrabalho;
import sisaudin.model.cadastroBasico.MatrizAchados;
import sisaudin.model.cadastroBasico.Planejamento;
import sisaudin.model.cadastroBasico.QuestaoMatrizAchados;
import sisaudin.model.cadastroBasico.QuestaoPlanejamento;
import sisaudin.repository.cadastroBasico.ItemTrabalhoRepository;
import sisaudin.repository.cadastroBasico.MatrizAchadosRepository;
import sisaudin.repository.cadastroBasico.PlanejamentoRepository;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.IdentityHashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Matriz de Achados: as questões vêm do Planejamento do mesmo item e só recebem fatos e evidências.
 *
 * - A Matriz é criada pela importação do Planejamento (importarDoPlanejamento); sem Planejamento não há Matriz.
 * - Cada questão da Matriz aponta para uma questão do Planejamento e mostra os dados dela (não há cópia).
 * - Ao salvar o Planejamento, a Matriz é sincronizada: questões novas entram, a ordem acompanha o Planejamento.
 * - Questão com fatos na Matriz não pode ser excluída do Planejamento (liberarQuestoesDoPlanejamento).
 * - A tela da Matriz não inclui nem exclui questões; ao salvar, só os fatos de cada questão mudam.
 */
@Service
public class MatrizAchadosService {

    @Autowired
    private MatrizAchadosRepository repository;

    @Autowired
    private ItemTrabalhoRepository itemTrabalhoRepository;

    @Autowired
    private PlanejamentoRepository planejamentoRepository;

    @Transactional(readOnly = true)
    public List<MatrizAchados> findAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public List<MatrizAchados> findByItemTrabalhoId(Long itemTrabalhoId) {
        return repository.findByItemTrabalhoId(itemTrabalhoId);
    }

    @Transactional(readOnly = true)
    public Optional<MatrizAchados> findById(Long id) {
        return repository.findById(id);
    }

    /** Cria a Matriz do item com as questões do Planejamento, ou devolve a já existente, sincronizada. */
    @Transactional
    public MatrizAchados importarDoPlanejamento(Long itemTrabalhoId) {
        ItemTrabalho item = itemTrabalhoRepository.findById(itemTrabalhoId)
                .orElseThrow(() -> new RegraDocumentoException(HttpStatus.NOT_FOUND, "Item de trabalho não encontrado."));
        Planejamento planejamento = planejamentoDoItem(itemTrabalhoId)
                .orElseThrow(() -> new RegraDocumentoException(HttpStatus.BAD_REQUEST,
                        "O item de trabalho não tem Planejamento. Crie o Planejamento antes da Matriz de Achados."));

        MatrizAchados matriz = repository.findByItemTrabalhoId(itemTrabalhoId).stream().findFirst().orElse(null);
        if (matriz == null) {
            matriz = new MatrizAchados();
            matriz.setItemTrabalho(item);
            matriz.setStatus("Minuta");
            matriz.setDataEmissao(LocalDate.now());
            matriz.setNome("Matriz de Achados de Auditoria");
        }
        sincronizar(matriz, planejamento);
        return repository.save(matriz);
    }

    /** Traz para a Matriz as questões incluídas no Planejamento e a ordem atual dele. */
    @Transactional
    public MatrizAchados sincronizarPorId(Long id) {
        MatrizAchados matriz = repository.findById(id)
                .orElseThrow(() -> new RegraDocumentoException(HttpStatus.NOT_FOUND, "Matriz de Achados não encontrada."));
        Planejamento planejamento = planejamentoDaMatriz(matriz)
                .orElseThrow(() -> new RegraDocumentoException(HttpStatus.BAD_REQUEST,
                        "O item de trabalho desta Matriz não tem Planejamento."));
        sincronizar(matriz, planejamento);
        return repository.save(matriz);
    }

    /** Chamado pelo PlanejamentoService depois de salvar: atualiza a(s) Matriz(es) que usam este Planejamento. */
    @Transactional
    public void sincronizarComPlanejamento(Planejamento planejamento) {
        Map<Long, MatrizAchados> alvo = new LinkedHashMap<>();
        repository.findByPlanejamentoId(planejamento.getId()).forEach(m -> alvo.put(m.getId(), m));
        if (planejamento.getItemTrabalho() != null && planejamento.getItemTrabalho().getId() != null) {
            repository.findByItemTrabalhoId(planejamento.getItemTrabalho().getId()).forEach(m -> alvo.putIfAbsent(m.getId(), m));
        }
        for (MatrizAchados matriz : alvo.values()) {
            sincronizar(matriz, planejamento);
            repository.save(matriz);
        }
    }

    /**
     * Antes de o Planejamento apagar questões: recusa se alguma já tem fatos na Matriz;
     * senão, retira da Matriz as questões ligadas a elas.
     */
    @Transactional
    public void liberarQuestoesDoPlanejamento(Collection<Long> idsQuestoesPlanejamento) {
        if (idsQuestoesPlanejamento == null || idsQuestoesPlanejamento.isEmpty()) return;
        List<QuestaoMatrizAchados> ligadas = repository.findQuestoesPorQuestaoPlanejamento(idsQuestoesPlanejamento);

        List<QuestaoMatrizAchados> comFatos = ligadas.stream()
                .filter(q -> q.getFatos() != null && !q.getFatos().isEmpty())
                .collect(Collectors.toList());
        if (!comFatos.isEmpty()) {
            String numeros = comFatos.stream()
                    .map(q -> q.getOrdem() != null ? String.valueOf(q.getOrdem()) : "?")
                    .collect(Collectors.joining(", "));
            throw new RegraDocumentoException(HttpStatus.CONFLICT, (comFatos.size() == 1
                    ? "A questão nº " + numeros + " já tem fatos na Matriz de Achados"
                    : "As questões nº " + numeros + " já têm fatos na Matriz de Achados")
                    + " e não pode(m) ser excluída(s) do Planejamento.");
        }
        for (QuestaoMatrizAchados q : ligadas) {
            q.getMatrizAchados().getQuestoes().remove(q);
        }
    }

    /** Ids das questões do Planejamento que já têm fatos na Matriz (a tela do Planejamento bloqueia a exclusão delas). */
    @Transactional(readOnly = true)
    public List<Long> questoesPlanejamentoComFatos(Long planejamentoId) {
        Planejamento planejamento = planejamentoRepository.findById(planejamentoId).orElse(null);
        if (planejamento == null) return Collections.emptyList();
        List<Long> ids = planejamento.getQuestoes().stream()
                .map(QuestaoPlanejamento::getId).filter(java.util.Objects::nonNull).collect(Collectors.toList());
        if (ids.isEmpty()) return Collections.emptyList();
        return repository.findQuestoesPorQuestaoPlanejamento(ids).stream()
                .filter(q -> q.getFatos() != null && !q.getFatos().isEmpty())
                .map(q -> q.getQuestaoPlanejamento().getId())
                .distinct()
                .collect(Collectors.toList());
    }

    /** Existe Matriz usando este Planejamento? (o Planejamento não pode ser excluído enquanto existir) */
    @Transactional(readOnly = true)
    public boolean existeMatrizDoPlanejamento(Planejamento planejamento) {
        if (!repository.findByPlanejamentoId(planejamento.getId()).isEmpty()) return true;
        return planejamento.getItemTrabalho() != null
                && !repository.findByItemTrabalhoId(planejamento.getItemTrabalho().getId()).isEmpty();
    }

    /**
     * Grava os dados do cabeçalho e os fatos de cada questão. Não inclui nem exclui questões:
     * as que não vierem no envio ficam como estão, e as desconhecidas são ignoradas.
     */
    @Transactional
    public MatrizAchados atualizar(Long id, MatrizAchados dados) {
        MatrizAchados matriz = repository.findById(id)
                .orElseThrow(() -> new RegraDocumentoException(HttpStatus.NOT_FOUND, "Matriz de Achados não encontrada."));

        if (dados.getNome() != null) matriz.setNome(dados.getNome());
        if (dados.getDescricao() != null) matriz.setDescricao(dados.getDescricao());
        if (dados.getConteudo() != null) matriz.setConteudo(dados.getConteudo());
        if (dados.getDataEmissao() != null) matriz.setDataEmissao(dados.getDataEmissao());
        if (dados.getStatus() != null && !dados.getStatus().isBlank()) matriz.setStatus(dados.getStatus());
        if (dados.getAno() != null) matriz.setAno(dados.getAno());
        if (dados.getNumero() != null) matriz.setNumero(dados.getNumero());
        if (dados.getDataInicial() != null) matriz.setDataInicial(dados.getDataInicial());
        if (dados.getDataFinal() != null) matriz.setDataFinal(dados.getDataFinal());

        Map<Long, QuestaoMatrizAchados> existentes = new HashMap<>();
        for (QuestaoMatrizAchados q : matriz.getQuestoes()) {
            if (q.getId() != null) existentes.put(q.getId(), q);
        }
        if (dados.getQuestoes() != null) {
            for (QuestaoMatrizAchados enviada : dados.getQuestoes()) {
                if (enviada == null || enviada.getId() == null) continue;
                QuestaoMatrizAchados questao = existentes.get(enviada.getId());
                if (questao != null) {
                    atualizarFatos(questao, enviada.getFatos());
                }
            }
        }
        return repository.save(matriz);
    }

    @Transactional
    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    // ---------------------------------------------------------------------------------------------

    /** Rótulo do Planejamento mostrado na Matriz: "Planejamento nº 03/2026" ou "Planejamento s/n". */
    public static String rotuloPlanejamento(Planejamento p) {
        if (p == null) return null;
        if (p.getNumero() == null) return "Planejamento s/n";
        String numero = String.format("%02d", p.getNumero());
        return p.getAno() != null ? "Planejamento nº " + numero + "/" + p.getAno() : "Planejamento nº " + numero;
    }

    private Optional<Planejamento> planejamentoDoItem(Long itemTrabalhoId) {
        return planejamentoRepository.findByItemTrabalhoId(itemTrabalhoId).stream()
                .min(Comparator.comparing(Planejamento::getId));
    }

    private Optional<Planejamento> planejamentoDaMatriz(MatrizAchados matriz) {
        if (matriz.getPlanejamentoId() != null) {
            Optional<Planejamento> p = planejamentoRepository.findById(matriz.getPlanejamentoId());
            if (p.isPresent()) return p;
        }
        if (matriz.getItemTrabalho() != null && matriz.getItemTrabalho().getId() != null) {
            return planejamentoDoItem(matriz.getItemTrabalho().getId());
        }
        return Optional.empty();
    }

    /**
     * Inclui na Matriz as questões do Planejamento que ainda não estão nela e põe todas na ordem do Planejamento.
     * Questões da Matriz sem ligação (versão anterior) ficam no fim, na ordem em que estavam.
     */
    void sincronizar(MatrizAchados matriz, Planejamento planejamento) {
        matriz.setPlanejamentoId(planejamento.getId());
        matriz.setPlanejamentoNumeroAno(rotuloPlanejamento(planejamento));
        matriz.setPlanejamentoNome(planejamento.getNome());
        if (matriz.getItemTrabalho() == null && planejamento.getItemTrabalho() != null) {
            matriz.setItemTrabalho(planejamento.getItemTrabalho());
        }

        List<QuestaoMatrizAchados> atuais = matriz.getQuestoes();
        Map<Long, QuestaoMatrizAchados> porQuestaoPlanejamento = new HashMap<>();
        for (QuestaoMatrizAchados q : atuais) {
            if (q.getQuestaoPlanejamento() != null && q.getQuestaoPlanejamento().getId() != null) {
                porQuestaoPlanejamento.putIfAbsent(q.getQuestaoPlanejamento().getId(), q);
            }
        }

        Set<QuestaoMatrizAchados> posicionadas = Collections.newSetFromMap(new IdentityHashMap<>());
        int ordem = 1;
        for (QuestaoPlanejamento qp : planejamento.getQuestoes()) {
            if (qp.getId() == null) continue;
            QuestaoMatrizAchados qm = porQuestaoPlanejamento.get(qp.getId());
            if (qm == null) {
                qm = QuestaoMatrizAchados.builder()
                        .matrizAchados(matriz)
                        .questaoPlanejamento(qp)
                        .build();
                atuais.add(qm);
            }
            qm.setOrdem(ordem++);
            posicionadas.add(qm);
        }
        List<QuestaoMatrizAchados> restantes = new ArrayList<>();
        for (QuestaoMatrizAchados q : atuais) {
            if (!posicionadas.contains(q)) restantes.add(q);
        }
        restantes.sort(Comparator.comparing((QuestaoMatrizAchados q) -> q.getOrdem() == null ? Integer.MAX_VALUE : q.getOrdem())
                .thenComparing(q -> q.getId() == null ? Long.MAX_VALUE : q.getId()));
        for (QuestaoMatrizAchados q : restantes) {
            q.setOrdem(ordem++);
        }
        atuais.sort(Comparator.comparing(QuestaoMatrizAchados::getOrdem));
    }

    private void atualizarFatos(QuestaoMatrizAchados questao, List<FatoMatrizAchados> enviados) {
        Map<Long, FatoMatrizAchados> atuais = new HashMap<>();
        for (FatoMatrizAchados f : questao.getFatos()) {
            if (f.getId() != null) atuais.put(f.getId(), f);
        }
        List<FatoMatrizAchados> resultado = new ArrayList<>();
        int ordem = 1;
        for (FatoMatrizAchados enviado : enviados == null ? List.<FatoMatrizAchados>of() : enviados) {
            if (enviado == null) continue;
            FatoMatrizAchados fato = enviado.getId() != null ? atuais.remove(enviado.getId()) : null;
            if (fato == null) {
                fato = new FatoMatrizAchados();
                fato.setQuestao(questao);
            }
            fato.setFato(enviado.getFato());
            fato.setEvidencia(enviado.getEvidencia());
            fato.setOrdem(ordem++);
            resultado.add(fato);
        }
        // Os que não vieram são removidos (orphanRemoval).
        questao.getFatos().clear();
        questao.getFatos().addAll(resultado);
    }
}
