package sisaudin.controller.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sisaudin.model.cadastroBasico.Comunicacao;
import sisaudin.service.cadastroBasico.ComunicacaoService;

import java.util.List;

@RestController
@RequestMapping("/api/comunicacoes")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ComunicacaoController {

    @Autowired
    private ComunicacaoService service;

    @GetMapping
    public ResponseEntity<List<Comunicacao>> getAllComunicacoes() {
        return ResponseEntity.ok(service.findAll());
    }

    @PostMapping
    public ResponseEntity<Comunicacao> createComunicacao() {
        return ResponseEntity.ok(service.createEmpty());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Comunicacao> getComunicacaoById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping("/item/{itemTrabalhoId}")
    public ResponseEntity<Comunicacao> getComunicacaoByItem(@PathVariable Long itemTrabalhoId) {
        return ResponseEntity.ok(service.getOrCreateByItemTrabalhoId(itemTrabalhoId));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Comunicacao> updateComunicacao(
            @PathVariable Long id,
            @RequestParam(required = false) Long itemTrabalhoId,
            @RequestBody Comunicacao dto) {
        return ResponseEntity.ok(service.updateById(id, dto, itemTrabalhoId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComunicacao(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
