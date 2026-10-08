package sisaudin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GerenciaComunicacaoDTO {
    private Long gerenciaId;
    private String nomeGerencia;
    private String siglaGerencia;
    private boolean possuiComunicacao; // true se já existe Comunicacao com esta gerência
}
