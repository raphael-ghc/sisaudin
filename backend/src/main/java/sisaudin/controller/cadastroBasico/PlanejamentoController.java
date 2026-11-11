package sisaudin.controller.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sisaudin.model.cadastroBasico.Planejamento;
import sisaudin.service.cadastroBasico.DocumentoNumeroService;
import sisaudin.service.cadastroBasico.PlanejamentoService;
import sisaudin.service.cadastroBasico.RegraDocumentoException;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

@RestController
@RequestMapping({"/api/planejamento", "/api/planejamentos"})
@CrossOrigin(origins = "*", maxAge = 3600)
public class PlanejamentoController {

    @Autowired
    private PlanejamentoService service;

    @Autowired
    private DocumentoNumeroService numeroService;

    @GetMapping
    public ResponseEntity<List<Planejamento>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/item/{itemTrabalhoId}")
    public ResponseEntity<List<Planejamento>> getByItemTrabalho(@PathVariable Long itemTrabalhoId) {
        return ResponseEntity.ok(service.findByItemTrabalhoId(itemTrabalhoId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Planejamento> getById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // A criação reserva o número (próximo da sequência do ano) sem repetir em criações simultâneas.
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Planejamento entity) {
        return executar(() -> numeroService.executarComNumeroReservado(() -> service.save(entity)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Planejamento entity) {
        return service.findById(id).<ResponseEntity<?>>map(existing -> {
            entity.setId(id);
            if (entity.getStatus() == null) entity.setStatus(existing.getStatus());
            if ((entity.getItemTrabalho() == null || entity.getItemTrabalho().getId() == null) && entity.getItemTrabalhoId() == null) {
                entity.setItemTrabalho(existing.getItemTrabalho());
            }
            return executar(() -> service.save(entity));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (RegraDocumentoException e) {
            return ResponseEntity.status(e.getStatus()).body(Map.of("error", e.getMessage()));
        }
    }

    private ResponseEntity<?> executar(Supplier<Object> acao) {
        try {
            return ResponseEntity.ok(acao.get());
        } catch (RegraDocumentoException e) {
            return ResponseEntity.status(e.getStatus()).body(Map.of("error", e.getMessage()));
        }
    }
}
