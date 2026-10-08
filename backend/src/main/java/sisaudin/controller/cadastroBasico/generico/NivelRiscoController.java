package sisaudin.controller.cadastroBasico.generico;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import sisaudin.model.cadastroBasico.generico.NivelRisco;

@RestController
@RequestMapping("/api/nivel-de-risco")
public class NivelRiscoController extends BaseController<NivelRisco> {
    
}