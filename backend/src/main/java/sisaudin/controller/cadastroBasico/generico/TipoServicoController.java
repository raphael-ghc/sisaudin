package sisaudin.controller.cadastroBasico.generico;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import sisaudin.model.cadastroBasico.generico.TipoServico;

@RestController
@RequestMapping("/api/tipo-de-servico")
public class TipoServicoController extends BaseController<TipoServico> {
    
}