package sisaudin.controller.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sisaudin.model.cadastroBasico.NotaPreliminar;
import sisaudin.service.cadastroBasico.NotaPreliminarService;

import java.util.List;

@RestController
@RequestMapping({"/api/notas-preliminar"})
@CrossOrigin(origins = "*", maxAge = 3600)
public class NotaPreliminarController {

    @Autowired
    private NotaPreliminarService service;

    @GetMapping("/item/{itemTrabalhoId}")
    public ResponseEntity<NotaPreliminar> getRelatorio(@PathVariable Long itemTrabalhoId) {
        NotaPreliminar nota = service.getOrCreateByItemTrabalhoId(itemTrabalhoId);
        return ResponseEntity.ok(nota);
    }

    @PatchMapping("/item/{itemTrabalhoId}")
    public ResponseEntity<NotaPreliminar> updateRelatorio(
            @PathVariable Long itemTrabalhoId,
            @RequestBody NotaPreliminar dto) {
        NotaPreliminar updated = service.saveOrUpdate(dto, itemTrabalhoId);
        return ResponseEntity.ok(updated);
    }

    @GetMapping
    public ResponseEntity<List<NotaPreliminar>> getAllRelatorios() {
        return ResponseEntity.ok(service.findAll());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRelatorio(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping
    public ResponseEntity<NotaPreliminar> createEmptyRelatorio() {
        return ResponseEntity.ok(service.createEmpty());
    }

    @GetMapping("/{id}")
    public ResponseEntity<NotaPreliminar> getRelatorioById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<NotaPreliminar> updateRelatorioById(
            @PathVariable Long id,
            @RequestParam(required = false) Long itemTrabalhoId,
            @RequestBody NotaPreliminar dto) {
        return ResponseEntity.ok(service.updateById(id, dto, itemTrabalhoId));
    }
}
