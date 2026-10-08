package sisaudin.controller.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sisaudin.model.cadastroBasico.OrdemServico;
import sisaudin.service.cadastroBasico.OrdemServicoService;

import java.util.List;

@RestController
@RequestMapping("/api/ordens-servico")
@CrossOrigin(origins = "*", maxAge = 3600)
public class OrdemServicoController {

    @Autowired
    private OrdemServicoService service;

    @GetMapping
    public ResponseEntity<List<OrdemServico>> getAllOrdensServico() {
        return ResponseEntity.ok(service.findAll());
    }

    @PostMapping
    public ResponseEntity<OrdemServico> createOrdemServico() {
        return ResponseEntity.ok(service.createEmpty());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrdemServico> getOrdemServicoById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping("/item/{itemTrabalhoId}")
    public ResponseEntity<OrdemServico> getOrdemServicoByItem(@PathVariable Long itemTrabalhoId) {
        return ResponseEntity.ok(service.getOrCreateByItemTrabalhoId(itemTrabalhoId));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<OrdemServico> updateOrdemServico(
            @PathVariable Long id,
            @RequestParam(required = false) Long itemTrabalhoId,
            @RequestBody OrdemServico dto) {
        return ResponseEntity.ok(service.updateById(id, dto, itemTrabalhoId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrdemServico(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
