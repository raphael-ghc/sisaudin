package sisaudin.controller.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sisaudin.model.cadastroBasico.RelatorioFinal;
import sisaudin.service.cadastroBasico.RelatorioFinalService;

import java.util.List;

@RestController
@RequestMapping("/api/relatorios-final")
@CrossOrigin(origins = "*", maxAge = 3600)
public class RelatorioFinalController {

    @Autowired
    private RelatorioFinalService service;

    @GetMapping("/item/{itemTrabalhoId}")
    public ResponseEntity<RelatorioFinal> getRelatorio(
            @PathVariable Long itemTrabalhoId,
            @RequestParam(required = false) Boolean especial) {
        RelatorioFinal relatorio = service.getOrCreateByItemTrabalhoId(itemTrabalhoId, especial);
        return ResponseEntity.ok(relatorio);
    }

    @PatchMapping("/item/{itemTrabalhoId}")
    public ResponseEntity<RelatorioFinal> updateRelatorio(
            @PathVariable Long itemTrabalhoId,
            @RequestBody RelatorioFinal dto) {
        RelatorioFinal updated = service.saveOrUpdate(dto, itemTrabalhoId);
        return ResponseEntity.ok(updated);
    }

    @GetMapping
    public ResponseEntity<List<RelatorioFinal>> getAllRelatorios() {
        return ResponseEntity.ok(service.findAll());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRelatorio(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping
    public ResponseEntity<RelatorioFinal> createEmptyRelatorio(@RequestParam(required = false) Boolean especial) {
        return ResponseEntity.ok(service.createEmpty(especial));
    }

    @PostMapping("/create-from-preliminar/{itemTrabalhoId}")
    public ResponseEntity<RelatorioFinal> createFromRelatorioPreliminar(
            @PathVariable Long itemTrabalhoId,
            @RequestParam(required = false) Boolean especial) {
        return ResponseEntity.ok(service.createFromRelatorioPreliminar(itemTrabalhoId, especial));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RelatorioFinal> getRelatorioById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<RelatorioFinal> updateRelatorioById(
            @PathVariable Long id,
            @RequestParam(required = false) Long itemTrabalhoId,
            @RequestBody RelatorioFinal dto) {
        return ResponseEntity.ok(service.updateById(id, dto, itemTrabalhoId));
    }
}
