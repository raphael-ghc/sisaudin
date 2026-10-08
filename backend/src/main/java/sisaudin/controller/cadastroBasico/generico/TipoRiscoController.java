package sisaudin.controller.cadastroBasico.generico;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import sisaudin.model.cadastroBasico.generico.TipoRisco;

@RestController
@RequestMapping("/api/tipo-de-risco")
public class TipoRiscoController extends BaseController<TipoRisco> {
    
}