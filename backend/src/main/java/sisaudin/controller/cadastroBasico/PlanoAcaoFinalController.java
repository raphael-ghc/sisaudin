package sisaudin.controller.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sisaudin.model.cadastroBasico.PlanoAcaoFinal;
import sisaudin.service.cadastroBasico.PlanoAcaoFinalService;
import java.util.List;

@RestController
@RequestMapping({"/api/plano-acao-final", "/api/planos-acao-final"})
@CrossOrigin(origins = "*", maxAge = 3600)
public class PlanoAcaoFinalController {

    @Autowired
    private PlanoAcaoFinalService service;

    @GetMapping
    public ResponseEntity<List<PlanoAcaoFinal>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/item/{itemTrabalhoId}")
    public ResponseEntity<List<PlanoAcaoFinal>> getByItemTrabalho(@PathVariable Long itemTrabalhoId) {
        return ResponseEntity.ok(service.findByItemTrabalhoId(itemTrabalhoId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlanoAcaoFinal> getById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PlanoAcaoFinal> create(@RequestBody PlanoAcaoFinal entity) {
        return ResponseEntity.ok(service.save(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlanoAcaoFinal> update(@PathVariable Long id, @RequestBody PlanoAcaoFinal entity) {
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
