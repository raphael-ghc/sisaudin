package sisaudin.model.cadastroBasico;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
public class AnexoDocumento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fileName;
    private String fileType;
    
    private String filePath;

    private LocalDateTime dataHora;
    private String responsavel;
    private Long itemTrabalhoId;
    private String documento;
    private String secao;
}
