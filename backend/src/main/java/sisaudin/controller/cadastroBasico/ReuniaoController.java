package sisaudin.controller.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sisaudin.model.cadastroBasico.Reuniao;
import sisaudin.service.cadastroBasico.ReuniaoService;
import java.util.List;

@RestController
@RequestMapping("/api/reunioes")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ReuniaoController {

    @Autowired
    private ReuniaoService reuniaoService;

    @GetMapping
    public ResponseEntity<List<Reuniao>> getAll() {
        return ResponseEntity.ok(reuniaoService.findAll());
    }

    @GetMapping("/item/{itemTrabalhoId}")
    public ResponseEntity<List<Reuniao>> getByItemTrabalho(@PathVariable Long itemTrabalhoId) {
        return ResponseEntity.ok(reuniaoService.findByItemTrabalhoId(itemTrabalhoId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Reuniao> getById(@PathVariable Long id) {
        return reuniaoService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Reuniao> create(@RequestBody Reuniao reuniao) {
        return ResponseEntity.ok(reuniaoService.save(reuniao));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Reuniao> update(@PathVariable Long id, @RequestBody Reuniao reuniao) {
        return reuniaoService.findById(id).map(existing -> {
            reuniao.setId(id);
            if (reuniao.getStatus() == null) reuniao.setStatus(existing.getStatus());
            return ResponseEntity.ok(reuniaoService.save(reuniao));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        reuniaoService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
