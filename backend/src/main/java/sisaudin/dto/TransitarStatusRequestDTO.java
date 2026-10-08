package sisaudin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransitarStatusRequestDTO {
    private String novoStatus; // "Minuta", "Em revisão", "Revisado", "Em aprovação", "Aprovado"
    private Long usuarioDestinatarioId;
    private String justificativaExcecao; // Obrigatório se tentar aprovar/revisar com checklist incompleto
    private String observacoes;
}
