package sisaudin.controller.cadastroBasico.generico;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import sisaudin.model.cadastroBasico.generico.TipoAuditoria;

@RestController
@RequestMapping("/api/tipo-de-auditoria")
public class TipoAuditoriaController extends BaseController<TipoAuditoria> {
    
}