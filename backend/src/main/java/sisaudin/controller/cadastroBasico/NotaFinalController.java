package sisaudin.controller.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sisaudin.model.cadastroBasico.NotaFinal;
import sisaudin.service.cadastroBasico.NotaFinalService;

import java.util.List;

@RestController
@RequestMapping("/api/notas-final")
@CrossOrigin(origins = "*", maxAge = 3600)
public class NotaFinalController {

    @Autowired
    private NotaFinalService service;

    @GetMapping("/item/{itemTrabalhoId}")
    public ResponseEntity<NotaFinal> getRelatorio(@PathVariable Long itemTrabalhoId) {
        NotaFinal nota = service.getOrCreateByItemTrabalhoId(itemTrabalhoId);
        return ResponseEntity.ok(nota);
    }

    @PatchMapping("/item/{itemTrabalhoId}")
    public ResponseEntity<NotaFinal> updateRelatorio(
            @PathVariable Long itemTrabalhoId,
            @RequestBody NotaFinal dto) {
        NotaFinal updated = service.saveOrUpdate(dto, itemTrabalhoId);
        return ResponseEntity.ok(updated);
    }

    @GetMapping
    public ResponseEntity<List<NotaFinal>> getAllRelatorios() {
        return ResponseEntity.ok(service.findAll());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRelatorio(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping
    public ResponseEntity<NotaFinal> createEmptyRelatorio() {
        return ResponseEntity.ok(service.createEmpty());
    }

    @PostMapping("/create-from-preliminar/{itemTrabalhoId}")
    public ResponseEntity<NotaFinal> createFromRelatorioPreliminar(@PathVariable Long itemTrabalhoId) {
        return ResponseEntity.ok(service.createFromRelatorioPreliminar(itemTrabalhoId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NotaFinal> getRelatorioById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<NotaFinal> updateRelatorioById(
            @PathVariable Long id,
            @RequestParam(required = false) Long itemTrabalhoId,
            @RequestBody NotaFinal dto) {
        return ResponseEntity.ok(service.updateById(id, dto, itemTrabalhoId));
    }
}
