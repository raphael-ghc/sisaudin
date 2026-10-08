package sisaudin.controller.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sisaudin.model.cadastroBasico.RelatorioPreliminar;
import sisaudin.service.cadastroBasico.RelatorioPreliminarService;

import java.util.List;

@RestController
@RequestMapping({"/api/relatorios-preliminar"})
@CrossOrigin(origins = "*", maxAge = 3600)
public class RelatorioPreliminarController {

    @Autowired
    private RelatorioPreliminarService service;

    @GetMapping("/item/{itemTrabalhoId}")
    public ResponseEntity<RelatorioPreliminar> getRelatorio(
            @PathVariable Long itemTrabalhoId,
            @RequestParam(required = false) Boolean especial) {
        RelatorioPreliminar relatorio = service.getOrCreateByItemTrabalhoId(itemTrabalhoId, especial);
        return ResponseEntity.ok(relatorio);
    }

    @PatchMapping("/item/{itemTrabalhoId}")
    public ResponseEntity<RelatorioPreliminar> updateRelatorio(
            @PathVariable Long itemTrabalhoId,
            @RequestBody RelatorioPreliminar dto) {
        RelatorioPreliminar updated = service.saveOrUpdate(dto, itemTrabalhoId);
        return ResponseEntity.ok(updated);
    }

    @GetMapping
    public ResponseEntity<List<RelatorioPreliminar>> getAllRelatorios() {
        return ResponseEntity.ok(service.findAll());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRelatorio(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping
    public ResponseEntity<RelatorioPreliminar> createEmptyRelatorio(@RequestParam(required = false) Boolean especial) {
        return ResponseEntity.ok(service.createEmpty(especial));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RelatorioPreliminar> getRelatorioById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<RelatorioPreliminar> updateRelatorioById(
            @PathVariable Long id,
            @RequestParam(required = false) Long itemTrabalhoId,
            @RequestBody RelatorioPreliminar dto) {
        return ResponseEntity.ok(service.updateById(id, dto, itemTrabalhoId));
    }
}
