package sisaudin.controller.cadastroBasico.generico;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import sisaudin.model.cadastroBasico.generico.TipoItem;

@RestController
@RequestMapping("/api/tipo-de-item")
public class TipoItemController extends BaseController<TipoItem> {
    
}