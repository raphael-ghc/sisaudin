package sisaudin.controller.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import sisaudin.dto.response.cadastroBasico.UnidadeResponse;
import sisaudin.model.cadastroBasico.Unidade;
import sisaudin.service.cadastroBasico.UnidadeService;


@RestController
@RequestMapping("/api/unidade")
public class UnidadeController {

    @Autowired
    protected UnidadeService service;

    //@PreAuthorize("hasRole('ADMIN')")
    //@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @GetMapping
    public ResponseEntity<UnidadeResponse<Page<Unidade>>> getAllUnidades(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        UnidadeResponse<Page<Unidade>> response = service.getAll(page, size);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.NO_CONTENT).body(response);
    }

    // @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<UnidadeResponse<Unidade>> getByIdUnidade(@PathVariable Long id){
        UnidadeResponse<Unidade> response = service.getById(id);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    // @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<UnidadeResponse<Unidade>> createUnidade(@RequestBody Unidade createdUnidade){
        UnidadeResponse<Unidade> response = service.create(createdUnidade);
        return response.isSuccess()
                ? ResponseEntity.status(HttpStatus.CREATED).body(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    // @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<UnidadeResponse<Unidade>> putUpdateUnidade(@PathVariable Long id, @RequestBody Unidade updatedUnidade){
        UnidadeResponse<Unidade> response = service.putUpdate(id, updatedUnidade);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    // @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}")
    public ResponseEntity<UnidadeResponse<Unidade>> patchUpdateUnidade(@PathVariable Long id, @RequestBody Unidade updatedUnidade){
        UnidadeResponse<Unidade> response = service.patchUpdate(id, updatedUnidade);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }


    // @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<UnidadeResponse<Unidade>> deleteUnidade(@PathVariable Long id) {
        UnidadeResponse<Unidade> response = service.delete(id);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
}
