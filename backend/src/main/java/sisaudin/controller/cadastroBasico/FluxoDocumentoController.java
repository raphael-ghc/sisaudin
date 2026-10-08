package sisaudin.controller.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sisaudin.dto.DocumentoCriadoDTO;
import sisaudin.dto.FluxoDocumentoStatusDTO;
import sisaudin.service.cadastroBasico.FluxoDocumentoService;

import java.util.List;

@RestController
@RequestMapping("/api/fluxo-documentos")
@CrossOrigin(origins = "*", maxAge = 3600)
public class FluxoDocumentoController {

    @Autowired
    private FluxoDocumentoService service;

    @GetMapping("/item/{itemTrabalhoId}")
    public ResponseEntity<FluxoDocumentoStatusDTO> getStatusFluxo(@PathVariable Long itemTrabalhoId) {
        return ResponseEntity.ok(service.getStatusFluxo(itemTrabalhoId));
    }

    @GetMapping("/item/{itemTrabalhoId}/criados")
    public ResponseEntity<List<DocumentoCriadoDTO>> getDocumentosCriados(@PathVariable Long itemTrabalhoId) {
        return ResponseEntity.ok(service.getDocumentosCriados(itemTrabalhoId));
    }
}

