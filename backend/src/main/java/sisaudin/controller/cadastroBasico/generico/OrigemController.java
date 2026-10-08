package sisaudin.controller.cadastroBasico.generico;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import sisaudin.model.cadastroBasico.generico.Origem;

@RestController
@RequestMapping("/api/origem-da-demanda")
public class OrigemController extends BaseController<Origem> {
    
}