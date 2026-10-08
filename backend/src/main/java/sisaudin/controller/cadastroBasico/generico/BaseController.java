package sisaudin.controller.cadastroBasico.generico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import sisaudin.dto.response.BaseResponse;
import sisaudin.model.cadastroBasico.generico.BaseEntity;
import sisaudin.service.cadastroBasico.generico.BaseService;

public abstract class BaseController<T extends BaseEntity> {

    @Autowired
    protected BaseService<T> service;

    //@PreAuthorize("hasRole('ADMIN')")
    //@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @GetMapping
    public ResponseEntity<BaseResponse<Page<T>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        BaseResponse<Page<T>> response = service.findAll(page, size);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.NO_CONTENT).body(response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<T>> getById(@PathVariable Long id){
        BaseResponse<T> response = service.getById(id);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<BaseResponse<T>> create(@RequestBody T createdBase){
        BaseResponse<T> response = service.create(createdBase);
        return response.isSuccess()
                ? ResponseEntity.status(HttpStatus.CREATED).body(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<BaseResponse<T>> putUpdate(@PathVariable Long id, @RequestBody T updatedBase){
        BaseResponse<T> response = service.putUpdate(id, updatedBase);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}")
    public ResponseEntity<BaseResponse<T>> patchUpdate(@PathVariable Long id, @RequestBody T updatedBase){
        BaseResponse<T> response = service.patchUpdate(id, updatedBase);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }


    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<BaseResponse<Void>> delete(@PathVariable Long id) {
        BaseResponse<Void> response = service.delete(id);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
}
