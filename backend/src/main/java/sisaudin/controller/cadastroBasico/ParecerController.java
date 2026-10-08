package sisaudin.controller.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sisaudin.model.cadastroBasico.Parecer;
import sisaudin.service.cadastroBasico.ParecerService;

import java.util.List;

@RestController
@RequestMapping({"/api/pareceres"})
@CrossOrigin(origins = "*", maxAge = 3600)
public class ParecerController {

    @Autowired
    private ParecerService service;

    @GetMapping("/item/{itemTrabalhoId}")
    public ResponseEntity<Parecer> getRelatorio(@PathVariable Long itemTrabalhoId) {
        Parecer parecer = service.getOrCreateByItemTrabalhoId(itemTrabalhoId);
        return ResponseEntity.ok(parecer);
    }

    @PatchMapping("/item/{itemTrabalhoId}")
    public ResponseEntity<Parecer> updateRelatorio(
            @PathVariable Long itemTrabalhoId,
            @RequestBody Parecer dto) {
        Parecer updated = service.saveOrUpdate(dto, itemTrabalhoId);
        return ResponseEntity.ok(updated);
    }

    @GetMapping
    public ResponseEntity<List<Parecer>> getAllRelatorios() {
        return ResponseEntity.ok(service.findAll());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRelatorio(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping
    public ResponseEntity<Parecer> createEmptyRelatorio() {
        return ResponseEntity.ok(service.createEmpty());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Parecer> getRelatorioById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Parecer> updateRelatorioById(
            @PathVariable Long id,
            @RequestParam(required = false) Long itemTrabalhoId,
            @RequestBody Parecer dto) {
        return ResponseEntity.ok(service.updateById(id, dto, itemTrabalhoId));
    }
}
