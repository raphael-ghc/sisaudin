package sisaudin.controller.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sisaudin.model.cadastroBasico.Planejamento;
import sisaudin.service.cadastroBasico.PlanejamentoService;
import java.util.List;

@RestController
@RequestMapping({"/api/planejamento", "/api/planejamentos"})
@CrossOrigin(origins = "*", maxAge = 3600)
public class PlanejamentoController {

    @Autowired
    private PlanejamentoService service;

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

    @PostMapping
    public ResponseEntity<Planejamento> create(@RequestBody Planejamento entity) {
        return ResponseEntity.ok(service.save(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Planejamento> update(@PathVariable Long id, @RequestBody Planejamento entity) {
        return service.findById(id).map(existing -> {
            entity.setId(id);
            if (entity.getStatus() == null) entity.setStatus(existing.getStatus());
            if ((entity.getItemTrabalho() == null || entity.getItemTrabalho().getId() == null) && entity.getItemTrabalhoId() == null) {
                entity.setItemTrabalho(existing.getItemTrabalho());
            }
            return ResponseEntity.ok(service.save(entity));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
