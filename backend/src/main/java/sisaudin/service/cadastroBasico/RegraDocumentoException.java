package sisaudin.service.cadastroBasico;

import org.springframework.http.HttpStatus;

/**
 * Operação recusada por uma regra dos documentos (ex.: excluir questão do Planejamento que já tem fatos
 * na Matriz de Achados). Os controladores devolvem o status e a mensagem como {"error": "..."}.
 */
public class RegraDocumentoException extends RuntimeException {

    private final HttpStatus status;

    public RegraDocumentoException(HttpStatus status, String mensagem) {
        super(mensagem);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
