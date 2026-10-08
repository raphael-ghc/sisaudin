package sisaudin.controller.cadastroBasico.generico;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import sisaudin.model.cadastroBasico.generico.Cargo;

@RestController
@RequestMapping("/api/cargo")
public class CargoController extends BaseController<Cargo> {
    
}