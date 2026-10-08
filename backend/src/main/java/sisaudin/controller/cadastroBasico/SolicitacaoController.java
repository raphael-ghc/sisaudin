package sisaudin.controller.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sisaudin.model.cadastroBasico.Solicitacao;
import sisaudin.service.cadastroBasico.SolicitacaoService;

import java.util.List;

@RestController
@RequestMapping("/api/solicitacoes")
@CrossOrigin(origins = "*", maxAge = 3600)
public class SolicitacaoController {

    @Autowired
    private SolicitacaoService service;

    @GetMapping
    public ResponseEntity<List<Solicitacao>> getAllSolicitacoes() {
        return ResponseEntity.ok(service.findAll());
    }

    @PostMapping
    public ResponseEntity<Solicitacao> createSolicitacao() {
        return ResponseEntity.ok(service.createEmpty());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Solicitacao> getSolicitacaoById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping("/item/{itemTrabalhoId}")
    public ResponseEntity<Solicitacao> getSolicitacaoByItem(@PathVariable Long itemTrabalhoId) {
        return ResponseEntity.ok(service.getOrCreateByItemTrabalhoId(itemTrabalhoId));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Solicitacao> updateSolicitacao(
            @PathVariable Long id,
            @RequestParam(required = false) Long itemTrabalhoId,
            @RequestBody Solicitacao dto) {
        return ResponseEntity.ok(service.updateById(id, dto, itemTrabalhoId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSolicitacao(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
