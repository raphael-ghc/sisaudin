package sisaudin.controller.cadastroBasico;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import sisaudin.service.cadastroBasico.DocumentoNumeroService;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/documentos")
public class DocumentoNumeroController {

    @Autowired
    private DocumentoNumeroService numeroService;

    @GetMapping("/next-number")
    public ResponseEntity<Map<String, Integer>> getNextNumber(
            @RequestParam String entityName, 
            @RequestParam Integer ano, 
            @RequestParam(required = false) Long itemTrabalhoId,
            @RequestParam(required = false) Boolean especial) {

        Integer nextNumber = numeroService.getNextAvailableNumber(entityName, ano, itemTrabalhoId, especial);
        
        Map<String, Integer> response = new HashMap<>();
        response.put("nextNumber", nextNumber);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/check-number")
    public ResponseEntity<Map<String, Object>> checkNumber(
            @RequestParam String entityName, 
            @RequestParam Integer ano, 
            @RequestParam Integer numero, 
            @RequestParam(required = false) Long itemTrabalhoId,
            @RequestParam(required = false) Long currentEntityId,
            @RequestParam(required = false) Boolean especial) {

        // Sem o parâmetro, o tipo (RAI/REAI) é lido do próprio relatório
        boolean ehEspecial = numeroService.resolveEspecial(entityName, itemTrabalhoId, currentEntityId, especial);
        boolean isAvailable = numeroService.checkNumberAvailability(entityName, ano, numero, itemTrabalhoId, currentEntityId, ehEspecial);

        Map<String, Object> response = new HashMap<>();
        response.put("available", isAvailable);

        if (!isAvailable) {
            Integer nextNumber = numeroService.getNextAvailableNumber(entityName, ano, itemTrabalhoId, ehEspecial);
            response.put("nextAvailable", nextNumber);
        }
        
        return ResponseEntity.ok(response);
    }
}
