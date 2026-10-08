package sisaudin.controller.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import sisaudin.dto.DocumentoStatusDTO;
import sisaudin.dto.TransitarStatusRequestDTO;
import sisaudin.model.cadastroBasico.ChecklistAprovacaoItem;
import sisaudin.model.cadastroBasico.ChecklistRevisaoItem;
import sisaudin.model.cadastroBasico.Pessoa;
import sisaudin.repository.cadastroBasico.PessoaRepository;
import sisaudin.service.cadastroBasico.DocumentoStatusService;

import java.util.Map;

@RestController
@RequestMapping("/api/documentos-status")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DocumentoStatusController {

    @Autowired
    private DocumentoStatusService service;

    @Autowired
    private PessoaRepository userRepository;

    @GetMapping("/{tipo}/{id}")
    public ResponseEntity<DocumentoStatusDTO> getStatus(
            @PathVariable String tipo,
            @PathVariable Long id,
            Authentication authentication) {
        Pessoa user = getUser(authentication);
        return ResponseEntity.ok(service.getStatus(tipo, id, user));
    }

    @PostMapping("/{tipo}/{id}/transitar")
    public ResponseEntity<DocumentoStatusDTO> transitarStatus(
            @PathVariable String tipo,
            @PathVariable Long id,
            @RequestBody TransitarStatusRequestDTO dto,
            Authentication authentication) {
        Pessoa user = getUser(authentication);
        try {
            return ResponseEntity.ok(service.transitarStatus(tipo, id, dto, user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(DocumentoStatusDTO.builder()
                    .documentoTipo(tipo)
                    .documentoId(id)
                    .statusAtual("ERRO: " + e.getMessage())
                    .build());
        }
    }

    @PutMapping("/{tipo}/{id}/checklist/revisao/{itemId}")
    public ResponseEntity<ChecklistRevisaoItem> updateRevisaoItem(
            @PathVariable Long itemId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.updateRevisaoItem(
                itemId,
                body.get("resposta"),
                body.get("observacao"),
                body.get("link")
        ));
    }

    @PutMapping("/{tipo}/{id}/checklist/aprovacao/{itemId}")
    public ResponseEntity<ChecklistAprovacaoItem> updateAprovacaoItem(
            @PathVariable Long itemId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.updateAprovacaoItem(
                itemId,
                body.get("resposta"),
                body.get("observacao"),
                body.get("link")
        ));
    }

    private Pessoa getUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return userRepository.findByEmail("admin@ghc.com.br"); // adjust if needed
        }
        Pessoa user = userRepository.findByEmail(authentication.getName());
        return user != null ? user : userRepository.findByEmail("admin@ghc.com.br");
    }
}
