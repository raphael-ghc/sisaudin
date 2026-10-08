package sisaudin.controller.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sisaudin.model.cadastroBasico.NotaTecnica;
import sisaudin.service.cadastroBasico.NotaTecnicaService;

import java.util.List;

@RestController
@RequestMapping({"/api/notas-tecnicas"})
@CrossOrigin(origins = "*", maxAge = 3600)
public class NotaTecnicaController {

    @Autowired
    private NotaTecnicaService service;

    @GetMapping("/item/{itemTrabalhoId}")
    public ResponseEntity<NotaTecnica> getRelatorio(@PathVariable Long itemTrabalhoId) {
        NotaTecnica nota = service.getOrCreateByItemTrabalhoId(itemTrabalhoId);
        return ResponseEntity.ok(nota);
    }

    @PatchMapping("/item/{itemTrabalhoId}")
    public ResponseEntity<NotaTecnica> updateRelatorio(
            @PathVariable Long itemTrabalhoId,
            @RequestBody NotaTecnica dto) {
        NotaTecnica updated = service.saveOrUpdate(dto, itemTrabalhoId);
        return ResponseEntity.ok(updated);
    }

    @GetMapping
    public ResponseEntity<List<NotaTecnica>> getAllRelatorios() {
        return ResponseEntity.ok(service.findAll());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRelatorio(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping
    public ResponseEntity<NotaTecnica> createEmptyRelatorio() {
        return ResponseEntity.ok(service.createEmpty());
    }

    @GetMapping("/{id}")
    public ResponseEntity<NotaTecnica> getRelatorioById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<NotaTecnica> updateRelatorioById(
            @PathVariable Long id,
            @RequestParam(required = false) Long itemTrabalhoId,
            @RequestBody NotaTecnica dto) {
        return ResponseEntity.ok(service.updateById(id, dto, itemTrabalhoId));
    }
}
