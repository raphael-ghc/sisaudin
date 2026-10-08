package sisaudin.controller.cadastroBasico.generico;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import sisaudin.model.cadastroBasico.generico.ClasseFinanceira;

@RestController
@RequestMapping("/api/classe-financeira")
public class ClasseFinanceiraController extends BaseController<ClasseFinanceira> {
    
}