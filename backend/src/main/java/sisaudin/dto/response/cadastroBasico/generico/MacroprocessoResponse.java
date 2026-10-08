package sisaudin.dto.response.cadastroBasico.generico;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MacroprocessoResponse<T> {
    private boolean success;
    private T data;
    private String error;
}
