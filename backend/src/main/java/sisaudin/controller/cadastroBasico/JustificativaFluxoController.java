package sisaudin.controller.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sisaudin.model.cadastroBasico.JustificativaFluxo;
import sisaudin.service.cadastroBasico.JustificativaFluxoService;
import java.util.List;

@RestController
@RequestMapping("/api/justificativas-fluxo")
@CrossOrigin(origins = "*", maxAge = 3600)
public class JustificativaFluxoController {

    @Autowired
    private JustificativaFluxoService service;

    @GetMapping("/item/{itemTrabalhoId}")
    public ResponseEntity<List<JustificativaFluxo>> getByItemTrabalho(@PathVariable Long itemTrabalhoId) {
        return ResponseEntity.ok(service.findByItemTrabalho(itemTrabalhoId));
    }

    @PostMapping
    public ResponseEntity<JustificativaFluxo> create(@RequestBody JustificativaFluxo justificativa) {
        return ResponseEntity.ok(service.save(justificativa));
    }
}
