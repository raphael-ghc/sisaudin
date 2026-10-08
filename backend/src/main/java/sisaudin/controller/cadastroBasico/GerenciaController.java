package sisaudin.controller.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import sisaudin.dto.response.cadastroBasico.GerenciaResponse;
import sisaudin.model.cadastroBasico.Gerencia;
import sisaudin.service.cadastroBasico.GerenciaService;


@RestController
@RequestMapping("/api/gerencia")
public class GerenciaController {

    @Autowired
    protected GerenciaService service;

    //@PreAuthorize("hasRole('ADMIN')")
    //@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @GetMapping
    public ResponseEntity<GerenciaResponse<Page<Gerencia>>> getAllGerencias(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        GerenciaResponse<Page<Gerencia>> response = service.getAll(page, size);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.NO_CONTENT).body(response);
    }

    // @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<GerenciaResponse<Gerencia>> getByIdGerencia(@PathVariable Long id){
        GerenciaResponse<Gerencia> response = service.getById(id);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    // @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<GerenciaResponse<Gerencia>> createGerencia(@RequestBody Gerencia createdGerencia){
        GerenciaResponse<Gerencia> response = service.create(createdGerencia);
        return response.isSuccess()
                ? ResponseEntity.status(HttpStatus.CREATED).body(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    // @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<GerenciaResponse<Gerencia>> putUpdateGerencia(@PathVariable Long id, @RequestBody Gerencia updatedGerencia){
        GerenciaResponse<Gerencia> response = service.putUpdate(id, updatedGerencia);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    // @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}")
    public ResponseEntity<GerenciaResponse<Gerencia>> patchUpdateGerencia(@PathVariable Long id, @RequestBody Gerencia updatedGerencia){
        GerenciaResponse<Gerencia> response = service.patchUpdate(id, updatedGerencia);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }


    // @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<GerenciaResponse<Gerencia>> deleteGerencia(@PathVariable Long id) {
        GerenciaResponse<Gerencia> response = service.delete(id);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
}
