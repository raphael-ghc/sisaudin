package sisaudin.controller.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import sisaudin.dto.response.cadastroBasico.GerenciaHistoricoResponse;
import sisaudin.model.cadastroBasico.GerenciaHistorico;
import sisaudin.service.cadastroBasico.GerenciaHistoricoService;


@RestController
@RequestMapping("/api/gerenciaHistorico")
public class GerenciaHistoricoController {

    @Autowired
    protected GerenciaHistoricoService service;

    //@PreAuthorize("hasRole('ADMIN')")
    //@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @GetMapping
    public ResponseEntity<GerenciaHistoricoResponse<Page<GerenciaHistorico>>> getAllGerenciaHistoricos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        GerenciaHistoricoResponse<Page<GerenciaHistorico>> response = service.getAll(page, size);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.NO_CONTENT).body(response);
    }

    // @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<GerenciaHistoricoResponse<GerenciaHistorico>> getByIdGerenciaHistorico(@PathVariable Long id){
        GerenciaHistoricoResponse<GerenciaHistorico> response = service.getById(id);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    // @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<GerenciaHistoricoResponse<GerenciaHistorico>> createGerenciaHistorico(@RequestBody GerenciaHistorico createdGerenciaHistorico){
        GerenciaHistoricoResponse<GerenciaHistorico> response = service.create(createdGerenciaHistorico);
        return response.isSuccess()
                ? ResponseEntity.status(HttpStatus.CREATED).body(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    // @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<GerenciaHistoricoResponse<GerenciaHistorico>> putUpdateGerenciaHistorico(@PathVariable Long id, @RequestBody GerenciaHistorico updatedGerenciaHistorico){
        GerenciaHistoricoResponse<GerenciaHistorico> response = service.putUpdate(id, updatedGerenciaHistorico);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    // @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}")
    public ResponseEntity<GerenciaHistoricoResponse<GerenciaHistorico>> patchUpdateGerenciaHistorico(@PathVariable Long id, @RequestBody GerenciaHistorico updatedGerenciaHistorico){
        GerenciaHistoricoResponse<GerenciaHistorico> response = service.patchUpdate(id, updatedGerenciaHistorico);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }


    // @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<GerenciaHistoricoResponse<GerenciaHistorico>> deleteGerenciaHistorico(@PathVariable Long id) {
        GerenciaHistoricoResponse<GerenciaHistorico> response = service.delete(id);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
}
