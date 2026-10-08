package sisaudin.controller.cadastroBasico.generico;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import sisaudin.model.cadastroBasico.generico.Produto;

@RestController
@RequestMapping("/api/produto")
public class ProdutoController extends BaseController<Produto> {
    
}