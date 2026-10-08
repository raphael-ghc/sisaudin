package sisaudin.controller.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sisaudin.model.cadastroBasico.ReuniaoBuscaConjunta;
import sisaudin.service.cadastroBasico.ReuniaoBuscaConjuntaService;
import java.util.List;

@RestController
@RequestMapping({"/api/reuniao-busca-conjunta", "/api/reunioes-busca-conjunta"})
@CrossOrigin(origins = "*", maxAge = 3600)
public class ReuniaoBuscaConjuntaController {

    @Autowired
    private ReuniaoBuscaConjuntaService service;

    @GetMapping
    public ResponseEntity<List<ReuniaoBuscaConjunta>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/item/{itemTrabalhoId}")
    public ResponseEntity<List<ReuniaoBuscaConjunta>> getByItemTrabalho(@PathVariable Long itemTrabalhoId) {
        return ResponseEntity.ok(service.findByItemTrabalho_Id(itemTrabalhoId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReuniaoBuscaConjunta> getById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ReuniaoBuscaConjunta> create(@RequestBody ReuniaoBuscaConjunta entity) {
        return ResponseEntity.ok(service.save(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReuniaoBuscaConjunta> update(@PathVariable Long id, @RequestBody ReuniaoBuscaConjunta entity) {
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
