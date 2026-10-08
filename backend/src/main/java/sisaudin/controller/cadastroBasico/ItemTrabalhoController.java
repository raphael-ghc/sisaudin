package sisaudin.controller.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import sisaudin.dto.DocumentoStatusDTO;
import sisaudin.dto.TransitarStatusRequestDTO;
import sisaudin.dto.response.cadastroBasico.ItemTrabalhoResponse;
import sisaudin.model.cadastroBasico.ItemTrabalho;
import sisaudin.service.cadastroBasico.ItemTrabalhoService;

@RestController
@RequestMapping("/api/item-trabalho")
public class ItemTrabalhoController {

    @Autowired
    protected ItemTrabalhoService service;

    @GetMapping
    public ResponseEntity<ItemTrabalhoResponse<Page<ItemTrabalho>>> getAllItensTrabalho(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        ItemTrabalhoResponse<Page<ItemTrabalho>> response = service.getAll(page, size);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.NO_CONTENT).body(response);
    }

    // @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<ItemTrabalhoResponse<ItemTrabalho>> getByIdItemTrabalho(@PathVariable Long id){
        ItemTrabalhoResponse<ItemTrabalho> response = service.getById(id);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    // @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ItemTrabalhoResponse<ItemTrabalho>> createItemTrabalho(@RequestBody ItemTrabalho createdObj){
        ItemTrabalhoResponse<ItemTrabalho> response = service.create(createdObj);
        return response.isSuccess()
                ? ResponseEntity.status(HttpStatus.CREATED).body(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    // @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ItemTrabalhoResponse<ItemTrabalho>> putUpdateItemTrabalho(@PathVariable Long id, @RequestBody ItemTrabalho updatedObj){
        ItemTrabalhoResponse<ItemTrabalho> response = service.putUpdate(id, updatedObj);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    // @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}")
    public ResponseEntity<ItemTrabalhoResponse<ItemTrabalho>> patchUpdateItemTrabalho(@PathVariable Long id, @RequestBody ItemTrabalho updatedObj){
        ItemTrabalhoResponse<ItemTrabalho> response = service.patchUpdate(id, updatedObj);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    // @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ItemTrabalhoResponse<ItemTrabalho>> deleteItemTrabalho(@PathVariable Long id) {
        ItemTrabalhoResponse<ItemTrabalho> response = service.delete(id);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @PostMapping("/{id}/transitar")
    public ResponseEntity<DocumentoStatusDTO> transitarStatus(
            @PathVariable Long id,
            @RequestBody TransitarStatusRequestDTO dto,
            Authentication authentication) {
        try {
            return ResponseEntity.ok(service.transitarStatus(id, dto, authentication));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(DocumentoStatusDTO.builder()
                    .documentoTipo("ITEM_TRABALHO")
                    .documentoId(id)
                    .statusAtual("ERRO: " + e.getMessage())
                    .build());
        }
    }

    @GetMapping("/{id}/historico-status")
    public ResponseEntity<DocumentoStatusDTO> getHistoricoStatus(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(service.getHistoricoStatus(id, authentication));
    }
}
