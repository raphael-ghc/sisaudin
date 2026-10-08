package sisaudin.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AnexoDocumentoDTO {
    private Long id;
    private String fileName;
    private String fileType;
    private LocalDateTime dataHora;
    private String responsavel;
    private Long itemTrabalhoId;
    private String documento;
    private String secao;
}
