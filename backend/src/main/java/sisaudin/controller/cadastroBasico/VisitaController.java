package sisaudin.controller.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sisaudin.model.cadastroBasico.Visita;
import sisaudin.service.cadastroBasico.VisitaService;
import java.util.List;

@RestController
@RequestMapping("/api/visitas")
@CrossOrigin(origins = "*", maxAge = 3600)
public class VisitaController {

    @Autowired
    private VisitaService visitaService;

    @GetMapping
    public ResponseEntity<List<Visita>> getAll() {
        return ResponseEntity.ok(visitaService.findAll());
    }

    @GetMapping("/item/{itemTrabalhoId}")
    public ResponseEntity<List<Visita>> getByItemTrabalho(@PathVariable Long itemTrabalhoId) {
        return ResponseEntity.ok(visitaService.findByItemTrabalhoId(itemTrabalhoId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Visita> getById(@PathVariable Long id) {
        return visitaService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Visita> create(@RequestBody Visita visita) {
        return ResponseEntity.ok(visitaService.save(visita));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Visita> update(@PathVariable Long id, @RequestBody Visita visita) {
        return visitaService.findById(id).map(existing -> {
            visita.setId(id);
            if (visita.getStatus() == null) visita.setStatus(existing.getStatus());
            return ResponseEntity.ok(visitaService.save(visita));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        visitaService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
