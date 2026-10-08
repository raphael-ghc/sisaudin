package sisaudin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentoCriadoDTO {
    private Long id;
    private String tipo;            // ex: "ORDEM_SERVICO"
    private String nome;            // ex: "Ordem de Serviço"
    private Integer numero;         // ex: 2
    private String numeroAno;       // ex: "2" ou "-"
    private LocalDateTime dataCriacao; // data e hora de criação
    private String siglasGerencias; // ex: "GTI, GFIN" ou "-"
    private String status;          // ex: "Minuta", "Em revisão", "Revisado", "Em aprovação", "Aprovado"
    private String rotaEditar;      // ex: "/ordem-servico/1"
    private String rotaVisualizar;  // ex: "/ordem-servico/1?view=true"
}
