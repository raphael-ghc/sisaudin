package sisaudin.dto.response.cadastroBasico;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PessoaResponse<T> {
    private boolean success;
    private T data;
    private String error;
}