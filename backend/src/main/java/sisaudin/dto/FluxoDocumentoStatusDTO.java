package sisaudin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FluxoDocumentoStatusDTO {
    private Long itemTrabalhoId;
    private boolean existeOrdemServico;
    private boolean existePlanejamento;
    private boolean existeMatrizPlanejamento;
    private boolean existeMatrizAchados;
    private boolean existeRelatorioPreliminar;
    private boolean existeNotaPreliminar;
    private boolean existeNotaTecnica;
    private boolean existeParecer;
    private boolean existeNotaMonitoramento;
    private boolean existeReuniaoBuscaConjunta;
    private List<GerenciaComunicacaoDTO> gerenciasItem;
    private Map<String, DocumentoOpcaoDTO> opcoes;
}
