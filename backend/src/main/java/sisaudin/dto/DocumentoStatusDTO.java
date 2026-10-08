package sisaudin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import sisaudin.model.cadastroBasico.ChecklistAprovacaoItem;
import sisaudin.model.cadastroBasico.ChecklistRevisaoItem;
import sisaudin.model.cadastroBasico.HistoricoStatus;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentoStatusDTO {
    private String documentoTipo;
    private Long documentoId;
    private String statusAtual;
    private boolean podeEditar; // true se < Aprovado ou se usuário for Gestor
    private List<HistoricoStatus> historico;
    private List<ChecklistRevisaoItem> checklistRevisao;
    private List<ChecklistAprovacaoItem> checklistAprovacao;
}
