package sisaudin.controller.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import sisaudin.dto.response.cadastroBasico.PessoaResponse;
import sisaudin.model.cadastroBasico.Pessoa;
import sisaudin.service.cadastroBasico.PessoaService;
import org.springframework.security.core.context.SecurityContextHolder;


@RestController
@RequestMapping("/api/pessoa")
public class PessoaController {

    @Autowired
    protected PessoaService service;

    //@PreAuthorize("hasRole('ADMIN')")
    //@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @GetMapping
    public ResponseEntity<PessoaResponse<Page<Pessoa>>> getAllPessoas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PessoaResponse<Page<Pessoa>> response = service.getAll(page, size);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.NO_CONTENT).body(response);
    }

    // @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<PessoaResponse<Pessoa>> getByIdPessoa(@PathVariable Long id){
        PessoaResponse<Pessoa> response = service.getById(id);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    // @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<PessoaResponse<Pessoa>> createPessoa(@RequestBody Pessoa createdPessoa){
        PessoaResponse<Pessoa> response = service.create(createdPessoa);
        return response.isSuccess()
                ? ResponseEntity.status(HttpStatus.CREATED).body(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    // @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<PessoaResponse<Pessoa>> putUpdatePessoa(@PathVariable Long id, @RequestBody Pessoa updatedPessoa){
        PessoaResponse<Pessoa> response = service.putUpdate(id, updatedPessoa);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    // @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}")
    public ResponseEntity<PessoaResponse<Pessoa>> patchUpdatePessoa(@PathVariable Long id, @RequestBody Pessoa updatedPessoa){
        PessoaResponse<Pessoa> response = service.patchUpdate(id, updatedPessoa);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }


    // @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<PessoaResponse<Pessoa>> deletePessoa(@PathVariable Long id) {
        PessoaResponse<Pessoa> response = service.delete(id);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @GetMapping("/profile")
    public ResponseEntity<PessoaResponse<Pessoa>> getProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        PessoaResponse<Pessoa> response = service.getByEmail(email);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }
}
