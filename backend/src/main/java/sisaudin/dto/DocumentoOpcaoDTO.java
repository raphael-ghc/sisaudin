package sisaudin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentoOpcaoDTO {
    private String codigo; // ex: ORDEM_SERVICO
    private String nome; // ex: Ordem de Serviço
    private boolean habilitado; // se está habilitado para ser criado
    private String modalVerificacao; // null, "B1_COMUNICACAO", "B2_PLANEJAMENTO_OPCIONAL", "B3_PLANEJAMENTO_OBRIGATORIO", "B1_E_B2", "B1_E_B3", "B4_REUNIAO_BUSCA_OPCIONAL"
    private String rotaCriacao;
    private String motivoInabilitado;
}
