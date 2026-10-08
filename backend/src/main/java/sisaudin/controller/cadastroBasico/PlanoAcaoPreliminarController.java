package sisaudin.controller.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sisaudin.model.cadastroBasico.PlanoAcaoPreliminar;
import sisaudin.service.cadastroBasico.PlanoAcaoPreliminarService;
import java.util.List;

@RestController
@RequestMapping({"/api/plano-acao-preliminar", "/api/planos-acao-preliminar"})
@CrossOrigin(origins = "*", maxAge = 3600)
public class PlanoAcaoPreliminarController {

    @Autowired
    private PlanoAcaoPreliminarService service;

    @GetMapping
    public ResponseEntity<List<PlanoAcaoPreliminar>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/item/{itemTrabalhoId}")
    public ResponseEntity<List<PlanoAcaoPreliminar>> getByItemTrabalho(@PathVariable Long itemTrabalhoId) {
        return ResponseEntity.ok(service.findByItemTrabalhoId(itemTrabalhoId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlanoAcaoPreliminar> getById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PlanoAcaoPreliminar> create(@RequestBody PlanoAcaoPreliminar entity) {
        return ResponseEntity.ok(service.save(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlanoAcaoPreliminar> update(@PathVariable Long id, @RequestBody PlanoAcaoPreliminar entity) {
        return service.findById(id).map(existing -> {
            entity.setId(id);
            if (entity.getStatus() == null) entity.setStatus(existing.getStatus());
            return ResponseEntity.ok(service.save(entity));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
