package sisaudin.controller.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import sisaudin.dto.AnexoDocumentoDTO;
import sisaudin.model.cadastroBasico.AnexoDocumento;
import sisaudin.service.cadastroBasico.AnexoDocumentoService;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/anexos")
@CrossOrigin("*")
public class AnexoDocumentoController {

    @Autowired
    private AnexoDocumentoService anexoDocumentoService;

    @PostMapping("/upload")
    public ResponseEntity<AnexoDocumentoDTO> uploadAnexo(
            @RequestParam("file") MultipartFile file,
            @RequestParam("itemTrabalhoId") Long itemTrabalhoId,
            @RequestParam("documento") String documento,
            @RequestParam("secao") String secao,
            @RequestParam(value = "responsavel", required = false) String responsavel) {
        try {
            AnexoDocumentoDTO dto = anexoDocumentoService.upload(file, itemTrabalhoId, documento, secao, responsavel);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/item/{itemTrabalhoId}")
    public ResponseEntity<List<AnexoDocumentoDTO>> getAnexos(
            @PathVariable Long itemTrabalhoId,
            @RequestParam("documento") String documento) {
        return ResponseEntity.ok(anexoDocumentoService.getByItemTrabalhoAndDocumento(itemTrabalhoId, documento));
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadAnexo(@PathVariable Long id) {
        Optional<AnexoDocumento> anexoOpt = anexoDocumentoService.getById(id);
        if (!anexoOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        AnexoDocumento anexo = anexoOpt.get();
        try {
            Path filePath = Paths.get(anexo.getFilePath());
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + anexo.getFileName() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAnexo(@PathVariable Long id) {
        anexoDocumentoService.delete(id);
        return ResponseEntity.ok().build();
    }
}
