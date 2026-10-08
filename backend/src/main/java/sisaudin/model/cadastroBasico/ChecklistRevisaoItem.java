package sisaudin.model.cadastroBasico;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "checklist_revisao_item")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistRevisaoItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long documentoId;

    private String documentoTipo;

    @Column(columnDefinition = "TEXT")
    private String questao;

    private String resposta; // "SIM", "NAO", ou null quando pendente

    @Column(columnDefinition = "TEXT")
    private String observacao;

    @Column(columnDefinition = "TEXT")
    private String link;

    private Integer ordem;
}
