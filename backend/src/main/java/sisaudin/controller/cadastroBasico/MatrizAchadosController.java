package sisaudin.controller.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sisaudin.model.cadastroBasico.MatrizAchados;
import sisaudin.service.cadastroBasico.MatrizAchadosService;
import sisaudin.service.cadastroBasico.RegraDocumentoException;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

@RestController
@RequestMapping({"/api/matriz-achados", "/api/matrizes-achados"})
@CrossOrigin(origins = "*", maxAge = 3600)
public class MatrizAchadosController {

    @Autowired
    private MatrizAchadosService service;

    @GetMapping
    public ResponseEntity<List<MatrizAchados>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/item/{itemTrabalhoId}")
    public ResponseEntity<List<MatrizAchados>> getByItemTrabalho(@PathVariable Long itemTrabalhoId) {
        return ResponseEntity.ok(service.findByItemTrabalhoId(itemTrabalhoId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MatrizAchados> getById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Cria a Matriz do item importando as questões do Planejamento (ou devolve a existente, sincronizada). */
    @PostMapping("/item/{itemTrabalhoId}/importar-planejamento")
    public ResponseEntity<?> importarPlanejamento(@PathVariable Long itemTrabalhoId) {
        return executar(() -> service.importarDoPlanejamento(itemTrabalhoId));
    }

    /** Inclui na Matriz as questões novas do Planejamento e acompanha a ordem dele. */
    @PostMapping("/{id}/sincronizar")
    public ResponseEntity<?> sincronizar(@PathVariable Long id) {
        return executar(() -> service.sincronizarPorId(id));
    }

    /** Ids das questões do Planejamento que já têm fatos na Matriz (não podem ser excluídas). */
    @GetMapping("/planejamento/{planejamentoId}/questoes-com-fatos")
    public ResponseEntity<List<Long>> questoesComFatos(@PathVariable Long planejamentoId) {
        return ResponseEntity.ok(service.questoesPlanejamentoComFatos(planejamentoId));
    }

    /** A Matriz só nasce do Planejamento: a criação usa o item informado e ignora as questões enviadas. */
    @PostMapping
    public ResponseEntity<?> create(@RequestBody MatrizAchados entity) {
        Long itemId = entity.getItemTrabalhoId();
        if (itemId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Informe o item de trabalho da Matriz de Achados."));
        }
        return executar(() -> service.importarDoPlanejamento(itemId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody MatrizAchados entity) {
        return executar(() -> service.atualizar(id, entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private ResponseEntity<?> executar(Supplier<Object> acao) {
        try {
            return ResponseEntity.ok(acao.get());
        } catch (RegraDocumentoException e) {
            return ResponseEntity.status(e.getStatus()).body(Map.of("error", e.getMessage()));
        }
    }
}
